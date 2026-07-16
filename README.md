# «فَزَوِّجُوهُ»

منصة لتيسير الزواج الشرعي — تُعرِّف الراغبين والراغبات بشروط واضحة وإشراف إداري، بعيدًا عن المحرّم.

## Stack

- Next.js 16 (App Router, TS) + React 19
- Convex (backend, database, functions)
- Better Auth (`better-auth` + `@convex-dev/better-auth`)
- Tailwind v4 (CSS-first `@theme`, no `tailwind.config`)
- shadcn (`base-nova` style, built on `@base-ui/react`)

## Local development

```bash
npm install

# terminal 1 — Convex dev deployment + function watcher
npx convex dev

# terminal 2 — Next.js dev server
npm run dev
```

`npx convex dev` provisions a dev deployment and writes `CONVEX_DEPLOYMENT`,
`NEXT_PUBLIC_CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_SITE_URL` into `.env.local`
automatically — no manual setup needed.

## First admin

Register an account at `/register`, then promote it via the Convex CLI.
See [`docs/admin-setup.md`](docs/admin-setup.md) for the full walkthrough.

## Project layout

- `convex/` — schema, functions, and auth wiring (server-side source of truth
  and enforcement; see `convex/_generated/ai/guidelines.md` before editing)
- `lib/forms/questions.ts` — the application form questions, per gender
  (**product-owner-editable config**)
- `lib/content/ar.ts` — Arabic copy: intros, oath text, publish consent,
  conditions lists (**product-owner-editable content**)
- `app/` — routes (`/`, `/browse`, `/forms/[shortCode]`, `/apply`,
  `/account`, `/chat`, `/login`, `/register`, `/admin`, …)
- `components/` — shared UI (site header/footer, seal, shadcn primitives)
- `docs/` — operational docs (admin setup, deployment)

## ⚠️ Placeholder content

`lib/forms/questions.ts` and `lib/content/ar.ts` currently contain
**placeholder** questions, oath text, and conditions. These MUST be replaced
verbatim from the initiative's official source document before launch — do
not ship with placeholder wording live.
