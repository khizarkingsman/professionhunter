
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
import { useAuth } from '@/context/auth-context';
import { SubscriptionDialog } from './subscription-dialog';

export default function SubscriptionCard() {
  const { user, subscribeUser } = useAuth();

  if (!user || user.role !== 'worker') {
    return null;
  }

  if (user.isPro) {
    const endDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : 'N/A';
    return (
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardHeader>
                <CardTitle  className="text-2xl font-headline flex items-center gap-2">
                    <CheckCircle /> You are a Pro Worker!
                </CardTitle>
                <CardDescription className="text-green-100">
                    You have access to all exclusive benefits. Your subscription is valid until {endDate}.
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
          Elevate your profile with a Pro badge and highlight your experience to attract more clients.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">$10</span>
            <span className="text-lg text-primary-foreground/80">/30 days</span>
          </div>
          <div className="text-lg">
            <span className="line-through text-primary-foreground/70">$15</span>
            <span className="font-bold text-yellow-300 ml-2">33% OFF</span>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Display a "Pro" badge on your profile
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Increase your visibility with service seekers
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <SubscriptionDialog onSubscribe={subscribeUser} />
      </CardFooter>
    </Card>
  );
}
