
'use client';

import {useState, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Send, Languages, Loader2, Camera} from 'lucide-react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../ui/tooltip';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
  onTranslateChat: () => void;
  isTranslating: boolean;
}

export default function ChatInput({
  onSendMessage,
  onTranslateChat,
  isTranslating,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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


  return (
    <form onSubmit={handleSend} className="p-4 border-t bg-background flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onTranslateChat}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Languages className="h-5 w-5" />
              )}
              <span className="sr-only">Translate Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Translate this conversation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
