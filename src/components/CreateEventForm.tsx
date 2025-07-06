
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, DollarSign, Image, FileText, Users, Clock, Upload, X } from "lucide-react";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to upload images");

      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, selectedImage);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setFormData({ ...formData, image_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to create events");
      }

      // Upload image if selected
      let imageUrl = formData.image_url;
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          throw new Error("Failed to upload image");
        }
      }

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
      setSelectedImage(null);
      setImagePreview("");

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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="title"
                  name="title"
                  placeholder="Amazing Concert 2024"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="venue"
                  name="venue"
                  placeholder="Nairobi Convention Center"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Tell people what makes your event special..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Price (KSh)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Event Image</Label>
            <div className="space-y-3">
              {!imagePreview && !formData.image_url && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Upload an image from your device</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Or enter a URL below</p>
                </div>
              )}
              
              {(imagePreview || formData.image_url) && (
                <div className="relative">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Event preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="relative">
                <Image className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="Or paste image URL here..."
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Ticket Management Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ticket Management
            </h3>
            
            <div>
              <Label htmlFor="ticket_type">Ticket Type *</Label>
              <Select 
                value={formData.ticket_type} 
                onValueChange={(value) => handleSelectChange('ticket_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open Tickets (No limit)</SelectItem>
                  <SelectItem value="fixed">Fixed Number of Tickets</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose whether to limit the number of tickets or keep it open
              </p>
            </div>

            {formData.ticket_type === 'fixed' && (
              <div>
                <Label htmlFor="max_tickets">Maximum Tickets *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="max_tickets"
                    name="max_tickets"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.max_tickets}
                    onChange={handleInputChange}
                    className="pl-10"
                    required={formData.ticket_type === 'fixed'}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Set the maximum number of tickets available for this event
                </p>
              </div>
            )}

            {formData.ticket_type === 'open' && (
              <div>
                <Label htmlFor="ticket_deadline">Ticket Sales Deadline (Optional)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="ticket_deadline"
                    name="ticket_deadline"
                    type="datetime-local"
                    value={formData.ticket_deadline}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Set when ticket sales should stop (must be before event date)
                </p>
              </div>
            )}
          </div>

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
