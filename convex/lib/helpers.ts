import type { QueryCtx } from "../_generated/server";

// Works in queries and mutations (MutationCtx satisfies QueryCtx). No writes here.
export async function optionalUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  const userId = identity.subject; // better-auth user id
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return {
    userId,
    email: profile?.email ?? (identity.email as string | undefined) ?? "",
    role: profile?.role ?? ("user" as const),
  };
}

export async function requireUser(ctx: QueryCtx) {
  const user = await optionalUser(ctx);
  if (!user) {
    throw new Error("يجب تسجيل الدخول");
  }
  return user;
}

export async function requireAdmin(ctx: QueryCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") {
    throw new Error("غير مصرّح");
  }
  return user;
}
