import {Footer} from '@/components/footer';
import {Header} from '@/components/header';
import {Suspense} from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
