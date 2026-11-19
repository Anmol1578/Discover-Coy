# Deploying Coy to Vercel (Static Data Architecture)

This document provides a comprehensive breakdown of the architectural changes and enhancements made to make the **Coy Discover & Crush Matching** application fully deployable to **Vercel** with zero external database configuration, while keeping 100% feature parity, gesture physics, visual styling, privacy guarantees, and integration tests intact.

---

## 📌 1. Background & Challenges with Standard Deployment

The local version of Coy was built using **SQLite via Prisma** (`file:./dev.db`). While SQLite works seamlessly for local development and local testing, deploying it directly to a serverless platform like Vercel introduces three fundamental blockers:

1. **Read-Only Serverless Filesystem:**
   Vercel deploys Next.js API routes as serverless AWS Lambda functions. The root filesystem (`/var/task`) in a Lambda container is strictly **read-only**. Any attempt to create or write to a local SQLite database (`dev.db`) triggers `SQLITE_READONLY: attempt to write a readonly database` or `EROFS` errors.
2. **Ephemeral Containers & Multi-Tenant Collisions:**
   Serverless functions are stateless and ephemeral. Even if a SQLite database were copied to `/tmp`, each incoming request can hit a different container instance or cold start, causing swipes and matches to vanish randomly. Furthermore, multiple evaluators or recruiters viewing a live shared link would collide into one shared database state.
3. **Prisma Client Generation in CI/CD:**
   In serverless build pipelines, `@prisma/client` must be generated during `npm install` / `npm run build` via `prisma generate`, otherwise the build fails with missing client engine errors.

---

## 🏗️ 2. Architectural Solution: Dual-Mode Data Engine

To resolve these challenges without requiring external paid database services (e.g., Supabase, Neon, AWS RDS), we implemented an **intelligent dual-mode data architecture**:

```
                       ┌────────────────────────┐
                       │  Incoming API Request  │
                       └───────────┬────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │   isStaticMode() Check │
                       └─────┬────────────┬─────┘
                             │            │
               True (Vercel) │            │ False (Vitest / Local)
                             ▼            ▼
             ┌─────────────────────┐  ┌─────────────────────┐
             │  Static Data Engine │  │    Prisma Engine    │
             │ (profiles.json +    │  │ (SQLite test.db /   │
             │  coy_session cookie)│  │  dev.db)            │
             └─────────────────────┘  └─────────────────────┘
```

### Key Highlights of the Static Data Engine:
- **Zero-Config Deployment:** Requires **0 environment variables** and **0 external databases** on Vercel. Works right out of the box upon `git push`.
- **Pre-Bundled Profile Deck:** Compiles all 35 mock Indian profiles from `data/profiles.json` directly into the serverless bundle with zero runtime disk I/O overhead.
- **Guaranteed Match Density:** Replicates the exact seed ID swap logic (`3 ↔ 5`, `7 ↔ 10`), guaranteeing that at least 2 of the first 4 profiles have already liked the logged-in user for immediate demo matches.
- **Stateless Session Isolation:** Uses a lightweight `coy_session` cookie (or in-memory fallback) to store the visitor's swipe directions and match timestamps. Each recruiter or reviewer gets an isolated deck that does not interfere with other visitors.
- **Zero-Leakage Privacy Promise:** The server-side projection whitelist (`toPublicProfile`) and atomic mutual match evaluator (`isMutualMatch`) run strictly on the serverless backend. `hasLikedCurrentUser` is strictly stripped and never sent across the wire.
- **100% Test & Local Compatibility:** In test mode (`NODE_ENV=test`), the system automatically routes to Prisma SQLite so all existing automated integration tests continue to run and pass.

---

## 🛠️ 3. Detailed Summary of Changes Made

| File | Changes Made | Purpose |
|---|---|---|
| `package.json` | Added `"postinstall": "prisma generate"` and updated `"build": "prisma generate && next build"` | Ensures `@prisma/client` types and query engines are automatically generated during Vercel deployment and local builds. |
| `src/lib/static-store.ts` | **New File:** Created static dataset loader, ID swap algorithm, cookie session manager (`coy_session`), and `isStaticMode()` environment detector. | Provides a high-performance, stateless data provider for Vercel without external database dependencies. |
| `src/lib/profiles.ts` | Updated `toPublicProfile` to accept `interests: string \| string[]` via `BaseProfileInput` interface. | Prevents TypeScript type conflicts when projecting either stringified Prisma interests or native static profile arrays. |
| `src/app/api/feed/route.ts` | Added static mode branch and graceful Prisma error fallback; added TypeScript function overloads. | Delivers unswiped profiles filtered by user session without exposing private fields; satisfies Next.js route type constraints. |
| `src/app/api/swipe/route.ts` | Added static mode swipe recording, duplicate check (409 Conflict), server-side match evaluation, and session cookie persistence. | Handles swipe actions (`LIKE` / `PASS`) with atomic match evaluation and zero privacy leakage on serverless. |
| `src/app/api/matches/route.ts` | Added static matches reader with descending chronological ordering (`matchedAt desc`). | Returns mutual matches with public projection and matched timestamps. |
| `src/app/api/reset/route.ts` | Added static session reset logic (`clearSession`) and enabled demo resets for Vercel reviewers. | Enables reviewers and interviewers to reset their swipe deck anytime using the UI's "Reset Demo Deck" button. |
| `.env.example` | Documented `DATABASE_URL`, `ENABLE_DEMO_RESET`, and `USE_STATIC_DATA`. | Clarifies environment variable options for reviewers and developers. |
| `tests/static-mode.test.ts` | **New File:** Added 8 automated integration tests for static data mode. | Validates static feed ordering, match density, swipe elimination, duplicate 409 conflict, and cookie session isolation. |
| `tests/setup.ts` | Ensured `process.env.USE_STATIC_DATA` is cleaned up before each Prisma test run. | Guarantees test isolation between Prisma tests and static mode tests. |

---

## 🧪 4. Verification & Testing

Both the Prisma SQLite test suite and the new Static Data Engine test suite were rigorously verified.

### Automated Test Suite (17/17 Tests Passing):
```bash
npm test
```

Output:
```
 ✓ tests/api.test.ts (9 tests)
 ✓ tests/static-mode.test.ts (8 tests)

 Test Files  2 passed (2)
      Tests  17 passed (17)
```

**Validated Scenarios:**
1. `/api/feed` returns unswiped profiles and never leaks `hasLikedCurrentUser` or `likedUser`.
2. Swiping `PASS` or `LIKE` permanently eliminates that profile from subsequent feed queries.
3. Unilateral `LIKE` (`hasLikedCurrentUser = false`) returns `{ matched: false }` with zero matches.
4. `PASS` on a profile with `hasLikedCurrentUser = true` returns `{ matched: false }`.
5. Mutual `LIKE` (`hasLikedCurrentUser = true`) returns `{ matched: true, match: { ... } }` and appears in `/api/matches`.
6. Duplicate swipe returns `409 Conflict` (idempotency guarantee).
7. Invalid input returns `400 Bad Request`; nonexistent profile returns `404 Not Found`.
8. Zero privacy leakage: JSON response bodies never contain the strings `hasLikedCurrentUser` or `likedUser`.
9. `/api/reset` clears all swipes and restores the full 35-card deck.
10. Cookie-based session isolation allows multi-tenant stateless persistence on serverless lambdas.

### Production Build Verification:
```bash
npm run build
```

Output:
```
✔ Generated Prisma Client (v5.22.0)
✔ Compiled successfully
✔ Linting and checking validity of types
✔ Generating static pages (4/4)
✔ Collecting build traces

Route (app)                              Size     First Load JS
┌ ○ /                                    47.5 kB         135 kB
├ ○ /_not-found                          873 B            88 kB
├ ƒ /api/feed                            0 B                0 B
├ ƒ /api/matches                         0 B                0 B
├ ƒ /api/reset                           0 B                0 B
└ ƒ /api/swipe                           0 B                0 B
```
The build exits cleanly with code `0`.

---

## 🚀 5. How to Deploy to Vercel (Step-by-Step)

### Option A: Via GitHub (Recommended)

1. **Commit and Push Changes:**
   ```bash
   git add .
   git commit -m "feat: make fully deployable on Vercel with static data architecture"
   git push origin main
   ```

2. **Import into Vercel:**
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **"Add New..."** → **"Project"**.
   - Select your GitHub repository (`Assignment`).
   - Framework Preset will be automatically detected as **Next.js**.

3. **Deploy (Zero Config):**
   - **Environment Variables:** None required! The app automatically detects the Vercel serverless environment and enables the static data engine.
   - Click **"Deploy"**.
   - Deployment completes in ~45 seconds.

---

### Option B: Via Vercel CLI

1. **Install Vercel CLI (if not installed):**
   ```bash
   npm i -g vercel
   ```

2. **Deploy directly from the terminal:**
   ```bash
   vercel
   ```
   Follow the prompts (accept default settings).

3. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

---

## 🎯 6. Post-Deployment Verification Checklist

Once deployed, visit your live Vercel URL and verify:
- [x] **Discover Tab:** 35 profiles load with DiceBear avatars, tags, and neo-brutalist styling.
- [x] **Gesture Physics:** Cards can be dragged left/right with dynamic dynamic tilt (`-18°` to `+18°`) and "LIKE ♥" / "PASS ✕" stamps.
- [x] **Instant Mutual Match:** Swiping right on cards in the first 4 (e.g., Ananya or Arjun) immediately triggers the hot pink **"It's a Match!"** modal overlay.
- [x] **Matches Tab:** Shows the mutual match with the green WhatsApp connect CTA.
- [x] **Page Refresh:** Swipes and matches persist in your browser session via the `coy_session` cookie.
- [x] **Reset Deck:** Clicking the **"Reset Demo Deck"** button restores all 35 cards and clears matches.
- [x] **Privacy:** Open browser DevTools Network tab — inspect `/api/feed` and `/api/swipe` to confirm `hasLikedCurrentUser` is never leaked.

