
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, MapPin, Loader2, Info, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PromoCodeInput } from "./PromoCodeInput";

interface TicketPurchaseProps {
  event: any;
  onSuccess: (ticketData: any) => void;
  onBack: () => void;
}

export const TicketPurchase = ({ event, onSuccess, onBack }: TicketPurchaseProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1
  });
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'success'>('form');
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    });
  };

  const calculateTotal = () => {
    const baseAmount = event.price * formData.quantity;
    
    if (!appliedDiscount) return baseAmount;
    
    if (appliedDiscount.type === 'percentage') {
      return baseAmount * (1 - appliedDiscount.value / 100);
    } else {
      return Math.max(0, baseAmount - appliedDiscount.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.quantity < 1 || formData.quantity > 10) {
      toast({
        title: "Invalid Quantity",
        description: "Please select between 1 and 10 tickets",
        variant: "destructive"
      });
      return;
    }

    setPaymentStep('payment');
    setIsProcessing(true);

    try {
      const ticketId = `TKT-${Date.now()}`;
      const totalAmount = calculateTotal();

      // Create ticket record first
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          ticket_id: ticketId,
          event_id: event.id,
          user_id: `USR-${Date.now()}`,
          buyer_name: formData.name,
          buyer_email: formData.email,
          buyer_phone: formData.phone,
          payment_status: 'pending',
          qr_code: `${ticketId}-${event.id}-${Date.now()}`,
          status: 'valid'
        })
        .select()
        .single();

      if (ticketError) {
        throw new Error(ticketError.message);
      }

      // Update promo code usage if discount was applied
      if (appliedDiscount) {
        const { data: currentPromo } = await supabase
          .from('promo_codes')
          .select('current_uses')
          .eq('code', appliedDiscount.code)
          .single();

        if (currentPromo) {
          await supabase
            .from('promo_codes')
            .update({ 
              current_uses: (currentPromo.current_uses || 0) + 1 
            })
            .eq('code', appliedDiscount.code);
        }
      }

      // Format phone number for M-Pesa (ensure it starts with 254)
      let mpesaPhone = formData.phone.replace(/\D/g, '');
      if (mpesaPhone.startsWith('0')) {
        mpesaPhone = '254' + mpesaPhone.substring(1);
      } else if (!mpesaPhone.startsWith('254')) {
        mpesaPhone = '254' + mpesaPhone;
      }

      // Initiate M-Pesa payment
      const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('mpesa-payment', {
        body: {
          phoneNumber: mpesaPhone,
          amount: totalAmount,
          ticketId: ticketId
        }
      });

      if (paymentError || !paymentResult.success) {
        throw new Error(paymentResult?.error || 'Payment initiation failed');
      }

      // Poll for payment status
      const checkPaymentStatus = async () => {
        const { data: updatedTicket } = await supabase
          .from('tickets')
          .select('payment_status')
          .eq('ticket_id', ticketId)
          .single();

        if (updatedTicket?.payment_status === 'completed') {
          setIsProcessing(false);
          setPaymentStep('success');
          
          const completeTicketData = {
            ticketId,
            userId: `USR-${Date.now()}`,
            eventId: event.id,
            event: event,
            buyer: formData,
            quantity: formData.quantity,
            totalAmount,
            originalAmount: event.price * formData.quantity,
            discount: appliedDiscount,
            purchaseDate: new Date().toISOString(),
            qrCode: ticketData.qr_code,
            receiptNumber: ticketData.receipt_number,
            status: 'valid'
          };

          toast({
            title: "Payment Successful!",
            description: "Your ticket has been generated"
          });

          setTimeout(() => {
            onSuccess(completeTicketData);
          }, 2000);
        } else if (updatedTicket?.payment_status === 'failed') {
          throw new Error('Payment failed or was cancelled');
        } else {
          // Continue polling
          setTimeout(checkPaymentStatus, 3000);
        }
      };

      // Start polling after 5 seconds
      setTimeout(checkPaymentStatus, 5000);

    } catch (error: any) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      setPaymentStep('form');
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const totalAmount = calculateTotal();
  const originalAmount = event.price * formData.quantity;
  const savings = originalAmount - totalAmount;

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {/* No Account Required Notice */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">No Account Required</h3>
              <p className="text-sm text-blue-800">
                You can purchase tickets instantly without creating an account. 
                Just fill in your details below and pay with M-Pesa to get your digital ticket.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-32 object-cover rounded-lg"
            />
            <h3 className="font-bold text-lg">{event.title}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{event.venue}</span>
              </div>
            </div>

            <Separator />
            
            <div className="flex justify-between items-center">
              <span>Price per ticket:</span>
              <Badge variant="secondary">KSh {event.price.toLocaleString()}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {paymentStep === 'form' && 'Your Details'}
              {paymentStep === 'payment' && 'Processing Payment'}
              {paymentStep === 'success' && 'Payment Successful!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentStep === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (M-Pesa) *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0712345678"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Number of Tickets
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum 10 tickets per purchase</p>
                </div>

                {/* Promo Code Section */}
                <div>
                  <Label>Promo Code (Optional)</Label>
                  <PromoCodeInput
                    eventId={event.id}
                    onDiscountApplied={setAppliedDiscount}
                    onDiscountRemoved={() => setAppliedDiscount(null)}
                    appliedDiscount={appliedDiscount}
                  />
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({formData.quantity} tickets):</span>
                    <span>KSh {originalAmount.toLocaleString()}</span>
                  </div>
                  
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedDiscount.code}):</span>
                      <span>-KSh {savings.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-green-600">
                      KSh {totalAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  {savings > 0 && (
                    <p className="text-sm text-green-600 text-center">
                      You save KSh {savings.toLocaleString()}!
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  Pay with M-Pesa
                </Button>
              </form>
            )}

            {paymentStep === 'payment' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
                <p className="text-gray-600 mb-4">
                  Please check your phone for the M-Pesa prompt
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    Enter your M-Pesa PIN to complete the payment of <br />
                    <strong>KSh {totalAmount.toLocaleString()}</strong>
                    {formData.quantity > 1 && (
                      <span className="block text-xs mt-1">
                        ({formData.quantity} tickets)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
                <p className="text-gray-600">
                  Generating your digital ticket{formData.quantity > 1 ? 's' : ''}...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
