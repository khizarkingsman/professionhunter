'use client';

import {useState, useEffect} from 'react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';
import {db} from '@/lib/firebase';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {Store, Clock, CheckCircle, XCircle, MapPin, AlertTriangle, Pencil, Save} from 'lucide-react';

const storeCategories = [
  {value: 'hardware', label: 'Hardware & Tools'},
  {value: 'electrical', label: 'Electrical Supplies'},
  {value: 'plumbing', label: 'Plumbing Supplies'},
  {value: 'paint', label: 'Paint & Finishing'},
  {value: 'building_materials', label: 'Building Materials'},
  {value: 'safety', label: 'Safety Equipment'},
  {value: 'garden', label: 'Garden & Outdoor'},
  {value: 'cleaning', label: 'Cleaning Supplies'},
  {value: 'automotive', label: 'Automotive Parts'},
  {value: 'general', label: 'General Store'},
  {value: 'other', label: 'Other'},
];

type StoreData = {
  storeName: string;
  storeAddress: string;
  storeCategory: string;
  phone: string;
  email: string;
  city: string;
  neighborhood: string;
  country: string;
  status: 'pending' | 'verified' | 'rejected';
};

export default function DashboardStoreClient() {
  const {user} = useAuth();
  const router = useRouter();
  const {toast} = useToast();

  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StoreData>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'store' || !user.storeDocId) {
      router.push('/');
      return;
    }

    const fetchStore = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'stores', user.storeDocId!));
        if (docSnap.exists()) {
          const data = docSnap.data() as StoreData;
          setStoreData(data);
          setEditForm(data);
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        toast({variant: 'destructive', title: 'Error', description: 'Could not load your store data.'});
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [user, router, toast]);

  const handleSave = async () => {
    if (!user?.storeDocId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'stores', user.storeDocId), {
        storeName: editForm.storeName,
        storeAddress: editForm.storeAddress,
        storeCategory: editForm.storeCategory,
        phone: editForm.phone,
      });
      setStoreData(prev => prev ? {...prev, ...editForm} : prev);
      setEditing(false);
      toast({title: 'Saved!', description: 'Your store details have been updated.'});
    } catch (error) {
      console.error('Error updating store:', error);
      toast({variant: 'destructive', title: 'Error', description: 'Could not update your store.'});
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
      badgeVariant: 'outline' as const,
      label: 'Pending Approval',
    },
    verified: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10 border-green-500/30',
      badgeVariant: 'default' as const,
      label: 'Verified',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10 border-red-500/30',
      badgeVariant: 'destructive' as const,
      label: 'Rejected',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse text-muted-foreground text-lg">Loading your store dashboard...</div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-muted-foreground">Store data could not be found.</p>
      </div>
    );
  }

  const status = statusConfig[storeData.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const categoryLabel = storeCategories.find(c => c.value === storeData.storeCategory)?.label || storeData.storeCategory;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold">Store Dashboard</h1>
          <p className="text-muted-foreground">Manage your store listing and details.</p>
        </div>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${status.bgColor}`}>
        <CardContent className="flex items-center gap-4 py-6">
          <StatusIcon className={`h-10 w-10 ${status.color}`} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold">Store Status</h2>
              <Badge variant={status.badgeVariant} className="text-sm">
                {status.label}
              </Badge>
            </div>
            {storeData.status === 'pending' && (
              <p className="text-sm text-muted-foreground">
                Your store registration is being reviewed. You will be notified once it is approved.
              </p>
            )}
            {storeData.status === 'verified' && (
              <p className="text-sm text-muted-foreground">
                Your store is approved and live!
              </p>
            )}
            {storeData.status === 'rejected' && (
              <p className="text-sm text-muted-foreground">
                Your store registration was not approved. Please contact support for details.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Notice */}
      <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-4 py-6">
          <MapPin className="h-8 w-8 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">Store Map Listing</h3>
            {storeData.status === 'verified' ? (
              <p className="text-sm text-muted-foreground">
                Your store is visible on the map and can be discovered by workers and clients.
              </p>
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Your store will appear on the map once your payment is verified and your store is approved. Until then, your listing is not visible to others.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Store Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Store Details</CardTitle>
            <CardDescription>Your registered store information.</CardDescription>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => {setEditing(false); setEditForm(storeData);}}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Store Name</Label>
              {editing ? (
                <Input
                  value={editForm.storeName || ''}
                  onChange={e => setEditForm(prev => ({...prev, storeName: e.target.value}))}
                />
              ) : (
                <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">{storeData.storeName}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Store Category</Label>
              {editing ? (
                <Select value={editForm.storeCategory} onValueChange={v => setEditForm(prev => ({...prev, storeCategory: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {storeCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">{categoryLabel}</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Store Address</Label>
            {editing ? (
              <Input
                value={editForm.storeAddress || ''}
                onChange={e => setEditForm(prev => ({...prev, storeAddress: e.target.value}))}
              />
            ) : (
              <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">{storeData.storeAddress}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Phone</Label>
              {editing ? (
                <Input
                  value={editForm.phone || ''}
                  onChange={e => setEditForm(prev => ({...prev, phone: e.target.value}))}
                />
              ) : (
                <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">{storeData.phone}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">{storeData.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>City</Label>
              <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">{storeData.city}</p>
            </div>
            <div className="grid gap-2">
              <Label>Neighborhood</Label>
              <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">{storeData.neighborhood || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
