# PROFESSION HUNTER — API INVENTORY

---

## REST API Routes (Next.js Route Handlers)

### GET /api/professions

| Property | Value |
|---------|-------|
| Method | GET |
| Route | `/api/professions` |
| File | `src/app/api/professions/route.ts` |
| Auth Required | No |
| Rate Limit | 30 requests / 1 minute per IP (public tier) |
| Input | None |
| Output | `Profession[]` JSON array |
| Used By | UNKNOWN — not currently called from any frontend page (pages use static import from data.ts directly) |

**Response Shape:**
```json
[
  { "name": "Plumber", "description": "Fixing leaks...", "isComingSoon": false },
  { "name": "Electrician", "description": "Wiring...", "isComingSoon": false },
  { "name": "Carpenter", "description": "Custom furniture...", "isComingSoon": true },
  { "name": "Painter", "description": "Interior...", "isComingSoon": true },
  { "name": "Cleaner", "description": "Home and office...", "isComingSoon": true },
  { "name": "Landscaper", "description": "Gardening...", "isComingSoon": true }
]
```

Note: The LucideIcon component reference is stripped from the JSON response (functions are not serializable).

---

## Client-Side "APIs" (AuthContext Functions)

These are functions exposed via AuthContext that act as the application's business logic layer. They are called from components exactly like API calls.

### login(identifier, password)
| Property | Value |
|---------|-------|
| Input | identifier: string (email/username/phone), password: string |
| Output | User (success) OR null (wrong credentials) OR { rateLimited: true, message: string } |
| Side Effects | Writes lastSeen to Firestore, updates React state, updates localStorage |
| Rate Limit | 5 attempts / 15 min per identifier |

### logout()
| Property | Value |
|---------|-------|
| Input | None |
| Output | void |
| Side Effects | Updates lastSeen in Firestore, clears React state, removes localStorage |

### signup(newUser, password)
| Property | Value |
|---------|-------|
| Input | newUser: User (without password), password: string |
| Output | User (success) OR null (email already exists) OR { rateLimited: true, message: string } |
| Side Effects | Writes new user to Firestore, sets React state, sets localStorage |
| Rate Limit | 5 attempts / 15 min per email |

### updateUser(updatedUser)
| Property | Value |
|---------|-------|
| Input | updatedUser: User |
| Output | void (async) |
| Side Effects | Writes to Firestore via setDoc merge, updates React state if current user |

### subscribeUser(amount, method)
| Property | Value |
|---------|-------|
| Input | amount: string ("100 SAR"), method: string ("stc", "visa", etc.) |
| Output | void |
| Side Effects | Sets isPro: true, subscriptionEndDate (+30 days), adds paymentHistory entry in Firestore |
| Precondition | user.role === 'worker' |

### subscribeSeeker(amount, method)
| Property | Value |
|---------|-------|
| Input | amount: string, method: string |
| Output | void |
| Side Effects | Sets isSeekerPro: true, seekerSubscriptionEndDate (+15 days), adds paymentHistory entry |
| Precondition | user.role === 'seeker' |

### getAllUsers()
| Property | Value |
|---------|-------|
| Input | None |
| Output | User[] (passwords stripped) |
| Side Effects | None (reads from React state populated by Firestore) |

### grantSubscription(workerId, durationDays)
| Property | Value |
|---------|-------|
| Input | workerId: string, durationDays: number |
| Output | void |
| Side Effects | Sets worker isPro: true, subscriptionEndDate, subscriptionGrantedBy: 'admin', adds history |
| Precondition | Admin only (called from admin panel) |

### revokeSubscription(workerId)
| Property | Value |
|---------|-------|
| Input | workerId: string |
| Output | void |
| Side Effects | Sets isPro: false, clears subscriptionEndDate, clears subscriptionGrantedBy |

### updateIqamaStatus(workerId, status, reason?)
| Property | Value |
|---------|-------|
| Input | workerId: string, status: 'approved' or 'rejected', reason?: string |
| Output | void |
| Side Effects | Updates iqamaStatus, iqamaVerifiedAt, isVerified, iqamaRejectionReason in Firestore |

### submitIqama(iqamaNumber, iqamaImageUrl, iqamaBackImageUrl)
| Property | Value |
|---------|-------|
| Input | iqamaNumber: string (10 digits), iqamaImageUrl: string (base64), iqamaBackImageUrl: string (base64) |
| Output | void |
| Side Effects | Writes iqama fields + status: 'pending' to Firestore |
| Precondition | user.role === 'worker' |

### requestPasswordReset(identifier)
| Property | Value |
|---------|-------|
| Input | identifier: string |
| Output | Promise<string OR null> — OTP string on success, null on email failure, "__rate_limited__:msg" if rate limited, "__fake__XXXXXX" if user not found |
| Side Effects | Sends email via EmailJS |

### resetPassword(identifier, newPassword)
| Property | Value |
|---------|-------|
| Input | identifier: string, newPassword: string |
| Output | boolean (true = success) |
| Side Effects | Updates password field in Firestore |

---

## Firebase Firestore Direct Operations

### Used in WorkerTracker (location tracking)
```javascript
// Read on mount
getDoc(doc(db, 'users', userId))

// Write on location update
setDoc(doc(db, 'users', workerId), {
  lat, lng, geohash, availabilityStatus, lastLocationUpdate: serverTimestamp()
}, { merge: true })

// Update availability
updateDoc(doc(db, 'users', workerId), { availabilityStatus, inactiveUntil, inactiveReason })
```

### Used in SeekerLiveMap (read worker locations)
```javascript
// Real-time per-worker subscription
onSnapshot(doc(db, 'users', workerId), (snap) => { ... })
```

### Used in AuthContext
```javascript
// Collection listener
onSnapshot(collection(db, 'users'), snapshot => { ... })

// User upsert
setDoc(doc(db, 'users', userId), userObject, { merge: true })
```

---

## External Service APIs

### EmailJS
- **Endpoint:** Called via `@emailjs/browser` client library
- **When:** Password reset OTP
- **Config:** NEXT_PUBLIC_EMAILJS_SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY
- **Payload:** `{ passcode: string, email: string }`

### Google Genkit / Gemini 1.5 Flash
- **When:** AI chat suggestion in chat-input.tsx
- **Pattern:** Next.js server action (use server)
- **Input:** Chat context + worker profession
- **Output:** Suggested reply text

### Firebase Cloud Functions (httpsCallable)
- **Status:** Called in seeker-live-map.tsx but NO functions are deployed in functions/index.js
- **RISK:** Will throw errors at runtime when invoked
