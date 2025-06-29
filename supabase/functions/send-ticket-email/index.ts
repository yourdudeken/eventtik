
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, ticketData } = await req.json()

    // Use Resend API for sending emails
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Email service not configured')
    }

    const emailPayload = {
      from: 'Events <tickets@yourdomain.com>',
      to: [email],
      subject: `Your Ticket for ${ticketData.event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your Event Ticket</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${ticketData.event.title}</h3>
            <p><strong>Date:</strong> ${new Date(ticketData.event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${ticketData.event.time}</p>
            <p><strong>Venue:</strong> ${ticketData.event.venue}</p>
            <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
          </div>

          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>Ticket Holder Details</h4>
            <p><strong>Name:</strong> ${ticketData.buyer.name}</p>
            <p><strong>Email:</strong> ${ticketData.buyer.email}</p>
            <p><strong>Phone:</strong> ${ticketData.buyer.phone}</p>
            <p><strong>Quantity:</strong> ${ticketData.quantity} ticket(s)</p>
            <p><strong>Total Amount:</strong> KSh ${ticketData.totalAmount.toLocaleString()}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px; background: white; border: 2px solid #e5e7eb; border-radius: 8px;">
              <p style="margin: 0; font-family: monospace; font-size: 14px; background: #f9fafb; padding: 10px; border-radius: 4px;">
                QR Code: ${ticketData.qrCode}
              </p>
              <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                Show this QR code at the event entrance
              </p>
            </div>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">Important Notes:</h4>
            <ul style="color: #92400e; font-size: 14px;">
              <li>Keep this ticket on your phone or print a copy</li>
              <li>Arrive 30 minutes before the event starts</li>
              <li>This ticket is non-transferable and non-refundable</li>
              <li>Contact support if you have any issues</li>
            </ul>
          </div>

          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
            Thank you for your purchase! We look forward to seeing you at the event.
          </p>
        </div>
      `
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Email sending failed: ${errorData.message}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email sending error:', error)
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
