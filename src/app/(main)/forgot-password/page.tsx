'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Eye, EyeOff} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {useToast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const {requestPasswordReset, resetPassword} = useAuth();
  const {toast} = useToast();
  const router = useRouter();

  const handleSendResetEmail = async () => {
    if (!identifier.trim()) {
       toast({variant: 'destructive', title: 'Error', description: 'Please enter a valid identifier.'});
       return;
    }

    setIsSending(true);
    const returnedCode = await requestPasswordReset(identifier);
    setIsSending(false);

    if (!returnedCode) {
      toast({
        variant: 'destructive',
        title: 'User Not Found or Error',
        description: 'Unable to send OTP email. Ensure the account exists.',
      });
      return;
    }

    setGeneratedCode(returnedCode);
    setStep(2);
    toast({
      title: 'Email Sent!',
      description: `A 6-digit code has been dispatched to the account email securely via EmailJS.`,
    });
  };

  const handleVerifyCode = () => {
    if (code !== generatedCode) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'The verification code you entered is incorrect.',
      });
      return;
    }
    setStep(3);
    toast({title: 'Verified!', description: 'Please choose a new password.'});
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
        toast({variant: 'destructive', title: 'Too short', description: 'Password must be at least 6 characters.'});
        return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Mismatch',
        description: 'Passwords do not match.',
      });
      return;
    }

    const success = resetPassword(identifier, newPassword);
    if (success) {
      toast({
        title: 'Success!',
        description: 'Your password has been successfully reset locally. Please log in.',
      });
      router.push('/login');
    } else {
        toast({variant: 'destructive', title: 'Error', description: 'Failed to reset password.'});
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Reset Password</CardTitle>
              <CardDescription>Enter your email, username, or phone number to receive a 6-digit OTP code.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="identifier">Identifier</Label>
                <Input
                  id="identifier"
                  placeholder="Email, Username, or +966..."
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <Button className="w-full" onClick={handleSendResetEmail} disabled={isSending}>
                {isSending ? 'Sending OTP Code...' : 'Send OTP via EmailJS'}
              </Button>
              <Link href="/login" className="text-center text-sm text-muted-foreground hover:underline">
                 Back to Login
              </Link>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Verify OTP Code</CardTitle>
              <CardDescription>Enter the 6-digit code we sent via EmailJS to your contact method.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="text-center text-lg tracking-[0.5em] font-mono"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <Button className="w-full" onClick={handleVerifyCode}>Verify Account</Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>Go Back</Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Create New Password</CardTitle>
              <CardDescription>Your account has been verified. Choose a secure new password.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="pr-10"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <Button className="w-full" onClick={handleResetPassword}>Save & Login</Button>
            </CardFooter>
          </>
        )}

      </Card>
    </div>
  );
}
