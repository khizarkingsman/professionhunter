
'use client';

import {useState, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Send, Camera, MapPin} from 'lucide-react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../ui/tooltip';
import {useToast} from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
}

export default function ChatInput({onSendMessage}: ChatInputProps) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSendMessage('', file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation not supported',
        description: "Your browser doesn't support location sharing.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        onSendMessage(mapsLink);
      },
      error => {
        toast({
          variant: 'destructive',
          title: 'Location permission denied',
          description: 'Please enable location services in your browser settings.',
        });
      }
    );
  };

  return (
    <form onSubmit={handleSend} className="p-4 border-t bg-background flex items-center gap-2">
      <Input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a message..."
        autoComplete="off"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={handleLocationClick}>
              <MapPin className="h-5 w-5" />
              <span className="sr-only">Share Location</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share your live location</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={handleCameraClick}>
              <Camera className="h-5 w-5" />
              <span className="sr-only">Send Photo/Video</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send a photo or video</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button type="submit" size="icon">
        <Send className="h-5 w-5" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
