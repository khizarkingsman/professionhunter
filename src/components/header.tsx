
'use client';

import Link from 'next/link';
import {Button} from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {Menu, Wrench, LayoutDashboard, User, LogIn, UserPlus, LogOut} from 'lucide-react';
import {useAuth} from '@/context/auth-context';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import { EditSeekerProfileDialog } from './edit-seeker-profile-dialog';

const navLinks = [
  {href: '/dashboard', label: 'Find a Worker', icon: LayoutDashboard, roles: ['seeker']},
  {
    href: '/dashboard-worker',
    label: 'Worker Dashboard',
    icon: User,
    roles: ['worker'],
  },
];

const authLinks = [
  {href: '/login', label: 'Login', icon: LogIn},
  {href: '/signup', label: 'Sign Up', icon: UserPlus},
];

export function Header() {
  const {user, logout} = useAuth();

  const getVisibleNavLinks = () => {
    if (!user) return [];
    return navLinks.filter(link => link.roles.includes(user.role));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" />
                <span className="font-bold">Profession Hunter</span>
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
                        className="justify-start gap-2"
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
                      Logout
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
                        {link.label}
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
            <span className="hidden font-bold sm:inline-block">Profession Hunter</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="hidden gap-2">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                   <Link href={user.role === 'worker' ? '/dashboard-worker' : '/dashboard'}>Dashboard</Link>
                </Button>
                <Button onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
