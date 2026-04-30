'use client';

import {useState, useMemo, useEffect} from 'react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  Calendar,
  Crown,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ShieldCheck,
  Receipt,
  Sparkles,
} from 'lucide-react';
import {SaudiCheckout} from '@/components/saudi-checkout';

// Plan definitions
const plans = {
  worker: {
    free: {name: 'Free Worker', price: 0, period: 'forever', features: ['Basic profile listing', 'Receive reviews']},
    pro: {name: 'Pro Worker', price: 100, period: '30 days', features: ['Pro badge on profile', 'Priority listing in search', 'Experience display', 'Increased visibility']},
  },
  seeker: {
    free: {name: 'Free Seeker', price: 0, period: 'forever', features: ['Browse workers', 'Leave reviews']},
    pro: {name: 'Pro Seeker', price: 60, period: '15 days', features: ['Access Pro worker profiles', 'Connect with top professionals', 'Priority support']},
  },
};

// Mock payment history is no longer needed since we store it in the user object
function getPaymentHistory(user: any) {
  if (!user || !user.paymentHistory) return [];
  // Return reversed history so newest is first
  return [...user.paymentHistory].reverse();
}

export default function SubscriptionClient() {
  const {user, loading, updateUser, subscribeUser, subscribeSeeker} = useAuth();
  const router = useRouter();
  const {toast} = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Memoize payment history at the top to ensure hooks are called unconditionally
  const paymentHistory = useMemo(() => getPaymentHistory(user), [user]);

  // Handle redirection in useEffect to avoid "cannot update while rendering" errors
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user?.role === 'store') {
      router.push('/dashboard-store');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role === 'store') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading or redirecting...</p>
      </div>
    );
  }

  const isWorker = user.role === 'worker';
  const isPro = isWorker ? user.isPro : user.isSeekerPro;
  const endDateStr = isWorker ? user.subscriptionEndDate : user.seekerSubscriptionEndDate;
  const currentPlanKey = isPro ? 'pro' : 'free';
  const rolePlans = isWorker ? plans.worker : plans.seeker;
  const currentPlan = rolePlans[currentPlanKey];
  const upgradePlan = rolePlans.pro;

  const endDate = endDateStr ? new Date(endDateStr) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const lastPayment = paymentHistory[0];

  const handleCancel = () => {
    setCancelling(true);
    // Simulate cancellation - remove pro status
    const updatedUser = {...user};
    if (isWorker) {
      updatedUser.isPro = false;
      updatedUser.subscriptionEndDate = undefined;
    } else {
      updatedUser.isSeekerPro = false;
      updatedUser.seekerSubscriptionEndDate = undefined;
    }
    updateUser(updatedUser);
    setCancelling(false);
    toast({
      title: 'Subscription Cancelled',
      description: 'Your subscription has been cancelled. You can resubscribe anytime.',
    });
  };

  const handleUpgrade = () => {
    setIsCheckoutOpen(true);
  };

  const onCheckoutSuccess = (method: string) => {
    const amount = `${upgradePlan.price} SAR`;
    if (isWorker) {
      subscribeUser(amount, method);
    } else {
      subscribeSeeker(amount, method);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your plan, billing, and payment history.</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className={isPro ? 'border-2 border-primary/40 bg-primary/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPro ? (
                <Crown className="h-8 w-8 text-primary" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-xl">{currentPlan.name}</CardTitle>
                <CardDescription>
                  {isPro ? 'Your current active plan' : 'You are on the free plan'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isPro ? 'default' : 'secondary'} className="text-sm px-3 py-1">
              {isPro ? 'Active' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{currentPlan.price} SAR</span>
            <span className="text-muted-foreground">/ {currentPlan.period}</span>
          </div>

          {/* Features */}
          <ul className="space-y-2">
            {currentPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Billing Details (only for Pro users) */}
      {isPro && endDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Next Billing Date</p>
              <p className="text-lg font-semibold">
                {endDate.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Payment Method</p>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5 text-primary" />
                {lastPayment?.method || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Expires 12/28</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Plan Amount</p>
              <p className="text-lg font-semibold">{upgradePlan.price} SAR</p>
              <p className="text-xs text-muted-foreground mt-1">per {upgradePlan.period}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {!isPro && (
            <Button onClick={handleUpgrade} className="gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Upgrade to {upgradePlan.name} — {upgradePlan.price} SAR/{upgradePlan.period}
            </Button>
          )}

          {isPro && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2" disabled={cancelling}>
                  <XCircle className="h-4 w-4" />
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your <strong>{currentPlan.name}</strong> subscription? 
                    You will immediately lose access to all Pro features. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep My Plan</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Your past subscription payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{payment.plan}</p>
                      <p className="text-xs text-muted-foreground">{payment.date} · {payment.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{payment.amount}</p>
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No payment history yet</p>
              <p className="text-sm">Subscribe to a Pro plan to see your payment records here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SaudiCheckout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={onCheckoutSuccess}
        planName={upgradePlan.name}
        amount={`${upgradePlan.price} SAR`}
      />
    </div>
  );
}
