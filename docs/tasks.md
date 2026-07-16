# Tasks — منصة «فَزَوِّجُوهُ»

Source: [prd-fazawwijuhu.md](./prd-fazawwijuhu.md). Milestones are dependency-ordered; each ends in a working, verifiable increment.

## M1 — Foundation: Convex, schema, RTL shell
Goal: app boots in Arabic RTL with the full data model in place.

- [x] Run `npx convex dev`, wire env vars, confirm Next.js ↔ Convex connection
- [x] Define Convex schema: `forms` (userId unique, type, shortCode unique, status, answers, pendingAnswers?, rejectionReason?, timestamps), `interests` (fromFormId, toFormId, status + composite index), `matches`, `threads` (userId unique, lastMessageAt), `messages` (by threadId), `deletionRequests`
- [x] Root layout: `lang="ar" dir="rtl"`, Arabic font, Tailwind base theme
- [x] Shared UI shell: header/nav (تصفح، قدّم الآن، حسابي، المحادثة، دخول) + footer
- [x] `/` landing page: initiative intro and message (copy from source doc)

## M2 — Auth & roles
Goal: email + password accounts with user/admin roles enforced server-side.

- [x] Email + password auth via the better-auth Convex component (no OTP): register, login, logout
- [x] `/register` and `/login` pages in Arabic with validation errors
- [x] `role: "user" | "admin"` on users; `requireUser` / `requireAdmin` helpers used by every non-public Convex function
- [x] Promote the first admin manually via `npx convex run users:promote` (documented in docs/admin-setup.md)

## M3 — Form submission
Goal: a registered user completes the wizard and submits one form (status `pending`).

- [ ] Question config file per type (male/female): id, label, field type, options, group, showInSummaryCard — placeholder questions until the product owner delivers the final list
- [ ] Static content files: intros, oath (القسَم), publish consent, conditions (11 male / 12 female) — verbatim from the source document
- [ ] `/apply` wizard: type → intro → oath (required consent) → publish consent → conditions (required consent) → questions; blocked if the account already has a form
- [ ] Link to «واعي» page shown at condition 11 in the male form
- [ ] `createForm` mutation: one form per account, name + phone required, unique shortCode generated (e.g. `853n`), status `pending`
- [ ] `/account`: show own form, its status and rejection reason, with an edit entry point

## M4 — Admin review & form lifecycle
Goal: admin reviews forms; lifecycle `pending → published | rejected` works, including published-edit flow.

- [ ] `/admin` layout gated by `requireAdmin`; nav for forms, edit requests, interests, chats, deletions
- [ ] Forms lists by status (pending / published / rejected / matched / archived)
- [ ] Admin form detail: all answers **including name + phone**; approve → `published`, reject → `rejected` with a reason
- [ ] Owner edit of a pending/rejected form: replaces answers and resets status to `pending`
- [ ] Owner edit of a published form: saved to `pendingAnswers`; published version stays live
- [ ] Admin pending-edits queue with a simple old/new diff; approve (replace answers) or reject (keep old, discard `pendingAnswers`)

## M5 — Public browse
Goal: visitors browse published forms with filters; name + phone never leave the server.

- [ ] Public Convex queries return only `published` forms and always strip name + phone server-side
- [ ] `/browse`: male/female tabs; summary cards with shortCode, age, marital status, المطلوب, residence, dress, nationality
- [ ] Filters: age range, residence, marital status; sorted newest-published first
- [ ] `/forms/[shortCode]`: all answers grouped by section (minus name/phone); not found unless status is `published`
- [ ] «إبداء اهتمام» button: guests → login prompt; users without a published form → explanatory message

## M6 — Interests & matching
Goal: interest requests flow to the admin board; a manual match closes everything correctly.

- [ ] `expressInterest` mutation enforcing: sender has a published form, target is published and of the opposite type, no existing open interest for the same pair (composite index)
- [ ] Admin interests board: `new → in_progress → closed_matched | closed_rejected`, with direct links to both parties' chat threads
- [ ] Match announcement action: create `matches` record, set both forms to `matched` (they vanish from browse), auto-close every open interest touching either form

## M7 — Chat (user ↔ admin)
Goal: real-time mediation channel; registration alone is enough to chat.

- [ ] `/chat`: one thread per user with the admin, real-time messages (Convex), thread auto-created on first message
- [ ] Admin inbox: threads sorted by `lastMessageAt`, unread badges, thread view with reply
- [ ] Unread indicator in both directions; mark as read on open

## M8 — Data deletion, QA & launch
Goal: deletion pipeline works end-to-end; platform ready for real users.

- [ ] «طلب حذف بياناتي» in `/account`: form → `archived` immediately + create a `deletionRequests` entry
- [ ] Admin deletions queue: execute = permanently delete form, interests, thread + messages, and account
- [ ] QA sweep: every visibility rule verified server-side, all state changes admin-only, no direct applicant-to-applicant contact anywhere, RTL/Arabic copy review, mobile layout, empty/error states
- [ ] Replace placeholder questions and texts with the product owner's final content
- [ ] Deploy: Convex production + hosting, env vars, smoke test

## Out of scope (v1)
OTP / identity verification, photos, email/push notifications, multi-admin roles, advanced text search, in-panel form builder, mobile app.
