import Link from 'next/link';
import {Button} from './ui/button';
import {Sheet, SheetContent, SheetTrigger} from './ui/sheet';
import {Menu, Wrench} from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 p-4">
                <Link href="/" className="flex items-center space-x-2">
                  <Wrench className="h-6 w-6 text-primary" />
                  <span className="font-bold">HandyConnect</span>
                </Link>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
