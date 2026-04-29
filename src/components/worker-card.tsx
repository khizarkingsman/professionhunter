
import Link from 'next/link';
import Image from 'next/image';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Star, Award, MapPin} from 'lucide-react';
import type {User} from '@/lib/data';
import {getCityLabel, getNeighborhoodLabel} from '@/lib/locations';

type WorkerCardProps = {
  worker: User;
};

export function WorkerCard({worker}: WorkerCardProps) {
  return (
    <Link href={`/profile/${worker.id}`} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
        <CardHeader className="pt-6 pb-4 flex flex-col items-center">
          <div className="relative h-28 w-28 shrink-0">
            <Image
              src={worker.avatarUrl}
              alt={`Portrait of ${worker.name}`}
              fill
              className="object-cover rounded-full shadow-sm group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={`${worker.profession?.toLowerCase()} portrait`}
            />
             {worker.isPro && (
              <div className="absolute -top-1 -right-1 z-10 flex items-center gap-0.5 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                <Award className="w-3 h-3" />
                <span>PRO</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow text-center flex flex-col items-center">
          <CardTitle className="text-lg font-headline mb-3">{worker.username}</CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <Badge variant="outline">{worker.profession}</Badge>
            <div className="flex items-center gap-4">
              {worker.isPro && worker.experience && (
                <div className="flex items-center gap-1 font-semibold">
                  {worker.experience} yrs exp
                </div>
              )}
              {worker.avgRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>{worker.avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            <span>
              {worker.neighborhood && `${getNeighborhoodLabel(worker.city, worker.neighborhood)}, `}
              {getCityLabel(worker.city)}
            </span>
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
