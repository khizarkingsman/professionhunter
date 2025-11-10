
'use client';

import {useState, useEffect} from 'react';
import type {Chat, User, ChatMessage} from '@/lib/data';
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
  onDeleteMessage: (messageId: string) => void;
}

export default function ChatLayout({
  chat: initialChat,
  currentUser,
  otherUser,
  onNewMessage,
  onDeleteMessage
}: ChatLayoutProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat.messages);
  const [notificationSent, setNotificationSent] = useState(false);
  const {user} = useAuth();
  const {toast} = useToast();

  useEffect(() => {
    setMessages(initialChat.messages);
  }, [initialChat.messages]);

  const handleSendMessage = (text: string, file?: File) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
    };

    if (file) {
      newMessage.file = {
        url: URL.createObjectURL(file),
        type: file.type,
      };
    }

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    onNewMessage(newMessage);

    if (currentUser.role === 'seeker' && otherUser.role === 'worker' && !notificationSent) {
      toast({
        title: 'Message Sent!',
        description: `${otherUser.name} has been notified.`,
      });
      setNotificationSent(true);
    }
  };

  const getBackLink = () => {
    if (!user) return '/';
    if (user.role === 'worker') {
      return '/dashboard-worker';
    }
    if (otherUser.role === 'worker') {
      return `/profile/${otherUser.id}`;
    }
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
            {otherUser.username} &middot;{' '}
            {otherUser.role === 'worker' ? otherUser.profession : 'Service Seeker'}
          </p>
        </div>
      </div>
      <ChatMessages messages={messages} currentUser={currentUser} otherUser={otherUser} onDeleteMessage={onDeleteMessage} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
