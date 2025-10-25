
import {professions} from '@/lib/data';
import {Card, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import {Search, UserCheck, CalendarCheck, Star} from 'lucide-react';

export default function Home() {
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
              Connect with Skilled Workers
            </h1>
            <p className="mx-auto max-w-[700px] text-lg md:text-xl">
              ProConnect helps you find trusted local professionals for any job, big or small.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
              Find Help in 3 Easy Steps
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Getting the job done has never been simpler.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold font-headline">1. Find a Service</h3>
              <p className="text-sm text-muted-foreground">
                Browse our list of skilled professionals and find the perfect match for your needs.
              </p>
            </div>
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <UserCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold font-headline">2. Hire with Confidence</h3>
              <p className="text-sm text-muted-foreground">
                Read reviews, chat with professionals, and hire the best person for the job.
              </p>
            </div>
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold font-headline">3. Review & Rate</h3>
              <p className="text-sm text-muted-foreground">
                After the job is done, leave a review to help others in the community.
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
                Our Services
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Browse our wide range of professional services to find the right expert for your
                needs.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:gap-12">
            {professions.map(profession => {
              const Icon = profession.icon;
              return (
                <Link
                  key={profession.name}
                  href={`/dashboard?profession=${encodeURIComponent(profession.name)}`}
                  className="group"
                >
                  <Card className="flex h-full flex-col items-center justify-center p-6 text-center transition-shadow duration-300 group-hover:shadow-xl">
                    <CardHeader>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <Icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="font-headline">{profession.name}</CardTitle>
                    </CardHeader>
                    <CardDescription>{profession.description}</CardDescription>
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
