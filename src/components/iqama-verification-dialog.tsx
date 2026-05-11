'use client';

import {useState} from 'react';
import {useAuth} from '@/context/auth-context';
import {useToast} from '@/hooks/use-toast';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {ShieldCheck, Upload, FileCheck, Clock, XCircle, AlertTriangle} from 'lucide-react';
import {Badge} from '@/components/ui/badge';

export function IqamaVerificationDialog() {
  const {user, submitIqama} = useAuth();
  const {toast} = useToast();
  const [iqamaNumber, setIqamaNumber] = useState('');
  const [iqamaImage, setIqamaImage] = useState<string | null>(null);
  const [iqamaBackImage, setIqamaBackImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [backFileName, setBackFileName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user || user.role !== 'worker') return null;

  const isPro = user.isPro;
  const iqamaStatus = user.iqamaStatus || 'none';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isBack: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    if (isBack) {
      setBackFileName(file.name);
    } else {
      setFileName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimension 800px to keep base64 string small
        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress heavily as JPEG to avoid LocalStorage quota issues
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        if (isBack) {
          setIqamaBackImage(compressedBase64);
        } else {
          setIqamaImage(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!iqamaNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter your Iqama number.',
      });
      return;
    }

    if (!iqamaImage || !iqamaBackImage) {
      toast({
        variant: 'destructive',
        title: 'Missing Document',
        description: 'Please upload both front and back photos of your Iqama.',
      });
      return;
    }

    setSubmitting(true);
    submitIqama(iqamaNumber, iqamaImage, iqamaBackImage);
    setSubmitting(false);
    setIsOpen(false);
    setIqamaNumber('');
    setIqamaImage(null);
    setIqamaBackImage(null);
    setFileName('');
    setBackFileName('');

    toast({
      title: 'Iqama Submitted',
      description: 'Your Iqama has been submitted for verification. The admin will review it shortly.',
    });
  };

  // If not subscribed, handle the expired verification state or show a prompt to subscribe first
  if (!isPro) {
    if (iqamaStatus === 'approved') {
      return (
        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
          <XCircle className="h-6 w-6 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-600">Unverified Iqama (Subscription Expired)</p>
            <p className="text-xs text-muted-foreground">
              Your subscription has ended. Please renew your Pro plan to restore your verified status.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-sm">Iqama Verification</p>
          <p className="text-xs text-muted-foreground">
            Subscribe to a Pro plan first to verify your Iqama and get the verified badge.
          </p>
        </div>
      </div>
    );
  }

  // Show current status
  if (iqamaStatus === 'approved') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-green-500/30 bg-green-500/10">
        <ShieldCheck className="h-6 w-6 text-green-500" />
        <div>
          <p className="font-semibold text-green-600">Iqama Verified ✅</p>
          <p className="text-xs text-muted-foreground">
            Your identity has been verified. Your profile shows a "Verified" badge.
          </p>
        </div>
      </div>
    );
  }

  if (iqamaStatus === 'pending') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-orange-500/30 bg-orange-500/10">
        <Clock className="h-6 w-6 text-orange-500" />
        <div>
          <p className="font-semibold text-orange-600">Verification Pending</p>
          <p className="text-xs text-muted-foreground">
            Your Iqama has been submitted and is awaiting admin review. You will be notified once it
            is processed.
          </p>
        </div>
      </div>
    );
  }

  if (iqamaStatus === 'rejected') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
          <XCircle className="h-6 w-6 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-600">Verification Rejected</p>
            <p className="text-xs text-muted-foreground">
              Reason: {user.iqamaRejectionReason || 'No reason provided.'}
            </p>
          </div>
        </div>
        {/* Allow resubmission */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Resubmit Iqama
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resubmit Your Iqama</DialogTitle>
              <DialogDescription>
                Please correct the issues and resubmit your Iqama for verification.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="iqama-number">Iqama Number</Label>
                <Input
                  id="iqama-number"
                  placeholder="Enter your 10-digit Iqama number"
                  value={iqamaNumber}
                  onChange={e => setIqamaNumber(e.target.value)}
                  maxLength={10}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="iqama-photo">Iqama Photo (Front)</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => document.getElementById('iqama-photo-resubmit')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {fileName || 'Choose File'}
                  </Button>
                  <input
                    id="iqama-photo-resubmit"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileChange(e, false)}
                  />
                </div>
                {iqamaImage && (
                  <p className="text-xs text-green-600">✓ Front photo selected</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="iqama-photo-back">Iqama Photo (Back)</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => document.getElementById('iqama-photo-back-resubmit')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {backFileName || 'Choose File'}
                  </Button>
                  <input
                    id="iqama-photo-back-resubmit"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileChange(e, true)}
                  />
                </div>
                {iqamaBackImage && (
                  <p className="text-xs text-green-600">✓ Back photo selected</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                <FileCheck className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Resubmit for Verification'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default: not submitted yet
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-sm">Verify Your Iqama</p>
              <p className="text-xs text-muted-foreground">
                Submit your Saudi worker ID to get a verified badge on your profile.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            Verify Now
          </Badge>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Your Iqama</DialogTitle>
          <DialogDescription>
            Submit your Iqama (Saudi Worker ID) number and clear photos of the front and back of the document. An admin
            will physically verify and approve your identity.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="iqama-number-new">Iqama Number</Label>
            <Input
              id="iqama-number-new"
              placeholder="Enter your 10-digit Iqama number"
              value={iqamaNumber}
              onChange={e => setIqamaNumber(e.target.value)}
              maxLength={10}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="iqama-photo-new">Iqama Photo (Front)</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById('iqama-photo-new')?.click()}
              >
                <Upload className="h-4 w-4" />
                {fileName || 'Choose File'}
              </Button>
              <input
                id="iqama-photo-new"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileChange(e, false)}
              />
            </div>
            {iqamaImage && (
              <p className="text-xs text-green-600">✓ Front photo selected</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="iqama-photo-back-new">Iqama Photo (Back)</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById('iqama-photo-back-new')?.click()}
              >
                <Upload className="h-4 w-4" />
                {backFileName || 'Choose File'}
              </Button>
              <input
                id="iqama-photo-back-new"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileChange(e, true)}
              />
            </div>
            {iqamaBackImage && (
              <p className="text-xs text-green-600">✓ Back photo selected</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Upload clear photos of your Iqama card. Max 5MB per file. Accepted formats: JPG, PNG.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            <FileCheck className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
