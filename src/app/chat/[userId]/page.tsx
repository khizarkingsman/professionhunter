
'use client';

import React from 'react';
import {chats as mockChats, users as mockUsers} from '@/lib/data';
import type {User, Chat, ChatMessage} from '@/lib/data';
import ChatLayout from '@/components/chat/chat-layout';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';

export default function ChatPage({params: paramsPromise}: {params: Promise<{userId: string}>}) {
  const params = React.use(paramsPromise);
  const {user: loggedInUser, loading} = useAuth();
  const router = useRouter();
  const otherUserId = params.userId;
  
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [allChats, setAllChats] = React.useState<Chat[]>([]);

  React.useEffect(() => {
    // In a real app, this data would be fetched, but here we use localStorage
    // to ensure newly created users are available.
    const storedUsers = localStorage.getItem('handy-connect-all-users');
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
      setAllUsers(mockUsers);
    }
    
    const storedChats = localStorage.getItem('handy-connect-all-chats');
    if (storedChats) {
      setAllChats(JSON.parse(storedChats));
    } else {
      setAllChats(mockChats);
      localStorage.setItem('handy-connect-all-chats', JSON.stringify(mockChats));
    }
  }, []);

  const handleNewMessage = (newMessage: ChatMessage) => {
    setAllChats(prevChats => {
      const chatIndex = prevChats.findIndex(
        c => c.participants.includes(loggedInUser!.id) && c.participants.includes(otherUserId)
      );

      let updatedChats;

      if (chatIndex > -1) {
        // Add message to existing chat
        updatedChats = [...prevChats];
        const updatedChat = {
          ...updatedChats[chatIndex],
          messages: [...updatedChats[chatIndex].messages, newMessage],
        };
        updatedChats[chatIndex] = updatedChat;
      } else {
        // Create a new chat
        const newChat: Chat = {
          id: `chat-${Date.now()}`,
          participants: [loggedInUser!.id, otherUserId],
          messages: [newMessage],
        };
        updatedChats = [...prevChats, newChat];
      }
      
      localStorage.setItem('handy-connect-all-chats', JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  React.useEffect(() => {
    if (!loading && !loggedInUser) {
      router.push('/login');
    }
  }, [loggedInUser, loading, router]);


  if (loading || !loggedInUser || allUsers.length === 0) {
     return <div className="text-center py-20">Loading...</div>;
  }

  const otherUser = allUsers.find(u => u.id === otherUserId);

  if (!otherUser) {
    return <div className="text-center py-20">User not found.</div>;
  }

  // Find chat or create a new one for demonstration
  let chat = allChats.find(
    c => c.participants.includes(loggedInUser.id) && c.participants.includes(otherUserId)
  );

  if (!chat) {
    chat = {
      id: `chat-${Date.now()}`,
      participants: [loggedInUser.id, otherUserId],
      messages: [],
    };
  }


  const worker =
    otherUser.role === 'worker'
      ? otherUser
      : loggedInUser.role === 'worker'
      ? loggedInUser
      : undefined;

  if (!worker || !worker.profession) {
    return <div className="text-center py-20">Could not identify a worker in this chat.</div>;
  }

  return (
    <main className="h-screen flex flex-col">
      <ChatLayout
        chat={chat}
        currentUser={loggedInUser}
        otherUser={otherUser}
        workerProfession={worker.profession}
        onNewMessage={handleNewMessage}
      />
    </main>
  );
}
