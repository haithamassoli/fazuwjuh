import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

// Server-side utilities + the /api/auth proxy handler (Next.js wiring mode
// prescribed by the @convex-dev/better-auth docs for v0.12).
export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
