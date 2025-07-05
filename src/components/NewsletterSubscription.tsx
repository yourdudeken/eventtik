import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const NewsletterSubscription = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubscribing(true);

    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .insert({ email: email.toLowerCase() });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter",
            variant: "default"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Successfully Subscribed!",
          description: "You'll receive updates about new events and features",
        });
        setEmail('');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-blue-400" />
        <h4 className="font-semibold text-white">Stay Updated</h4>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Get notified about new events, exclusive offers, and platform updates.
      </p>
      <form onSubmit={handleSubscribe} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          disabled={isSubscribing}
        />
        <Button 
          type="submit" 
          disabled={isSubscribing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubscribing ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
    </div>
  );
};