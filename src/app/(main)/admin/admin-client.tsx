'use client';

import {useState, useEffect, useMemo} from 'react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';
import type {User} from '@/lib/data';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {Textarea} from '@/components/ui/textarea';
import {
  Shield,
  Users,
  ShieldCheck,
  Crown,
  XCircle,
  CheckCircle,
  Clock,
  Search,
  Gift,
  Ban,
  Eye,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';

const DURATION_OPTIONS = [
  {value: '7', label: '7 Days'},
  {value: '30', label: '1 Month'},
  {value: '90', label: '3 Months'},
  {value: '180', label: '6 Months'},
  {value: '365', label: '1 Year'},
];

export default function AdminClient() {
  const {user, loading, getAllUsers, grantSubscription, revokeSubscription, updateIqamaStatus} = useAuth();
  const router = useRouter();
  const {toast} = useToast();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('30');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedIqamaImage, setSelectedIqamaImage] = useState<{url: string, label: string} | null>(null);
  const [grantDialogOpen, setGrantDialogOpen] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Refresh user list periodically
  useEffect(() => {
    if (user?.role === 'admin') {
      setAllUsers(getAllUsers());
    }
  }, [user, getAllUsers]);

  // Refresh the list from localStorage on any interaction
  const refreshUsers = () => {
    setAllUsers(getAllUsers());
  };

  const workers = useMemo(() => {
    return allUsers.filter(u => u.role === 'worker');
  }, [allUsers]);

  const filteredWorkers = useMemo(() => {
    if (!searchTerm) return workers;
    const term = searchTerm.toLowerCase();
    return workers.filter(
      w =>
        w.name.toLowerCase().includes(term) ||
        w.username.toLowerCase().includes(term) ||
        w.email.toLowerCase().includes(term) ||
        (w.profession && w.profession.toLowerCase().includes(term)) ||
        (w.city && w.city.toLowerCase().includes(term))
    );
  }, [workers, searchTerm]);

  const pendingVerifications = useMemo(() => {
    return workers.filter(w => w.iqamaStatus === 'pending');
  }, [workers]);

  const handleGrantSubscription = (workerId: string) => {
    grantSubscription(workerId, parseInt(selectedDuration));
    refreshUsers();
    setGrantDialogOpen(null);
    setSelectedDuration('30');
    toast({
      title: 'Subscription Granted',
      description: `Worker subscription activated for ${DURATION_OPTIONS.find(d => d.value === selectedDuration)?.label}.`,
    });
  };

  const handleRevokeSubscription = (workerId: string) => {
    revokeSubscription(workerId);
    refreshUsers();
    toast({
      title: 'Subscription Revoked',
      description: 'Worker subscription has been revoked.',
      variant: 'destructive',
    });
  };

  const handleApproveIqama = (workerId: string) => {
    updateIqamaStatus(workerId, 'approved');
    refreshUsers();
    toast({
      title: 'Iqama Approved',
      description: 'Worker has been verified successfully.',
    });
  };

  const handleRejectIqama = (workerId: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }
    updateIqamaStatus(workerId, 'rejected', rejectReason);
    refreshUsers();
    setRejectReason('');
    toast({
      title: 'Iqama Rejected',
      description: 'Worker verification has been rejected.',
      variant: 'destructive',
    });
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage workers, subscriptions, and Iqama verifications.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{workers.length}</p>
              <p className="text-xs text-muted-foreground">Total Workers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">
                {workers.filter(w => w.isPro).length}
              </p>
              <p className="text-xs text-muted-foreground">Pro Workers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {workers.filter(w => w.isVerified).length}
              </p>
              <p className="text-xs text-muted-foreground">Verified Workers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{pendingVerifications.length}</p>
              <p className="text-xs text-muted-foreground">Pending Verifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="workers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workers" className="gap-2">
            <Users className="h-4 w-4" />
            Workers
          </TabsTrigger>
          <TabsTrigger value="verifications" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Verifications
            {pendingVerifications.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                {pendingVerifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workers by name, email, profession, or city..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Worker List */}
          <div className="space-y-3">
            {filteredWorkers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No workers found.
                </CardContent>
              </Card>
            ) : (
              filteredWorkers.map(worker => (
                <Card key={worker.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Worker Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                          <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{worker.name}</p>
                            {worker.isPro && (
                              <Badge variant="default" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                PRO
                              </Badge>
                            )}
                            {worker.isVerified && (
                              <Badge
                                variant="outline"
                                className="text-xs text-green-600 border-green-600"
                              >
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {worker.subscriptionGrantedBy === 'admin' && (
                              <Badge
                                variant="outline"
                                className="text-xs text-purple-600 border-purple-600"
                              >
                                <Gift className="h-3 w-3 mr-1" />
                                Admin Granted
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {worker.profession || 'No profession'} · {worker.city}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {worker.email} · @{worker.username}
                          </p>
                          {worker.isPro && worker.subscriptionEndDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Expires:{' '}
                              {new Date(worker.subscriptionEndDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {/* Grant Subscription */}
                        <Dialog
                          open={grantDialogOpen === worker.id}
                          onOpenChange={open => {
                            setGrantDialogOpen(open ? worker.id : null);
                            if (!open) setSelectedDuration('30');
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Gift className="h-3.5 w-3.5" />
                              Grant Sub
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Grant Subscription</DialogTitle>
                              <DialogDescription>
                                Grant Pro subscription to <strong>{worker.name}</strong> for a set
                                duration.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Duration</Label>
                                <Select
                                  value={selectedDuration}
                                  onValueChange={setSelectedDuration}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DURATION_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleGrantSubscription(worker.id)}
                                className="gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Grant Subscription
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Revoke Subscription */}
                        {worker.isPro && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-1">
                                <Ban className="h-3.5 w-3.5" />
                                Revoke
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Subscription?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will immediately remove Pro access for{' '}
                                  <strong>{worker.name}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevokeSubscription(worker.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Revoke Subscription
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Iqama Status */}
                        {worker.iqamaStatus === 'pending' && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Iqama Pending
                          </Badge>
                        )}
                        {worker.iqamaStatus === 'approved' && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Iqama Verified
                          </Badge>
                        )}
                        {worker.iqamaStatus === 'rejected' && (
                          <Badge variant="outline" className="text-red-500 border-red-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            Iqama Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Verifications Tab */}
        <TabsContent value="verifications" className="space-y-4">
          {pendingVerifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-lg">No Pending Verifications</p>
                <p className="text-sm">
                  All Iqama verification requests have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingVerifications.map(worker => (
              <Card key={worker.id} className="border-2 border-orange-500/30 bg-orange-500/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                        <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{worker.name}</CardTitle>
                        <CardDescription>
                          {worker.profession || 'No profession'} · {worker.city} · @
                          {worker.username}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Iqama Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                        Iqama Number
                      </Label>
                      <p className="text-lg font-mono font-semibold bg-muted rounded-lg px-4 py-2">
                        {worker.iqamaNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                        Submitted On
                      </Label>
                      <p className="text-sm font-medium bg-muted rounded-lg px-4 py-2">
                        {worker.iqamaSubmittedAt
                          ? new Date(worker.iqamaSubmittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* View Iqama Images */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                      Iqama Documents
                    </Label>
                    <div className="flex gap-3">
                      {worker.iqamaImageUrl && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => setSelectedIqamaImage({url: worker.iqamaImageUrl!, label: 'Front'})}
                            >
                              <Eye className="h-4 w-4" />
                              View Front
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Iqama Document (Front) — {worker.name}</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={worker.iqamaImageUrl}
                                alt="Iqama document front"
                                className="max-w-full max-h-[70vh] rounded-lg border object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {worker.iqamaBackImageUrl && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => setSelectedIqamaImage({url: worker.iqamaBackImageUrl!, label: 'Back'})}
                            >
                              <Eye className="h-4 w-4" />
                              View Back
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Iqama Document (Back) — {worker.name}</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={worker.iqamaBackImageUrl}
                                alt="Iqama document back"
                                className="max-w-full max-h-[70vh] rounded-lg border object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                    {/* Approve */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="gap-2 flex-1">
                          <CheckCircle className="h-4 w-4" />
                          Approve Verification
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Iqama?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Confirm that you have physically verified the Iqama for{' '}
                            <strong>{worker.name}</strong>. The worker will receive a "Verified"
                            badge on their profile.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleApproveIqama(worker.id)}>
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Reject */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="gap-2 flex-1">
                          <XCircle className="h-4 w-4" />
                          Reject Verification
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Iqama Verification</DialogTitle>
                          <DialogDescription>
                            Please provide a reason for rejecting {worker.name}&apos;s Iqama
                            verification. The worker will see this reason.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label>Rejection Reason</Label>
                            <Textarea
                              placeholder="e.g., Document is unclear, ID number doesn't match, expired document..."
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectIqama(worker.id)}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
