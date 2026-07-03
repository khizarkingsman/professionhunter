'use client';

import {professions} from '@/lib/data';
import {Card, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import {Search, UserCheck, Star} from 'lucide-react';
import {useLanguage} from '@/context/language-context';
import {translations} from '@/lib/translations';

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="flex-1">
      <section className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] flex items-center justify-center text-center text-white">
        <Image
          src="https://picsum.photos/seed/hero-handy/1920/1080"
          alt="A skilled worker fixing something"
          fill
          className="object-cover -z-10 brightness-50"
          data-ai-hint="tools workshop"
          priority
        />
        <div className="container px-4 md:px-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
              {t('heroTitle')}
            </h1>
            <p className="mx-auto max-w-[700px] text-lg md:text-xl">
              {t('heroSubtitle')}
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              {t('howItWorks')}
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
              {t('howItWorksTitle')}
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t('howItWorksSubtitle')}
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold font-headline">{t('step1Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('step1Desc')}
              </p>
            </div>
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <UserCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold font-headline">{t('step2Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('step2Desc')}
              </p>
            </div>
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold font-headline">{t('step3Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="professions" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                {t('ourServices')}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('ourServicesSubtitle')}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:gap-12">
            {professions.map(profession => {
              const Icon = profession.icon;
              const nameKey = `prof_${profession.name}` as keyof typeof translations['en'];
              const descKey = `desc_${profession.name}` as keyof typeof translations['en'];
              
              if (profession.isComingSoon) {
                return (
                  <Card 
                    key={profession.name} 
                    className="relative flex h-full flex-col items-center justify-center p-6 text-center border-dashed opacity-80 bg-muted/20 select-none overflow-hidden"
                  >
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {t('comingSoon')}
                      </span>
                    </div>
                    <CardHeader>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                        <Icon className="h-8 w-8 text-muted-foreground/60" />
                      </div>
                      <CardTitle className="font-headline text-muted-foreground">{t(nameKey as any)}</CardTitle>
                    </CardHeader>
                    <CardDescription className="text-muted-foreground/70">{t(descKey as any)}</CardDescription>
                  </Card>
                );
              }

              return (
                <Link
                  key={profession.name}
                  href={`/dashboard?profession=${encodeURIComponent(profession.name)}`}
                  className="group"
                >
                  <Card className="profession-card flex h-full flex-col items-center justify-center p-6 text-center">
                    <CardHeader>
                      <div className="profession-icon-wrap mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <Icon className="profession-icon h-8 w-8" />
                      </div>
                      <CardTitle className="profession-title font-headline">{t(nameKey as any)}</CardTitle>
                    </CardHeader>
                    <CardDescription className="profession-desc">{t(descKey as any)}</CardDescription>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
