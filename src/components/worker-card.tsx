import Link from 'next/link';
import Image from 'next/image';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Star} from 'lucide-react';
import type {User} from '@/lib/data';

type WorkerCardProps = {
  worker: User;
};

export function WorkerCard({worker}: WorkerCardProps) {
  return (
    <Link href={`/profile/${worker.id}`} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={worker.avatarUrl}
              alt={`Portrait of ${worker.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={`${worker.profession?.toLowerCase()} portrait`}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-headline mb-2">{worker.name}</CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <Badge variant="outline">{worker.profession}</Badge>
            {worker.avgRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{worker.avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{worker.bio}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full">View Profile</Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
