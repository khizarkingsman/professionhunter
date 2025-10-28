
import {Wrench, Zap, Hammer, Paintbrush, Sparkles, Sprout} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

export type Profession = {
  name: string;
  description: string;
  icon: LucideIcon;
};

export const professions: Profession[] = [
  {name: 'Plumber', description: 'Fixing leaks, installing pipes, and more.', icon: Wrench},
  {name: 'Electrician', description: 'Wiring, repairs, and electrical installations.', icon: Zap},
  {name: 'Carpenter', description: 'Custom furniture, repairs, and woodwork.', icon: Hammer},
  {name: 'Painter', description: 'Interior and exterior painting services.', icon: Paintbrush},
  {name: 'Cleaner', description: 'Home and office cleaning services.', icon: Sparkles},
  {name: 'Landscaper', description: 'Gardening, lawn care, and design.', icon: Sprout},
];

export type User = {
  id: string;
  name: string;
  username: string;
  role: 'worker' | 'seeker';
  email: string;
  country: string;
  city: string;
  age: number;
  phone: string;
  avatarUrl: string;
  profession?: string;
  experience?: number;
  bio?: string;
  avgRating?: number;
};

export type Review = {
  id: string;
  workerId: string;
  seekerId: string;
  seekerName: string;
  seekerAvatarUrl: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isAiSuggestion?: boolean;
  file?: {
    url: string;
    type: string;
  };
};

export type Chat = {
  id: string;
  participants: [string, string];
  messages: ChatMessage[];
};

export const users: User[] = [
  {
    id: 'worker-1',
    name: 'John Doe',
    username: 'johndoe',
    role: 'worker',
    email: 'john.d@example.com',
    country: 'USA',
    city: 'New York',
    age: 35,
    phone: '+12345678901',
    avatarUrl: 'https://picsum.photos/seed/worker1/400/400',
    profession: 'Plumber',
    experience: 10,
    bio: 'Licensed plumber with 10 years of experience in residential and commercial plumbing. I specialize in emergency repairs and new installations. Customer satisfaction is my top priority.',
    avgRating: 4.8,
  },
  {
    id: 'worker-2',
    name: 'Jane Smith',
    username: 'janesmith',
    role: 'worker',
    email: 'jane.s@example.com',
    country: 'USA',
    city: 'New York',
    age: 29,
    phone: '+12345678902',
    avatarUrl: 'https://picsum.photos/seed/worker2/400/400',
    profession: 'Electrician',
    experience: 7,
    bio: 'Certified electrician, skilled in all facets of electrical wiring, repairs, and system maintenance. Safety and quality are my guarantees.',
    avgRating: 4.9,
  },
  {
    id: 'worker-3',
    name: 'Mike Johnson',
    username: 'mikejohnson',
    role: 'worker',
    email: 'mike.j@example.com',
    country: 'USA',
    city: 'Los Angeles',
    age: 42,
    phone: '+12345678903',
    avatarUrl: 'https://picsum.photos/seed/worker3/400/400',
    profession: 'Carpenter',
    experience: 20,
    bio: 'Master carpenter with a passion for creating custom furniture and built-ins. No job is too big or too small, from minor repairs to major renovations.',
    avgRating: 4.7,
  },
  {
    id: 'worker-4',
    name: 'Emily White',
    username: 'emilywhite',
    role: 'worker',
    email: 'emily.w@example.com',
    country: 'USA',
    city: 'New York',
    age: 31,
    phone: '+12345678904',
    avatarUrl: 'https://picsum.photos/seed/worker4/400/400',
    profession: 'Painter',
    experience: 8,
    bio: 'Professional painter dedicated to transforming spaces with color. I offer interior and exterior painting services with a meticulous eye for detail.',
    avgRating: 5.0,
  },
  {
    id: 'seeker-1',
    name: 'Alice Brown',
    username: 'alicebrown',
    role: 'seeker',
    email: 'alice.b@example.com',
    country: 'USA',
    city: 'New York',
    age: 45,
    phone: '+12345678905',
    avatarUrl: 'https://picsum.photos/seed/seeker1/400/400',
  },
  {
    id: 'seeker-2',
    name: 'Bob Green',
    username: 'bobgreen',
    role: 'seeker',
    email: 'bob.g@example.com',
    country: 'USA',
    city: 'Los Angeles',
    age: 50,
    phone: '+12345678906',
    avatarUrl: 'https://picsum.photos/seed/seeker2/400/400',
  },
];

export const reviews: Review[] = [
  {
    id: 'review-1',
    workerId: 'worker-1',
    seekerId: 'seeker-1',
    seekerName: 'Alice Brown',
    seekerAvatarUrl: 'https://picsum.photos/seed/seeker1/400/400',
    rating: 5,
    comment:
      'John was fantastic! He arrived on time, fixed my leaky faucet in minutes, and was very professional. Highly recommended!',
    createdAt: '2 weeks ago',
    reply: 'Thank you, Alice! Glad I could help.',
  },
  {
    id: 'review-2',
    workerId: 'worker-1',
    seekerId: 'seeker-2',
    seekerName: 'Bob Green',
    seekerAvatarUrl: 'https://picsum.photos/seed/seeker2/400/400',
    rating: 4,
    comment: 'Good service, got the job done. Was a bit late but communicated well.',
    createdAt: '1 month ago',
  },
  {
    id: 'review-3',
    workerId: 'worker-2',
    seekerId: 'seeker-1',
    seekerName: 'Alice Brown',
    seekerAvatarUrl: 'https://picsum.photos/seed/seeker1/400/400',
    rating: 5,
    comment:
      'Jane rewired our entire kitchen. She was incredibly knowledgeable and efficient. The result is perfect!',
    createdAt: '3 weeks ago',
    reply: 'It was a pleasure working on your kitchen project, Alice. Enjoy the new setup!',
  },
];

export const chats: Chat[] = [
  {
    id: 'chat-1',
    participants: ['seeker-1', 'worker-1'],
    messages: [
      {
        id: 'msg-1',
        senderId: 'seeker-1',
        text: "Hi John, I have a constantly dripping kitchen sink. It's driving me crazy. Can you help?",
        timestamp: '10:00 AM',
      },
      {
        id: 'msg-2',
        senderId: 'worker-1',
        text: 'Hi Alice. Sorry to hear that. A dripping faucet is usually caused by a worn-out washer or O-ring. I can definitely take a look.',
        timestamp: '10:01 AM',
      },
      {
        id: 'msg-3',
        senderId: 'seeker-1',
        text: 'That sounds right. Is it something I can fix myself?',
        timestamp: '10:02 AM',
      },
    ],
  },
];

export const currentUserSeeker: User = users.find(u => u.id === 'seeker-1')!;
export const currentUserWorker: User = users.find(u => u.id === 'worker-1')!;
