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
import Link from 'next/link';
import {Eye, EyeOff, AlertCircle} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';
import {useLanguage} from '@/context/language-context';
import {loginSchema, type LoginInput} from '@/lib/validation-schemas';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});

  const {login} = useAuth();
  const router = useRouter();
  const {toast} = useToast();
  const {t} = useLanguage();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = () => {
    // ── Input validation ──────────────────────────────────────────────────
    const result = loginSchema.safeParse({identifier, password});
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setFieldErrors({
        identifier: flat.identifier?.[0],
        password: flat.password?.[0],
      });
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);

    const {identifier: validIdentifier, password: validPassword} = result.data;
    const outcome = login(validIdentifier, validPassword);

    setIsSubmitting(false);

    // ── Rate-limit response ───────────────────────────────────────────────
    if (outcome && typeof outcome === 'object' && 'rateLimited' in outcome) {
      toast({
        variant: 'destructive',
        title: 'Too Many Attempts',
        description: outcome.message,
      });
      return;
    }

    // ── Auth response ─────────────────────────────────────────────────────
    if (outcome) {
      const loggedInUser = outcome;
      toast({
        title: t('loginSuccessful'),
        description: t('welcomeBackUser').replace('{name}', loggedInUser.name),
      });
      const targetDashboard =
        loggedInUser.role === 'admin'
          ? '/admin'
          : loggedInUser.role === 'worker'
          ? '/dashboard-worker'
          : loggedInUser.role === 'store'
          ? '/dashboard-store'
          : '/dashboard';
      router.push(targetDashboard);
    } else {
      toast({
        variant: 'destructive',
        title: t('loginFailed'),
        description: t('invalidEmailPassword'),
      });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('login')}</CardTitle>
          <CardDescription>{t('welcomeBack')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="identifier">{t('emailUsernamePhone')}</Label>
            <Input
              id="identifier"
              type="text"
              placeholder={t('emailPlaceholder')}
              required
              value={identifier}
              onChange={e => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier) setFieldErrors(prev => ({...prev, identifier: undefined}));
              }}
              aria-invalid={!!fieldErrors.identifier}
              aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
            />
            {fieldErrors.identifier && (
              <p id="identifier-error" className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.identifier}
              </p>
            )}
          </div>
          <div className="grid gap-2 relative">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="pr-10"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: undefined}));
              }}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">Toggle password visibility</span>
            </Button>
            {fieldErrors.password && (
              <p id="password-error" className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.password}
              </p>
            )}
          </div>
          <div className="text-right">
             <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
               {t('forgotPasswordLink')}
             </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button className="w-full" onClick={handleLogin} disabled={isSubmitting}>
            {isSubmitting ? t('submitting') : t('login')}
          </Button>
          <div className="mt-4 text-center text-sm">
            {t('dontHaveAccount')}{' '}
            <Link href="/signup" className="underline">
              {t('signup')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}