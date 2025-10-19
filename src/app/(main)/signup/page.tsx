'use client';

import {useState} from 'react';
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
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {professions} from '@/lib/data';
import Link from 'next/link';
import {Eye, EyeOff} from 'lucide-react';

export default function SignupPage() {
  const [userType, setUserType] = useState('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-12 bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create an account</CardTitle>
          <CardDescription>Join HandyConnect to find or offer professional services.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>I am a...</Label>
            <RadioGroup defaultValue="seeker" onValueChange={setUserType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seeker" id="seeker" />
                <Label htmlFor="seeker">Service Seeker</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="worker" id="worker" />
                <Label htmlFor="worker">Worker</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 234 567 890" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="USA" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="New York" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="30" required />
            </div>
            {userType === 'worker' && (
              <div className="grid gap-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input id="experience" type="number" placeholder="5" required />
              </div>
            )}
          </div>

          {userType === 'worker' && (
            <div className="grid gap-2">
              <Label htmlFor="profession">Profession</Label>
              <Select>
                <SelectTrigger id="profession">
                  <SelectValue placeholder="Select your profession" />
                </SelectTrigger>
                <SelectContent>
                  {professions.map(p => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          <Button type="submit" className="w-full mt-4">
            Create account
          </Button>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
