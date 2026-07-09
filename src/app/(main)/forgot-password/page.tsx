'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const { requestPasswordReset, resetPassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSendResetEmail = async () => {
    if (!identifier.trim()) {
      toast({ variant: 'destructive', title: t('error'), description: t('validIdentifierError') });
      return;
    }

    setIsSending(true);
    const returnedCode = await requestPasswordReset(identifier);
    setIsSending(false);

    if (!returnedCode) {
      toast({
        variant: 'destructive',
        title: t('userNotFoundError'),
        description: t('sendOtpError'),
      });
      return;
    }

    setGeneratedCode(returnedCode);
    setStep(2);
    toast({
      title: t('emailSent'),
      description: t('otpSentDesc'),
    });
  };

  const handleVerifyCode = () => {
    if (code !== generatedCode) {
      toast({
        variant: 'destructive',
        title: t('invalidCode'),
        description: t('invalidCodeDesc'),
      });
      return;
    }
    setStep(3);
    toast({ title: t('verifiedSuccess'), description: t('chooseNewPasswordDesc') });
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: t('tooShort'), description: t('passwordLengthError') });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('mismatch'),
        description: t('passwordMismatchError'),
      });
      return;
    }

    const success = resetPassword(identifier, newPassword);
    if (success) {
      toast({
        title: t('resetSuccess'),
        description: t('resetSuccessDesc'),
      });
      router.push('/login');
    } else {
      toast({ variant: 'destructive', title: t('error'), description: t('resetPasswordErrorDesc') });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">

        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">{t('resetPassword')}</CardTitle>
              <CardDescription>{t('forgotPasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="identifier">{t('identifier')}</Label>
                <Input
                  id="identifier"
                  placeholder={t('identifierPlaceholder')}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <Button className="w-full" onClick={handleSendResetEmail} disabled={isSending}>
                {isSending ? t('sendingOtp') : t('sendOtp')}
              </Button>
              <Link href="/login" className="text-center text-sm text-muted-foreground hover:underline">
                {t('backToLogin')}
              </Link>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">{t('verifyOtpCode')}</CardTitle>
              <CardDescription>{t('verifyOtpDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">{t('verificationCode')}</Label>
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
              <Button className="w-full" onClick={handleVerifyCode}>{t('verifyAccount')}</Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>{t('goBack')}</Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">{t('createNewPassword')}</CardTitle>
              <CardDescription>{t('createNewPasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="newPassword">{t('newPassword')}</Label>
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
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
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
              <Button className="w-full" onClick={handleResetPassword}>{t('saveLogin')}</Button>
            </CardFooter>
          </>
        )}

      </Card>
    </div>
  );
}
