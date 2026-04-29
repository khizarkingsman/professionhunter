'use client';

import {useState, useEffect} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {CreditCard, Lock, Smartphone, ShieldCheck, Loader2, CheckCircle2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

interface SaudiCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: string) => void;
  planName: string;
  amount: string;
}

export function SaudiCheckout({isOpen, onClose, onSuccess, planName, amount}: SaudiCheckoutProps) {
  const {toast} = useToast();
  const [tab, setTab] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'mada' | 'unknown'>('unknown');

  // STC Pay State
  const [phoneNumber, setPhoneNumber] = useState('');

  // Detect Card Type (Simple Logic for Saudi mada / Visa / MC)
  useEffect(() => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) setCardType('visa');
    else if (raw.startsWith('5')) setCardType('mastercard');
    // mada cards in Saudi often start with specific ranges (e.g., 4069, 4463, 5888, 6049, 6361)
    else if (['4069', '4463', '5888', '6049', '6361', '9682'].some(prefix => raw.startsWith(prefix))) setCardType('mada');
    else setCardType('unknown');
  }, [cardNumber]);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 2) return digits.substring(0, 2) + '/' + digits.substring(2, 4);
    return digits;
  };

  const handlePayment = async () => {
    // Basic validation
    if (tab === 'card') {
      if (cardNumber.length < 16 || expiry.length < 5 || cvv.length < 3) {
        toast({variant: 'destructive', title: 'Invalid Details', description: 'Please complete the card information.'});
        return;
      }
    } else {
      if (phoneNumber.length < 9) {
        toast({variant: 'destructive', title: 'Invalid Phone', description: 'Please enter a valid Saudi phone number.'});
        return;
      }
    }

    setIsProcessing(true);

    // Simulate Payment Gateway Roundtrip
    await new Promise(resolve => setTimeout(resolve, 2500));

    setIsProcessing(false);
    setIsDone(true);

    // Final Success Callback
    setTimeout(() => {
      onSuccess(tab === 'card' ? (cardType === 'mada' ? 'mada card' : cardType.toUpperCase() + ' card') : 'STC Pay');
      setIsDone(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden p-0">
        {!isDone ? (
          <>
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                   Secure Checkout
                </DialogTitle>
                <DialogDescription>
                  Complete your payment for <strong>{planName}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg flex justify-between items-center border border-primary/10">
                <span className="text-sm font-medium">Total Amount</span>
                <span className="text-xl font-bold text-primary">{amount}</span>
              </div>
            </div>

            <Tabs defaultValue="card" className="w-full" onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 mx-6 mt-4">
                <TabsTrigger value="card" className="gap-2">
                  <CreditCard className="h-4 w-4" /> Card
                </TabsTrigger>
                <TabsTrigger value="stc" className="gap-2">
                  <Smartphone className="h-4 w-4" /> Digital Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="p-6 pt-4 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="pr-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {cardType === 'visa' && <span className="text-[10px] font-bold text-blue-800 italic bg-white px-1 border border-blue-200 rounded">VISA</span>}
                      {cardType === 'mastercard' && <div className="flex -space-x-1"><div className="w-3 h-3 rounded-full bg-red-500 opacity-80" /><div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" /></div>}
                      {cardType === 'mada' && <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1 border border-green-200 rounded">mada</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <div className="relative">
                       <Input
                        id="cvv"
                        type="password"
                        placeholder="123"
                        value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                        maxLength={3}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cardHolder">Cardholder Name</Label>
                  <Input
                    id="cardHolder"
                    placeholder="NAME ON CARD"
                    className="uppercase"
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="stc" className="p-6 pt-4 space-y-4 text-center">
                 <div className="py-4 px-6 mb-4 rounded-xl bg-[#4F008C]/5 border border-[#4F008C]/20 flex flex-col items-center">
                    <div className="text-2xl font-bold text-[#4F008C]">stc pay</div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">A verification code will be sent to your number</p>
                 </div>
                 
                 <div className="grid gap-2 text-left">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                        <span className="flex items-center justify-center px-3 bg-muted rounded-md text-sm">+966</span>
                        <Input
                          id="phone"
                          placeholder="5XXXXXXXX"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          maxLength={9}
                          className="flex-1"
                        />
                    </div>
                 </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="p-6 bg-muted/30 border-t mt-4">
              <div className="w-full flex flex-col gap-3">
                <Button 
                  onClick={handlePayment} 
                  disabled={isProcessing} 
                  className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Secuely...</>
                  ) : (
                    `Pay ${amount}`
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                   <ShieldCheck className="h-3 w-3 text-green-600" />
                   100% Encrypted & SSL Secured Payment
                </div>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce shadow-xl border-4 border-white">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-bold text-green-800">Payment Verified!</h3>
                <p className="text-muted-foreground">Your subscription has been updated successfully.</p>
            </div>
            <div className="text-sm font-mono bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                AUTH CODE: {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
