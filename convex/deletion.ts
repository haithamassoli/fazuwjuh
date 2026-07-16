import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { optionalUser, requireAdmin, requireUser } from "./lib/helpers";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const requestDeletion = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("deletionRequests")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) {
      return existing; // idempotent — no duplicate pending requests
    }
    const form = await ctx.db
      .query("forms")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique();
    if (form) {
      await ctx.db.patch(form._id, { status: "archived" });
    }
    const id = await ctx.db.insert("deletionRequests", {
      userId: user.userId,
      status: "pending",
    });
    return await ctx.db.get(id);
  },
});

export const myDeletionRequest = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx);
    if (!user) {
      return null;
    }
    return await ctx.db
      .query("deletionRequests")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
  },
});

export const adminList = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("deletionRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .paginate(args.paginationOpts);
    const page = await Promise.all(
      result.page.map(async (req) => {
        const [profile, form] = await Promise.all([
          ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", req.userId))
            .unique(),
          ctx.db
            .query("forms")
            .withIndex("by_userId", (q) => q.eq("userId", req.userId))
            .unique(),
        ]);
        const name = form?.answers.name;
        return {
          _id: req._id,
          _creationTime: req._creationTime,
          status: req.status,
          email: profile?.email ?? "",
          form: form
            ? {
                shortCode: form.shortCode,
                name: typeof name === "string" ? name : "",
              }
            : null,
        };
      }),
    );
    return { ...result, page };
  },
});

// ponytail: batched .take(200) loops assume the per-user totals (interests,
// <~2000 messages) fit one transaction; schedule-continue if it ever matters.
async function deleteBatched(
  ctx: MutationCtx,
  nextBatch: () => Promise<{ _id: Id<"interests"> | Id<"messages"> }[]>,
) {
  while (true) {
    const batch = await nextBatch();
    if (batch.length === 0) {
      break;
    }
    for (const doc of batch) {
      await ctx.db.delete(doc._id);
    }
  }
}

export const execute = mutation({
  args: { requestId: v.id("deletionRequests") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("طلب الحذف غير موجود");
    }
    if (request.status !== "pending") {
      throw new Error("طلب الحذف منفَّذ مسبقًا");
    }
    const userId = request.userId;

    // (a) form + every interest touching it (both directions)
    const form = await ctx.db
      .query("forms")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (form) {
      await deleteBatched(ctx, () =>
        ctx.db
          .query("interests")
          .withIndex("by_fromFormId_and_toFormId", (q) =>
            q.eq("fromFormId", form._id),
          )
          .take(200),
      );
      await deleteBatched(ctx, () =>
        ctx.db
          .query("interests")
          .withIndex("by_toFormId", (q) => q.eq("toFormId", form._id))
          .take(200),
      );
      await ctx.db.delete(form._id);
    }

    // matches rows are intentionally KEPT — سجل التوافقات يبقى كأثر تاريخي.

    // (b) thread + all its messages
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (thread) {
      await deleteBatched(ctx, () =>
        ctx.db
          .query("messages")
          .withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
          .take(200),
      );
      await ctx.db.delete(thread._id);
    }

    // (c) profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    // (d) better-auth account: the component exposes typed internal adapter
    // mutations callable from a mutation — delete sessions, accounts, then user.
    for (const model of ["session", "account"] as const) {
      let cursor: string | null = null;
      while (true) {
        const res: { isDone: boolean; continueCursor: string } =
          await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
            input: { model, where: [{ field: "userId", value: userId }] },
            paginationOpts: { numItems: 200, cursor },
          });
        if (res.isDone) {
          break;
        }
        cursor = res.continueCursor;
      }
    }
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: { model: "user", where: [{ field: "_id", value: userId }] },
    });

    // (e) keep the request as an audit trail
    await ctx.db.patch(args.requestId, { status: "done" });
    return null;
  },
});
