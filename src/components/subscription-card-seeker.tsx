
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
import {CheckCircle, Crown} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { SubscriptionDialogSeeker } from './subscription-dialog-seeker';

export default function SubscriptionCardSeeker() {
  const { user, subscribeSeeker } = useAuth();

  if (!user || user.role !== 'seeker') {
    return null;
  }

  if (user.isSeekerPro) {
    const endDate = user.seekerSubscriptionEndDate ? new Date(user.seekerSubscriptionEndDate).toLocaleDateString() : 'N/A';
    return (
        <Card className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-lg">
            <CardHeader>
                <CardTitle  className="text-2xl font-headline flex items-center gap-2">
                    <Crown /> You are a Pro Seeker!
                </CardTitle>
                <CardDescription className="text-amber-100">
                    You have access to all Pro workers. Your subscription is valid until {endDate}.
                </CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Become a Pro Seeker</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Unlock access to top-tier professionals by subscribing to our Pro Seeker plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">$15</span>
            <span className="text-lg text-primary-foreground/80">/15 days</span>
          </div>
          <div className="text-lg">
            <span className="line-through text-primary-foreground/70">$25</span>
            <span className="font-bold text-yellow-300 ml-2">40% OFF</span>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            View profiles of all "Pro" workers
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Connect with the most experienced professionals
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <SubscriptionDialogSeeker onSubscribe={subscribeSeeker} />
      </CardFooter>
    </Card>
  );
}
