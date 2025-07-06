import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, DollarSign, FileText } from "lucide-react";

interface EventFormFieldsProps {
  formData: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    price: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const EventFormFields = ({ formData, onInputChange }: EventFormFieldsProps) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Event Title *</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="title"
              name="title"
              placeholder="Amazing Concert 2024"
              value={formData.title}
              onChange={onInputChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="venue">Venue *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="venue"
              name="venue"
              placeholder="Nairobi Convention Center"
              value={formData.venue}
              onChange={onInputChange}
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
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="date">Date *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={onInputChange}
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
            onChange={onInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="price">Price (KSh)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={onInputChange}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </>
  );
};