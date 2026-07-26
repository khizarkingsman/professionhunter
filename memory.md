# PROFESSION HUNTER — PROJECT MEMORY
> **Generated:** 2026-07-26 | Complete Codebase Analysis
> Permanent brain of the project. A new engineer reading this can fully understand and navigate the codebase.

---

## 1. PROJECT OVERVIEW

**Profession Hunter** is a Saudi Arabia-focused **service marketplace web application** connecting skilled tradespeople ("Workers") with people needing services ("Seekers"). Think localised TaskRabbit/Thumbtack for Saudi Arabia.

### Business Purpose
- Allow **Workers** (plumbers, electricians, etc.) to list profiles and accept service requests
- Allow **Seekers** to browse, filter, and contact workers
- Monetise via **freemium subscriptions** — Workers and Seekers have free and Pro tiers
- Provide real-time worker **location tracking on a live map** (Leaflet + Firebase Firestore)
- Provide **in-app chat** between seekers and workers
- Provide **admin controls** for subscription management and ID verification

### Primary User Roles

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| `worker` | Skilled tradesperson | Profile, location tracking, reviews, Iqama verification |
| `seeker` | Service customer | Browse workers by city/profession, chat, leave reviews |
| `store` | Business account | Separate dashboard |
| `admin` | Platform operator | Grant/revoke subscriptions, manage Iqama verification |

---

## 2. TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | ^15.0.3 |
| Language | TypeScript | ^5 |
| UI Library | React | ^19.0.0 |
| Styling | TailwindCSS + tailwindcss-animate | ^3.4.1 |
| UI Components | shadcn/ui (Radix UI primitives) | Various |
| Database | Firebase Firestore | ^11.10.0 |
| Auth | Custom (Firestore + localStorage) | — |
| AI / LLM | Google Genkit + Gemini 1.5 Flash | ^1.20.0 |
| Email | EmailJS (password reset OTPs) | ^4.4.1 |
| Maps | Leaflet + react-leaflet | ^1.9.4 |
| Geo | geofire-common (GeoHash) | ^6.0.0 |
| Forms | react-hook-form + zod | ^7.54.2 / ^3.24.2 |
| Charts | Recharts | ^2.15.1 |
| Icons | lucide-react | ^0.475.0 |
| Fonts | PT Sans (Google Fonts via next/font) | — |
| i18n | Custom translation context | — |
| Payments | Custom UI (SaudiCheckout) — no real gateway | — |
| Dev Server Port | 9002 | — |

---

## 3. REPOSITORY STRUCTURE

```
professionhunter-main/
├── src/
│   ├── ai/                          # Google Genkit AI config
│   │   ├── genkit.ts                # Genkit instance (Gemini 1.5 Flash)
│   │   └── dev.ts                   # Dev entry point for Genkit CLI
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout (Theme, Language, Auth providers)
│   │   ├── globals.css              # Global Tailwind styles + CSS tokens
│   │   ├── loading.tsx              # Root-level loading state
│   │   ├── (main)/                  # Route group with Header+Footer layout
│   │   │   ├── layout.tsx           # Adds Header, Footer, Suspense
│   │   │   ├── page.tsx             # Home/Landing page (/)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx      # Worker/Seeker/Store tabs
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   ├── dashboard/           # Seeker dashboard
│   │   │   ├── dashboard-worker/    # Worker dashboard
│   │   │   ├── dashboard-store/     # Store dashboard
│   │   │   ├── admin/               # Admin panel
│   │   │   ├── profile/[id]/page.tsx
│   │   │   ├── live-map/page.tsx    # Real-time worker map
│   │   │   ├── subscription/        # Subscription management
│   │   │   ├── payment/             # Empty stub
│   │   │   ├── payment-hosted/      # Empty stub
│   │   │   ├── payment-result/      # Empty stub
│   │   │   ├── privacy/page.tsx
│   │   │   └── terms/page.tsx
│   │   ├── chat/[userId]/page.tsx   # In-app chat (outside main layout)
│   │   └── api/
│   │       └── professions/route.ts # GET /api/professions
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── chat/                    # chat-layout, chat-messages, chat-input
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── worker-card.tsx
│   │   ├── worker-tracker.tsx       # Worker location tracking panel
│   │   ├── seeker-live-map.tsx      # Leaflet map for seekers
│   │   ├── iqama-verification-dialog.tsx
│   │   ├── saudi-checkout.tsx       # Payment UI (simulation)
│   │   ├── subscription-card.tsx
│   │   ├── subscription-card-seeker.tsx
│   │   ├── edit-profile-dialog.tsx
│   │   ├── edit-seeker-profile-dialog.tsx
│   │   ├── review-form.tsx
│   │   ├── reply-review-dialog.tsx
│   │   ├── loading-screen.tsx
│   │   ├── mode-toggle.tsx
│   │   └── theme-provider.tsx
│   ├── context/
│   │   ├── auth-context.tsx         # CORE: All auth state and logic
│   │   └── language-context.tsx     # i18n
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   └── lib/
│       ├── data.ts                  # TypeScript types + mock seed data
│       ├── firebase.ts              # Firebase init (auth + db exports)
│       ├── translations.ts          # EN/AR/UR strings
│       ├── locations.ts             # Saudi city + neighborhood data
│       ├── validation-schemas.ts    # Zod schemas for all forms
│       ├── rate-limit-config.ts     # Rate limit thresholds
│       ├── client-rate-limiter.ts   # Browser-side rate limiter
│       ├── server-rate-limiter.ts   # Server-side rate limiter
│       └── utils.ts                 # cn() classname utility
├── functions/
│   └── index.js                     # Firebase Cloud Functions STUB (nothing deployed)
├── .env.local                       # Real secrets (git-ignored)
├── .env.local.example
├── next.config.ts                   # Next.js config + security headers
├── apphosting.yaml                  # Firebase App Hosting (maxInstances: 1)
├── vercel.json                      # Vercel deployment config
├── tailwind.config.ts
├── components.json                  # shadcn/ui config
└── package.json
```

---

## 4. SYSTEM ARCHITECTURE

```
BROWSER (Client)
  React Pages (Next.js App Router)
  React Components (shadcn/ui)
  Context Providers: AuthContext, LanguageContext, ThemeProvider
  localStorage: session, chats, reviews, language
        |
        |-- Next.js API Routes --> /api/professions (rate-limited)
        |
        |-- Firebase SDK
              Firebase Firestore: collection "users" (auth + profiles + location)
              Firebase Auth: imported but not used for auth
        |
        |-- EmailJS --> Password Reset OTP emails
        |
        |-- Google Genkit --> Gemini 1.5 Flash --> AI chat suggestions
```

### Key Architectural Decisions
1. **No traditional backend** — All auth/user logic runs in the browser via AuthContext + Firestore
2. **Firestore is the database** — users collection is the single source of truth
3. **localStorage for chat and reviews** — NOT Firestore (critical technical debt)
4. **Custom auth, not Firebase Auth** — passwords stored in Firestore documents (security risk)
5. **AI chat** uses Genkit server actions + Gemini

---

## 5. AUTHENTICATION FLOW

### Login
```
Form submit
  -> loginSchema (Zod) validate
  -> AuthContext.login(identifier, password)
  -> ClientRateLimiter.check('auth', identifier) [5 attempts / 15 min]
  -> Search users array (from Firestore): match email OR username OR phone + password
  -> On success:
       - Set lastSeen: 'online' in Firestore
       - Strip password from user object
       - setUser(userToSave)
       - localStorage.setItem('handy-connect-user', JSON.stringify(userToSave))
  -> On failure: rl.onFailure() -> exponential backoff
```

### Session Restoration (page load)
```
AuthProvider mounts
  -> onSnapshot(collection(db, 'users')) [real-time listener]
  -> If empty collection -> seed with mockUsers + ADMIN_ACCOUNT
  -> Read localStorage 'handy-connect-user'
  -> Find user in Firestore data
  -> Check subscription expiry, expire if needed, update Firestore
  -> setUser(fullUser) / setLoading(false)
```

### Logout
```
AuthContext.logout()
  -> update lastSeen in Firestore
  -> setUser(null)
  -> localStorage.removeItem('handy-connect-user')
```

### Password Reset
```
/forgot-password: user enters email/username/phone
  -> AuthContext.requestPasswordReset(identifier)
  -> Rate limit check
  -> If user exists: generate 6-digit OTP, send via EmailJS, return OTP
  -> If user NOT found: return fake OTP prefixed __fake__ (prevents enumeration)
  -> User enters OTP -> compare in component state
  -> User enters new password -> AuthContext.resetPassword() -> update Firestore
```

### Protected Route Pattern
```tsx
useEffect(() => {
  if (!loading && !user) router.push('/login');
}, [user, loading, router]);

if (loading || !user || user.role !== 'expected_role') return <LoadingScreen />;
```

### Role-Based Navigation
| Role | Links Shown |
|------|------------|
| `seeker` | /dashboard, /live-map, /subscription |
| `worker` | /dashboard-worker, /subscription |
| `store` | /dashboard-store |
| `admin` | /admin |
| unauthenticated | /login, /signup |

---

## 6. STATE MANAGEMENT

### Global (React Context)
| Context | File | Manages |
|---------|------|---------|
| AuthContext | auth-context.tsx | Session, all users, auth actions |
| LanguageContext | language-context.tsx | Language, t() function |
| ThemeProvider | theme-provider.tsx | Dark/light theme |

### localStorage Keys
| Key | Content |
|-----|---------|
| handy-connect-user | Logged-in user JSON |
| handy-connect-all-reviews | Reviews array |
| handy-connect-all-chats | Chats array |
| app-language | Language code |

### Firebase (Remote)
| Collection | Content |
|-----------|---------|
| users | All user profiles + passwords + locations |
| users/{id} | Per-user doc with real-time GPS data |

---

## 7. DATA MODELS

### User
```typescript
type User = {
  id: string; name: string; username: string;
  role: 'worker' | 'seeker' | 'store' | 'admin';
  email: string; country: string; city: string;
  neighborhood?: string; age: number; phone: string; avatarUrl: string;
  // Worker fields
  profession?: string; experience?: number; bio?: string; avgRating?: number;
  isPro?: boolean; subscriptionEndDate?: string;
  subscriptionGrantedBy?: string;
  availabilityStatus?: 'active' | 'inactive';
  // Iqama (ID verification)
  iqamaNumber?: string; iqamaImageUrl?: string; iqamaBackImageUrl?: string;
  iqamaStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  iqamaSubmittedAt?: string; iqamaVerifiedAt?: string;
  iqamaRejectionReason?: string; isVerified?: boolean;
  // Seeker fields
  isSeekerPro?: boolean; seekerSubscriptionEndDate?: string;
  // Shared
  lastSeen?: string;
  paymentHistory?: PaymentHistoryEntry[];
}
```

### Review
```typescript
type Review = {
  id: string; workerId: string; seekerId: string;
  seekerName: string; seekerAvatarUrl: string;
  rating: number; comment: string; reply?: string; createdAt: string;
}
```

### Chat / ChatMessage
```typescript
type Chat = { id: string; participants: [string, string]; messages: ChatMessage[]; }
type ChatMessage = {
  id: string; senderId: string; text: string; timestamp: string;
  isAiSuggestion?: boolean;
  file?: { url: string; type: string; };
}
```

### Professions (static in data.ts)
- **Active:** Plumber, Electrician
- **Coming Soon:** Carpenter, Painter, Cleaner, Landscaper

---

## 8. SUBSCRIPTION & PAYWALL SYSTEM

### Plans
| Plan | Role | Price | Duration |
|------|------|-------|----------|
| Free Worker | worker | 0 SAR | Forever |
| Pro Worker | worker | 100 SAR | 30 days |
| Free Seeker | seeker | 0 SAR | Forever |
| Pro Seeker | seeker | 60 SAR | 15 days |

### Paywall Logic (dashboard-client.tsx)
```
isSeekerPro == true  -> show ALL workers
isSeekerPro == false -> show ONLY free workers (worker.isPro === false)
```

### Payment Flow
SaudiCheckout component = simulated card form (no real gateway)
On "payment":
- Detect card type (Visa=starts 4, MC=starts 5, Mada=Saudi BIN prefixes)
- Call subscribeUser() or subscribeSeeker() from AuthContext
- Sets isPro/isSeekerPro + subscriptionEndDate in Firestore

### Admin Controls
- Grant subscription: 7/30/90/180/365 days
- Revoke subscription instantly
- Tracked via subscriptionGrantedBy: 'admin'

---

## 9. REAL-TIME FEATURES

### Worker Location Tracking (worker-tracker.tsx)
1. Worker clicks "Go Active" -> browser requests navigator.geolocation
2. watchPosition() continuously gets lat/lng
3. Each update writes to Firestore users/{workerId}: lat, lng, geohash, availabilityStatus, lastLocationUpdate
4. "Go Inactive" -> modal for reason + duration -> still tracks location (shows red dot)

### Seeker Live Map (seeker-live-map.tsx)
1. Seeker navigates to /live-map
2. Gets own position via getCurrentPosition() (fallback: Riyadh 24.7136, 46.6753)
3. Subscribes to each worker's Firestore doc via onSnapshot
4. Renders Leaflet map: green = active workers, red = inactive workers
5. Click marker -> modal with worker profile

### Firebase Cloud Functions
functions/index.js is a STUB. No functions deployed. seeker-live-map.tsx calls httpsCallable for non-existent functions.

---

## 10. CHAT SYSTEM

Architecture: localStorage only (NOT Firestore, NOT real-time between users)

### Flow
```
/chat/{userId} page loads
  -> Load chats from localStorage
  -> Find existing chat or create new
  -> Render ChatLayout -> ChatMessages + ChatInput
  -> User sends message -> update allChats state -> save to localStorage
  -> AI suggestion: ChatInput calls Genkit/Gemini -> isAiSuggestion: true message
```

### Components
| Component | Purpose |
|-----------|---------|
| chat-layout.tsx | Header bar + layout shell |
| chat-messages.tsx | Message bubbles, timestamps, delete |
| chat-input.tsx | Text input + file upload + AI suggestion |

---

## 11. INTERNATIONALISATION (i18n)

Supported: en (English), ar (Saudi Arabic), ur (Urdu)

RTL: Arabic and Urdu set document.documentElement.dir = 'rtl'
Header sheet opens from right for RTL languages.

Usage: const { t } = useLanguage(); then t('translationKey')
All strings in src/lib/translations.ts (large flat object)
Language saved to localStorage key 'app-language'

---

## 12. ENVIRONMENT VARIABLES

| Variable | Purpose | Required |
|---------|---------|---------| 
| NEXT_PUBLIC_FIREBASE_API_KEY | Firebase API key | Yes |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Firebase auth domain | Yes |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | Project ID | Yes |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Storage bucket | Yes |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Messaging ID | Yes |
| NEXT_PUBLIC_FIREBASE_APP_ID | App ID | Yes |
| NEXT_PUBLIC_EMAILJS_SERVICE_ID | EmailJS service | Yes |
| NEXT_PUBLIC_EMAILJS_TEMPLATE_ID | EmailJS template | Yes |
| NEXT_PUBLIC_EMAILJS_PUBLIC_KEY | EmailJS public key | Yes |
| NEXT_PUBLIC_ADMIN_SEED_PASSWORD | Admin password | Yes |
| NEXT_PUBLIC_RATE_LIMIT_AUTH_MAX | Auth max attempts | No (default: 5) |
| NEXT_PUBLIC_RATE_LIMIT_AUTH_WINDOW_MS | Auth window ms | No (default: 900000) |
| NEXT_PUBLIC_RATE_LIMIT_AUTH_BASE_DELAY_MS | Auth base delay | No (default: 30000) |
| NEXT_PUBLIC_RATE_LIMIT_AUTH_MAX_DELAY_MS | Auth max delay | No (default: 3600000) |
| NEXT_PUBLIC_RATE_LIMIT_PUBLIC_MAX | Public API limit | No (default: 30) |
| NEXT_PUBLIC_RATE_LIMIT_AUTHED_MAX | Authed API limit | No (default: 60) |

WARNING: All use NEXT_PUBLIC_ prefix = visible in browser bundle. Admin password is exposed.

---

## 13. RATE LIMITING

### Client-Side (client-rate-limiter.ts)
- Login: 5 attempts / 15 min per identifier, exponential backoff up to 1 hour
- Signup: same limits per email
- Password reset: same limits per identifier

### Server-Side (server-rate-limiter.ts)
- /api/professions: 30 requests / 1 min per IP

---

## 14. SECURITY HEADERS (next.config.ts + vercel.json)
- Strict-Transport-Security (HSTS, 2 years)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

---

## 15. DEPLOYMENT

### Vercel (primary)
vercel.json in root. Install: npm install --legacy-peer-deps

### Firebase App Hosting (alternative)
apphosting.yaml: maxInstances: 1

### Development Scripts
```
npm run dev          # Next.js on port 9002
npm run genkit:dev   # Genkit AI dev server
npm run build        # Production build
npm run typecheck    # TypeScript (no emit)
npm run lint         # ESLint
```

---

## 16. TECHNICAL DEBT & KNOWN RISKS

### CRITICAL SECURITY
1. Passwords stored in Firestore plaintext — anyone with read access gets all passwords
2. Admin password in NEXT_PUBLIC env var = exposed in browser bundle
3. All auth client-side — no server-side session validation, localStorage can be tampered

### ARCHITECTURE
4. Chat in localStorage — not synced between devices or users
5. Reviews in localStorage — not persisted to Firestore
6. Firebase Functions are stubs — seeker-live-map.tsx calls httpsCallable for non-existent functions
7. Payment is simulated — SaudiCheckout is UI only, no real gateway
8. typescript: ignoreBuildErrors: true — TS errors don't block builds
9. eslint: ignoreDuringBuilds: true — ESLint errors don't block builds

### PERFORMANCE
10. Entire user list in AuthContext — getAllUsers() loads ALL users, won't scale
11. Iqama images as base64 in Firestore — should use Firebase Storage
12. No pagination on any list

---

## 17. FEATURE INVENTORY

| Feature | Status | Files |
|---------|--------|-------|
| Landing page | Live | (main)/page.tsx |
| Login | Live | login/page.tsx, auth-context |
| Signup Worker/Seeker/Store | Live | signup/page.tsx, auth-context |
| Forgot/Reset Password | Live | forgot-password/, reset-password/, EmailJS |
| Seeker Dashboard | Live | dashboard/dashboard-client.tsx |
| Worker Dashboard | Live | dashboard-worker/dashboard-worker-client.tsx |
| Store Dashboard | Live | dashboard-store/dashboard-store-client.tsx |
| Public Worker Profile | Live | profile/[id]/page.tsx |
| Subscription Management | Live | subscription/subscription-client.tsx |
| Payment Checkout | Simulated | saudi-checkout.tsx (no gateway) |
| Worker Location Tracker | Live | worker-tracker.tsx + Firestore |
| Seeker Live Map | Live | seeker-live-map.tsx + Leaflet + Firestore |
| In-app Chat | Live | chat/[userId]/page.tsx + localStorage |
| AI Chat Suggestions | Live | chat-input.tsx + Genkit + Gemini |
| Iqama ID Verification | Live | iqama-verification-dialog.tsx |
| Admin Panel | Live | admin/admin-client.tsx |
| Reviews (leave + reply) | Live | review-form.tsx, localStorage |
| Dark/Light Theme | Live | mode-toggle.tsx, next-themes |
| Multi-language EN/AR/UR | Live | language-context.tsx, translations.ts |
| Privacy Policy | Live | privacy/page.tsx |
| Terms of Service | Live | terms/page.tsx |
| Firebase Cloud Functions | STUB | functions/index.js (nothing deployed) |
| payment/, payment-hosted/, payment-result/ | EMPTY | No content |

---

## 18. IMPORTANT FILES (MODIFY WITH CAUTION)

| File | Reason |
|------|--------|
| src/context/auth-context.tsx | Core auth + user management. Changes affect entire app. |
| src/lib/data.ts | All TypeScript types. Changing breaks all consumers. |
| src/lib/firebase.ts | Single Firebase init. Misconfiguration breaks everything. |
| src/app/layout.tsx | Root layout, provider order matters. |
| src/lib/validation-schemas.ts | Zod schemas for all forms. Security-critical. |
| src/lib/translations.ts | All i18n strings. Missing keys silently fallback to English. |
| src/lib/locations.ts | All Saudi city/neighborhood data used across multiple pages. |
| next.config.ts | Security headers, image domains, build settings. |

---

## 19. DEVELOPMENT WORKFLOW

```bash
# 1. Install
npm install --legacy-peer-deps

# 2. Configure env
cp .env.local.example .env.local
# Fill in Firebase + EmailJS credentials

# 3. Run
npm run dev   # http://localhost:9002
```

### Test Accounts (auto-seeded on first Firebase run)
- Worker: johndoe / password123
- Seeker: alicebrown / password123
- Admin: admin / <NEXT_PUBLIC_ADMIN_SEED_PASSWORD>
