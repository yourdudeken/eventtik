
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Percent, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PromoCodeInputProps {
  eventId: string;
  onDiscountApplied: (discount: { type: string; value: number; code: string }) => void;
  onDiscountRemoved: () => void;
  appliedDiscount?: { type: string; value: number; code: string } | null;
}

export const PromoCodeInput = ({ 
  eventId, 
  onDiscountApplied, 
  onDiscountRemoved, 
  appliedDiscount 
}: PromoCodeInputProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Enter Promo Code",
        description: "Please enter a promo code to apply discount",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);

    try {
      const { data: promoData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (error || !promoData) {
        toast({
          title: "Invalid Promo Code",
          description: "The promo code is not valid for this event",
          variant: "destructive"
        });
        return;
      }

      // Check if promo code is still valid (dates and usage)
      const now = new Date();
      if (promoData.valid_until && new Date(promoData.valid_until) < now) {
        toast({
          title: "Expired Promo Code",
          description: "This promo code has expired",
          variant: "destructive"
        });
        return;
      }

      if (promoData.max_uses && promoData.current_uses >= promoData.max_uses) {
        toast({
          title: "Promo Code Limit Reached",
          description: "This promo code has reached its usage limit",
          variant: "destructive"
        });
        return;
      }

      // Apply discount
      onDiscountApplied({
        type: promoData.discount_type,
        value: promoData.discount_value,
        code: promoData.code
      });

      toast({
        title: "Promo Code Applied!",
        description: `${promoData.discount_type === 'percentage' ? promoData.discount_value + '%' : 'KSh ' + promoData.discount_value} discount applied`,
      });

    } catch (error) {
      console.error('Promo code validation error:', error);
      toast({
        title: "Error",
        description: "Failed to validate promo code",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeDiscount = () => {
    setPromoCode('');
    onDiscountRemoved();
    toast({
      title: "Discount Removed",
      description: "Promo code discount has been removed"
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          disabled={isValidating || !!appliedDiscount}
          className="flex-1"
        />
        {!appliedDiscount ? (
          <Button
            onClick={validatePromoCode}
            disabled={isValidating || !promoCode.trim()}
            size="sm"
          >
            <Tag className="h-4 w-4 mr-1" />
            {isValidating ? 'Validating...' : 'Apply'}
          </Button>
        ) : (
          <Button
            onClick={removeDiscount}
            variant="outline"
            size="sm"
          >
            Remove
          </Button>
        )}
      </div>

      {appliedDiscount && (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Percent className="h-3 w-3 mr-1" />
          {appliedDiscount.type === 'percentage' 
            ? `${appliedDiscount.value}% OFF` 
            : `KSh ${appliedDiscount.value} OFF`
          } - {appliedDiscount.code}
        </Badge>
      )}
    </div>
  );
};
