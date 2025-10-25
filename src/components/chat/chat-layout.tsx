
'use client';

import {useState, useEffect} from 'react';
import type {Chat, User, ChatMessage} from '@/lib/data';
import {suggestHelpfulArticles} from '@/ai/flows/suggest-helpful-articles-in-chat';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import ChatMessages from './chat-messages';
import ChatInput from './chat-input';
import Link from 'next/link';
import {ChevronLeft} from 'lucide-react';
import {Button} from '../ui/button';
import {useAuth} from '@/context/auth-context';
import {useToast} from '@/hooks/use-toast';

interface ChatLayoutProps {
  chat: Chat;
  currentUser: User;
  otherUser: User;
  workerProfession: string;
  onNewMessage: (message: ChatMessage) => void;
}

export default function ChatLayout({
  chat: initialChat,
  currentUser,
  otherUser,
  workerProfession,
  onNewMessage,
}: ChatLayoutProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat.messages);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const {user} = useAuth();
  const {toast} = useToast();
  
  useEffect(() => {
    setMessages(initialChat.messages);
  }, [initialChat.messages]);

  const handleSendMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
    };
    setMessages(prev => [...prev, newMessage]);
    onNewMessage(newMessage);

    // If the current user is a seeker sending a message to a worker, show a toast.
    // In a real app, this would be a push notification to the worker.
    if (currentUser.role === 'seeker' && otherUser.role === 'worker') {
      
    }
  };

  const handleGetSuggestion = async () => {
    setIsLoadingSuggestion(true);
    const chatHistory = messages
      .map(m => {
        const senderName = m.senderId === currentUser.id ? currentUser.name : otherUser.name;
        return `${senderName}: ${m.text}`;
      })
      .join('\n');

    try {
      const result = await suggestHelpfulArticles({
        chatHistory,
        userProfession: workerProfession,
      });

      if (result.suggestedArticleSnippet) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          senderId: 'ai',
          text: result.suggestedArticleSnippet,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
          isAiSuggestion: true,
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const getBackLink = () => {
    if (!user) return '/';
    if (user.role === 'worker') {
      return '/dashboard-worker';
    }
    // If the current user is a seeker, the "back" link should go to the other user's (the worker's) profile
    if (otherUser.role === 'worker') {
      return `/profile/${otherUser.id}`;
    }
    // Fallback for seeker-seeker chat or other edge cases
    return '/dashboard';
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="flex items-center p-2 md:p-4 border-b">
        <Button variant="ghost" size="icon" className="mr-2" asChild>
          <Link href={getBackLink()}>
            <ChevronLeft />
          </Link>
        </Button>
        <Avatar className="mr-4">
          <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
          <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{otherUser.name}</p>
          <p className="text-sm text-muted-foreground">
            {otherUser.role === 'worker' ? otherUser.profession : 'Service Seeker'}
          </p>
        </div>
      </div>
      <ChatMessages messages={messages} currentUser={currentUser} otherUser={otherUser} />
      <ChatInput
        onSendMessage={handleSendMessage}
        onGetSuggestion={handleGetSuggestion}
        isLoadingSuggestion={isLoadingSuggestion}
      />
    </div>
  );
}
