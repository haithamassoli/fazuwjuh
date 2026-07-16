"use client";

import {
  ConvexBetterAuthProvider,
  type AuthClient,
} from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      // ponytail: cast — better-auth 1.6.23 useSession typing collapses the
      // component's AuthClient union to `never`; runtime shape is correct.
      authClient={authClient as unknown as AuthClient}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
