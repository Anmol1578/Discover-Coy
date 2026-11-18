# Spark — Dating App (Discover & Matches)

A mobile-first dating app built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **SQLite via Prisma**. It features a gesture-driven swipe **Discover** deck, a blank **Home** screen, and a **Matches** view.

The core promise to protect: **A user never learns who liked them unless the like is mutual.**

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup & Seeding
Push the Prisma schema to create the local SQLite database and seed the 35 profiles:
```bash
npx prisma db push
npx prisma db seed
```
> The seed script automatically maps `data/profiles.json` into the database, parses interests into JSON, sets initial like flags, and verifies that at least 2 of the first 4 profiles have liked the logged-in user to allow immediate testing of mutual matches.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

Vitest runs backend integration tests against an isolated SQLite test database (`prisma/test.db`). The production/development database (`dev.db`) is never touched during tests.

```bash
npm test
```

The test suite validates:
1. `GET /api/feed` returns unswiped profiles and never includes `hasLikedCurrentUser` or `likedUser`.
2. After swiping `PASS` or `LIKE`, the profile is permanently removed from subsequent feed queries.
3. Swiping `LIKE` on a profile that did not like the user returns `{ matched: false }` and creates 0 `Match` rows.
4. Swiping `PASS` on a profile that liked the user returns `{ matched: false }` and creates 0 `Match` rows.
5. Swiping `LIKE` on a profile that already liked the user returns `{ matched: true, match: { ... } }` and adds the profile to `/api/matches`.
6. Duplicate swipes on the same profile return `409 Conflict` and preserve database integrity (single swipe, at most one match).
7. Invalid payloads return `400 Bad Request` and unknown profile IDs return `404 Not Found`.
8. **Privacy Guarantee**: JSON responses across all endpoints (`/api/feed`, `/api/swipe` matched/unmatched, `/api/matches`) do not leak `hasLikedCurrentUser` or `likedUser`.
9. `POST /api/reset` clears all swipes and matches, resetting the feed to 35 profiles.

---

## 📁 Project Structure

```
├── data/
│   └── profiles.json            # 35 initial seed profiles (12 with likedUser=true)
├── prisma/
│   ├── schema.prisma            # Prisma schema (Profile, Swipe, Match with foreign keys)
│   ├── seed.ts                  # Seed script with stable order & like-density guarantee
│   └── dev.db                   # SQLite database (git-ignored)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── feed/route.ts    # GET /api/feed (unswiped profiles, strictly whitelisted)
│   │   │   ├── swipe/route.ts   # POST /api/swipe (transactional swipe + match check)
│   │   │   ├── matches/route.ts # GET /api/matches (all mutual matches)
│   │   │   └── reset/route.ts   # POST /api/reset (demo-only database cleaner)
│   │   ├── globals.css          # Tailwind base and dark mode styles
│   │   ├── layout.tsx           # App layout with mobile viewport and font settings
│   │   └── page.tsx             # Root page mounting AppShell
│   ├── components/
│   │   ├── AppShell.tsx         # Mobile-first centered shell and active tab coordinator
│   │   ├── DiscoverTab.tsx      # Swipe card arena, keyboard listeners, empty state
│   │   ├── SwipeCard.tsx        # Framer Motion drag gestures, stamps, rotation
│   │   ├── MatchModal.tsx       # "It's a match!" overlay modal
│   │   ├── MatchesTab.tsx       # List of mutual matches with photo and interests
│   │   ├── HomeTab.tsx          # Intentionally blank screen
│   │   └── TabBar.tsx           # Fixed bottom navigation with live match count badge
│   ├── lib/
│   │   ├── prisma.ts            # Singleton Prisma client instance
│   │   └── profiles.ts          # Public field projection whitelist & matching rules
│   └── types/
│       └── index.ts             # TypeScript definitions
├── tests/
│   ├── api.test.ts              # Route handler integration test cases
│   ├── global-setup.ts          # Vitest global setup (creates & seeds test.db)
│   └── setup.ts                 # Vitest beforeEach (cleans Swipe and Match tables)
├── vitest.config.mts            # Vitest configuration with test database environment
└── README.md
```

---

## 🔒 Privacy & Security Design

The application enforces a **zero-leakage architecture**:
1. **Public-Field Whitelist in Shared Module (`src/lib/profiles.ts`)**:
   Every database profile object is passed through `toPublicProfile()` before being returned to the client:
   - Whitelisted fields: `id`, `name`, `age`, `photoUrl`, `bio`, `city`, `college`, `interests` (parsed from string to array).
   - The boolean `hasLikedCurrentUser` is strictly stripped out on the server and is never passed into any response object.
2. **Server-Side Match Decision**:
   The client never knows if another user liked them before swiping. The evaluation `isMutualMatch(direction, profile.hasLikedCurrentUser)` occurs exclusively on the backend inside the swipe transaction.
3. **Information Hiding on Unmatched Swipes**:
   When a user swipes `PASS` on someone who liked them, or swipes `LIKE` on someone who did not, the API response is identically `{ matched: false }`. No clue or hint is ever provided.
4. **Automated Test Assertions**:
   Test cases assert that neither the string `hasLikedCurrentUser` nor `likedUser` exists anywhere within the serialized JSON response body of any endpoint.

---

## 🔄 Transaction & Race Condition Handling

- **Prisma Transaction (`$transaction`)**:
  Swipes and match creations are executed within an atomic transaction.
- **Unique Constraint (`profileId @unique`)**:
  Both the `Swipe` and `Match` models define `@unique` on `profileId` so a profile can only ever be swiped once.
- **P2002 to 409 Conflict**:
  If double-taps, network retries, or concurrent requests attempt to swipe the same profile twice, the database unique-constraint violation (`P2002`) is caught and translated to a `409 Conflict` HTTP response.
- **Frontend Optimistic Swiping**:
  The UI immediately advances the card deck for maximum responsiveness, calls the swipe API in the background, disables gestures while animating, and gracefully ignores `409 Conflict` responses without disrupting the user experience.

---

## 🛠️ API Reference

### 1. `GET /api/feed`
Returns unswiped profiles ordered by `id` ascending.

**Example Response (`200 OK`)**:
```json
[
  {
    "id": "1",
    "name": "Aarav Mehta",
    "age": 21,
    "photoUrl": "https://api.dicebear.com/9.x/personas/svg?seed=Aarav&backgroundColor=b6e3f4",
    "bio": "CS student who ships side projects at 2 a.m. Will trade chai recommendations for good playlists.",
    "city": "Pune",
    "college": "Symbiosis Institute of Technology",
    "interests": ["Coding", "Chai", "Indie Music", "Cricket"]
  }
]
```

### 2. `POST /api/swipe`
Records a swipe and checks for a mutual match.

**Request Body**:
```json
{
  "profileId": "10",
  "direction": "LIKE" // or "PASS"
}
```

**Example Response - Mutual Match (`200 OK`)**:
```json
{
  "matched": true,
  "match": {
    "id": "10",
    "name": "Arjun Reddy",
    "age": 23,
    "photoUrl": "https://api.dicebear.com/9.x/personas/svg?seed=Arjun&backgroundColor=c0aede",
    "bio": "Robotics club lead. I can build you a robot but I still cannot fold a fitted sheet.",
    "city": "Hyderabad",
    "college": "IIIT Hyderabad",
    "interests": ["Robotics", "Biryani", "Gaming", "Startups"],
    "matchedAt": "2026-11-18T10:20:52.923Z"
  }
}
```

**Example Response - No Match (`200 OK`)**:
```json
{
  "matched": false
}
```

**Error Responses**:
- `400 Bad Request`: Missing `profileId` or invalid `direction`.
- `404 Not Found`: Profile does not exist.
- `409 Conflict`: Profile has already been swiped.

### 3. `GET /api/matches`
Returns all mutual matches ordered by `matchedAt` descending.

**Example Response (`200 OK`)**:
```json
[
  {
    "id": "10",
    "name": "Arjun Reddy",
    "age": 23,
    "photoUrl": "https://api.dicebear.com/9.x/personas/svg?seed=Arjun&backgroundColor=c0aede",
    "bio": "Robotics club lead. I can build you a robot but I still cannot fold a fitted sheet.",
    "city": "Hyderabad",
    "college": "IIIT Hyderabad",
    "interests": ["Robotics", "Biryani", "Gaming", "Startups"],
    "matchedAt": "2026-11-18T10:20:52.923Z"
  }
]
```

### 4. `POST /api/reset` (Demo Helper Only)
Clears all `Swipe` and `Match` records so that reviewers can re-test the swipe deck.
- **Safety Gate**: Active only when `NODE_ENV !== "production"` or `ENABLE_DEMO_RESET=true`.
- In standard production environments without this flag, returns `404 Not Found`.

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Swipes and matches have been reset"
}
```

---

## 🎨 Visual Design Specifications

- **Mobile Shell**: Centered `max-w-[430px]` container on desktop with hairline border (`#27272A`), full-bleed on mobile devices.
- **Palette**:
  - Background: `#0D0D0F`
  - Elevated surfaces: `#18181B`
  - Hairline borders: `#27272A`
  - Warm accent: Rose (`#F43F5E`) for mutual match highlights, like actions, and active indicators.
- **Desktop Shortcuts**:
  - `←` Left Arrow: Pass current profile
  - `→` Right Arrow: Like current profile
- **Gestures**: Framer Motion horizontal drag with rotation, dynamic "LIKE" / "PASS" stamps, velocity exit fling, and optimistic card advancement.

---

## ⚠️ Known Limitations & Assumptions

1. **Single Logged-in User**: The logged-in user is hardcoded on the server as `CURRENT_USER_ID = "me"`. There is no multi-user authentication system or session token exchange.
2. **Local SQLite Persistence**: Profiles and swipes persist locally in SQLite via Prisma.
3. **Avatar Rendering**: Dicebear persona SVGs are rendered using plain HTML `<img>` elements to support remote SVG rendering without next/image remote domain configuration restrictions.
