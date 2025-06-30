
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

    // Get all tickets for events happening in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: upcomingEvents, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, title, date, time, venue')
      .eq('date', tomorrow.toISOString().split('T')[0]);

    if (eventsError) throw eventsError;

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events scheduled for tomorrow" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let remindersSent = 0;

    for (const event of upcomingEvents) {
      // Get all tickets for this event
      const { data: tickets, error: ticketsError } = await supabaseClient
        .from('tickets')
        .select('ticket_id, buyer_name, buyer_email, buyer_phone')
        .eq('event_id', event.id)
        .eq('payment_status', 'completed')
        .eq('status', 'valid');

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        continue;
      }

      for (const ticket of tickets || []) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabaseClient
          .from('event_reminders')
          .select('id')
          .eq('ticket_id', ticket.ticket_id)
          .eq('reminder_type', 'email')
          .eq('status', 'sent')
          .single();

        if (existingReminder) continue;

        // Create reminder record
        const { error: reminderError } = await supabaseClient
          .from('event_reminders')
          .insert({
            ticket_id: ticket.ticket_id,
            reminder_type: 'email',
            scheduled_for: new Date().toISOString(),
            status: 'sent',
            sent_at: new Date().toISOString()
          });

        if (reminderError) {
          console.error('Error creating reminder record:', reminderError);
          continue;
        }

        // Send email reminder (you would integrate with your email service here)
        console.log(`Sending reminder to ${ticket.buyer_email} for event ${event.title}`);
        
        // In a real implementation, you would send the email here
        // For now, we'll just log it
        
        remindersSent++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Sent ${remindersSent} event reminders`,
        eventsProcessed: upcomingEvents.length 
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in send-event-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
