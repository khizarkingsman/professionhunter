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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2 relative">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="pr-10"
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
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button className="w-full" asChild>
            <Link href="/dashboard">Sign in as Seeker</Link>
          </Button>
          <Button className="w-full" variant="secondary" asChild>
            <Link href="/dashboard-worker">Sign in as Worker</Link>
          </Button>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
