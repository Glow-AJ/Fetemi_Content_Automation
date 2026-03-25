# Fetemi Content Automation — Agent Instructions

## What this product is
An end-to-end content creation and publishing automation for a marketing agency.
Content managers submit a raw idea or a URL. The system researches SEO keywords,
generates 3 article drafts, the manager selects one, and the system adapts it for
LinkedIn, X (Twitter), and email newsletter, then publishes or schedules it.

## Stack
- Frontend: Next.js 16 (App Router, Turbopack)
- Styling: Tailwind CSS v4 + CSS custom properties (design tokens)
- Database + Auth: Supabase (Postgres, Auth via @supabase/ssr, Realtime)
- Automation: n8n Cloud
- AI: OpenAI GPT-4o via n8n AI nodes
- Scraping regular URLs: Firecrawl (primary), n8n HTTP + HTML node (fallback)
- Scraping social URLs: Apify (primary), ScrapeCreators (fallback)
- SEO research: DataForSEO API via n8n HTTP Request nodes
- Icons: Lucide React (SVG, no emojis)
- Font: Inter (Google Fonts, weights 300–800)

## How the system works
Six phases triggered sequentially. Each phase writes its output and status 
to Supabase. The frontend reads from Supabase directly and uses Supabase 
Realtime for live status updates — no polling.

1. Input intake — manager submits idea or URL via frontend
2. SEO research — DataForSEO keyword data + competitor article scraping
3. Draft generation — 3 parallel article drafts via OpenAI
4. Human review — manager selects one draft in the frontend
5. Platform adaptation — LinkedIn, X, email versions generated
6. Publish or schedule — immediate publish or queued with timestamp

Frontend → n8n communication happens via webhooks only.

All n8n webhook URLs are stored as environment variables. 
The .env.local file is structured with placeholder values. 
Real URLs are provided when n8n workflows are built.

Use the Supabase node in n8n, not the raw Postgres node.

## URL handling
Classify every submitted URL before processing:
- Social URLs (ONLY linkedin.com, twitter.com, x.com) → ScrapeCreators API (Primary) → Apify (Fallback)
- Known paywall domains → attempt Firecrawl → if content under 300 words,
  surface error: ask manager to paste text directly
- All other Standard URLs → n8n HTTP Request node (Primary, generic credential with header auth, convert response to Markdown) → Firecrawl (Fallback).
  _Note: Handle Firecrawl edge cases seamlessly without silent failures. If Firecrawl fallback fails, raise a visible error._

## Content Generation & SEO Rules
1. **SEO Best Practices**:
   - **Keywords**: Primary keyword in title and first 100 words. Extract long/short-tail keywords from top-performing competitor articles and integrate them into headers and body.
   - **Structure**: One H1 → H2s → H3s. 700-800 words per main section. Short paragraphs (2-3 sentences).
   - **Enrichment**: 2-3 contextual links (internal/external). Readability at Grade 7 level. Include 1 relevant image.
2. **Platform Formatting Checklists**:
   - **LinkedIn**: PAS framework (Problem-Agitate-Solution). Short paragraphs (2-3 lines). Bullets/symbols (✅ •). 3-5 relevant emojis max. Clear CTA. Relevant image/carousel.
   - **X (Twitter)**: Lead with benefit/insight. One core idea per tweet. Optional line breaks. 1-2 relevant hashtags. Tag only for value.
   - **Email Newsletter**: Strong subject line. Short intro (1-3 sentences). Skimmable main value (subheads/bullets). Secondary item (optional). Clear CTA. Friendly sign-off. Tone: "writing to a smart, busy friend". Length: 250-600 words.

## Non-negotiables
- No API keys or secrets in code. Environment variables only.
- Supabase RLS enabled on every table, no exceptions.
- Every job has a status field. Status only moves forward, never backward.
  A published job cannot go back to drafting. Ever.
- Every async UI action has three states: loading, error, success.
- Before any n8n workflow step runs, check the job status in Supabase first.
  If the status does not match what is expected, stop the workflow. 
  Do not process the same job step twice.
- Every n8n node that calls an external API has error handling on it.
- On any failure, write a plain-English error message to Supabase and surface 
  it in the UI. Never fail silently. Never show raw errors to the manager.
- Deduplicate at intake: check if a job with the same URL or idea hash was 
  created in the last 7 days. If yes, warn the manager before proceeding.

## Error message standard
Every error shown to the manager must answer three things:
1. What happened (plain English)
2. Why it likely happened
3. What they can do next (retry, edit input, contact support)
Raw errors go to a separate Supabase column for debugging only.

## Production robustness rules
- All workflows must be safe to run multiple times without corrupting data
- Handle missing or incomplete data explicitly — never assume clean input
- Unexpected URL formats, empty API responses, and timeouts must all be 
  caught and handled, not ignored
- Rate limit all parallel AI calls — add delays if on limited OpenAI tier


## How to work
- Complete one concern fully before moving to the next
- After each session, commit all work and push to GitHub anytime you have made changes. Update this file with what was 
  built and any decisions made
- Make implementation decisions autonomously — you are the expert
- Ask only when a requirement is genuinely ambiguous
- When you discover API constraints, edge cases, or better approaches, 
  update this file

---

## Implementation Log

### Design System (Professional SaaS — Clean, Minimal, Flat)
- **Palette**: Warm stone (`#FAFAF9` bg, `#FFFFFF` cards, `#1C1917` text, `#F97316` accent)
- **Font**: Inter 300–800 via Google Fonts
- **Style**: Flat design, subtle borders (`#E7E5E4`), minimal shadows, 200ms transitions
- **Icons**: Lucide React (SVG only, no emojis as icons)
- **Layout**: Sidebar (240px) + Navbar (64px) + scrollable content area
- **Anti-patterns avoided**: No glassmorphism, no dark mode, no emoji icons, no layout-shifting hovers

### Core Architecture
- **Next.js 16 (App Router)**: Route groups `(auth)` and `(app)` with shared layout.
- **Supabase SSR**: `@supabase/ssr` for client (`createBrowserClient`), server (`createServerClient`), and middleware (`getUser()` — not deprecated `getSession()`).
- **Auth Flow**: `signInWithPassword` → explicit `router.push('/dashboard')` + `router.refresh()`. Middleware guards all `(app)` routes and redirects unauthenticated users to `/login`.

### Pages (All Functional)
- **Login**: Clean centered card, email+password, error handling, 15s timeout safety.
- **Dashboard**: Alert banner, 4 stats cards, recent projects list with status badges, quick action CTA.
- **New Content**: Idea/URL toggle with real-time URL classification (social/paywall/standard).
- **Projects Archive**: Filterable/searchable table with status badges, platform success indicators, pagination.
- **Project Detail**: Status timeline, 3 draft cards with SEO scores, platform preview tabs.
- **Settings**: Profile (name, password), Team (members table, invite), Platforms (connection status, API key warnings).
- **Forgot Password** / **Set Password**: Clean forms with success states.

### Reusable Components
- `Button` (5 variants, 3 sizes, loading state)
- `Input` (label, icon, error, helper text)
- `Card` (3 variants, hover effect)
- `Sidebar`, `Navbar`, `DraftCard`, `IntakeForm`, `StatusStepper`
- `ProfileTab`, `TeamTab`, `PlatformsTab`

### Supabase Schema (Deployed)
Tables: `jobs`, `drafts`, `platform_posts`, `notifications`, `profiles`, `platform_connections`
All with RLS enabled. Realtime replication enabled.

### Environment Requirements
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (admin operations only, never exposed to client)
- `NEXT_PUBLIC_N8N_WEBHOOK_INTAKE`
- `NEXT_PUBLIC_N8N_WEBHOOK_SELECT_DRAFT`
- `NEXT_PUBLIC_N8N_WEBHOOK_PUBLISH`
- `NEXT_PUBLIC_N8N_WEBHOOK_SCHEDULE`

### Next Steps
1. **n8n Workflow Development**: Build the 6 core workflows (Intake, SEO, Drafting, Adaptation, Publishing, Schedule Cron).
2. **Wire Frontend to Webhooks**: Replace mock submission with real n8n webhook calls.
3. **Supabase Realtime**: Connect dashboard stats and project detail to live Supabase queries.
4. **Platform API Integration**: Connect LinkedIn, X, and email APIs for actual publishing.