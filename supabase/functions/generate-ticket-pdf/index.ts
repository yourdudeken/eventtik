
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
    const { ticketData } = await req.json()

    // Generate HTML for the ticket
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .ticket { max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .event-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .qr-section { text-align: center; margin: 20px 0; }
          .qr-code { font-family: monospace; background: #f5f5f5; padding: 15px; border: 1px solid #ccc; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="event-title">${ticketData.event.title}</div>
            <div>Digital Ticket</div>
          </div>
          
          <div class="details">
            <div>
              <h3>Event Details</h3>
              <p><strong>Date:</strong> ${new Date(ticketData.event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${ticketData.event.time}</p>
              <p><strong>Venue:</strong> ${ticketData.event.venue}</p>
            </div>
            
            <div>
              <h3>Ticket Holder</h3>
              <p><strong>Name:</strong> ${ticketData.buyer.name}</p>
              <p><strong>Email:</strong> ${ticketData.buyer.email}</p>
              <p><strong>Phone:</strong> ${ticketData.buyer.phone}</p>
              <p><strong>Quantity:</strong> ${ticketData.quantity} ticket(s)</p>
            </div>
          </div>
          
          <div class="qr-section">
            <h3>QR Code</h3>
            <div class="qr-code">${ticketData.qrCode}</div>
            <p style="font-size: 12px;">Show this QR code at the event entrance</p>
          </div>
          
          <div style="border-top: 1px solid #ccc; padding-top: 15px;">
            <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
            <p><strong>Total Amount:</strong> KSh ${ticketData.totalAmount.toLocaleString()}</p>
            <p><strong>Purchase Date:</strong> ${new Date(ticketData.purchaseDate).toLocaleDateString()}</p>
          </div>
          
          <div class="footer">
            <p>This ticket is non-transferable and non-refundable.</p>
            <p>Please arrive 30 minutes before the event starts.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // For now, return the HTML as a downloadable file
    // In production, you would use a PDF generation service like Puppeteer or similar
    return new Response(ticketHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="ticket_${ticketData.ticketId}.html"`
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
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
