import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { requireAdmin } from "./lib/helpers";

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("published"),
  v.literal("rejected"),
  v.literal("matched"),
  v.literal("archived"),
);

export const listForms = query({
  args: { status: statusValidator, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("forms")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getForm = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("الاستمارة غير موجودة");
    }
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", form.userId))
      .unique();
    return { ...form, ownerEmail: profile?.email ?? "" };
  },
});

export const approve = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("الاستمارة غير موجودة");
    }
    if (form.status !== "pending") {
      throw new Error("لا يمكن قبول استمارة ليست قيد المراجعة");
    }
    await ctx.db.patch(args.formId, {
      status: "published",
      publishedAt: Date.now(),
      rejectionReason: undefined,
    });
    return null;
  },
});

export const reject = mutation({
  args: { formId: v.id("forms"), reason: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.reason.trim() === "") {
      throw new Error("يجب ذكر سبب الرفض");
    }
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("الاستمارة غير موجودة");
    }
    if (form.status !== "pending") {
      throw new Error("لا يمكن رفض استمارة ليست قيد المراجعة");
    }
    await ctx.db.patch(args.formId, {
      status: "rejected",
      rejectionReason: args.reason,
    });
    return null;
  },
});

// One-off maintenance: JWKS private keys were encrypted with a BETTER_AUTH_SECRET
// that no longer matches, breaking login ("Failed to decrypt private key"). Delete
// them so better-auth regenerates a keypair with the current secret. Existing sessions
// are unaffected (email/password login mints new ones).
// Run once against the broken deployment: npx convex run admin:clearJwks --prod
export const clearJwks = internalMutation({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let deleted = 0;
    while (true) {
      const res = await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        input: { model: "jwks" },
        paginationOpts: { numItems: 200, cursor },
      });
      deleted += res.count;
      if (res.isDone) {
        break;
      }
      cursor = res.continueCursor;
    }
    return { deleted };
  },
});

export const listPendingEdits = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("forms")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.neq(q.field("pendingAnswers"), undefined))
      .take(100); // ponytail: bounded 100, paginate if the queue ever grows
  },
});

export const approveEdit = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("الاستمارة غير موجودة");
    }
    if (form.status !== "published" || form.pendingAnswers === undefined) {
      throw new Error("لا يوجد تعديل معلّق على هذه الاستمارة");
    }
    await ctx.db.patch(args.formId, {
      answers: form.pendingAnswers,
      pendingAnswers: undefined,
    });
    return null;
  },
});

export const rejectEdit = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("الاستمارة غير موجودة");
    }
    if (form.status !== "published" || form.pendingAnswers === undefined) {
      throw new Error("لا يوجد تعديل معلّق على هذه الاستمارة");
    }
    await ctx.db.patch(args.formId, { pendingAnswers: undefined });
    return null;
  },
});
