
'use client';

import {
  chats as mockChats,
  reviews as mockReviews,
  users as mockUsers,
} from '@/lib/data';
import type { User, Review, Chat } from '@/lib/data';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import Image from 'next/image';
import {Button} from '@/components/ui/button';
import {Star, MessageSquare, User as UserIcon, Briefcase, CalendarDays, Phone, Trash2} from 'lucide-react';
import EditProfileDialog from '@/components/edit-profile-dialog';
import ReplyReviewDialog from '@/components/reply-review-dialog';
import Link from 'next/link';
import {useAuth} from '@/context/auth-context';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import SubscriptionCard from '@/components/subscription-card';

export default function WorkerDashboardPage() {
  const {user: worker, loading} = useAuth();
  const router = useRouter();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allChats, setAllChats] = useState<Chat[]>([]);

  useEffect(() => {
    // In a real app, you would fetch users, but here we get them from localStorage
    // to include newly registered users.
    const storedUsers = localStorage.getItem('handy-connect-all-users');
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
        setAllUsers(mockUsers);
    }
    const storedReviews = localStorage.getItem('handy-connect-all-reviews');
    if (storedReviews) {
        setAllReviews(JSON.parse(storedReviews));
    } else {
        setAllReviews(mockReviews);
        localStorage.setItem('handy-connect-all-reviews', JSON.stringify(mockReviews));
    }
    const storedChats = localStorage.getItem('handy-connect-all-chats');
    if (storedChats) {
      setAllChats(JSON.parse(storedChats));
    } else {
      setAllChats(mockChats);
      localStorage.setItem('handy-connect-all-chats', JSON.stringify(mockChats));
    }
  }, []);

  useEffect(() => {
    if (!loading && !worker) {
      router.push('/login');
    }
  }, [worker, loading, router]);


  if (loading || !worker || worker.role !== 'worker') {
    return <div className="container text-center py-20">Loading or not authorized...</div>;
  }

  const workerReviews = allReviews.filter(r => r.workerId === worker.id);
  const workerChats = allChats.filter(c => c.participants.includes(worker.id));

  const handleDeleteReview = (reviewId: string) => {
    const updatedReviews = allReviews.filter(r => r.id !== reviewId);
    setAllReviews(updatedReviews);
    localStorage.setItem('handy-connect-all-reviews', JSON.stringify(updatedReviews));
  };
  
  const handleReplyToReview = (reviewId: string, replyText: string) => {
    const updatedReviews = allReviews.map(review => {
      if (review.id === reviewId) {
        return {...review, reply: replyText};
      }
      return review;
    });
    setAllReviews(updatedReviews);
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

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={worker.avatarUrl} alt={worker.name} />
          <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold font-headline">
            Welcome, {worker.name} ({worker.username})
          </h1>
          <p className="text-muted-foreground">Manage your profile, reviews, and client communications.</p>
        </div>
      </div>

      <div className="mb-8">
        <SubscriptionCard />
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="mr-2 h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="chats">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chats
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline text-2xl">{worker.name}</CardTitle>
                  <CardDescription>
                    {worker.username} &middot; {worker.profession}
                  </CardDescription>
                </div>
                <EditProfileDialog worker={worker} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                  src={worker.avatarUrl}
                  alt={worker.name}
                  fill
                  className="object-cover"
                  data-ai-hint={`${worker.profession?.toLowerCase()} portrait`}
                />
              </div>
              <p className="text-muted-foreground flex items-start gap-3 pt-4">
                <Briefcase className="w-5 h-5 mt-1 text-primary shrink-0" />
                {worker.bio}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm pt-4">

                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="text-primary" /> <strong>Age:</strong> {worker.age}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Reviews</CardTitle>
              <CardDescription>See what customers are saying about your work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {workerReviews.map(review => (
                <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
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
                      <div className="flex items-center gap-1 my-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {review.reply ? (
                          <Card className="flex-1 bg-secondary">
                            <CardContent className="p-3 text-sm">
                              <p className="font-semibold text-foreground mb-1">Your reply:</p>
                              <p className="text-muted-foreground">{review.reply}</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <ReplyReviewDialog
                            review={review}
                            onReplySubmit={handleReplyToReview}
                          />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {workerReviews.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  You have no reviews yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Conversations</CardTitle>
              <CardDescription>
                Manage your client communications and open conversations in WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {workerChats.map(chat => {
                  const otherUserId = chat.participants.find(p => p !== worker.id);
                  const otherUser = allUsers.find(u => u.id === otherUserId);
                  if (!otherUser) return null;

                  return (
                    <div
                      key={chat.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <p className="font-semibold">{otherUser.name}</p>
                        <p className="text-sm text-muted-foreground">{otherUser.username}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3"/>
                            <span>{otherUser.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-auto px-2"
                          asChild
                        >
                           <Link href={`/chat/${otherUser.id}`}>
                            <MessageSquare className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">App Chat</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-auto px-2 bg-green-500 hover:bg-green-600 text-white hover:text-white"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${otherUser.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <WhatsAppIcon />
                            <span className="ml-2 hidden sm:inline">WhatsApp</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
                 {workerChats.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    You have no active chats.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    