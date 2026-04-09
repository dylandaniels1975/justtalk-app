# Just Talk - Anonymous Conversation Platform PRD

## Original Problem Statement
Build the entire "Just Talk" anonymous conversation platform as specified in JustTalk V3 PDF/DOCX.

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion + Phosphor Icons
- **AI**: OpenAI via Emergent LLM key (gpt-4o-mini for AI personas)
- **Payments**: Stripe via emergentintegrations (test key)
- **Auth**: JWT with httpOnly cookies + localStorage bearer token
- **Real-time**: HTTP polling (1.5s chat, 2s queue)

## What's Been Implemented

### Iteration 1 (April 9, 2026)
- Full auth flow (register/login/logout/refresh)
- 4-step onboarding (gender, interests, country, username)
- Queue/matching with interest-based matching
- AI personas (Justin/Justine/Justice) via OpenAI
- Real-time chat with HTTP polling
- Polaroid CRUD
- Friends system & DM
- 22 badges, 134 interests, 50 countries
- Profile, Settings, Navigation

### Iteration 2 (April 9, 2026)
- Clickable polaroids with full conversation replay modal
- 1 polaroid per AI persona limit enforcement
- Badges page with progress bars and threshold tracking
- SVG silhouette avatars (golden ratio) for AI personas
- Expanded to 200 interests (full spec)
- Expanded to 43 badges (full spec including social & special)
- Stripe VIP subscription ($9.99/month) with checkout flow
- Ad reward system (watch ad -> +5 conversations)
- Report user functionality (4 categories)
- Hide user functionality (won't match again)
- Social platform connections (8 platforms) with badge unlocking
- "Fully Doxxed" badge for connecting all 8 platforms

## Prioritized Backlog
### P1
- WebSocket for true real-time chat
- Push notifications (Firebase)
- TikTok ambassador program
- User search/discovery
- Media messages (images for VIP)

### P2
- Data export (GDPR)
- Account deletion
- Trending interests algorithm
- User links management
- Promotion claims system
