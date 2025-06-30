
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get events that ended yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: pastEvents, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, title, date, time, venue')
      .eq('date', yesterday.toISOString().split('T')[0]);

    if (eventsError) throw eventsError;

    if (!pastEvents || pastEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events ended yesterday" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let feedbackRequestsSent = 0;

    for (const event of pastEvents) {
      // Get all tickets for this event that were checked in
      const { data: tickets, error: ticketsError } = await supabaseClient
        .from('tickets')
        .select('ticket_id, buyer_name, buyer_email')
        .eq('event_id', event.id)
        .eq('payment_status', 'completed')
        .eq('checked_in', true);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        continue;
      }

      for (const ticket of tickets || []) {
        // Check if feedback already submitted
        const { data: existingFeedback } = await supabaseClient
          .from('event_feedback')
          .select('id')
          .eq('ticket_id', ticket.ticket_id)
          .single();

        if (existingFeedback) continue;

        // Send feedback request email (you would integrate with your email service here)
        console.log(`Sending feedback request to ${ticket.buyer_email} for event ${event.title}`);
        
        // In a real implementation, you would send the email here
        // The email would contain a link to the feedback form
        
        feedbackRequestsSent++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Sent ${feedbackRequestsSent} feedback requests`,
        eventsProcessed: pastEvents.length 
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in send-feedback-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
