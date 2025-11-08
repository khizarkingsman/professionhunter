
'use client';

import { useRef, useState } from 'react';
import type {ChatMessage, User} from '@/lib/data';
import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import Image from 'next/image';
import {MapPin, Play, Pause} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUser: User;
  otherUser: User;
}

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} src={src} onEnded={handleAudioEnded} preload="none" />
      <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8">
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
       <div className="text-sm">Voice Message</div>
    </div>
  );
}

export default function ChatMessages({messages, currentUser, otherUser}: ChatMessagesProps) {
  const isLocationLink = (text: string) => {
    return text.startsWith('https://www.google.com/maps?q=');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => {
        const isCurrentUser = message.senderId === currentUser.id;
        const sender = isCurrentUser ? currentUser : otherUser;

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
             {message.file?.url && message.file.type.startsWith('audio/') && (
              <AudioPlayer src={message.file.url} />
            )}
            {message.text &&
              (isLocationLink(message.text) ? (
                <Link
                  href={message.text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('flex items-center gap-2 underline', {
                    'text-primary-foreground': isCurrentUser,
                    'text-blue-500': !isCurrentUser,
                  })}
                >
                  <MapPin className="w-4 h-4" />
                  View Location
                </Link>
              ) : (
                <p className="text-sm">{message.text}</p>
              ))}
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
