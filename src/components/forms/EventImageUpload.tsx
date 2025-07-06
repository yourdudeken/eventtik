import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image } from "lucide-react";

interface EventImageUploadProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
}

export const EventImageUpload = ({ imageUrl, onImageUrlChange }: EventImageUploadProps) => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();

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
    onImageUrlChange("");
  };

  // Auto-upload when image is selected
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e);
    const file = e.target.files?.[0];
    if (file) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        onImageUrlChange(uploadedUrl);
      }
    }
  };

  return (
    <div>
      <Label>Event Image</Label>
      <div className="space-y-3">
        {!imagePreview && !imageUrl && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Upload an image from your device</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
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
              {uploadingImage ? "Uploading..." : "Choose Image"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Or enter a URL below</p>
          </div>
        )}
        
        {(imagePreview || imageUrl) && (
          <div className="relative">
            <img
              src={imagePreview || imageUrl}
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
          <Image className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="image_url"
            name="image_url"
            type="url"
            placeholder="Or paste image URL here..."
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
};