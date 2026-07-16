import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Next.js proxy mode: requests go same-origin to /api/auth/* (no baseURL needed).
export const authClient = createAuthClient({
  plugins: [convexClient()],
});
