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
import {Eye, EyeOff, AlertCircle} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useToast} from '@/hooks/use-toast';
import {useLanguage} from '@/context/language-context';
import {saudiLocations, getNeighborhoodsForCity} from '@/lib/locations';
import {db} from '@/lib/firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';
import {
  seekerSignupSchema,
  workerSignupSchema,
  storeSignupSchema,
} from '@/lib/validation-schemas';

const storeCategories = [
  {value: 'hardware', labelKey: 'storeCat_hardware' as const},
  {value: 'electrical', labelKey: 'storeCat_electrical' as const},
  {value: 'plumbing', labelKey: 'storeCat_plumbing' as const},
  {value: 'paint', labelKey: 'storeCat_paint' as const},
  {value: 'building_materials', labelKey: 'storeCat_building_materials' as const},
  {value: 'safety', labelKey: 'storeCat_safety' as const},
  {value: 'garden', labelKey: 'storeCat_garden' as const},
  {value: 'cleaning', labelKey: 'storeCat_cleaning' as const},
  {value: 'automotive', labelKey: 'storeCat_automotive' as const},
  {value: 'general', labelKey: 'storeCat_general' as const},
  {value: 'other', labelKey: 'storeCat_other' as const},
];

// Helper to display inline field errors
function FieldError({message}: {message?: string}) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export default function SignupPage() {
  const [userType, setUserType] = useState('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const {t} = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    countryCode: '+966',
    phone: '',
    country: 'Saudi Arabia',
    city: '',
    neighborhood: '',
    age: '',
    profession: '',
    password: '',
    name: '',
    username: '',
    // Store Owner fields
    storeName: '',
    storeAddress: '',
    storeCategory: '',
  });
  const {signup} = useAuth();
  const router = useRouter();
  const {toast} = useToast();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const next = {...prev};
      delete next[field];
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {id, value} = e.target;
    setFormData(prev => ({...prev, [id]: value}));
    clearFieldError(id);
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({...prev, profession: value}));
    clearFieldError('profession');
  };

  const handleCityChange = (value: string) => {
    setFormData(prev => ({...prev, city: value, neighborhood: ''}));
    clearFieldError('city');
  };

  const handleNeighborhoodChange = (value: string) => {
    setFormData(prev => ({...prev, neighborhood: value}));
  };

  const handleStoreCategoryChange = (value: string) => {
    setFormData(prev => ({...prev, storeCategory: value}));
    clearFieldError('storeCategory');
  };

  // ── Validate and extract errors ────────────────────────────────────────────
  const validate = (): boolean => {
    const base = {
      email: formData.email,
      countryCode: formData.countryCode,
      phone: formData.phone,
      city: formData.city,
      neighborhood: formData.neighborhood || undefined,
      password: formData.password,
    };

    let result;
    if (userType === 'store') {
      result = storeSignupSchema.safeParse({
        ...base,
        storeName: formData.storeName,
        storeAddress: formData.storeAddress,
        storeCategory: formData.storeCategory,
      });
    } else if (userType === 'worker') {
      result = workerSignupSchema.safeParse({
        ...base,
        name: formData.name,
        username: formData.username,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        profession: formData.profession,
      });
    } else {
      result = seekerSignupSchema.safeParse({
        ...base,
        name: formData.name,
        username: formData.username,
      });
    }

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs?.[0]) errors[key] = msgs[0];
      }
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    const fullPhoneNumber = `${formData.countryCode}${formData.phone}`;

    // ── Store Owner Flow ───────────────────────────────────────────────────
    if (userType === 'store') {
      try {
        const newUserId = `store-${Date.now()}`;
        const docRef = await addDoc(collection(db, 'stores'), {
          ownerId: newUserId,
          storeName: formData.storeName,
          storeAddress: formData.storeAddress,
          storeCategory: formData.storeCategory,
          phone: fullPhoneNumber,
          email: formData.email,
          city: formData.city,
          neighborhood: formData.neighborhood,
          country: 'Saudi Arabia',
          status: 'pending',
          createdAt: serverTimestamp(),
        });

        // Also create a local user so they can log in
        const storeUser: Partial<User> = {
          id: newUserId,
          name: formData.storeName,
          username: formData.email.split('@')[0],
          email: formData.email,
          phone: fullPhoneNumber,
          country: 'Saudi Arabia',
          city: formData.city,
          neighborhood: formData.neighborhood,
          role: 'store' as const,
          avatarUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
          storeDocId: docRef.id,
        };

        const outcome = signup(storeUser as User, formData.password);

        if (outcome && typeof outcome === 'object' && 'rateLimited' in outcome) {
          toast({variant: 'destructive', title: 'Too Many Attempts', description: outcome.message});
          return;
        }

        if (outcome) {
          toast({title: t('storePendingDesc'), description: t('storePendingDesc')});
          router.push('/dashboard-store');
        }
      } catch (error) {
        // Log internally; show only a generic message to the user
        console.error('[signup] Store Firestore write failed:', error);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('storeUpdateError'),
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── Seeker / Worker Flow ───────────────────────────────────────────────
    const newUser: Partial<User> = {
      id: `user-${Date.now()}`,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      phone: fullPhoneNumber,
      country: formData.country,
      city: formData.city,
      neighborhood: formData.neighborhood,
      role: userType as 'seeker' | 'worker',
      avatarUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
    };

    if (userType === 'worker') {
      newUser.age = parseInt(formData.age);
      newUser.experience = 0;
      newUser.profession = formData.profession;
      newUser.bio = 'Newly registered worker.';
      newUser.avgRating = 0;
    }

    const outcome = signup(newUser as User, formData.password);

    if (outcome && typeof outcome === 'object' && 'rateLimited' in outcome) {
      toast({variant: 'destructive', title: 'Too Many Attempts', description: outcome.message});
      setIsSubmitting(false);
      return;
    }

    if (outcome) {
      toast({title: t('profileUpdated'), description: t('profileSavedSuccess')});
      const targetDashboard =
        (outcome as User).role === 'worker' ? '/dashboard-worker' : '/dashboard';
      router.push(targetDashboard);
    } else {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('sendOtpError'),
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-12 bg-background px-4">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{t('signup')}</CardTitle>
            <CardDescription>
              {t('createAccount')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t('iAmA')}</Label>
              <RadioGroup
                defaultValue="seeker"
                onValueChange={setUserType}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="seeker" id="seeker" />
                  <Label htmlFor="seeker">{t('serviceSeeker')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="worker" id="worker" />
                  <Label htmlFor="worker">{t('worker')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="store" id="store" />
                  <Label htmlFor="store">{t('storeOwner')}</Label>
                </div>
              </RadioGroup>
            </div>

            {/* === STORE OWNER FIELDS === */}
            {userType === 'store' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="storeName">{t('storeName')}</Label>
                  <Input
                    id="storeName"
                    placeholder={t('storeNamePlaceholder')}
                    required
                    value={formData.storeName}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.storeName}
                  />
                  <FieldError message={fieldErrors.storeName} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="storeAddress">{t('storeAddress')}</Label>
                  <Input
                    id="storeAddress"
                    placeholder={t('storeAddressPlaceholder')}
                    required
                    value={formData.storeAddress}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.storeAddress}
                  />
                  <FieldError message={fieldErrors.storeAddress} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="storeCategory">{t('storeCategory')}</Label>
                  <Select onValueChange={handleStoreCategoryChange} value={formData.storeCategory}>
                    <SelectTrigger id="storeCategory">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {storeCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {t(cat.labelKey as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldErrors.storeCategory} />
                </div>
              </>
            )}

            {/* === SEEKER / WORKER SHARED FIELDS === */}
            {userType !== 'store' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t('fullName')}</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.name}
                  />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="username"
                      placeholder="johndoe"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="pl-7"
                      aria-invalid={!!fieldErrors.username}
                    />
                  </div>
                  <FieldError message={fieldErrors.username} />
                </div>
              </div>
            )}

            {/* === SHARED: EMAIL & PHONE === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.email}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="countryCode"
                    type="tel"
                    placeholder="+966"
                    required
                    readOnly
                    className="w-16 bg-muted text-muted-foreground cursor-not-allowed text-center px-1"
                    value={formData.countryCode}
                    onChange={handleChange}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="5X XXX XXXX"
                    required
                    className="flex-1"
                    value={formData.phone}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.phone}
                  />
                </div>
                <FieldError message={fieldErrors.phone} />
              </div>
            </div>

            {/* === SHARED: CITY & NEIGHBORHOOD === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">{t('city')} ({t('saudiArabia')})</Label>
                <Select onValueChange={handleCityChange} value={formData.city}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder={t('selectCity')} />
                  </SelectTrigger>
                  <SelectContent>
                    {saudiLocations.map(location => (
                      <SelectItem key={location.city.value} value={location.city.value}>
                        {location.city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={fieldErrors.city} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="neighborhood">{t('neighborhood')}</Label>
                <Select onValueChange={handleNeighborhoodChange} value={formData.neighborhood} disabled={!formData.city}>
                  <SelectTrigger id="neighborhood">
                    <SelectValue placeholder={t('selectNeighborhood')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getNeighborhoodsForCity(formData.city).map(hood => (
                      <SelectItem key={hood.value} value={hood.value}>
                        {hood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* === WORKER-ONLY FIELDS === */}
            {userType === 'worker' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="age">{t('age')}</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="30"
                    required
                    value={formData.age}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.age}
                  />
                  <FieldError message={fieldErrors.age} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profession">{t('profession')}</Label>
                  <Select onValueChange={handleSelectChange} value={formData.profession}>
                    <SelectTrigger id="profession">
                      <SelectValue placeholder={t('selectProfession')} />
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map(p => (
                        <SelectItem key={p.name} value={p.name} disabled={p.isComingSoon}>
                          {p.name}{p.isComingSoon ? ` (${t('comingSoon')})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldErrors.profession} />
                </div>
              </>
            )}

            {/* === PASSWORD (all user types) === */}
            <div className="grid gap-2 relative">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="pr-10"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.password}
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
              <FieldError message={fieldErrors.password} />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? t('submitting') : userType === 'store' ? t('registerStore') : t('signup')}
            </Button>

            <div className="mt-4 text-center text-sm">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="underline">
                {t('signIn')}
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}