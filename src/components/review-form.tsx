'use client';

import {useState} from 'react';
import {Button} from './ui/button';
import {Textarea} from './ui/textarea';
import {Star} from 'lucide-react';
import {Card, CardContent} from './ui/card';
import {Label} from './ui/label';

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
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
          <Textarea id="comment" placeholder="Share your experience with this worker..." />
        </div>
        <Button>Submit Review</Button>
      </CardContent>
    </Card>
  );
}
