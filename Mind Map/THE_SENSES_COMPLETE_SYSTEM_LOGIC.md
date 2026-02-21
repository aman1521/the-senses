# The Senses — Complete System Logic (Full Feature Map)

*Updated: February 2026 | Source: Live Codebase Audit*

---

## 1. Authentication & Identity

### Standard Auth

- Email/Password login & registration
- JWT access + refresh token flow
- Role-based access control (User / Company / Admin)
- Password reset via email token
- Session invalidation on logout

### SSO (Single Sign-On)

- Google OAuth integration
- GitHub OAuth integration
- Microsoft OAuth integration
- SSO token exchange & profile sync
- Company-managed SSO domains

### Security

- Rate limiting per IP
- Idempotency guard (prevents duplicate submissions)
- CSRF protection
- Request payload validation

---

## 2. User Profile System

### Profile Data

- Username, bio, avatar, cover image
- Skills list (free-form)
- Profession / domain
- Privacy settings (public / connections / private)
- Hiring visibility toggle
- Video Intro (30s video upload with status: processing/ready/failed)

### Cognitive Identity

- Global Thinking Score (weighted avg of last 10 tests)
- Thinking Metrics:
  - Problem Solving
  - Analytical Thinking
  - Creativity Score
  - Logical Reasoning
  - Critical Thinking
  - Pattern Recognition
- Integrity Score (anti-cheat aggregate)

### Achievement System

- 🎯 First Steps (1 test completed)
- ⭐ Veteran Thinker (10 tests completed)
- 🏆 High Achiever (800+ signal score)
- ✅ Verified Thinker (5 high-integrity tests)
- Rank Milestones: Top 10,000 → Top 100 → Elite 50 → Top 10

### Public Profile

- Shareable URL: `senses.ai/@username`
- OG image / share card generation
- Trust badge display
- Tier badge system (Elite / High / Mid / Low)

---

## 3. Assessment Engine

### Session Initialization

- Previous history fetched
- Cognitive profile baseline set
- Difficulty calibrated from history
- Repetition guards activated
- Anti-cheat environment initialized

### Question Selection Logic

1. **Cache Layer** → Pull generic pool, filter by user memory, reject seen items
2. **Database Layer** → Query by profile & difficulty, exclude attempted history
3. **AI Generation Layer** → Trigger if pool insufficient; rotate cognitive types; generate fresh questions; attach metadata; block recent intents

### Question Delivery

- Question sent to frontend
- Expected time window recorded
- Anti-cheat hooks attached (tab-switch listener, gaze tracking)

### User Response Processing

- Answer submitted
- Timing captured (ms precision)
- Reasoning text captured (optional)
- Context snapshot taken

### Evaluation Logic

- **Accuracy Check** → Correctness measured, partial credit applied
- **Reasoning Analysis** → Structure analyzed, pattern reuse detected
- **Behavioral Analysis** → Latency evaluated, consistency compared, context shifts detected

---

## 4. Anti-Cheat & Integrity System

### Signal Collection (Vision Agent)

- Gaze direction tracking (webcam)
- Tab switch / focus loss events
- Copy-paste detection
- Keyboard pattern anomalies
- Device fingerprinting
- Time-pressure behavior analysis

### Integrity Event Logging (`IntegrityEvent` model)

- Event type classification
- Severity rating (low / medium / high)
- Session timestamp
- Aggregated per session

### Risk Scoring

- Weak signals combined (no single binary decision)
- Risk score computed per session
- Penalty applied proportionally
- Integrity modifier applied to final score

### Telemetry

- Real-time telemetry logging (`TelemetryLog` model)
- Behavioral telemetry streamed via WebSocket
- Used for ML training and audit logs

---

## 5. Scoring & Ranking

### Score Calculation

- Base score: accuracy × speed × difficulty
- Integrity modifier: reduces score proportionally to risk
- Consistency modifier: rewards stable performance
- Final Signal Score produced

### Ranking Engine (`rankEngine.js`)

- Global rank assigned
- Percentile calculated
- Tier assigned (Elite / High / Mid / Low)
- Elo-style rating for duels
- Badges awarded automatically

### Leaderboard

- Global leaderboard (paginated)
- Filter by: profession, country, score range, time period
- Company-scoped leaderboard
- Team leaderboard

---

## 6. AI Battle & Duel System

### Matchmaking

- Match users by Elo rating
- Real-time opponent search
- AI Bot opponents (from `AIProfile` model)
- Duel room creation (`Duel` model)

### Duel Flow

- Both participants receive same question set
- Real-time scoring (parallel)
- Pressure behavior captured
- Winner determined by score + speed

### Outcome Processing

- Elo rating updated for both players
- Victory/Defeat result stored
- Duel history added to profile
- Rank recalculated

---

## 7. Social Layer

### Post System

- Create standalone posts (10–5000 chars)
- 7 content categories
- Tags support
- Visibility: public / connections / private
- Anti-spam: 10 posts/hour limit
- Post impressions tracked (`PostImpression`)
- Post saves (`PostSave`)
- Post likes (`PostLike`)

### Thinking Bubbles (Discussion Trees)

- Bubble root post created
- Topic label (5–200 chars)
- `BubbleNode` tree structure
- Participants list tracked
- Trending score computed
- Anti-spam: 5 bubbles/day limit

### Sharing

- Share with optional note
- New share post linked to original
- Share count incremented on original
- Sharer added to `sharedBy` array

### Engagement

- Like/Unlike (likedBy array + count)
- View/impression auto-increment
- Comment system (`Comment` + `CommentLike` models)
- Save posts for later

### Trending Algorithm

- Age decay factor (7-day window)
- Engagement score: Views×0.1 + Likes×2 + Comments×5 + Shares×10
- Activity score: Participants×3 + Posts×2
- Combined trending score stored per bubble

### Feed Generation

- Query public posts, sorted by recency
- Category & tag filters
- Paginated (20 per page)
- `isLiked` flag injected per user
- Shared/quoted posts populated

---

## 8. Messaging & Chat

### Direct Messages

- `Conversation` model (two participants)
- `Message` model with read receipts
- WebSocket real-time delivery
- Message history paginated

### Chat Rooms (Group)

- `Room` model
- Room creation & management
- Multi-user messaging

---

## 9. Notifications System

### Notification Types (`Notification` model)

- Rank updates
- Duel challenges/results
- Social interactions (likes, comments, shares)
- Company invitations
- Achievement unlocks
- Market updates

### Delivery Channels

- In-app notification bell
- Push Notifications (`PushToken` model)
  - Expo push token storage (mobile)
  - FCM/APNs delivery (pending full config)

---

## 10. Team System

### Team Management (`Team` model)

- Create / manage teams
- Team invite flow (`TeamInvite` model)
- Invite status: pending / accepted / rejected
- Member roles: owner / admin / member

### Team Analytics

- Team average score
- Top performer identification
- Team leaderboard position
- Department-level scoring

---

## 11. Organization System (`Organization` model)

- Org creation & slug generation
- Multi-company org structure
- Member management
- Role hierarchy (owner → admin → member)
- SSO domain binding
- Org-level analytics

---

## 12. Company & Recruiter System

### Company Profile (`CompanyProfile` model)

- Company bio, logo, industry
- Cognitive index (avg of employee scores)
- Job board
- Recruiter list

### Talent Search

- Filter by profession, rank, score threshold, percentile
- Public profiles only (privacy respected)
- Candidate deep profile view

### Candidate Engagement

- Recruiter invites candidate
- Invitation status tracked
- Notes & follow-up scheduling
- Employee analytics dashboard:
  - Team avg score
  - Skill heatmap
  - Department scores
  - Company cognitive index

### Company Reputation (`CompanyReputation` model)

- Review & rating system
- Transparency score for companies

---

## 13. Payment & Membership (Stripe)

### Payment Flow

- Stripe Checkout session creation
- Webhook handling (payment success / failure)
- Membership tiers stored on `User` model
- Certified Reports purchase

### Premium Features (unlocked via payment)

- PDF score certificate download
- Advanced analytics access
- Priority recruiter visibility
- Extended history

---

## 14. Score Sharing & Virality

### Share Card Generation

- Result saved with `sessionId`
- Share slug: `result-{sessionId}`
- OG image dynamically generated
- Share URL: `{origin}/share/{slug}`

### Share Card Data

- Final score, global rank, percentile
- Archetype/tier label
- Integrity score
- Visual branding with Flex Tier

### Social Platform Sharing

- **Twitter/X** → Pre-filled tweet with score + challenge message
- **Direct link** → Copyable share URL
- **Download** → Share card image download

---

## 15. Mobile App (Expo / React Native)

### Setup

- Expo environment configured
- Monorepo with `@thesenses/core` shared package
- React Navigation stack

### Features

- Mobile login / auth flow
- Mobile-optimized test interface
- Camera permissions (proctoring)
- Optimized timers
- Push notification integration (via `PushToken`)

### Pending

- Full test flow parity with web
- Mobile-specific push notification triggers

---

## 16. AI Intelligence Agents

| Agent | Purpose |
|---|---|
| `audio/` | Audio analysis & MIME validation |
| `company/` | Company intelligence & matching |
| `detection/` | Cheat detection ML |
| `duels/` | Duel matchmaking & scoring (`duelService.js`) |
| `insights/` | Behavioral insights computation |
| `llm/` | GPT/Gemini prompt routing & response parsing |
| `profile/` | Profile generation & scoring (`profileService.js`) |
| `profile-intelligence/` | Search engine, skill graph, recommendations |
| `questions/` | AI question generation |
| `ranking/` | Rank engine (`rankEngine.js`) |
| `trust/` | Integrity & trust signal aggregation |
| `virality/` | Share card generation (`shareCardGenerator.js`) |
| `vision/` | Computer vision proctoring (`integrityAnalyst.js`) |

---

## 17. Market Updates

- `MarketUpdate` model
- Market news / signals feed
- Admin posts updates
- Users receive in notification feed

---

## 18. Game Sessions

- `GameSession` model (extended test/duel session)
- Weekly Challenges (`WeeklyChallenge` model)
- Game-style scoring mechanics
- XP and streak tracking

---

## 19. Adaptive Coaching Engine

- **Micro-Gap Analysis** → Detect pattern failure, analyze cognitive load spikes, identify weak domains
- **Intervention Logic** → Prescribe drills, adjust difficulty curve, recommend learning paths

---

## 20. Data Flow Summary

```
Auth → Profile Load → Session Init
  → Question Select (Cache → DB → AI Gen)
    → Deliver → Response → Evaluate
      → Anti-Cheat Score → Integrity Update
        → Signal Score → Rank → Badge Check
          → Result Display → Share Card → Social Post
            → Feed → Comments → Trending
              → Recruiter Discovery → Invite
                → Payment (if premium) → Certificate
```

---

## 21. Pending Features (Critical Path)

| Feature | Status |
|---|---|
| Comments Threaded UI | Backend model exists, frontend pending |
| Global Search (User/Post) | Search engine exists (`search.engine.js`), UI pending |
| Media Upload (Direct) | URL-only currently, direct upload pending |
| Real-time Notifications (Push) | Backend partial, FCM config pending |
| Mobile App Full Parity | Test UI in progress |

---

## 22. Key System Principles

1. **No Absolute Trust** — All signals weighted, none binary
2. **Continuous Calibration** — System learns from every interaction
3. **Transparency** — Explainability built into every score
4. **Privacy-First** — User controls what's shared publicly
5. **Community-Driven** — Social features amplify engagement
6. **Merit-Based** — Performance determines rank, not gaming
7. **Growth-Oriented** — System encourages improvement
8. **Recruiter-Friendly** — Easy talent discovery
9. **Share-Worthy** — Built-in viral mechanics
10. **Anti-Cheat Resilient** — 13 independent AI agent layers
