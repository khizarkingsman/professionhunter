'use client';

import {useState, useEffect} from 'react';

import Link from 'next/link';
import {Button} from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {Menu, Wrench, LayoutDashboard, User, LogIn, UserPlus, LogOut, Languages, CreditCard, Store, MapPin, Shield} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import { EditSeekerProfileDialog } from './edit-seeker-profile-dialog';
import { ModeToggle } from './mode-toggle';
import { useLanguage } from '@/context/language-context';
import { Language } from '@/lib/translations';

const authLinks = [
  {href: '/login', label: 'login', icon: LogIn},
  {href: '/signup', label: 'signup', icon: UserPlus},
];

export function Header() {
  const {user, logout} = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getVisibleNavLinks = () => {
    if (!user) return [];
    const links = [
      {href: '/dashboard', label: t('findWorker'), icon: LayoutDashboard, roles: ['seeker']},
      {
        href: '/live-map', 
        label: t('findWorkerOnMap'), 
        icon: MapPin, 
        roles: ['seeker']
      },
      {
        href: '/dashboard-worker',
        label: t('myDashboard'),
        icon: User,
        roles: ['worker'],
      },
      {
        href: '/dashboard-store',
        label: t('myStore'),
        icon: Store,
        roles: ['store'],
      },
      {
        href: '/subscription',
        label: t('subscription'),
        icon: CreditCard,
        roles: ['worker', 'seeker'],
      },
      {
        href: '/admin',
        label: t('adminPanel'),
        icon: Shield,
        roles: ['admin'],
      },
    ];
    return links.filter(link => link.roles.includes(user.role));
  };

  return (
    <header suppressHydrationWarning className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side={language === 'ar' || language === 'ur' ? 'right' : 'left'}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" />
                <span className="font-bold">{t('title')}</span>
              </SheetTitle>
            </SheetHeader>
            <div className="py-4">
              {user ? (
                <>
                  <div className="px-2 pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.username}</span>
                            </div>
                        </div>
                        {user.role === 'seeker' && <EditSeekerProfileDialog user={user} />}
                    </div>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {getVisibleNavLinks().map(link => (
                      <Button
                        key={link.href}
                        asChild
                        variant="ghost"
                        className="justify-start gap-2 text-start"
                      >
                        <Link href={link.href}>
                          <link.icon className="h-5 w-5" />
                          {link.label}
                        </Link>
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="justify-start gap-2"
                      onClick={() => logout()}
                    >
                      <LogOut className="h-5 w-5" />
                      {t('logout')}
                    </Button>
                  </nav>
                </>
              ) : (
                <nav className="flex flex-col gap-2">
                  {authLinks.map(link => (
                    <Button
                      key={link.href}
                      asChild
                      variant={link.href === '/signup' ? 'default' : 'ghost'}
                      className="justify-start gap-2"
                    >
                      <Link href={link.href}>
                        <link.icon className="h-5 w-5" />
                        {t(link.label as any)}
                      </Link>
                    </Button>
                  ))}
                </nav>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between md:justify-start">
          <Link href="/" className="ml-2 md:ml-6 flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">{t('title')}</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2" suppressHydrationWarning>
           {isMounted && (
             <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger suppressHydrationWarning className="w-[130px] h-9 border-none bg-transparent hover:bg-accent focus:ring-0">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <SelectValue placeholder="Language" />
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية السعودية (Saudi Arabic)</SelectItem>
                <SelectItem value="ur">اردو (Urdu)</SelectItem>
              </SelectContent>
            </Select>
           )}
          <ModeToggle />
          <nav className="hidden gap-2 lg:flex">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                   <Link href={user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/dashboard-worker' : user.role === 'store' ? '/dashboard-store' : '/dashboard'}>{t('dashboard')}</Link>
                </Button>
                {(user.role === 'worker' || user.role === 'seeker') && (
                  <Button variant="ghost" asChild>
                    <Link href="/subscription">{t('subscription')}</Link>
                  </Button>
                )}
                <Button onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> {t('logout')}
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">{t('signup')}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
