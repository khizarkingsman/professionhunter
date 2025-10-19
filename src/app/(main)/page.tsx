import {professions} from '@/lib/data';
import {Card, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none font-headline">
                Connect with Skilled Workers
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                HandyConnect helps you find trusted local professionals for any job, big or small.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/dashboard">Find a Worker</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup">Become a Worker</Link>
              </Button>
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
                <Card
                  key={profession.name}
                  className="flex flex-col items-center justify-center p-6 text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="font-headline">{profession.name}</CardTitle>
                  </CardHeader>
                  <CardDescription>{profession.description}</CardDescription>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
