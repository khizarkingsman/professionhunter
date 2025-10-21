'use client';

import React from 'react';
import {chats, users} from '@/lib/data';
import type {User} from '@/lib/data';
import ChatLayout from '@/components/chat/chat-layout';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';

export default function ChatPage({params: paramsPromise}: {params: Promise<{userId: string}>}) {
  const params = React.use(paramsPromise);
  const {user: loggedInUser, loading} = useAuth();
  const router = useRouter();
  const otherUserId = params.userId;
  
  React.useEffect(() => {
    if (!loading && !loggedInUser) {
      router.push('/login');
    }
  }, [loggedInUser, loading, router]);


  if (loading || !loggedInUser) {
     return <div className="text-center py-20">Loading...</div>;
  }

  const otherUser = users.find(u => u.id === otherUserId);

  if (!otherUser) {
    return <div className="text-center py-20">User not found.</div>;
  }

  // Find chat or create a new one for demonstration
  let chat = chats.find(
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
