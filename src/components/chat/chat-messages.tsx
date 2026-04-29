
'use client';

import { useRef, useState, useEffect } from 'react';
import type {ChatMessage, User} from '@/lib/data';
import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import Image from 'next/image';
import {MapPin, Play, Pause, Trash2} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };

      const setAudioTime = () => setCurrentTime(audio.currentTime);

      audio.addEventListener('loadedmetadata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('loadedmetadata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);
  
  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // We await the play promise to catch any rejections (like browser blocks)
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
      } catch (error: any) {
        console.error("Audio playback failed:", error);
        
        // Show a helpful toast instead of a crash
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "This audio format may not be supported on your device, or playback was blocked.",
        });
        setIsPlaying(false);
      }
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
    <div className="flex items-center gap-2 w-64">
       <Avatar className="h-10 w-10">
          <AvatarImage src={sender.avatarUrl} alt={sender.name} />
          <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <audio ref={audioRef} src={src} preload="metadata" playsInline />
      <Button 
        type="button"
        variant="ghost" 
        size="icon" 
        onClick={togglePlay} 
        className={cn(
          "h-10 w-10 shrink-0 rounded-full transition-colors", 
          isCurrentUser 
            ? "bg-primary/90 text-primary-foreground hover:bg-primary" 
            : "bg-muted hover:bg-muted/80"
        )}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
      </Button>
      <div className="flex-grow flex flex-col gap-1">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          className={cn(
            "[&>span:first-child]:h-1 [&>span>span]:h-1", 
            isCurrentUser ? "[&>span>span]:bg-primary-foreground" : "[&>span>span]:bg-primary"
          )}
        />
        <div className={cn("text-xs text-right", isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUser: User;
  otherUser: User;
  onDeleteMessage: (messageId: string) => void;
}

export default function ChatMessages({messages, currentUser, otherUser, onDeleteMessage}: ChatMessagesProps) {
  const isLocationLink = (text: string) => {
    return text.startsWith('https://www.google.com/maps?q=');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
             {message.file?.url && (message.file.type.startsWith('audio/') || message.file.url.endsWith('.webm') || message.file.url.endsWith('.mp4')) && (
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
            className={cn('flex items-end gap-3 group/message', {
              'justify-end': isCurrentUser,
            })}
          >
             {isCurrentUser && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover/message:opacity-100 transition-opacity" onClick={() => onDeleteMessage(message.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
            )}
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
                'p-2': message.file?.url && (message.file.type.startsWith('audio/') || message.file.url.endsWith('.webm') || message.file.url.endsWith('.mp4'))
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
