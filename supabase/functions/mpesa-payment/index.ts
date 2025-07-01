
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, ticketId } = await req.json();
    
    console.log(`Initiating M-Pesa STK Push for: ${phoneNumber} ${amount}`);

    // Check if M-Pesa credentials are configured
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const businessShortcode = Deno.env.get('MPESA_BUSINESS_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!consumerKey || !consumerSecret || !businessShortcode || !passkey) {
      console.log('M-Pesa credentials not configured, simulating successful payment for demo');
      
      // For demo purposes, simulate a successful payment after a short delay
      setTimeout(async () => {
        try {
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.50.2');
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          // Update ticket status to completed for demo
          await supabase
            .from('tickets')
            .update({ 
              payment_status: 'completed',
              mpesa_transaction_id: `DEMO_${Date.now()}`,
              payment_reference: `DEMO_REF_${Date.now()}`
            })
            .eq('ticket_id', ticketId);

          console.log(`Demo payment completed for ticket: ${ticketId}`);
        } catch (error) {
          console.error('Error updating demo payment:', error);
        }
      }, 3000); // Simulate 3-second processing time

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Demo payment initiated - M-Pesa credentials not configured',
          demo: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // If credentials are available, proceed with actual M-Pesa integration
    // Get OAuth token
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get M-Pesa OAuth token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = btoa(`${businessShortcode}${passkey}${timestamp}`);

    // Initiate STK Push
    const stkPushPayload = {
      BusinessShortCode: businessShortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: businessShortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: ticketId,
      TransactionDesc: `Payment for ticket ${ticketId}`
    };

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode === '0') {
      // Update ticket with M-Pesa request details
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.50.2');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('tickets')
        .update({
          mpesa_checkout_request_id: stkData.CheckoutRequestID,
          mpesa_merchant_request_id: stkData.MerchantRequestID,
          mpesa_phone_number: phoneNumber
        })
        .eq('ticket_id', ticketId);

      return new Response(
        JSON.stringify({ success: true, data: stkData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      throw new Error(stkData.ResponseDescription || 'STK Push failed');
    }

  } catch (error) {
    console.error('M-Pesa payment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment initiation failed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
