
'use client';

import {useState} from 'react';
import {Button} from './ui/button';
import {Textarea} from './ui/textarea';
import {Star} from 'lucide-react';
import {Card, CardContent} from './ui/card';
import {Label} from './ui/label';
import {useToast} from '@/hooks/use-toast';
import type {User, Review} from '@/lib/data';

interface ReviewFormProps {
  workerId: string;
  seeker: User;
  onReviewSubmitted: (review: Review) => void;
}

export default function ReviewForm({workerId, seeker, onReviewSubmitted}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const {toast} = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Incomplete Review',
        description: 'Please provide a rating and a comment.',
      });
      return;
    }

    const newReview: Review = {
      id: `review-${Date.now()}`,
      workerId: workerId,
      seekerId: seeker.id,
      seekerName: seeker.name,
      seekerAvatarUrl: seeker.avatarUrl,
      rating: rating,
      comment: comment,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    onReviewSubmitted(newReview);

    toast({
      title: 'Review Submitted!',
      description: 'Thank you for your feedback.',
    });

    // Reset form
    setRating(0);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <button
                    key={index}
                    type="button"
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(ratingValue)}
                  >
                    <Star
                      className={`cursor-pointer transition-colors w-6 h-6 ${
                        ratingValue <= (hover || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Your Comment</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this worker..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
          <Button type="submit">Submit Review</Button>
        </CardContent>
      </Card>
    </form>
  );
}
