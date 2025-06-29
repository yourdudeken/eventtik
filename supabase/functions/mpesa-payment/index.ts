
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phoneNumber, amount, ticketId } = await req.json()

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Initiating M-Pesa STK Push for:', phoneNumber, amount)

    // M-Pesa STK Push implementation
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    const businessShortCode = Deno.env.get('MPESA_BUSINESS_SHORTCODE')
    const passkey = Deno.env.get('MPESA_PASSKEY')

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      throw new Error('M-Pesa credentials not configured')
    }

    // Generate access token
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = btoa(`${businessShortCode}${passkey}${timestamp}`)

    // STK Push request
    const stkPushPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: businessShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: ticketId,
      TransactionDesc: `Ticket payment for ${ticketId}`
    }

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushPayload)
    })

    const stkData = await stkResponse.json()
    console.log('M-Pesa STK Response:', stkData)

    if (stkData.ResponseCode === '0') {
      // Update ticket with M-Pesa request details
      const { error } = await supabase
        .from('tickets')
        .update({
          mpesa_checkout_request_id: stkData.CheckoutRequestID,
          mpesa_merchant_request_id: stkData.MerchantRequestID,
          mpesa_phone_number: phoneNumber,
          payment_status: 'pending'
        })
        .eq('ticket_id', ticketId)

      if (error) {
        console.error('Error updating ticket:', error)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          checkoutRequestId: stkData.CheckoutRequestID
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error(stkData.errorMessage || 'STK Push failed')
    }

  } catch (error) {
    console.error('M-Pesa payment error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
