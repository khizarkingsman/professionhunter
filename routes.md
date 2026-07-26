# PROFESSION HUNTER — ROUTES MAP

---

## Page Routes

| Route | File | Purpose | Auth Required | Role |
|-------|------|---------|---------------|------|
| `/` | `src/app/(main)/page.tsx` | Landing page, profession cards, how-it-works | No | Any |
| `/login` | `src/app/(main)/login/page.tsx` | Login form (email/username/phone + password) | No | Unauthenticated |
| `/signup` | `src/app/(main)/signup/page.tsx` | Signup with 3 tabs: Worker, Seeker, Store | No | Unauthenticated |
| `/forgot-password` | `src/app/(main)/forgot-password/page.tsx` | Enter identifier -> receive OTP via email | No | Any |
| `/reset-password` | `src/app/(main)/reset-password/page.tsx` | Enter new password after OTP verification | No | Any |
| `/dashboard` | `src/app/(main)/dashboard/page.tsx` | Seeker browse workers (filter by city/profession) | Yes | seeker |
| `/dashboard-worker` | `src/app/(main)/dashboard-worker/page.tsx` | Worker profile, reviews, chats tabs | Yes | worker |
| `/dashboard-store` | `src/app/(main)/dashboard-store/page.tsx` | Store owner dashboard | Yes | store |
| `/admin` | `src/app/(main)/admin/page.tsx` | Admin: user management, subscriptions, Iqama | Yes | admin |
| `/profile/[id]` | `src/app/(main)/profile/[id]/page.tsx` | Public worker profile, reviews, contact | Yes | seeker |
| `/live-map` | `src/app/(main)/live-map/page.tsx` | Real-time Leaflet map of active workers | Yes | seeker |
| `/subscription` | `src/app/(main)/subscription/page.tsx` | Manage plan, billing, payment history | Yes | worker, seeker |
| `/chat/[userId]` | `src/app/chat/[userId]/page.tsx` | Full-screen chat between two users | Yes | Any |
| `/privacy` | `src/app/(main)/privacy/page.tsx` | Privacy policy (static) | No | Any |
| `/terms` | `src/app/(main)/terms/page.tsx` | Terms of service (static) | No | Any |
| `/payment` | `src/app/(main)/payment/` | **EMPTY STUB** | — | — |
| `/payment-hosted` | `src/app/(main)/payment-hosted/` | **EMPTY STUB** | — | — |
| `/payment-result` | `src/app/(main)/payment-result/` | **EMPTY STUB** | — | — |

---

## API Routes

| Method | Route | File | Purpose | Rate Limit |
|--------|-------|------|---------|-----------|
| GET | `/api/professions` | `src/app/api/professions/route.ts` | Returns list of all professions | 30/min public |

---

## Dynamic Routes

| Route Pattern | Parameter | Example | Purpose |
|--------------|-----------|---------|---------|
| `/profile/[id]` | `id` = user ID | `/profile/worker-1` | Public worker profile |
| `/chat/[userId]` | `userId` = other user's ID | `/chat/seeker-1` | Chat with specific user |

---

## Route Groups

### `(main)` Group
- **Purpose:** All pages that share the Header + Footer layout
- **Layout file:** `src/app/(main)/layout.tsx`
- **Components added:** `<Header />`, `<Footer />`, `<Suspense fallback={<LoadingScreen />}>`

### Root (no group)
- **Layout file:** `src/app/layout.tsx`
- **Components added:** ThemeProvider, LanguageProvider, AuthProvider, Toaster
- **Note:** `/chat/[userId]` is under root (no Header/Footer) to achieve full-height layout

---

## Layouts

| Layout | File | Wraps | Adds |
|--------|------|-------|------|
| Root Layout | `src/app/layout.tsx` | All pages | ThemeProvider, LanguageProvider, AuthProvider, Toaster, PT Sans font |
| Main Layout | `src/app/(main)/layout.tsx` | All (main) pages | Header, Footer, Suspense fallback |

---

## Navigation Links (Header)

### Unauthenticated
- Logo → `/`
- Login → `/login`
- Sign Up → `/signup`

### Seeker
- Dashboard → `/dashboard`
- Find on Map → `/live-map`
- Subscription → `/subscription`
- Logout

### Worker
- My Dashboard → `/dashboard-worker`
- Subscription → `/subscription`
- Logout

### Store
- My Store → `/dashboard-store`
- Logout

### Admin
- Admin Panel → `/admin`
- Logout

---

## Redirect Logic

| From | Condition | To |
|------|-----------|-----|
| Protected page | `!loading && !user` | `/login` |
| `/subscription` | `user.role === 'store'` | `/dashboard-store` |
| `/dashboard` | `user.role !== 'seeker'` | `<LoadingScreen>` (then redirect by effect) |
| `/dashboard-worker` | `user.role !== 'worker'` | `<LoadingScreen>` |
| `/admin` | `user.role !== 'admin'` | `<LoadingScreen>` |

---

## Page-Client Split Pattern

Next.js App Router pages follow a consistent split:

```
page.tsx  (server component, minimal)
  └─ 'use client' disabled
  └─ Wraps ClientComponent in Suspense
  └─ Example:
     import { Suspense } from 'react';
     import DashboardClient from './dashboard-client';
     export default function Page() {
       return <Suspense><DashboardClient /></Suspense>;
     }

dashboard-client.tsx  (client component)
  └─ 'use client' at top
  └─ All hooks, state, auth checks
  └─ Actual UI rendering
```

This pattern is used for: dashboard, dashboard-worker, dashboard-store, admin, subscription.
Login, signup, profile, and chat pages are monolithic client components (page.tsx contains all logic).
