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
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@/lib/validation-schemas';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { t } = useLanguage();

  const { requestPasswordReset, resetPassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────

  const handleSendResetEmail = async () => {
    const result = forgotPasswordSchema.safeParse({ identifier });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setFieldErrors({ identifier: flat.identifier?.[0] ?? '' });
      return;
    }
    setFieldErrors({});

    setIsSending(true);
    const returnedCode = await requestPasswordReset(identifier);
    setIsSending(false);

    if (!returnedCode) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('sendOtpError'),
      });
      return;
    }

    // Rate-limit signal from auth-context
    if (returnedCode.startsWith('__rate_limited__:')) {
      const msg = returnedCode.replace('__rate_limited__:', '');
      toast({ variant: 'destructive', title: 'Too Many Attempts', description: msg });
      return;
    }

    // SECURITY: Always advance to step 2 — regardless of whether the account
    // exists.  If the code starts with '__fake__' the OTP won't match any real
    // user, so no access is granted, but we reveal nothing about account
    // existence to the requester.
    setGeneratedCode(returnedCode);
    setStep(2);
    toast({
      title: t('emailSent'),
      description: t('otpSentDesc'),
    });
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────

  const handleVerifyCode = () => {
    if (!code.trim()) {
      setFieldErrors({ code: 'Please enter the verification code.' });
      return;
    }
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setFieldErrors({ code: 'Code must be 6 digits.' });
      return;
    }
    setFieldErrors({});

    // Reject fake codes (user doesn't exist case)
    const isRealCode = !generatedCode.startsWith('__fake__');
    const expectedCode = isRealCode ? generatedCode : '';

    if (!isRealCode || code !== expectedCode) {
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

  // ── Step 3: Reset password ────────────────────────────────────────────────

  const handleResetPassword = () => {
    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const formErrors = result.error.flatten().formErrors;
      const errors: Record<string, string> = {};
      if (flat.newPassword?.[0]) errors.newPassword = flat.newPassword[0];
      if (flat.confirmPassword?.[0]) errors.confirmPassword = flat.confirmPassword[0];
      if (formErrors?.[0]) errors.confirmPassword = formErrors[0]; // refine error
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const success = resetPassword(identifier, result.data.newPassword);
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
                  onChange={e => {
                    setIdentifier(e.target.value);
                    if (fieldErrors.identifier) setFieldErrors(prev => ({...prev, identifier: ''}));
                  }}
                  aria-invalid={!!fieldErrors.identifier}
                />
                <FieldError message={fieldErrors.identifier} />
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
                  onChange={e => {
                    // Only allow digits
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(digits);
                    if (fieldErrors.code) setFieldErrors(prev => ({...prev, code: ''}));
                  }}
                  className="text-center text-lg tracking-[0.5em] font-mono"
                  aria-invalid={!!fieldErrors.code}
                />
                <FieldError message={fieldErrors.code} />
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
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) setFieldErrors(prev => ({...prev, newPassword: ''}));
                  }}
                  aria-invalid={!!fieldErrors.newPassword}
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
                <FieldError message={fieldErrors.newPassword} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="pr-10"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({...prev, confirmPassword: ''}));
                  }}
                  aria-invalid={!!fieldErrors.confirmPassword}
                />
                <FieldError message={fieldErrors.confirmPassword} />
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
