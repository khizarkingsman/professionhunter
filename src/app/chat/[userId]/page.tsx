'use client';

import {chats, users, currentUserSeeker} from '@/lib/data';
import type {User} from '@/lib/data';
import ChatLayout from '@/components/chat/chat-layout';

export default function ChatPage({params}: {params: {userId: string}}) {
  const otherUserId = params.userId;
  const otherUser = users.find(u => u.id === otherUserId);
  const loggedInUser = currentUserSeeker; // In a real app, this would come from auth context

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

  if (!otherUser) {
    return <div className="text-center py-20">User not found.</div>;
  }

  const worker =
    otherUser.role === 'worker' ? otherUser : loggedInUser.role === 'worker' ? loggedInUser : undefined;
  
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
