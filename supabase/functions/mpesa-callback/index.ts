
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.json()
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stkCallback = body.Body?.stkCallback
    if (!stkCallback) {
      return new Response('Invalid callback format', { status: 400 })
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    let paymentStatus = 'failed'
    let transactionId = null

    if (resultCode === 0) {
      // Payment successful
      paymentStatus = 'completed'
      const callbackMetadata = stkCallback.CallbackMetadata
      if (callbackMetadata && callbackMetadata.Item) {
        const transactionIdItem = callbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber')
        if (transactionIdItem) {
          transactionId = transactionIdItem.Value
        }
      }
    }

    // Update ticket payment status
    const { error } = await supabase
      .from('tickets')
      .update({
        payment_status: paymentStatus,
        mpesa_transaction_id: transactionId,
        payment_reference: transactionId
      })
      .eq('mpesa_checkout_request_id', checkoutRequestId)

    if (error) {
      console.error('Error updating ticket payment status:', error)
      return new Response('Database update failed', { status: 500 })
    }

    console.log(`Payment ${paymentStatus} for checkout request ${checkoutRequestId}`)

    return new Response('Callback processed successfully', { status: 200 })
  } catch (error) {
    console.error('Callback processing error:', error)
    return new Response('Callback processing failed', { status: 500 })
  }
})
