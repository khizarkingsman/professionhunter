
import type {ChatMessage, User} from '@/lib/data';
import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Bot, Image as ImageIcon, Video} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import Image from 'next/image';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUser: User;
  otherUser: User;
}

export default function ChatMessages({messages, currentUser, otherUser}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => {
        const isCurrentUser = message.senderId === currentUser.id;
        const sender = isCurrentUser ? currentUser : otherUser;

        if (message.isAiSuggestion) {
          return (
            <div key={message.id} className="flex items-start gap-3 justify-center my-6">
               <Card className="max-w-2xl bg-accent border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm mb-1 text-accent-foreground">
                        Helpful Suggestion
                        </p>
                        <p className="text-sm text-accent-foreground">{message.text}</p>
                    </div>
                  </div>
                </CardContent>
               </Card>
            </div>
          );
        }

        const messageContent = (
          <>
            {message.file?.url && message.file.type.startsWith('image/') && (
              <Image
                src={message.file.url}
                alt="Sent image"
                width={300}
                height={300}
                className="rounded-lg object-cover"
              />
            )}
            {message.file?.url && message.file.type.startsWith('video/') && (
              <video src={message.file.url} controls className="rounded-lg max-w-xs" />
            )}
            {message.text && <p className="text-sm">{message.text}</p>}
            <p
              className={cn('text-xs mt-1 text-right', {
                'text-primary-foreground/70': isCurrentUser,
                'text-muted-foreground': !isCurrentUser,
              })}
            >
              {message.timestamp}
            </p>
          </>
        );

        return (
          <div
            key={message.id}
            className={cn('flex items-end gap-3', {
              'justify-end': isCurrentUser,
            })}
          >
            {!isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={sender.avatarUrl} alt={sender.name} />
                <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn('max-w-md p-3 rounded-lg', {
                'bg-primary text-primary-foreground': isCurrentUser,
                'bg-card border': !isCurrentUser,
              })}
            >
              {messageContent}
            </div>
            {isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={sender.avatarUrl} alt={sender.name} />
                <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}
    </div>
  );
}
