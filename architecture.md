# PROFESSION HUNTER — ARCHITECTURE DOCUMENT

---

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BROWSER / CLIENT                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    Provider Tree (app/layout.tsx)             │    │
│  │   ThemeProvider                                               │    │
│  │     └── LanguageProvider                                      │    │
│  │           └── AuthProvider                                    │    │
│  │                 └── {children} + <Toaster />                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌────────────────┐    ┌─────────────────┐    ┌──────────────────┐   │
│  │  Next.js Pages │    │  React           │    │   Context State  │   │
│  │  App Router    │◄──►│  Components      │◄──►│  user (Auth)     │   │
│  │  (main) group  │    │  shadcn/ui       │    │  language (i18n) │   │
│  └────────┬───────┘    └─────────────────┘    │  theme           │   │
│           │                                    └──────────────────┘   │
│           │                localStorage                               │
│           │         [handy-connect-user]                              │
│           │         [handy-connect-all-chats]                         │
│           │         [handy-connect-all-reviews]                       │
│           │         [app-language]                                    │
└───────────┼──────────────────────────────────────────────────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
Next.js API    Firebase SDK (client)
Routes         ──────────────────────────────────
─────────      Firestore: collection('users')
/api/          ├── Document per user
professions    │     fields: all User type fields
(rate-limit)   │     + password (SECURITY RISK)
               │     + lat, lng, geohash (location)
               │     + availabilityStatus
               │
               Firebase Auth: initialized but not used
               (custom auth only via Firestore)

External Services:
─────────────────
EmailJS ──────────────► Password reset OTP emails
Google Genkit ────────► Gemini 1.5 Flash (AI chat suggestions)
Leaflet (CDN CSS) ────► Map tiles from OpenStreetMap
picsum.photos ────────► Placeholder avatars (dev only)
```

---

## Frontend Architecture

### Provider Hierarchy (app/layout.tsx)
```
ThemeProvider (next-themes, system default)
  └─ LanguageProvider (EN/AR/UR, localStorage persisted)
       └─ AuthProvider (Firestore onSnapshot, localStorage session)
            └─ Page Content
                 └─ <Toaster /> (toast notifications)
```

### Route Group Architecture
```
app/
├── layout.tsx          [Root Layout — providers only]
└── (main)/
    ├── layout.tsx      [Main Layout — Header + Footer + Suspense]
    └── pages...        [All user-facing pages]

app/chat/[userId]/      [No Header/Footer — full-height chat UI]
app/api/                [Server-side API routes]
```

### Component Dependency Map
```
Header ──────────────── useAuth, useLanguage
WorkerCard ─────────── User type, locations lib
WorkerTracker ─────── useAuth, Firebase Firestore, geofire-common
SeekerLiveMap ──────── useAuth, Firebase Firestore, Leaflet
IqamaVerificationDialog ─ useAuth, validation-schemas
SaudiCheckout ─────── useToast
SubscriptionCard ───── useAuth
EditProfileDialog ──── useAuth
ChatLayout ─────────── chat-messages, chat-input
ChatInput ─────────── useAuth, Genkit AI action
```

---

## Backend Architecture

The "backend" is effectively:
1. **Next.js API Routes** (`/api/professions`) — thin, rate-limited, reads static data
2. **Firebase Firestore** — primary database, accessed directly from client via Firebase SDK
3. **Firebase Cloud Functions** — scaffolded but EMPTY (functions/index.js is a stub)
4. **AuthContext server actions** — Genkit server actions for AI features

### API Route Architecture
```
/api/professions
  └─ withRateLimit(req, 'public')   [30 req/min per IP]
  └─ return NextResponse.json(professions)
```

---

## Data Architecture

### Primary Store: Firestore
- **Collection:** `users`
- **Document ID:** user.id (e.g., "worker-1", "seeker-1", "admin-001")
- **Access Pattern:** onSnapshot (real-time) on collection load, setDoc for writes
- **Seed Logic:** If collection empty on first load → seed from src/lib/data.ts mockUsers

### Secondary Store: localStorage
- **Chat history** — `handy-connect-all-chats`
- **Reviews** — `handy-connect-all-reviews`
- **Session** — `handy-connect-user`
- **Language** — `app-language`

### Real-time Data Flow (Worker Location)
```
WorkerTracker component
  -> navigator.geolocation.watchPosition()
  -> On position update: updateDoc(doc(db,'users',workerId), {lat, lng, geohash, ...})
  -> SeekerLiveMap: onSnapshot(doc(db,'users',workerId)) 
  -> Updates Leaflet marker position in real-time
```

---

## Security Architecture

### Authentication Security (Current State)
- RISK: Passwords stored plaintext in Firestore
- RISK: Admin password in NEXT_PUBLIC_ env var (client bundle)
- RISK: Auth logic entirely in browser
- MITIGATION: Rate limiting (5 attempts / 15 min)
- MITIGATION: Zod validation on all inputs
- MITIGATION: Magic byte check on image uploads

### Network Security
- HSTS enforced (2 years)
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff

### Input Validation Stack
```
User Input
  -> react-hook-form (UI validation)
  -> Zod schema (validation-schemas.ts)
  -> AuthContext function (business logic)
  -> Firestore (no server-side validation — weakness)
```

---

## Deployment Architecture

### Vercel (Primary)
```
GitHub Push
  -> Vercel CI
  -> npm install --legacy-peer-deps
  -> next build
  -> Deploy to Vercel Edge Network
  -> Security headers from vercel.json applied
```

### Firebase App Hosting (Alternative)
```
Firebase CLI deploy
  -> App Hosting (maxInstances: 1)
  -> Security headers from next.config.ts applied
```

---

## AI Architecture

### Genkit Setup (src/ai/genkit.ts)
```typescript
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});
```

### Usage Pattern
- Defined as `'use server'` — runs as Next.js server action
- Called from `chat-input.tsx` to generate AI chat reply suggestions
- Suggestions marked with `isAiSuggestion: true` in ChatMessage type
