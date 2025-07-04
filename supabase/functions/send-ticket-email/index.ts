import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  ticketId: string;
  recipientEmail: string;
  recipientName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticketId, recipientEmail, recipientName }: EmailRequest = await req.json()

    if (!ticketId || !recipientEmail) {
      throw new Error('Missing required fields: ticketId and recipientEmail')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get ticket information with event details
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        events (
          id,
          title,
          date,
          time,
          venue,
          description,
          price
        )
      `)
      .eq('ticket_id', ticketId)
      .single()

    if (ticketError || !ticket) {
      throw new Error('Ticket not found')
    }

    // Prepare email content
    const eventDate = new Date(ticket.events.date).toLocaleDateString()
    const eventTime = ticket.events.time
    const eventTitle = ticket.events.title
    const eventVenue = ticket.events.venue
    const buyerName = recipientName || ticket.buyer_name

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Event Ticket - ${eventTitle}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 30px;
        }
        .ticket-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .event-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .detail-item {
            padding: 15px;
            background: #f1f5f9;
            border-radius: 6px;
        }
        .detail-label {
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 4px;
            font-size: 14px;
        }
        .detail-value {
            color: #475569;
            font-size: 14px;
        }
        .qr-section {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px dashed #cbd5e1;
        }
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .important-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .notice-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
        }
        .notice-list {
            color: #92400e;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding-left: 20px;
        }
        @media (max-width: 600px) {
            .event-details {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎟️ Your Event Ticket</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ready for an amazing experience!</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b; margin-bottom: 10px;">Hello ${buyerName}!</h2>
            <p style="color: #475569; line-height: 1.6;">
                Thank you for your purchase! Your ticket for <strong>${eventTitle}</strong> is ready. 
                Please save this email and bring it with you to the event.
            </p>
            
            <div class="ticket-info">
                <h3 style="margin: 0 0 10px 0; color: #1e293b;">Event Information</h3>
                <div style="font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
                    ${eventTitle}
                </div>
            </div>
            
            <div class="event-details">
                <div class="detail-item">
                    <div class="detail-label">📅 Date & Time</div>
                    <div class="detail-value">${eventDate} at ${eventTime}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">📍 Venue</div>
                    <div class="detail-value">${eventVenue}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">👤 Ticket Holder</div>
                    <div class="detail-value">${buyerName}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">🎫 Ticket ID</div>
                    <div class="detail-value" style="font-family: monospace;">${ticketId}</div>
                </div>
            </div>
            
            <div class="qr-section">
                <h4 style="margin: 0 0 15px 0; color: #1e293b;">Your QR Code</h4>
                <div style="font-size: 24px; font-family: monospace; background: white; padding: 20px; border-radius: 8px; margin: 10px 0;">
                    ${ticketId}
                </div>
                <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">
                    Show this ticket ID at the venue entrance for scanning
                </p>
            </div>
            
            <div class="important-notice">
                <div class="notice-title">📋 Important Information</div>
                <ul class="notice-list">
                    <li>Keep this email safe and accessible on your phone</li>
                    <li>Arrive 30 minutes before the event start time</li>
                    <li>This ticket is valid for one-time entry only</li>
                    <li>Contact event organizer if you face any issues</li>
                    <li>No refunds or exchanges allowed</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #475569; font-size: 16px; margin: 0;">
                    We can't wait to see you at the event! 🎉
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">
                <strong>Generated by EventTix</strong> • Secure Digital Ticketing Platform
            </p>
            <p style="margin: 5px 0 0 0;">
                For support, contact: support@eventtix.com
            </p>
        </div>
    </div>
</body>
</html>
    `

    const textContent = `
Your Event Ticket - ${eventTitle}

Hello ${buyerName}!

Thank you for your purchase! Your ticket for ${eventTitle} is ready.

Event Information:
- Event: ${eventTitle}
- Date & Time: ${eventDate} at ${eventTime}
- Venue: ${eventVenue}
- Ticket Holder: ${buyerName}
- Ticket ID: ${ticketId}

Your QR Code: ${ticketId}

Important Information:
• Keep this email safe and accessible on your phone
• Arrive 30 minutes before the event start time
• This ticket is valid for one-time entry only
• Contact event organizer if you face any issues
• No refunds or exchanges allowed

We can't wait to see you at the event!

Generated by EventTix • Secure Digital Ticketing Platform
For support, contact: support@eventtix.com
    `

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EventTix <noreply@eventtix.com>',
        to: [recipientEmail],
        subject: `Your Ticket for ${eventTitle} - ${eventDate}`,
        html: emailHtml,
        text: textContent,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      throw new Error(`Failed to send email: ${errorText}`)
    }

    const result = await resendResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Ticket email sent successfully',
        emailId: result.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending ticket email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})