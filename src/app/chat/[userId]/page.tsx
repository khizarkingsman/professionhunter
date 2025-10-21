'use client';

import React from 'react';
import {chats as mockChats, users as mockUsers} from '@/lib/data';
import type {User} from '@/lib/data';
import ChatLayout from '@/components/chat/chat-layout';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';

export default function ChatPage({params: paramsPromise}: {params: Promise<{userId: string}>}) {
  const params = React.use(paramsPromise);
  const {user: loggedInUser, loading} = useAuth();
  const router = useRouter();
  const otherUserId = params.userId;
  
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [allChats, setAllChats] = React.useState<typeof mockChats>([]);

  React.useEffect(() => {
    // In a real app, this data would be fetched, but here we use localStorage
    // to ensure newly created users are available.
    const storedUsers = localStorage.getItem('handy-connect-all-users');
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
      setAllUsers(mockUsers);
    }
    // For now, chats are not persisted, so we use the initial mock data.
    setAllChats(mockChats);
  }, []);

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
      />
    </main>
  );
}
