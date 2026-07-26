import {Footer} from '@/components/footer';
import {Header} from '@/components/header';
import {Suspense} from 'react';
import {LoadingScreen} from '@/components/loading-screen';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<LoadingScreen message="Loading page..." />}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
