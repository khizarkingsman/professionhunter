
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {reviews as mockReviews, users as mockUsers, professions} from '@/lib/data';
import type {Review, User} from '@/lib/data';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {
  Star,
  MessageCircle,
  Info,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Award,
  Briefcase,
  ShieldCheck,
  XCircle,
  Loader2,
  Navigation,
  Ban,
  User as UserIcon
} from 'lucide-react';
import ReviewForm from '@/components/review-form';
import {useEffect, useState, use} from 'react';
import {useAuth} from '@/context/auth-context';
import {db} from '@/lib/firebase';
import {doc, getDoc, onSnapshot} from 'firebase/firestore';
import {getCityLabel, getNeighborhoodLabel} from '@/lib/locations';

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
  const workerId = params.id;

  const {user: currentUser, getAllUsers} = useAuth();
  const allUsers = getAllUsers();

  const [worker, setWorker] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  // 1. Fetch worker document from Firestore directly using ID in URL
  useEffect(() => {
    if (!workerId) return;

    let isSubscribed = true;

    // Set up real-time listener to worker document in Firestore
    const workerDocRef = doc(db, 'users', workerId);
    const unsubscribe = onSnapshot(
      workerDocRef,
      (docSnap) => {
        if (!isSubscribed) return;
        if (docSnap.exists()) {
          setWorker(docSnap.data() as User);
        } else {
          // Fallback to mock users if Firestore doc is missing
          const found = mockUsers.find(u => u.id === workerId) || null;
          setWorker(found);
        }
        setLoading(false);
      },
      (error) => {
        if (!isSubscribed) return;
        console.warn('[profile] Firestore unreachable/offline, fallback to mock data:', error?.message);
        const found = mockUsers.find(u => u.id === workerId) || null;
        setWorker(found);
        setLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [workerId]);

  // 2. Fetch reviews from localStorage
  useEffect(() => {
    const storedReviews = localStorage.getItem('handy-connect-all-reviews');
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews));
    } else {
      setReviews(mockReviews);
      localStorage.setItem('handy-connect-all-reviews', JSON.stringify(mockReviews));
    }
  }, []);

  const workerReviews = reviews.filter(r => r.workerId === workerId);
  const averageRating =
    workerReviews.length > 0
      ? workerReviews.reduce((acc, r) => acc + r.rating, 0) / workerReviews.length
      : worker?.avgRating || 0;

  const hasAlreadyReviewed = currentUser && workerReviews.some(r => r.seekerId === currentUser.id);

  const handleReviewSubmitted = (newReview: Review) => {
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    localStorage.setItem('handy-connect-all-reviews', JSON.stringify(updatedReviews));
  };
  
  const handleDeleteReview = (reviewId: string) => {
    const updatedReviews = reviews.filter(r => r.id !== reviewId);
    setReviews(updatedReviews);
    localStorage.setItem('handy-connect-all-reviews', JSON.stringify(updatedReviews));
  };

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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading worker profile...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="container text-center py-20 font-headline text-lg">
        Worker profile not found.
      </div>
    );
  }

  const isActive = worker.availabilityStatus === 'active';

  return (
    <div className="bg-secondary min-h-screen">
      <div className="container mx-auto py-12 px-4 md:px-6">
        <Card>
          <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
            {/* Left Column: Avatar and Quick Details */}
            <div className="md:col-span-1 flex flex-col items-center text-center">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-card shadow-lg mb-4">
                <Image
                  src={worker.avatarUrl || 'https://placehold.co/400x400.png?text=Worker'}
                  alt={worker.name}
                  fill
                  className="object-cover"
                  data-ai-hint={`${worker.profession?.toLowerCase()} portrait`}
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {worker.isPro && (
                    <div className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      <Award className="w-4 h-4" />
                      <span>PRO</span>
                    </div>
                  )}
                  {worker.isVerified && worker.isPro && (
                    <div className="flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      <ShieldCheck className="w-4 h-4" />
                      <span>VERIFIED</span>
                    </div>
                  )}
                  {worker.iqamaStatus === 'approved' && !worker.isPro && (
                    <div className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      <XCircle className="w-4 h-4" />
                      <span>UNVERIFIED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Active / Inactive Status Badge */}
              <div className="mb-3">
                {isActive ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300 gap-1.5 px-3 py-1 text-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Available Now (Active)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs text-muted-foreground">
                    <Ban className="w-3 h-3 text-red-500" />
                    Currently Inactive
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold font-headline">{worker.name}</h1>
              <p className="text-muted-foreground mb-2">@{worker.username}</p>
              <p className="text-lg text-primary font-semibold">{worker.profession || 'Specialist Worker'}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={averageRating} />
                <span className="text-muted-foreground">({workerReviews.length} reviews)</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-6 w-full">
                <Button asChild className="flex-1">
                  <Link href={`/chat/${worker.id}`}>
                    <MessageCircle className="w-4 h-4 mr-2" /> Chat
                  </Link>
                </Button>
                {worker.phone && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`tel:${worker.phone}`}>
                      <Phone className="w-4 h-4 mr-2" /> Call
                    </a>
                  </Button>
                )}
                {worker.phone && (
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 bg-[#25D366] text-white hover:bg-[#25D366]/90 hover:text-white border-[#25D366] hover:border-[#25D366]/90"
                  >
                    <a
                      href={`https://wa.me/${worker.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column: Bio, Detailed Info, Reviews */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold font-headline flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-primary" /> About Me
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {worker.bio || 'No bio provided.'}
                </p>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="text-primary w-4 h-4" /> 
                  <span>
                    <strong>Location:</strong>{' '}
                    {worker.neighborhood ? `${getNeighborhoodLabel(worker.city, worker.neighborhood)}, ` : ''}
                    {getCityLabel(worker.city || 'Riyadh')}, {worker.country || 'Saudi Arabia'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="text-primary w-4 h-4" /> <strong>Email:</strong> {worker.email}
                </div>
                {worker.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="text-primary w-4 h-4" /> <strong>Phone:</strong> {worker.phone}
                  </div>
                )}
                {worker.age && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserIcon className="text-primary w-4 h-4" /> <strong>Age:</strong> {worker.age}
                  </div>
                )}
                {worker.experience && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="text-primary w-4 h-4" /> <strong>Experience:</strong> {worker.experience} years
                  </div>
                )}
              </div>

              <Separator />

              {/* Reviews List */}
              <div>
                <h2 className="text-xl font-bold font-headline mb-4">Client Reviews</h2>
                <div className="space-y-6">
                  {workerReviews.map(review => {
                    const seeker = allUsers.find(u => u.id === review.seekerId);
                    return (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.seekerAvatarUrl} alt={review.seekerName} />
                            <AvatarFallback>{review.seekerName ? review.seekerName.charAt(0) : 'S'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{seeker?.username || review.seekerName}</p>
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

                            {(currentUser?.id === review.seekerId || currentUser?.id === worker.id) && (
                              <div className="flex justify-end mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {workerReviews.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      This worker has no reviews yet.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Leave a Review Section */}
              <div>
                <h2 className="text-xl font-bold font-headline mb-4">Leave a Review</h2>
                {currentUser && currentUser.role === 'seeker' ? (
                  hasAlreadyReviewed ? (
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm">
                          You have already submitted a review for this worker.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <ReviewForm
                      workerId={worker.id}
                      seeker={currentUser}
                      onReviewSubmitted={handleReviewSubmitted}
                    />
                  )
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-muted-foreground text-sm">
                        You must be logged in as a service seeker to leave a review.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
