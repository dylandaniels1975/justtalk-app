# Just Talk - Anonymous Conversation Platform PRD

## Original Problem Statement
Build the entire "Just Talk" anonymous conversation platform as described in the JustTalk V3 PDF. Full-stack app with auth, onboarding, queue/matching, real-time chat, AI personas, Polaroids, friends/DM, badges, profile, settings.

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion
- **AI**: OpenAI via Emergent LLM key (gpt-4o-mini for AI personas)
- **Auth**: JWT with httpOnly cookies + localStorage bearer token
- **Real-time**: HTTP polling (1.5s intervals for chat, 2s for queue)

## User Personas
1. **Anonymous User** - Wants genuine text-based conversations without social media pressure
2. **VIP User** - Wants unlimited conversations and premium features
3. **AI Explorer** - Wants to interact with AI personas (Justin/Justine/Justice)

## Core Requirements
- Anonymous matching based on shared interests
- 20 free conversations/day (unlimited for VIP)
- AI personas fill empty queue slots
- Polaroid captures = proof of good conversation
- Country flags as subtle identity
- Badges/achievements system

## What's Been Implemented (April 9, 2026)
### Backend
- Auth (register, login, logout, refresh, me)
- Onboarding (gender, interests, country, username)
- Queue/Matching with interest-based matching
- AI conversations (Justin/Justine/Justice) via OpenAI
- Real-time messages with HTTP polling
- Polaroid CRUD (create, list, pin, delete)
- Friends (request, accept, reject, list, remove)
- DM threads & messages
- Badges (22 badges across 5 types: polaroid, conversation, friend, special)
- User profiles & statistics
- Settings (notifications, sound, quiet hours)
- Seed data (50 countries, 134 interests, 22 badges)

### Frontend
- Landing page with brutalist dark design
- Auth page (sign in / sign up)
- Onboarding flow (4 steps: gender, interests, country, username)
- Home page with queue, AI persona selection
- Chat page with real-time polling
- Conversation end screen with friend request + polaroid capture
- Profile page with stats, interests, badges, polaroid grid
- Friends page (friends list + pending requests)
- DM list + DM thread pages
- Badges collection page
- Settings page (profile edit, notifications, sound, quiet hours, logout)
- Bottom navigation (Home, Friends, DM, Profile, Settings)

## Prioritized Backlog
### P0 (Critical)
- All core flows implemented ✅

### P1 (Important)
- WebSocket for real-time chat (currently polling)
- Stripe integration for VIP subscriptions
- Media messages (images/video for VIP)
- Report user functionality
- Hide user functionality

### P2 (Nice to have)
- Push notifications (Firebase)
- Social platform connections (Instagram, Twitter, etc.)
- TikTok ambassador program
- User search
- Trending interests
- Mobile-responsive improvements

## Next Tasks
1. Integrate Stripe for VIP subscriptions
2. Add WebSocket support for real-time chat
3. Implement report/hide user functionality
4. Add push notifications
5. Social platform connections for badge earning
