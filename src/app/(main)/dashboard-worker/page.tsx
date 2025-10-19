import {
  currentUserWorker,
  users,
  chats as allChats,
  reviews as allReviews,
} from '@/lib/data';
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
import {Star, MessageSquare, User, Briefcase, CalendarDays} from 'lucide-react';
import EditProfileDialog from '@/components/edit-profile-dialog';
import ReplyReviewDialog from '@/components/reply-review-dialog';
import Link from 'next/link';

export default function WorkerDashboardPage() {
  const worker = currentUserWorker;
  const workerReviews = allReviews.filter(r => r.workerId === worker.id);
  const workerChats = allChats.filter(c => c.participants.includes(worker.id));

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={worker.avatarUrl} alt={worker.name} />
          <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome, {worker.name}</h1>
          <p className="text-muted-foreground">Here&apos;s your dashboard.</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
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
                  <CardDescription>{worker.profession}</CardDescription>
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
                  <CalendarDays className="text-primary" /> <strong>Experience:</strong>{' '}
                  {worker.experience} years
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="text-primary" /> <strong>Age:</strong> {worker.age}
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
                      {review.reply ? (
                        <Card className="mt-3 bg-secondary">
                          <CardContent className="p-3 text-sm">
                            <p className="font-semibold text-foreground mb-1">Your reply:</p>
                            <p className="text-muted-foreground">{review.reply}</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <ReplyReviewDialog review={review} />
                      )}
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
              <CardDescription>Chat with potential customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {workerChats.map(chat => {
                  const otherUserId = chat.participants.find(p => p !== worker.id);
                  const otherUser = users.find(u => u.id === otherUserId);
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  if (!otherUser) return null;

                  return (
                    <Link
                      key={chat.id}
                      href={`/chat/${otherUser.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <p className="font-semibold">{otherUser.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{lastMessage.text}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{lastMessage.timestamp}</p>
                    </Link>
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
