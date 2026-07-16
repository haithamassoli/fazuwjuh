import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { optionalUser } from "./lib/helpers";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx);
    return user === null ? null : { email: user.email, role: user.role };
  },
});

export const promote = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!profile) {
      throw new Error(`لا يوجد ملف مستخدم بالبريد: ${args.email}`);
    }
    await ctx.db.patch(profile._id, { role: "admin" });
    return null;
  },
});
