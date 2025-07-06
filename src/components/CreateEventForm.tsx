
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EventFormFields } from "./forms/EventFormFields";
import { EventImageUpload } from "./forms/EventImageUpload";
import { TicketManagementSection } from "./forms/TicketManagementSection";

interface CreateEventFormProps {
  onSuccess: () => void;
}

export const CreateEventForm = ({ onSuccess }: CreateEventFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    price: "",
    image_url: "",
    ticket_type: "open",
    max_tickets: "",
    ticket_deadline: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to create events");
      }

      // Use the image URL from form data (already uploaded via EventImageUpload component)
      const imageUrl = formData.image_url;

      // Validate ticket type specific fields
      if (formData.ticket_type === 'fixed') {
        if (!formData.max_tickets || parseInt(formData.max_tickets) <= 0) {
          throw new Error("Please specify the maximum number of tickets for fixed ticket events");
        }
      }

      if (formData.ticket_type === 'open' && formData.ticket_deadline) {
        const deadlineDate = new Date(formData.ticket_deadline);
        const eventDate = new Date(formData.date);
        
        if (deadlineDate >= eventDate) {
          throw new Error("Ticket deadline must be before the event date");
        }
      }

      const { error } = await supabase
        .from('events')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            date: formData.date,
            time: formData.time,
            venue: formData.venue,
            price: parseFloat(formData.price) || 0,
            image_url: imageUrl || null,
            creator_id: user.id,
            ticket_type: formData.ticket_type,
            max_tickets: formData.ticket_type === 'fixed' ? parseInt(formData.max_tickets) || null : null,
            ticket_deadline: formData.ticket_deadline || null
          }
        ]);

      if (error) throw error;

      toast({
        title: "Event Created!",
        description: "Your event has been created successfully."
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        price: "",
        image_url: "",
        ticket_type: "open",
        max_tickets: "",
        ticket_deadline: ""
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <EventFormFields 
            formData={formData} 
            onInputChange={handleInputChange} 
          />

          <EventImageUpload 
            imageUrl={formData.image_url}
            onImageUrlChange={(url) => setFormData({ ...formData, image_url: url })}
          />

          <TicketManagementSection
            ticketType={formData.ticket_type}
            maxTickets={formData.max_tickets}
            ticketDeadline={formData.ticket_deadline}
            onTicketTypeChange={(value) => handleSelectChange('ticket_type', value)}
            onMaxTicketsChange={handleInputChange}
            onTicketDeadlineChange={handleInputChange}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating Event..." : "Create Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
