'use client';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Review} from '@/lib/data';
import {MessageSquare} from 'lucide-react';
import {useState} from 'react';

export default function ReplyReviewDialog({review}: {review: Review}) {
  const [reply, setReply] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2">
          <MessageSquare className="mr-2 h-4 w-4" /> Reply
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reply to {review.seekerName}</DialogTitle>
          <DialogDescription>"{review.comment}"</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reply">Your Reply</Label>
            <Textarea
              id="reply"
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Write your response..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit">Send Reply</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
