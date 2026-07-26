# PROFESSION HUNTER — DATABASE MAP & SCHEMA INTELLIGENCE

---

## Overview

Profession Hunter uses **Firebase Firestore** as its primary persistent database for User accounts, roles, geolocation, and verification status. 
Certain volatile/feature data (specifically `Chat` messaging and `Review` feedback) are stored in client **localStorage** or initialised from mock seeds in `src/lib/data.ts`.

---

## Primary Database: Firebase Firestore

### Collection: `users`

**Purpose:** Stores user profile details, authentication credentials (passwords), roles, subscription state, live location data, and worker Iqama (ID) verification information.

#### Fields Table

| Field Name | Data Type | Nullable / Optional | Description |
|------------|-----------|--------------------|-------------|
| `id` | `string` | No | Unique User Identifier (e.g. `worker-1`, `seeker-1`, `admin-001`) |
| `name` | `string` | No | User's full name |
| `username` | `string` | No | User's unique handle |
| `role` | `'worker' \| 'seeker' \| 'store' \| 'admin'` | No | Account role controlling access and layout |
| `email` | `string` | No | User's email address (used for auth & password reset) |
| `password` | `string` | Optional (stored in Firestore) | Plaintext or hashed password string |
| `country` | `string` | No | Country of residence (default: `"Saudi Arabia"`) |
| `city` | `string` | No | City key (e.g. `"riyadh"`, `"jeddah"`, `"dammam"`) |
| `neighborhood` | `string` | Optional | Neighborhood key within city (e.g. `"al_olaya"`) |
| `age` | `number` | No | User's age |
| `phone` | `string` | No | Contact phone number (formatted for WhatsApp) |
| `avatarUrl` | `string` | No | Profile avatar image URL / Base64 string |
| `profession` | `string` | Optional (Worker only) | Profession title (e.g. `"Plumber"`, `"Electrician"`) |
| `experience` | `number` | Optional (Worker only) | Years of experience |
| `bio` | `string` | Optional (Worker only) | Short profile summary |
| `avgRating` | `number` | Optional (Worker only) | Calculated aggregate review rating (0.0 to 5.0) |
| `isPro` | `boolean` | Optional (Worker only) | Pro tier subscription active status |
| `subscriptionEndDate` | `string` | Optional (Worker only) | ISO date string for Worker Pro expiry |
| `isSeekerPro` | `boolean` | Optional (Seeker only) | Seeker Pro tier subscription active status |
| `seekerSubscriptionEndDate` | `string` | Optional (Seeker only) | ISO date string for Seeker Pro expiry |
| `lastSeen` | `string` | Optional | User status string (e.g. `"online"`, `"last seen 5 min ago"`) |
| `storeDocId` | `string` | Optional (Store only) | Store document ID reference |
| `paymentHistory` | `Array<PaymentHistoryEntry>` | Optional | Array of past payment transactions |
| `iqamaNumber` | `string` | Optional (Worker only) | 10-digit Saudi Iqama / Resident ID number |
| `iqamaImageUrl` | `string` | Optional (Worker only) | Front side image (Base64 or URL) |
| `iqamaBackImageUrl` | `string` | Optional (Worker only) | Back side image (Base64 or URL) |
| `iqamaStatus` | `'none' \| 'pending' \| 'approved' \| 'rejected'` | Optional (Worker only) | Verification workflow state |
| `iqamaSubmittedAt` | `string` | Optional (Worker only) | ISO submission timestamp |
| `iqamaVerifiedAt` | `string` | Optional (Worker only) | ISO verification timestamp |
| `iqamaRejectionReason` | `string` | Optional (Worker only) | Reason for rejection if applicable |
| `isVerified` | `boolean` | Optional (Worker only) | Flag for verified badge display |
| `subscriptionGrantedBy` | `string` | Optional | `"admin"` if granted via admin panel |
| `availabilityStatus` | `'active' \| 'inactive'` | Optional (Worker only) | Worker live location tracking active status |
| `lat` | `number` | Optional (Worker location) | Current latitude coordinate |
| `lng` | `number` | Optional (Worker location) | Current longitude coordinate |
| `geohash` | `string` | Optional (Worker location) | Geohash for geo-queries (`geofire-common`) |
| `lastLocationUpdate` | `Timestamp` | Optional (Worker location) | Firestore server timestamp of last GPS signal |

---

## Secondary Database: Browser localStorage

### Key: `handy-connect-all-chats`

**Data Type:** `Array<Chat>`

```typescript
type ChatMessage = {
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

type Chat = {
  id: string;
  participants: [string, string]; // [user1Id, user2Id]
  messages: ChatMessage[];
};
```

### Key: `handy-connect-all-reviews`

**Data Type:** `Array<Review>`

```typescript
type Review = {
  id: string;
  workerId: string; // Foreign key -> User.id (worker)
  seekerId: string; // Foreign key -> User.id (seeker)
  seekerName: string;
  seekerAvatarUrl: string;
  rating: number; // 1 to 5
  comment: string;
  reply?: string; // Worker's response string
  createdAt: string;
};
```

### Key: `handy-connect-user`
Stores the serialized active `User` session object (without password).

### Key: `app-language`
Stores current locale (`'en'`, `'ar'`, `'ur'`).

---

## Entity Relationships Map

```
                    ┌─────────────────────────┐
                    │      User (Firestore)    │
                    │   id (Primary Key)      │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼────────────────────────┐
         │ 1                     │ 1                      │ 1
         ▼ N                     ▼ N                      ▼ N
┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│      Review      │    │  ChatParticipant │    │PaymentHistoryEntry │
│ (localStorage)   │    │  (localStorage)  │    │  (Nested Array)    │
├──────────────────┤    ├──────────────────┤    ├────────────────────┤
│ workerId  (FK)   │    │ participants[0]  │    │ id                 │
│ seekerId  (FK)   │    │ participants[1]  │    │ amount, plan, date │
└──────────────────┘    └──────────────────┘    └────────────────────┘
```

1. **User (Worker) ── (1:N) ──> Review**: A worker can receive multiple reviews from seekers.
2. **User (Seeker) ── (1:N) ──> Review**: A seeker can write multiple reviews for different workers.
3. **User ── (M:N) ──> Chat**: Two users participate in a `Chat` item represented by `participants: [userA, userB]`.
4. **User ── (1:N) ──> PaymentHistoryEntry**: Nested array field on `User` recording subscription payments.
