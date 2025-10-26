
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
import {professions, type User} from '@/lib/data';
import Link from 'next/link';
import {Eye, EyeOff} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';

export default function SignupPage() {
  const [userType, setUserType] = useState('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    countryCode: '',
    phone: '',
    country: '',
    city: '',
    age: '',
    profession: '',
    password: '',
    name: '',
    username: '',
  });
  const {signup} = useAuth();
  const router = useRouter();
  const {toast} = useToast();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {id, value} = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({...prev, profession: value}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = `${formData.countryCode}${formData.phone}`;
    const newUser: Partial<User> = {
      id: `user-${Date.now()}`,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      phone: fullPhoneNumber,
      country: formData.country,
      city: formData.city,
      role: userType as 'seeker' | 'worker',
      avatarUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
    };

    if (userType === 'worker') {
      newUser.age = parseInt(formData.age);
      newUser.experience = 0; // Defaulting experience
      newUser.profession = formData.profession;
      newUser.bio = 'Newly registered worker.';
      newUser.avgRating = 0;
    }

    const registeredUser = signup(newUser as User, formData.password);

    if (registeredUser) {
      toast({
        title: 'Account Created!',
        description: "You've been successfully signed up.",
      });
      const targetDashboard =
        registeredUser.role === 'worker' ? '/dashboard-worker' : '/dashboard';
      router.push(targetDashboard);
    } else {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'An account with this email may already exist.',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-12 bg-background px-4">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Create an account</CardTitle>
            <CardDescription>
              Join ProConnect to find or offer professional services.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>I am a...</Label>
              <RadioGroup
                defaultValue="seeker"
                onValueChange={setUserType}
                className="flex gap-4"
              >
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  required
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="countryCode"
                    type="tel"
                    placeholder="+1"
                    required
                    className="w-16"
                    value={formData.countryCode}
                    onChange={handleChange}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="234 567 890"
                    required
                    className="flex-1"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="USA"
                  required
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  required
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            {userType === 'worker' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="30"
                    required
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Select onValueChange={handleSelectChange} value={formData.profession}>
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
              </>
            )}

            <div className="grid gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="pr-10"
                value={formData.password}
                onChange={handleChange}
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
        </form>
      </Card>
    </div>
  );
}
