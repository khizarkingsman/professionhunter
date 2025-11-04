
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Calendar, Lock } from 'lucide-react';

interface SubscriptionDialogSeekerProps {
  onSubscribe: () => void;
}

export function SubscriptionDialogSeeker({ onSubscribe }: SubscriptionDialogSeekerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const [card, setCard] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let formattedValue = value;

    if (id === 'number') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    } else if (id === 'expiry') {
        if (value.length === 2 && card.expiry.length === 1) {
            formattedValue = value + '/';
        } else if (value.length === 2 && card.expiry.length === 3) {
            formattedValue = value.slice(0,1);
        }
    }
    setCard(prev => ({ ...prev, [id]: formattedValue }));
  };

  const handlePayment = () => {
    if (card.number.length < 19 || card.expiry.length < 5 || card.cvc.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Invalid Card Details',
        description: 'Please check your card information and try again.',
      });
      return;
    }

    onSubscribe();
    toast({
      title: 'Payment Successful!',
      description: 'You are now a Pro Seeker. Enjoy access to all workers!',
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
          Subscribe Now for $15
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Subscription</DialogTitle>
          <DialogDescription>
            Enter your card details to become a Pro Seeker for $15/15 days.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="number">Card Number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="number" placeholder="0000 0000 0000 0000" value={card.number} onChange={handleInputChange} maxLength={19} className="pl-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="expiry" placeholder="MM/YY" value={card.expiry} onChange={handleInputChange} maxLength={5} className="pl-10"/>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="cvc" placeholder="123" value={card.cvc} onChange={handleInputChange} maxLength={4} className="pl-10"/>
                </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handlePayment} className="w-full">
            Pay $15.00
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

