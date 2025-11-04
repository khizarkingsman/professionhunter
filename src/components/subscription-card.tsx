
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {CheckCircle} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

export default function SubscriptionCard() {
  const {toast} = useToast();

  const handleSubscribe = () => {
    toast({
      title: 'Subscription Feature Coming Soon!',
      description: 'Thank you for your interest. Payment processing will be implemented soon.',
    });
  };

  return (
    <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Become a Pro Worker</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Unlock exclusive benefits and get noticed by more clients.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">$8</span>
          <span className="text-lg text-primary-foreground/80">/month</span>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Priority placement in search results
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Pro badge on your profile
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Access to advanced analytics
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          onClick={handleSubscribe}
        >
          Subscribe Now
        </Button>
      </CardFooter>
    </Card>
  );
}
