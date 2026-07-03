
'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            {t('footerRights')}
          </p>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            {t('terms')}
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
            {t('privacy')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
