
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {users as mockUsers, reviews as allReviews} from '@/lib/data';
import type {User} from '@/lib/data';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {Star, MessageCircle, Info, CalendarDays, MapPin, Mail, Phone} from 'lucide-react';
import ReviewForm from '@/components/review-form';
import {useEffect, useState, use} from 'react';

function StarRating({rating, className}: {rating: number; className?: string}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

export default function WorkerProfilePage({params: paramsPromise}: {params: Promise<{id: string}>}) {
  const params = use(paramsPromise);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const storedUsers = localStorage.getItem('handy-connect-all-users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(mockUsers);
    }
  }, []);

  const worker = users.find(u => u.id === params.id && u.role === 'worker');
  const workerReviews = allReviews.filter(r => r.workerId === params.id);

  if (!worker) {
    return <div className="container text-center py-20">Worker not found.</div>;
  }

  const WhatsAppIcon = () => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 fill-current"
    >
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52s-.67-.816-.917-1.107-.5-.249-.699-.249h-.6c-.249 0-.622.124-.87.371-.249.249-.966.923-.966 2.245 0 1.322.99 2.615 1.14 2.79.149.174 1.96 3.04 4.76 4.22.676.299 1.25.478 1.67.622.717.255 1.37.213 1.87.126.548-.099 1.758-.718 2.006-1.413.248-.695.248-1.289.173-1.413-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 5.451 0 9.885 4.434 9.889 9.884-.001 5.45-4.438 9.884-9.889 9.884m8.392-18.282a11.815 11.815 0 00-11.813 11.813c0 1.991.486 3.861 1.354 5.495L.62 23.38l6.125-1.597a11.81 11.81 0 005.666 1.36h.004c6.513 0 11.813-5.299 11.813-11.812a11.825 11.825 0 00-11.813-11.813Z" />
    </svg>
  );

  return (
    <div className="bg-secondary">
      <div className="container mx-auto py-12 px-4 md:px-6">
        <Card>
          <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col items-center text-center">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-card shadow-lg mb-4">
                <Image
                  src={worker.avatarUrl}
                  alt={worker.name}
                  fill
                  className="object-cover"
                  data-ai-hint={`${worker.profession?.toLowerCase()} portrait`}
                />
              </div>
              <h1 className="text-3xl font-bold font-headline">{worker.name}</h1>
              <p className="text-lg text-primary font-semibold">{worker.profession}</p>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={worker.avgRating ?? 0} />
                <span className="text-muted-foreground">({workerReviews.length} reviews)</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-6 w-full">
                <Button asChild className="flex-1">
                  <Link href={`/chat/${worker.id}`}>
                    <MessageCircle /> Chat
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 bg-[#25D366] text-white hover:bg-[#25D366]/90 hover:text-white border-[#25D366] hover:border-[#25D366]/90"
                >
                  <a href={`https://wa.me/${worker.phone}`} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold font-headline flex items-center gap-2 mb-2">
                  <Info /> About Me
                </h2>
                <p className="text-muted-foreground">{worker.bio}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="text-primary" /> <strong>Location:</strong> {worker.city},{' '}
                  {worker.country}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="text-primary" /> <strong>Email:</strong> {worker.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="text-primary" /> <strong>Phone:</strong> {worker.phone}
                </div>
              </div>
              <Separator />
              <div>
                <h2 className="text-xl font-bold font-headline mb-4">Reviews</h2>
                <div className="space-y-6">
                  {workerReviews.map(review => (
                    <div key={review.id}>
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.seekerAvatarUrl} alt={review.seekerName} />
                          <AvatarFallback>{review.seekerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{review.seekerName}</p>
                            <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                          </div>
                          <StarRating rating={review.rating} className="my-1" />
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                          {review.reply && (
                            <Card className="mt-3 bg-secondary">
                              <CardContent className="p-3 text-sm">
                                <p className="font-semibold text-foreground mb-1">
                                  Reply from {worker.name}
                                </p>
                                <p className="text-muted-foreground">{review.reply}</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {workerReviews.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      This worker has no reviews yet.
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <h2 className="text-xl font-bold font-headline mb-4">Leave a Review</h2>
                <ReviewForm />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
