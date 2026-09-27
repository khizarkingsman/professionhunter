'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Send, CheckCircle2, Clock, Loader2, ShieldAlert } from 'lucide-react';

export function PhoneVerificationSidebarBox() {
  const { user, updateUser, setPhoneVerified } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 60-second cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Only render if a user is logged in, their phone is unverified, and they are not admin
  if (!user || user.phoneVerified || user.role === 'admin') {
    return null;
  }

  const handleSendCode = async () => {
    setErrorMessage(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setCodeSent(true);
        setCooldown(60);
        toast({
          title: t('verifyPhoneTitle'),
          description: t('codeSentSuccess'),
        });
      } else {
        const errorText = data.error || 'Failed to send verification code.';
        setErrorMessage(errorText);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: errorText,
        });
      }
    } catch (err) {
      console.error('[phone-verification-box] Send OTP failed:', err);
      const netError = 'Network error while requesting verification code.';
      setErrorMessage(netError);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: netError,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setErrorMessage(t('invalidCodeFormat'));
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, code: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Update user state immediately in context and storage
        if (setPhoneVerified) {
          setPhoneVerified(true);
        }
        await updateUser({ ...user, phoneVerified: true });

        toast({
          title: t('verifyPhoneTitle'),
          description: t('phoneVerifiedSuccess'),
        });
      } else {
        const errorText = data.error || 'Invalid or expired verification code.';
        setErrorMessage(errorText);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: errorText,
        });
      }
    } catch (err) {
      console.error('[phone-verification-box] Verify OTP failed:', err);
      const netError = 'Network error while verifying code.';
      setErrorMessage(netError);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: netError,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="phone-verification-box"
      className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-3.5 shadow-sm text-start"
    >
      <div className="flex items-start gap-2.5">
        <div className="rounded-lg bg-amber-500/20 p-1.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">
              {t('verifyPhoneTitle')}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {t('verifyPhonePrompt')}
          </p>
          {user.phone && (
            <p className="text-[11px] font-mono text-muted-foreground/80 mt-1">
              {user.phone}
            </p>
          )}
        </div>
      </div>

      {!codeSent ? (
        <div className="mt-3">
          <Button
            id="send-phone-otp-btn"
            size="sm"
            onClick={handleSendCode}
            disabled={isSending}
            className="w-full h-8 text-xs font-medium"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {t('sendingCode')}
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {t('sendCode')}
              </>
            )}
          </Button>
          {errorMessage && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-destructive">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Input
            id="phone-otp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder={t('enterCodePlaceholder')}
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setCode(val);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.length === 6 && !isVerifying) {
                handleVerifyCode();
              }
            }}
            className="h-8 text-center text-xs font-mono tracking-widest bg-background"
          />

          <Button
            id="verify-phone-otp-btn"
            size="sm"
            onClick={handleVerifyCode}
            disabled={isVerifying || code.length !== 6}
            className="w-full h-8 text-xs font-medium"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {t('verifyingCode')}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {t('verifyCode')}
              </>
            )}
          </Button>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            {cooldown > 0 ? (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('resendIn').replace('{seconds}', String(cooldown))}
              </span>
            ) : (
              <Button
                variant="link"
                size="sm"
                onClick={handleSendCode}
                disabled={isSending}
                className="h-auto p-0 text-[11px] text-primary underline"
              >
                {t('resendCode')}
              </Button>
            )}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-destructive">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
