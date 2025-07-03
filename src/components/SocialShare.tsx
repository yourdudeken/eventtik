import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Mail, Share2, Copy, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SocialShareProps {
  ticket: any;
}

export const SocialShare = ({ ticket }: SocialShareProps) => {
  const { toast } = useToast();
  const [customMessage, setCustomMessage] = useState('');

  const eventUrl = window.location.href;
  const eventTitle = ticket.event.title;
  const eventDate = new Date(ticket.event.date).toLocaleDateString();
  
  const defaultMessage = `🎟️ I'll be attending ${eventTitle} on ${eventDate} at ${ticket.event.venue}! Join me for this amazing event! #EventTix #${eventTitle.replace(/\s+/g, '')}`;

  const shareToFacebook = () => {
    const message = customMessage || defaultMessage;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(message)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    toast({
      title: "Shared to Facebook",
      description: "Your event has been shared on Facebook!"
    });
  };

  const shareToTwitter = () => {
    const message = customMessage || defaultMessage;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(eventUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    
    toast({
      title: "Shared to Twitter",
      description: "Your event has been shared on Twitter!"
    });
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy the text
    const message = customMessage || `${defaultMessage}\n\nEvent Details:\n📅 ${eventDate}\n📍 ${ticket.event.venue}\n🎫 Ticket ID: ${ticket.ticketId}`;
    
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Content Copied",
        description: "Event details copied! You can now paste this in your Instagram story or post."
      });
    });
  };

  const shareToWhatsApp = () => {
    const message = customMessage || `${defaultMessage}\n\nEvent Details:\n📅 ${eventDate}\n📍 ${ticket.event.venue}\n🎫 Ticket ID: ${ticket.ticketId}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Shared to WhatsApp",
      description: "Your event has been shared on WhatsApp!"
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join me at ${eventTitle}!`);
    const body = encodeURIComponent(`
Hi there!

I wanted to invite you to join me at this amazing event:

🎟️ ${eventTitle}
📅 ${eventDate} at ${ticket.event.time}
📍 ${ticket.event.venue}

${ticket.event.description || 'This looks like it\'s going to be an incredible event!'}

Hope to see you there!

Best regards
    `);
    
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    
    toast({
      title: "Email Client Opened",
      description: "Your email client has been opened with the invitation."
    });
  };

  const copyToClipboard = () => {
    const message = customMessage || `${defaultMessage}\n\nEvent Details:\n📅 ${eventDate}\n📍 ${ticket.event.venue}\n🎫 Ticket ID: ${ticket.ticketId}\n\nEvent Link: ${eventUrl}`;
    
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Event details copied! You can now paste this anywhere."
      });
    });
  };

  const useNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${eventTitle} - Event Ticket`,
          text: customMessage || defaultMessage,
          url: eventUrl
        });
        
        toast({
          title: "Shared Successfully",
          description: "Event shared using your device's share menu!"
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Your Event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Custom Message Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Message (Optional)</label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={defaultMessage}
            className="w-full p-3 border rounded-lg resize-none h-24 text-sm"
          />
          <p className="text-xs text-gray-500">
            Leave blank to use the default message
          </p>
        </div>

        {/* Social Media Platforms */}
        <div className="space-y-4">
          <h3 className="font-semibold">Share on Social Media</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              onClick={shareToFacebook}
              variant="outline"
              className="w-full justify-start bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              <Facebook className="h-5 w-5 mr-3 text-blue-600" />
              Share on Facebook
            </Button>

            <Button
              onClick={shareToTwitter}
              variant="outline"
              className="w-full justify-start bg-sky-50 hover:bg-sky-100 border-sky-200"
            >
              <Twitter className="h-5 w-5 mr-3 text-sky-500" />
              Share on Twitter
            </Button>

            <Button
              onClick={shareToInstagram}
              variant="outline"
              className="w-full justify-start bg-pink-50 hover:bg-pink-100 border-pink-200"
            >
              <Instagram className="h-5 w-5 mr-3 text-pink-600" />
              Copy for Instagram
            </Button>

            <Button
              onClick={shareToWhatsApp}
              variant="outline"
              className="w-full justify-start bg-green-50 hover:bg-green-100 border-green-200"
            >
              <MessageCircle className="h-5 w-5 mr-3 text-green-600" />
              Share on WhatsApp
            </Button>
          </div>
        </div>

        {/* Other Sharing Options */}
        <div className="space-y-4">
          <h3 className="font-semibold">Other Options</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="w-full justify-start"
            >
              <Mail className="h-5 w-5 mr-3" />
              Send via Email
            </Button>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full justify-start"
            >
              <Copy className="h-5 w-5 mr-3" />
              Copy to Clipboard
            </Button>
          </div>

          {/* Native Share (for mobile devices) */}
          {navigator.share && (
            <Button
              onClick={useNativeShare}
              className="w-full"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share via Device Menu
            </Button>
          )}
        </div>

        {/* Event Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Event Preview</h4>
          <div className="text-sm space-y-1">
            <p><strong>Event:</strong> {eventTitle}</p>
            <p><strong>Date:</strong> {eventDate} at {ticket.event.time}</p>
            <p><strong>Venue:</strong> {ticket.event.venue}</p>
            <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
