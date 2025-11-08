
'use client';

import { useRef, useState, useEffect } from 'react';
import type {ChatMessage, User} from '@/lib/data';
import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import Image from 'next/image';
import {MapPin, Play, Pause} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface AudioPlayerProps {
  src: string;
  sender: User;
  isCurrentUser: boolean;
}

function AudioPlayer({ src, sender, isCurrentUser }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };

      const setAudioTime = () => setCurrentTime(audio.currentTime);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);
  
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

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-64">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button variant="ghost" size="icon" onClick={togglePlay} className={cn("h-10 w-10 shrink-0 rounded-full", isCurrentUser ? "bg-white/20 hover:bg-white/30" : "bg-muted-foreground/20 hover:bg-muted-foreground/30")}>
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
      </Button>
      <div className="flex-grow flex flex-col gap-1">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSliderChange}
          className={cn("[&>span:first-child]:h-1 [&>span>span]:h-1 [&>span>span]:bg-white", !isCurrentUser && "[&>span>span]:bg-primary")}
        />
        <div className="text-xs text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
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
               <AudioPlayer src={message.file.url} sender={sender} isCurrentUser={isCurrentUser} />
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
