
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

    // Generate compact single-page HTML for the ticket
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 12px; font-size: 12px; }
          .ticket { max-width: 600px; margin: 0 auto; background: white; border: 2px solid #000; padding: 16px; }
          .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
          .event-title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; font-size: 11px; }
          .qr-section { text-align: center; margin: 12px 0; }
          .qr-code { font-family: monospace; background: #f5f5f5; padding: 8px; border: 1px solid #ccc; font-size: 10px; }
          .footer { text-align: center; font-size: 10px; color: #666; margin-top: 12px; border-top: 1px solid #ccc; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="event-title">${ticketData.event.title}</div>
            <div>🎫 Digital Ticket</div>
          </div>
          
          <div class="details">
            <div>
              <h4 style="margin: 0 0 4px 0;">Event Details</h4>
              <p style="margin: 2px 0;"><strong>📅 Date:</strong> ${new Date(ticketData.event.date).toLocaleDateString()}</p>
              <p style="margin: 2px 0;"><strong>🕐 Time:</strong> ${ticketData.event.time}</p>
              <p style="margin: 2px 0;"><strong>📍 Venue:</strong> ${ticketData.event.venue}</p>
            </div>
            
            <div>
              <h4 style="margin: 0 0 4px 0;">Ticket Holder</h4>
              <p style="margin: 2px 0;"><strong>👤 Name:</strong> ${ticketData.buyer.name}</p>
              <p style="margin: 2px 0;"><strong>📧 Email:</strong> ${ticketData.buyer.email}</p>
              <p style="margin: 2px 0;"><strong>📱 Phone:</strong> ${ticketData.buyer.phone}</p>
            </div>
          </div>
          
          <div class="qr-section">
            <div class="qr-code">${ticketData.qrCode}</div>
            <p style="font-size: 10px; margin: 4px 0;">Scan at entrance</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px; margin-bottom: 8px;">
            <p style="margin: 0;"><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
            <p style="margin: 0;"><strong>Amount:</strong> KSh ${ticketData.totalAmount.toLocaleString()}</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">Non-transferable • Present for entry • EventTix ${new Date().getFullYear()}</p>
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
