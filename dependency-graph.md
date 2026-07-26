# PROFESSION HUNTER — DEPENDENCY GRAPH & CRITICAL FILES

---

## 1. High-Level Import Hierarchy

```
Root Layout (app/layout.tsx)
 ├── theme-provider.tsx (next-themes)
 ├── language-context.tsx (src/context/language-context.tsx)
 │    └── src/lib/translations.ts
 └── auth-context.tsx (src/context/auth-context.tsx)
      ├── src/lib/firebase.ts (Firestore SDK)
      ├── src/lib/data.ts (Mock data & seed Users)
      ├── src/lib/client-rate-limiter.ts
      └── @emailjs/browser (Password reset OTP)

Main Layout (app/(main)/layout.tsx)
 ├── header.tsx
 │    ├── useAuth, useLanguage
 │    ├── mode-toggle.tsx
 │    └── components/ui/*
 └── footer.tsx
      └── useLanguage

Pages & Components
 ├── Dashboard (dashboard-client.tsx)
 │    ├── worker-card.tsx -> src/lib/locations.ts
 │    ├── seeker-live-map.tsx -> react-leaflet, firebase/firestore
 │    └── subscription-card-seeker.tsx -> saudi-checkout.tsx
 ├── Dashboard Worker (dashboard-worker-client.tsx)
 │    ├── worker-tracker.tsx -> geofire-common, navigator.geolocation
 │    ├── subscription-card.tsx -> saudi-checkout.tsx
 │    ├── iqama-verification-dialog.tsx -> validation-schemas.ts
 │    ├── edit-profile-dialog.tsx
 │    └── reply-review-dialog.tsx
 ├── Admin (admin-client.tsx)
 │    └── useAuth
 ├── Chat Page (src/app/chat/[userId]/page.tsx)
 │    └── chat-layout.tsx
 │         ├── chat-messages.tsx
 │         └── chat-input.tsx -> src/ai/genkit.ts (Server Action)
 └── Profile Page (src/app/(main)/profile/[id]/page.tsx)
      ├── worker-card.tsx
      └── review-form.tsx -> validation-schemas.ts
```

---

## 2. Core Critical System Files

These files form the backbone of the application. **Modifications to these files carry high regression risks across multiple features.**

| File Path | Responsibility | Dependent Features | Risk Level |
|-----------|----------------|-------------------|------------|
| [`src/context/auth-context.tsx`](file:///c:/Users/User/OneDrive/Desktop/mypros/professionhunter-main/src/context/auth-context.tsx) | Central Auth, User state, Firestore sync, Subscriptions, Iqama status, Password logic | All pages, Header, Admin, Subscription, Map, Dashboards | **CRITICAL** |
| [`src/lib/data.ts`](file:///c:/Users/User/OneDrive/Desktop/mypros/professionhunter-main/src/lib/data.ts) | Core TypeScript Types (`User`, `Review`, `Chat`, `Profession`), Seed database data | AuthContext, all dashboards, Profile, Chat, Header | **CRITICAL** |
| [`src/lib/firebase.ts`](file:///c:/Users/User/OneDrive/Desktop/mypros/professionhunter-main/src/lib/firebase.ts) | Firebase app initialization, Firestore export (`db`), Firebase auth export | AuthContext, WorkerTracker, SeekerLiveMap | **HIGH** |
| [`src/context/language-context.tsx`](file:///c:/Users/User/OneDrive/Desktop/mypros/professionhunter-main/src/context/language-context.tsx) | Internationalization (`t()` function for EN, AR, UR) | All client components, Header, Footer, Forms | **HIGH** |
| [`src/lib/locations.ts`](file:///c:/Users/User/OneDrive/Desktop/mypros/professionhunter-main/src/lib/locations.ts) | Saudi Arabia cities and neighborhood dictionaries | Dashboard seeker filters, Worker profile location | **MEDIUM** |
| [`src/lib/validation-schemas.ts`](file:///c:/Users/User/OneDrive/Desktop/mypros/professionhunter-main/src/lib/validation-schemas.ts) | Zod validation rules for login, signup, Iqama, reviews, profile edits | Login, Signup, Admin dialogs, Profile dialogs | **MEDIUM** |

---

## 3. Key Package Dependencies Graph

```
Next.js 15 (App Router)
 ├── React 19 / React DOM 19
 ├── TailwindCSS + tailwindcss-animate
 ├── Radix UI Primitives (@radix-ui/react-*)
 │    └── shadcn/ui components (src/components/ui/*)
 ├── Firebase JS SDK (^11.10.0)
 │    ├── firebase/app
 │    └── firebase/firestore
 ├── Google Genkit (^1.20.0)
 │    └── @genkit-ai/google-genai (Gemini 1.5 Flash)
 ├── Leaflet & React Leaflet (^1.9.4 / ^4.2.1)
 ├── geofire-common (^6.0.0)
 ├── EmailJS (@emailjs/browser ^4.4.1)
 ├── React Hook Form + Zod (@hookform/resolvers ^4.1.3)
 └── Recharts (^2.15.1)
```
