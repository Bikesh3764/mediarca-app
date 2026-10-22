# ADR 005: Direct Connection to Live Render Production Backend

## Status
Accepted

## Context
MediArca has an active production backend deployed on Render (`https://mediarca-mdwk.onrender.com/api`) connected to a live Supabase PostgreSQL database in Mumbai. Creating a separate mobile backend or maintaining local mock servers would introduce synchronization lag, schema drift, and maintenance burdens.

## Decision
1. Wire the mobile application directly to `https://mediarca-mdwk.onrender.com/api` through `src/constants/config.ts` and `src/services/api.ts`.
2. Map Cloudflare R2 bucket URLs directly via `getFileUrl()` to resolve clinic logos and doctor avatars from `https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev`.
3. Provide live warmup health pings (`/healthz` and `/api/health`) in `src/app/index.tsx` to handle Render free-tier idle spin-up seamlessly.

## Consequences
- Single unified backend and database supporting both web and mobile platforms with zero code divergence.
- Instant access to live doctor profiles, verified clinics, and real-time queues.
