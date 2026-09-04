
'use client';

import React from 'react';
import type {User, Chat, ChatMessage} from '@/lib/data';
import ChatLayout from '@/components/chat/chat-layout';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {LoadingScreen} from '@/components/loading-screen';
import {db} from '@/lib/firebase';
import {doc, onSnapshot, setDoc} from 'firebase/firestore';

export default function ChatPage({params: paramsPromise}: {params: Promise<{userId: string}>}) {
  const params = React.use(paramsPromise);
  const {user: loggedInUser, loading, getAllUsers} = useAuth();
  const router = useRouter();
  const otherUserId = params.userId;
  
  const allUsers = getAllUsers();
  const [currentChat, setCurrentChat] = React.useState<Chat | null>(null);

  // Compute deterministic chatId so both participants share the exact same Firestore doc
  const chatId = React.useMemo(() => {
    if (!loggedInUser || !otherUserId) return null;
    return [loggedInUser.id, otherUserId].sort().join('_');
  }, [loggedInUser?.id, otherUserId]);

  // Real-time Firestore listener
  React.useEffect(() => {
    if (!chatId || !loggedInUser || !otherUserId) return;

    const chatDocRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(
      chatDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Chat;
          setCurrentChat(data);
          // Save backup to localStorage
          try {
            localStorage.setItem(`handy-chat-${chatId}`, JSON.stringify(data));
          } catch {
            /* ignore quota */
          }
        } else {
          // Check localStorage fallback or initialize empty
          const fallbackKey = `handy-chat-${chatId}`;
          const localData = typeof window !== 'undefined' ? localStorage.getItem(fallbackKey) : null;
          if (localData) {
            try {
              setCurrentChat(JSON.parse(localData));
              return;
            } catch {
              /* ignore */
            }
          }
          setCurrentChat({
            id: chatId,
            participants: [loggedInUser.id, otherUserId],
            messages: [],
          });
        }
      },
      (error) => {
        console.warn('[chat] Firestore onSnapshot error:', error);
        // Fallback to local storage
        const fallbackKey = `handy-chat-${chatId}`;
        const localData = typeof window !== 'undefined' ? localStorage.getItem(fallbackKey) : null;
        if (localData) {
          try {
            setCurrentChat(JSON.parse(localData));
          } catch {
            /* ignore */
          }
        }
      }
    );

    return () => unsubscribe();
  }, [chatId, loggedInUser?.id, otherUserId]);

  const handleNewMessage = async (newMessage: ChatMessage) => {
    if (!chatId || !loggedInUser || !otherUserId) return;

    const existingMessages = currentChat?.messages || [];
    const updatedMessages = [...existingMessages, newMessage];

    const updatedChat: Chat = {
      id: chatId,
      participants: [loggedInUser.id, otherUserId],
      messages: updatedMessages,
    };

    // Optimistic UI update
    setCurrentChat(updatedChat);

    // Save local backup
    try {
      localStorage.setItem(`handy-chat-${chatId}`, JSON.stringify(updatedChat));
    } catch {
      /* ignore */
    }

    // Persist to Firestore
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(
        chatDocRef,
        {
          id: chatId,
          participants: [loggedInUser.id, otherUserId],
          messages: updatedMessages,
          lastMessage: newMessage.text || (newMessage.file?.type?.startsWith('audio/') ? 'Voice message' : 'Media attachment'),
          updatedAt: new Date().toISOString(),
        },
        {merge: true}
      );
    } catch (err) {
      console.error('[chat] Failed to write message to Firestore:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId || !loggedInUser || !otherUserId || !currentChat) return;

    const filteredMessages = currentChat.messages.filter(msg => msg.id !== messageId);
    const updatedChat: Chat = {
      ...currentChat,
      messages: filteredMessages,
    };

    setCurrentChat(updatedChat);

    try {
      localStorage.setItem(`handy-chat-${chatId}`, JSON.stringify(updatedChat));
    } catch {
      /* ignore */
    }

    try {
      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(
        chatDocRef,
        {
          messages: filteredMessages,
          updatedAt: new Date().toISOString(),
        },
        {merge: true}
      );
    } catch (err) {
      console.error('[chat] Failed to delete message from Firestore:', err);
    }
  };

  React.useEffect(() => {
    if (!loading && !loggedInUser) {
      router.push('/login');
    }
  }, [loggedInUser, loading, router]);

  if (loading || !loggedInUser || allUsers.length === 0) {
     return <LoadingScreen message="Loading conversation..." />;
  }

  const otherUser = allUsers.find(u => u.id === otherUserId);

  if (!otherUser) {
    return <div className="text-center py-20">User not found.</div>;
  }

  const activeChat: Chat = currentChat || {
    id: chatId || `chat-${Date.now()}`,
    participants: [loggedInUser.id, otherUserId],
    messages: [],
  };

  const worker =
    otherUser.role === 'worker'
      ? otherUser
      : loggedInUser.role === 'worker'
      ? loggedInUser
      : undefined;

  const workerProfession = worker?.profession || 'general';

  return (
    <main className="h-screen flex flex-col">
      <ChatLayout
        chat={activeChat}
        currentUser={loggedInUser}
        otherUser={otherUser}
        workerProfession={workerProfession}
        onNewMessage={handleNewMessage}
        onDeleteMessage={handleDeleteMessage}
      />
    </main>
  );
}
