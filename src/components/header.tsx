import Link from 'next/link';
import {Button} from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {Menu, Wrench, LayoutDashboard, User, LogIn, UserPlus} from 'lucide-react';

const navLinks = [
  {href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/dashboard-worker', label: 'Worker Dashboard', icon: User},
];

const authLinks = [
  {href: '/login', label: 'Login', icon: LogIn},
  {href: '/signup', label: 'Sign Up', icon: UserPlus},
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" />
                <span className="font-bold">HandyConnect</span>
              </SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <nav className="flex flex-col gap-2">
                {navLinks.map(link => (
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
              </nav>
              <hr className="my-4" />
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
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between md:justify-start">
          <Link href="/" className="ml-2 md:ml-6 flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">HandyConnect</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="hidden gap-2 md:flex">
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
