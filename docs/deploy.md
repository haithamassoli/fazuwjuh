# Production Deploy Runbook

## 1. Deploy Convex to production

```bash
npx convex deploy
```

This creates/pushes the prod deployment separate from your dev deployment.

## 2. Set prod env vars on Convex

In the Convex dashboard (or `npx convex env set ... --prod`), set on the
**production** deployment:

- `BETTER_AUTH_SECRET` — a fresh secret, generated separately from the dev
  one (never reuse the dev secret in prod)
- `SITE_URL=https://<prod-domain>` — the final production domain

## 3. Deploy the frontend to Vercel

```bash
vercel link
vercel env add NEXT_PUBLIC_CONVEX_URL production
vercel env add NEXT_PUBLIC_CONVEX_SITE_URL production
```

Use the **production** Convex URLs (from `npx convex deploy` output / the
Convex dashboard's prod deployment), not the dev ones.

```bash
vercel deploy --prod
```

## 4. Wire up the final domain

Once the Vercel production URL/domain is confirmed:

1. Update `SITE_URL` on the Convex **prod** deployment (step 2) to the final
   domain if it wasn't already set correctly.
2. Ensure `trustedOrigins` in `convex/auth.ts` covers the prod domain — see
   the `trustedOrigins: [siteUrl, "http://localhost:3000"]` line. Since
   `siteUrl` comes from `process.env.SITE_URL!`, setting `SITE_URL` correctly
   in step 2 is what makes this line trust the prod domain; add the domain
   explicitly to the array if it needs to trust more than one origin.

## 5. Promote the first prod admin

```bash
npx convex run users:promote '{"email":"<their-email>"}' --prod
```

The user must have already registered on the production site first.

## 6. Smoke test

- [ ] `/` loads
- [ ] `/register` → creates account → redirects to `/account`
- [ ] `/browse` loads published forms
- [ ] `/admin` loads for the promoted admin account (and is blocked for
      non-admins)
