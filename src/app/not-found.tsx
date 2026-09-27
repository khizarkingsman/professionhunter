import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="max-w-md w-full text-center border-border shadow-lg p-6 sm:p-8">
        <CardContent className="space-y-6 pt-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-2">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold tracking-wider text-primary uppercase">
              404 Error
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Page Not Found
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              The page you are looking for might have been moved, renamed, or is temporarily unavailable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <Button asChild variant="default" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/search">
                <Compass className="w-4 h-4 mr-2" />
                Find Workers
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
