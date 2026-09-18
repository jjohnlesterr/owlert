# PLAN.md — Owlert Implementation Plan

Owlert is a mobile-first weather & class-alert PWA (Next.js App Router + TypeScript + Tailwind + Supabase). This plan sequences the MVP into demoable phases. **Non-negotiable rule across every phase:** no weather alert or class-suspension status is ever shown unless it traces back to a real, stored `source_updates` row with an `original_url`. AI classifies/summarizes/extracts — it is never the source of truth.

Current repo state (as of writing): fresh `create-next-app` scaffold (Next.js 16.3.5, App Router, TS, Tailwind v4), not yet a git repo, no Supabase project wired up, no PWA config, no mascot assets in `public/`.

---

## MVP-First Checklist

The smallest set of things that must be true for a legitimate demo:

- [ ] Sign up / login / logout works via Supabase Auth
- [ ] Profile create/edit (name, school, city, province, education level, notification prefs)
- [ ] Dashboard renders: banner, weather overview, class status card, active warning card, latest updates, source preview
- [ ] Weather overview shows real data (temperature, condition, rain %, wind, active warnings) from a real API
- [ ] At least 2–3 built-in trusted sources seeded with real URLs (PAGASA + one LGU/school + one news outlet)
- [ ] Monitoring pipeline runs for at least one built-in source and produces real `source_updates` rows (not mocked)
- [ ] Updates page lists real updates with All/Weather/Classes/School filters and "View Source"
- [ ] Sources page lists built-in + custom sources with monitoring/notification toggles and last-checked time
- [ ] Add Source flow validates a pasted URL and returns supported/limited/unsupported
- [ ] Notifications: in-app minimum viable (push is a stretch goal, not required to demo)
- [ ] App is installable (manifest + icons); service worker present even if minimal
- [ ] RLS enabled and tested on every table before demo

If time runs out, cut in this order (last cut first, protect the top): Web Push → offline caching → multiple custom sources → partial/online class states → source status "limited" nuance → filter chips polish.

---

## Phase 0 — Project Foundation & Environment Setup

**Goal:** repo, tooling, and external accounts ready so every later phase is unblocked.

Tasks:
- `git init`, initial commit of the scaffold as-is
- Create Supabase project; capture `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (never commit — already gitignored)
- Install core deps: `@supabase/supabase-js`, `@supabase/ssr`, a weather API client (or plain `fetch`), an HTML parsing/readability library, an RSS parser, `web-push`
- Pick and register a weather data API (e.g. OpenWeatherMap or similar free-tier API) — PAGASA has no public JSON API, so it is treated as a **monitored source for advisories/class-suspension text**, not as the numeric weather API
- Add `owlert-default` and `owlert-banner` assets to `public/`
- Set up base Tailwind theme tokens (navy/blue/teal/white + green/yellow/red status colors)
- Read `node_modules/next/dist/docs/01-app` for any App Router conventions that differ from training data before writing routes

Acceptance criteria:
- `npm run dev` runs clean, app loads at `/`
- Supabase project reachable from a throwaway server-side test query
- `.env.local` present locally, confirmed absent from `git status`
- Mascot assets render in a scratch page

---

## Phase 1 — Supabase Schema, RLS & Auth

**Goal:** every table exists with RLS locked down, and a user can sign up/login/logout against real Supabase Auth.

Tasks:
- Create all tables (see **Supabase Schema Planning** below) via SQL migration files (`supabase/migrations/`)
- Enable RLS on every table; write policies per table (see schema section)
- Seed `sources` with 2–4 real built-in sources (PAGASA advisories page, one DepEd/school announcement page, one LGU page, one news outlet)
- Build `/login`, `/signup` pages using Supabase Auth (email/password is enough for MVP)
- Wire Supabase client: browser client (anon key) for client components, server client (via `@supabase/ssr`) for Route Handlers/Server Components, service-role client only inside server-only monitoring code
- On signup, auto-create a `profiles` row (DB trigger or app-level insert) keyed to `auth.users.id`
- Basic logout action clearing the session

Acceptance criteria:
- New user can sign up, gets a `profiles` row, can log out and back in
- A logged-in user querying `profiles`/`user_sources` only ever sees their own rows (verify by attempting a cross-user read with a second test account and confirming it returns nothing)
- `sources` table is readable by any authenticated user but not writable by anon/authenticated role except through the defined custom-source insert policy
- Service role key never appears in any client bundle (verify via browser devtools/network tab)

---

## Phase 2 — App Shell, Navigation & Profile

**Goal:** the four-tab app shell exists and Profile is fully functional, so every later phase has a place to render into.

Tasks:
- Root layout with mobile-first shell, bottom/top nav: Home, Updates, Sources, Profile
- PWA-aware viewport/meta tags (safe-area, theme-color) — full manifest lands in Phase 6, but base meta goes in now
- Profile page: view/edit name, school, city, province, education level, notification preferences (form → Supabase update, RLS-protected)
- Empty/onboarding states use `owlert-default`
- Auth guard: unauthenticated users redirected to `/login`

Acceptance criteria:
- All 4 nav destinations reachable and render without crashing on a fresh account
- Profile edits persist and reload correctly after refresh
- Layout usable at 375px width with no horizontal scroll

---

## Phase 3 — Weather Integration & Dashboard

**Goal:** Dashboard shows real weather data plus real (if still empty) class status/updates sections in the correct layout order.

Tasks:
- Server-side route/handler that calls the chosen weather API server-side (hide API key), returns normalized `{ temp, condition, rainChance, wind, warnings[] }` for the user's profile city/province
- Weather overview card: temperature, condition, rain probability, wind, active warnings
- Class status card: reads latest relevant `class_status`/`source_updates` row for the user's school/location scope; renders explicit **"no announcement"** state when nothing exists — never derived from weather
- Active warning card: surfaces PAGASA-sourced advisory rows once Phase 5 monitoring produces them (build the component now against real schema, backed by empty state until then)
- Latest updates list (top N `source_updates`, any type) and source preview (top monitored sources) on Dashboard, per layout order in the brief
- `owlert-banner` hero

Acceptance criteria:
- Dashboard reflects real weather for the profile's city (change profile city → weather changes)
- With zero `source_updates` rows, class status and warning cards show honest empty states, not placeholders styled as real alerts
- Page order matches: header → greeting → banner → class status → weather overview → warnings → latest updates → source preview

---

## Phase 4 — Sources Page & Add Source Flow (validation only)

**Goal:** users can view built-in sources, add a custom URL, and get an honest supported/limited/unsupported verdict — without yet running full recurring monitoring (that's Phase 5).

Tasks:
- Sources page: "My Sources" (from `user_sources` join), built-in sources list, status badges, monitoring/notification toggles, last-checked timestamp
- Add Source UI: URL input → "Check Source" → loading state → result (supported/limited/unsupported) → "Add Source" (only enabled once checked)
- Server-side URL validation + reachability check endpoint (see **Security Considerations** — this is where SSRF protection lands)
- Classification logic for supported/limited/unsupported:
  - **supported**: real RSS/Atom feed or known API found
  - **limited**: HTML page reachable and readable-content-extractable, no structured feed
  - **unsupported**: unreachable, non-HTML, blocked by robots/paywall, or content too sparse to extract
- On "Add Source": upsert into `sources` (type=custom, `created_by`=current user) + insert `user_sources` row

Acceptance criteria:
- Pasting a known-good RSS URL returns "supported" within a few seconds
- Pasting an internal/loopback/link-local URL (e.g. `http://127.0.0.1`, `http://169.254.169.254`) is rejected with a clear error, never fetched
- Toggling monitoring/notifications on a source persists and reflects on reload
- A second user cannot see or modify another user's custom source's `user_sources` row

---

## Phase 5 — Source Monitoring Engine & Class Status

**Goal:** the actual fetch → parse → filter → extract → dedupe → store pipeline runs (manually triggerable for demo reliability; scheduled if time allows), producing real `source_updates` rows including class-status detection.

Tasks:
- Shared fetch/parse module reused from Phase 4's checker: priority order **official API → RSS/feed → readable webpage extraction → generic custom URL monitoring**
- Weather-relevance filter: keyword/category match against the provided list (weather, rainfall, thunderstorm, tropical cyclone, typhoon, habagat, flood, warning, advisory, class suspension, walang pasok, etc.) — non-matching content is discarded before it ever reaches extraction or storage
- Structured extraction step (rule-based first; LLM-assisted via `claude-api` skill guidance for summary/category only) producing: `relevant`, `category`, `title`, `summary`, `location`, `severity`, `class_status`, `published_at`, `original_url`
- **Class status extraction is keyword/announcement-driven only** (e.g. explicit "suspended", "walang pasok", "online classes" language from the source) — if the source doesn't explicitly say so, `class_status` stays null/"no announcement", full stop, regardless of weather severity
- Content hashing: normalize extracted text, hash it, uniqueness enforced per `(source_id, content_hash)` to prevent duplicate `source_updates`/duplicate notifications
- On new row insert: fan out `notifications` rows to users with `user_sources.notifications_enabled = true` for that source
- Trigger mechanism: an on-demand "Refresh" action (Route Handler) calling the pipeline for due sources (`last_checked_at` older than interval) — real scheduling (Vercel Cron hitting the same handler, or Supabase `pg_cron` + Edge Function) added if time allows, but manual trigger must work for the demo regardless
- Update `sources.status` and `user_sources.last_checked_at` after each run; track consecutive failures to auto-flag `unsupported`

Acceptance criteria:
- Running the pipeline against a real seeded source produces at least one real `source_updates` row with a working `original_url`
- Running it a second time with unchanged content produces **zero** new rows (dedupe verified)
- A source's `class_status` is never populated unless the underlying content contains an explicit suspension/continuation statement
- A non-weather-related article from the same source does not produce a `source_updates` row
- Notification rows are created only for users who opted in on that source

---

## Phase 6 — Updates Page & In-App Notifications

**Goal:** users can browse/filter all detected updates and see notifications for new ones, even without push.

Tasks:
- Updates page: search box, filter chips (All/Weather/Classes/School), update cards (title, short summary, type, severity, source, location, published time, detected time), "View Source" linking to `original_url`
- Notification center (bell icon or dedicated section): lists `notifications` joined to `source_updates`, mark-as-read on open
- Distinguish source trust visually per card: official / news / custom badge (requirement #7)

Acceptance criteria:
- Filters correctly narrow the list; search matches title/summary
- Every card's "View Source" opens the real `original_url` in a new tab
- New `source_updates` rows created in Phase 5 appear here and generate visible in-app notifications without a page reload requirement (poll or Supabase Realtime subscription)

---

## Phase 7 — PWA & Web Push

**Goal:** installable app shell with real push notifications where supported, graceful in-app fallback everywhere else.

Tasks:
- Read the installed Next.js's own docs (`node_modules/next/dist/docs`) for the current-version-correct way to register a service worker/manifest before implementing — do not assume a training-data approach works unchanged
- `manifest.json`: name, short_name, `owlert-default` icons at required sizes, theme/background color from brand palette, `display: standalone`
- Minimal service worker: cache app shell, handle `push` and `notificationclick` events
- VAPID key pair generated, private key server-only; `push_subscriptions` table stores per-user endpoint/keys
- Client: request notification permission only after explicit user opt-in (e.g. a toggle in Profile/notification prefs), subscribe, store subscription
- Server: sending function (Route Handler or Edge Function) using `web-push`, triggered from the Phase 5 notification fan-out
- Fallback: if push subscription fails/unsupported/denied, in-app notifications from Phase 6 remain the sole delivery path — must not be treated as broken

Acceptance criteria:
- App is installable on a mobile browser (Add to Home Screen works, manifest passes basic Lighthouse PWA checks)
- A test push notification is delivered to a subscribed device when a new `source_updates` row is created
- Denying notification permission does not break any other feature; in-app notifications still populate

---

## Phase 8 — Polish, QA & Demo Prep

**Goal:** everything above holds together end-to-end on a phone-sized screen with real data.

Tasks:
- Full mobile-width pass (375px and 390px) on every page
- Verify RLS on all tables with a second test account (cross-user access denied everywhere it should be)
- Verify no fabricated data anywhere: every alert/status on screen has a working "View Source" back to a real URL
- Run `security-review` skill over the monitoring/fetch code and RLS policies
- Seed enough realistic demo content (a few real source updates, one real "no announcement" case, one real weather warning) so the demo shows the full state range, not just happy path
- Write a short demo script hitting: signup → profile → dashboard → add a custom source → see it monitored → updates page → notification

Acceptance criteria:
- Cold demo run-through (logout → signup → full flow) completes with no crashes
- Nothing on screen during the demo is invented — every number/status traces to a real source or real API response

---

## Supabase Schema Planning

All tables live in `public`, RLS **enabled on every table**, no table left with RLS disabled "temporarily." Service-role writes (used by the monitoring pipeline) bypass RLS by design — that's why the service role key must never reach the client.

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid PK, references `auth.users.id` | |
| full_name | text | |
| school | text | nullable |
| city | text | |
| province | text | |
| education_level | text | enum-like: elementary/junior_high/senior_high/college/other |
| created_at | timestamptz default now() | |
| updated_at | timestamptz | update via trigger |

RLS: `select`/`update`/`insert` allowed only where `id = auth.uid()`.

### `sources`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| url | text | normalized, unique |
| source_type | text | `official` / `news` / `custom` (requirement #7) |
| trust_level | text | `official` / `trusted_news` / `custom` |
| status | text | `supported` / `limited` / `unsupported` |
| created_by | uuid, references `profiles.id`, nullable | **addition beyond base spec** — null for built-in seeded sources, set for user-added custom sources; needed so RLS can restrict who may edit/delete a custom source |
| created_at | timestamptz default now() | |

RLS: `select` open to any authenticated user. `insert` allowed only when `source_type = 'custom'` and `created_by = auth.uid()`. `update`/`delete` allowed only to the row's `created_by`, or service role (built-ins are service-role-managed, e.g. via a seed script/admin task, not through the client).

### `user_sources`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid, references `profiles.id` | |
| source_id | uuid, references `sources.id` | |
| notifications_enabled | boolean default true | |
| monitoring_enabled | boolean default true | |
| last_checked_at | timestamptz, nullable | |

RLS: all operations restricted to `user_id = auth.uid()`. Unique constraint on `(user_id, source_id)`.

### `source_updates`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| source_id | uuid, references `sources.id` | |
| content_hash | text | hash of normalized extracted content |
| type | text | weather / classes / school |
| title | text | |
| summary | text | |
| severity | text | e.g. info/advisory/warning/critical |
| location | text | nullable |
| class_status | text, nullable | one of: no_announcement / continue / suspended / online / partial — **only ever set from explicit source text** |
| published_at | timestamptz, nullable | from source if available |
| detected_at | timestamptz default now() | |
| original_url | text | |

RLS: `select` open to any authenticated user (updates are meant to be visible so users can discover sources through them). `insert`/`update` restricted to service role only (client never writes this table directly). Unique constraint on `(source_id, content_hash)` for dedupe.

### `notifications`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid, references `profiles.id` | |
| source_update_id | uuid, references `source_updates.id` | |
| read_at | timestamptz, nullable | |
| created_at | timestamptz default now() | |

RLS: `select`/`update` (marking read) restricted to `user_id = auth.uid()`. `insert` service-role only (fan-out step in Phase 5).

### `push_subscriptions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid, references `profiles.id` | |
| endpoint | text, unique | |
| p256dh | text | subscription key |
| auth_key | text | subscription auth secret |
| created_at | timestamptz default now() | |

RLS: all operations restricted to `user_id = auth.uid()`.

---

## Source Monitoring Architecture

```
Add Source (Phase 4) ──┐
                        ├──► shared URL/content resolver ──► classification (supported/limited/unsupported)
On-demand Refresh /     │
Scheduled trigger ──────┘
        │
        ▼
1. Select due sources (monitoring_enabled=true, last_checked_at older than interval)
2. For each source, resolve content in priority order:
     a. Official API (if known integration exists, e.g. PAGASA-style structured endpoint)
     b. RSS/Atom feed (parsed via feed parser)
     c. Readable webpage extraction (readability-style parser over server-fetched HTML)
     d. Generic custom URL monitoring (same extraction, lowest confidence → tends toward "limited")
3. Weather-relevance filter: keyword/category match; non-matching items dropped before storage
4. Structured extraction → { relevant, category, title, summary, location, severity, class_status, published_at, original_url }
   - class_status stays null unless explicit suspension/continuation language is present in the source text
5. Normalize + hash extracted content
6. If (source_id, content_hash) already exists → skip (no duplicate row, no duplicate notification)
7. Else insert source_updates row
8. Fan out notifications rows to opted-in users (user_sources.notifications_enabled=true)
9. Trigger push send (Phase 7) for subscribed users
10. Update sources.status / user_sources.last_checked_at; increment/reset failure counter
```

All of the above runs **server-side only** (Route Handler or Supabase Edge Function using the service-role client) — never in a client component, never via a client-exposed API key.

---

## PWA & Notification Setup Summary

- Manifest + icons (owlert-default at multiple sizes) + service worker registered at app shell level.
- Web Push preferred: VAPID keypair, `push_subscriptions` table, opt-in-gated permission request, server-side send via `web-push` triggered from the Phase 5 fan-out.
- In-app notifications (via `notifications` table + Realtime/poll) are not a "fallback" in the sense of being lesser-tested — they must work standalone since push permission will often be denied on mobile browsers/demo devices.
- Before implementing service worker registration, confirm the current-version-correct approach in `node_modules/next/dist/docs` per `AGENTS.md` — do not assume a remembered `next-pwa` setup still applies unmodified.

---

## Security Considerations

- **RLS everywhere.** No table ships without RLS enabled and policies written in the same change (see schema section above). Test cross-user access with a second account before calling a phase done.
- **Server-side fetching only.** All external source fetches (built-in and custom) happen in Route Handlers/Edge Functions using the service-role Supabase client; the fetch code and service role key never ship to the client bundle.
- **URL validation.** On Add Source and on every monitoring run: require `http`/`https` scheme only; reject `javascript:`, `data:`, `file:`, etc.; enforce a max URL length; normalize before storing/deduping.
- **SSRF protection.** Before fetching a user-supplied URL: resolve DNS and reject private/reserved ranges (RFC1918 `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, loopback `127.0.0.0/8`/`::1`, link-local `169.254.0.0/16` including the cloud metadata address `169.254.169.254`, and IPv6 unique-local `fc00::/7`). Disable automatic redirect-following and re-validate the target of every redirect hop manually (don't just check the original URL and then follow blindly — that's the classic bypass). Set a request timeout (a few seconds) and a max response size (a couple MB) so a slow/huge response can't tie up the pipeline.
- **Rate limiting.** Per-user cap on how many sources can be added; minimum recheck interval enforced per source (don't allow hammering a site every few seconds); global concurrency cap on the monitoring run; exponential backoff and eventual auto-flag to `unsupported` after repeated consecutive failures.
- **Safe scraping.** Parse HTML with a readability/text-extraction library only — never execute page JavaScript or run a full headless browser for MVP. Sanitize/strip any extracted HTML before storage or render (no raw `dangerouslySetInnerHTML` from source content). Identify the fetcher with a descriptive User-Agent. Fetch a single page only — no recursive crawling of linked pages in MVP. Best-effort `robots.txt` awareness is a nice-to-have, not a hard blocker for a hackathon timeline, but document it as a known limitation rather than silently ignoring it.
- **Auth boundaries.** Every mutating API route derives `user_id` from the verified Supabase session — never from a client-supplied field. Service role key lives only in server environment variables.

---

## Non-Goals for MVP (avoid overengineering)

- No admin dashboard for managing built-in sources (seed via SQL/script instead)
- No recursive/multi-page crawling of custom sources
- No headless-browser rendering of JS-heavy sites (mark as `unsupported`/`limited` instead)
- No multi-language support
- No complex ML model for classification — keyword filtering plus a single LLM extraction call is enough
- No offline-first data sync beyond basic app-shell caching
- No native mobile app — PWA only

## Open Assumptions to Confirm Early

- Which weather API will supply numeric conditions (PAGASA has no public JSON API — treat PAGASA as a monitored *source* for advisories/class-related text, not as the numeric weather provider)
- Exact list of built-in sources to seed (need real, stable URLs before Phase 1 seeding)
- Whether Vercel Cron or Supabase `pg_cron` is available/preferred for scheduling in Phase 5 (manual refresh trigger works either way and is enough for a demo)

---

## Recommended Starting Point

Start with **Phase 0 → Phase 1**: environment/tooling setup, then schema + RLS + auth. Everything else (dashboard, sources, monitoring, notifications) depends on having real tables with correct RLS and a working session — building UI against those first avoids rework later.
