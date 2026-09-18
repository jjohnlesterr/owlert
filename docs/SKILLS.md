# SKILLS.md — Owlert Dev Reference

This file maps the Claude Code skills already available in this environment to the work Owlert actually needs, so agents (and humans) reach for the right tool instead of re-deriving a process every session. It does not duplicate `AGENTS.md`/`CLAUDE.md` — read those first, they take precedence.

There is currently no project-local `.claude/skills/` directory. All skills referenced below are global Claude Code skills. **Do not delete or overwrite them** — if project-specific skills are added later (e.g. an `owlert-monitor` skill for the fetch pipeline), keep this file in sync but never remove existing entries without checking with the user first.

## Framework ground rules (read before writing code)

- This repo's `AGENTS.md` states the installed Next.js is **not** the Next.js in training data. Before touching anything under `app/`, `next.config.ts`, or routing/data-fetching code, read the relevant guide under `node_modules/next/dist/docs/` (subfolders: `01-app`, `02-pages`, `03-architecture`, `04-community`). This applies especially to PWA/service-worker setup (Phase 6) and any route handlers used for server-side fetching (Phase 4).
- Never remove the `<!-- BEGIN:nextjs-agent-rules -->` block from `AGENTS.md` — `next dev` re-adds it anyway; just commit it as-is if it shows up in a diff.

## Skill → Owlert task map

| When you're about to... | Use skill | Why |
|---|---|---|
| Start any implementation session | `init` (only if `CLAUDE.md` coverage feels stale) | Keeps codebase docs current as the app grows past the initial scaffold. |
| Launch the dev server / verify a feature works in-browser | `run` | Project convention (see root guidance): UI changes must be manually verified running, not just type-checked. |
| Build any chart/graph (e.g. a weather trend, severity breakdown) | `dataviz` | Enforces accessible, theme-consistent chart colors instead of ad hoc styling. |
| Mock up a screen (Dashboard, Sources, Add Source flow) before coding it | `design` | Cheaper to iterate on layout/spacing/mascot placement visually first. |
| Review a diff before considering a phase "done" | `code-review` | Catches correctness bugs; use at least `medium` effort per phase, higher for the monitoring/fetch pipeline. |
| Review anything that fetches user-supplied URLs, handles auth tokens, or touches RLS policies | `security-review` | Owlert's core risk surface is SSRF (custom source URLs) and RLS misconfiguration — always run this before merging Phase 1 (schema/RLS) and Phase 4–5 (source monitoring). |
| Clean up code after a feature works but before merging | `simplify` | Quality pass only, no bug hunting — pairs with `code-review`. |
| Configure permissions/hooks for this repo | `update-config` | Not `settings.json` by hand. |
| Anything involving an LLM call (e.g. classification/extraction/summarization of source content) | `claude-api` | Owlert explicitly uses AI only to classify/summarize/extract, never as source of truth — check current API/model guidance here before wiring it up. |
| Set up a recurring monitoring check or demo polling loop during dev | `loop` or `schedule` | `loop` for an interactive dev-time recurring check; `schedule` if a real cron-based Supabase/Vercel job needs scaffolding help. |

## Project-specific conventions for agents

1. **Never invent data.** Any code path that renders a weather alert or class-suspension status must trace back to a real `source_updates` row with an `original_url`. If you can't find a real source during a phase, stub the UI with an explicit "no data yet" state — do not fabricate sample alerts as if real.
2. **Server-side only for source fetching.** All fetching of external URLs (built-in or custom) happens in Route Handlers/Edge Functions using the service role key — never expose fetch logic or the service role key to client components.
3. **RLS first, UI second.** When adding a new Supabase table, write and test its RLS policy in the same change that creates the table — don't defer it to a "security pass" later.
4. **Mobile-first only.** Build and screenshot at ~375px width before widening; do not design desktop-first and retrofit.
5. **Mascot usage is fixed:** `owlert-default` for branding/onboarding/empty states, `owlert-banner` for the dashboard hero only. Don't introduce new mascot poses without asset support.

## Known gaps to fill during setup (Phase 0)

- `public/` currently only has the default `create-next-app` SVGs — `owlert-default` and `owlert-banner` image assets need to be added before Dashboard/Profile UI work starts.
- No `.env.local` / Supabase project exists yet — see `PLAN.md` Phase 1.
- No PWA manifest or service worker yet — see `PLAN.md` Phase 6.
