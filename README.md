# Coy — Discover & Crush Matching

> A mobile-first swipe discovery and double-blind crush-matching application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **SQLite via Prisma**. 
> Faithfully styled after **[getcoy.com](https://getcoy.com/)** with its iconic neo-brutalist identity: Bricolage Grotesque typography, bold 2px borders, tactile hard drop shadows, playful pastel stickers, and fluid Framer Motion gestures.

---

## 💡 Part A: Product Strategy & Core Features

Based on an end-to-end evaluation of Coy's onboarding flow (Phone OTP, secret crush nomination, email verification, viral invite loops, and extra slots), here are two high-impact features designed to accelerate Coy's growth while preserving its zero-knowledge double-blind promise:

### 1. Zero-Knowledge Campus & Organization Circles
- **The Problem:** In Coy's current flow, you must add people individually by phone number or personal email. College students and co-workers often don't have their crush's private phone number, and hesitate to add them without knowing if peers are active.
- **The Solution:** Users verify their college or workplace domain (e.g. `@iitb.ac.in`). Coy displays an aggregate peer counter (*"34 peers from your campus are on Coy"*) and allows nominating crushes within the verified campus directory via internal salted hashes.
- **Why Required:** Solves the cold-start density problem. Dating in college/workplaces is where real-life crushes cluster. Collective social proof eliminates hesitation while preserving 100% double-blind privacy.

### 2. Secret "Vibe Anchor" (Post-Match Icebreaker)
- **The Problem:** When two acquaintances or classmates match on a double-blind app, they frequently experience paralyzing friction: *"Who texts first? What do we say? Will it be awkward in class tomorrow?"*
- **The Solution:** When nominating a crush, users pick a low-stakes meetup activity (e.g. *"Late-night chai walk"*, *"Study session at library"*, *"Filter coffee run"*). This remains encrypted and hidden until both match, when Coy reveals the shared prompt with a one-tap WhatsApp pre-filled greeting.
- **Why Required:** Closes the gap between a digital match and a real-world date. Removing the post-match icebreaker anxiety converts passive matches into active real-world meetups.

---

## 🎨 Part B: Discover Tab & Swipe Experience

### 1. Visual Theme (Matching getcoy.com)
- **Typography:** `Bricolage Grotesque` bold editorial typeface.
- **Palette:** Signature Hot Pink (`#FF3D81`), Soft Pink (`#FFE4EF` header), Peach (`#FFE1CF` button bar), Mint (`#CBF4E0`), Yellow (`#FFE45C`), and Sky Blue (`#D7ECFF`).
- **Neo-Brutalist Surfaces:** 2px solid `#15121D` borders, hard drop shadows (`4px 4px 0 #15121D`), and active press translation.

### 2. Framer Motion Gesture Engine
- **Gesture Physics:** Horizontal drag with velocity fling, dynamic rotation (`-18°` to `+18°`), and smooth background card scaling.
- **Dynamic Stamps:** Animated **"LIKE ♥"** (pink) and **"PASS ✕"** (dark) stickers that swell and tilt dynamically on drag.
- **Floating Heart Burst:** Pressing the Like button shoots an animated burst of floating Coy hearts.
- **"It's a Match!" Overlay:** Matches Coy's signature hero match card with overlapping peach ("You") and sky ("Them") avatars with a pulsing heart badge and direct WhatsApp connect.

### 3. Zero-Leakage Privacy Guarantee
- **Server-Side Whitelist:** Database queries pass through `toPublicProfile()`. The `hasLikedCurrentUser` flag is strictly stripped on the server and is never sent to the client.
- **Atomic Match Evaluation:** Match decisions occur strictly inside `POST /api/swipe`. Unilateral likes or passes return `{ matched: false }` with zero information leakage.

---

## 🚀 Quick Start

### 1. Install & Database Setup
```bash
npm install
npx prisma db push
npx prisma db seed
```
> Seeds 35 mock Indian profiles. At least 2 of the first 4 profiles have already liked the logged-in user to guarantee instant mutual matches during demos.

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Vitest executes automated integration tests against an isolated SQLite test database:
```bash
npm test
```

**Validated Test Scenarios (9/9 Passing):**
1. `GET /api/feed` returns unswiped profiles and never leaks `hasLikedCurrentUser`.
2. Profiles permanently disappear from the feed after swiping `LIKE` or `PASS`.
3. Unilateral likes return `{ matched: false }` and create 0 matches.
4. Mutual likes return `{ matched: true, match: { ... } }` and add to `/api/matches`.
5. Duplicate swipes return `409 Conflict` (idempotency guarantee).
6. Response payloads never contain `hasLikedCurrentUser` or `likedUser`.
7. `POST /api/reset` successfully restores the deck for re-testing.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|:---:|---|
| `/api/feed` & `/feed` | `GET` | Returns unswiped profiles (whitelisted public projection). |
| `/api/swipe` & `/swipe` | `POST` | Records a swipe (`LIKE` or `PASS`) and returns `{ matched: boolean }`. |
| `/api/matches` & `/matches` | `GET` | Returns mutual matches ordered by `matchedAt` descending. |
| `/api/reset` & `/reset` | `POST` | Demo helper: resets all swipes and matches. |

---

## 📁 Project Structure

```
├── data/
│   └── profiles.json        # 35 initial seed profiles (12 with likedUser=true)
├── prisma/
│   ├── schema.prisma        # Prisma schema (Profile, Swipe, Match)
│   └── seed.ts              # Guaranteed match density seed script
├── public/
│   ├── coy-wordmark.svg     # Official Coy wordmark vector
│   └── fonts/               # Bricolage Grotesque font
├── src/
│   ├── app/
│   │   ├── api/             # /feed, /swipe, /matches, /reset route handlers
│   │   ├── globals.css      # Coy design tokens, font face, neo-brutalist buttons
│   │   ├── layout.tsx       # Root layout with Bricolage Grotesque
│   │   └── page.tsx         # Mounts AppShell
│   ├── components/
│   │   ├── AppShell.tsx     # Centered mobile container with tab coordinator
│   │   ├── DiscoverTab.tsx  # Swipe deck, action buttons, floating heart burst
│   │   ├── SwipeCard.tsx    # Card physics, LIKE/PASS dynamic stamps
│   │   ├── MatchModal.tsx   # Signature Coy hot pink mutual match overlay
│   │   ├── MatchesTab.tsx   # Staggered mutual matches list with WhatsApp CTA
│   │   ├── HomeTab.tsx      # Clean placeholder tab per assignment instructions
│   │   └── TabBar.tsx       # Coy bottom navigation with live match counter
│   ├── lib/
│   │   ├── prisma.ts        # Singleton Prisma client
│   │   └── profiles.ts      # Server-side projection whitelist
│   └── types/
│       └── index.ts         # TypeScript definitions
└── tests/
    └── api.test.ts          # Vitest integration test suite
```
