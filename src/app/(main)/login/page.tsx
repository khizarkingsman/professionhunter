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
import {Eye, EyeOff} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';
import {useLanguage} from '@/context/language-context';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {login} = useAuth();
  const router = useRouter();
  const {toast} = useToast();
  const {t} = useLanguage();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = () => {
    const loggedInUser = login(identifier, password);
    if (loggedInUser) {
      toast({title: 'Login Successful', description: `Welcome back, ${loggedInUser.name}!`});
      const targetDashboard =
        loggedInUser.role === 'worker' ? '/dashboard-worker' : loggedInUser.role === 'store' ? '/dashboard-store' : '/dashboard';
      router.push(targetDashboard);
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password.',
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
            <Label htmlFor="identifier">Email, Username, or Phone Number</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="m@example.com or +966..."
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
            />
          </div>
          <div className="grid gap-2 relative">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="pr-10"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
          </div>
          <div className="text-right">
             <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
               Forgot password?
             </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button className="w-full" onClick={handleLogin}>
            {t('login')}
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