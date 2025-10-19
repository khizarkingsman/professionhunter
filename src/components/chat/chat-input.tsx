'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Send, Bot, Loader2} from 'lucide-react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../ui/tooltip';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onGetSuggestion: () => void;
  isLoadingSuggestion: boolean;
}

export default function ChatInput({
  onSendMessage,
  onGetSuggestion,
  isLoadingSuggestion,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
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
              onClick={onGetSuggestion}
              disabled={isLoadingSuggestion}
            >
              {isLoadingSuggestion ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
              <span className="sr-only">Get AI Suggestion</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Get a helpful article snippet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a message..."
        autoComplete="off"
      />
      <Button type="submit" size="icon">
        <Send className="h-5 w-5" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
