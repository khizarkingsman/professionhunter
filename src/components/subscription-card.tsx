
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
import { useAuth } from '@/context/auth-context';

export default function SubscriptionCard() {
  const {toast} = useToast();
  const { user, subscribeUser } = useAuth();

  const handleSubscribe = () => {
    subscribeUser();
    toast({
      title: 'Subscription Activated!',
      description: 'You are now a Pro Worker. Enjoy the new benefits!',
    });
  };

  if (user?.isPro) {
    return (
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardHeader>
                <CardTitle  className="text-2xl font-headline flex items-center gap-2">
                    <CheckCircle /> You are a Pro Worker!
                </CardTitle>
                <CardDescription className="text-green-100">
                    You have access to all exclusive benefits.
                </CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Become a Pro Worker</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Get recognized by service seekers, show off your badge and experience.
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
            Display years of experience (2-4 years)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Green "Pro" badge on your profile
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Get more recognition from service seekers
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
