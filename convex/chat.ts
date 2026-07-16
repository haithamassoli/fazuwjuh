import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { optionalUser, requireAdmin, requireUser } from "./lib/helpers";

function validBody(body: string) {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new Error("لا يمكن إرسال رسالة فارغة");
  }
  if (trimmed.length > 2000) {
    throw new Error("الرسالة طويلة جدًا");
  }
  return trimmed;
}

async function threadFor(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("threads")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

async function ensureThread(ctx: MutationCtx, userId: string) {
  const existing = await threadFor(ctx, userId);
  if (existing) {
    return existing;
  }
  const id = await ctx.db.insert("threads", {
    userId,
    lastMessageAt: Date.now(),
    userUnread: 0,
    adminUnread: 0,
  });
  return (await ctx.db.get(id))!;
}

export const send = mutation({
  args: { body: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const body = validBody(args.body);
    const thread = await ensureThread(ctx, user.userId);
    await ctx.db.insert("messages", {
      threadId: thread._id,
      senderRole: "user",
      body,
      isRead: false,
    });
    await ctx.db.patch(thread._id, {
      lastMessageAt: Date.now(),
      adminUnread: thread.adminUnread + 1,
    });
    return null;
  },
});

export const myThread = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx);
    if (!user) {
      return null;
    }
    const thread = await threadFor(ctx, user.userId);
    if (!thread) {
      return null;
    }
    return { threadId: thread._id, userUnread: thread.userUnread };
  },
});

export const markRead = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("غير مصرّح");
    }
    const isOwner = thread.userId === user.userId;
    if (!isOwner && user.role !== "admin") {
      throw new Error("غير مصرّح");
    }
    // Owner clears admin-sent unread; admin clears user-sent unread.
    const senderToClear = isOwner ? "admin" : "user";
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isRead"), false),
          q.eq(q.field("senderRole"), senderToClear),
        ),
      )
      .take(200); // ponytail: 200 per call; call again if a thread ever exceeds it
    for (const message of unread) {
      await ctx.db.patch(message._id, { isRead: true });
    }
    await ctx.db.patch(
      args.threadId,
      isOwner ? { userUnread: 0 } : { adminUnread: 0 },
    );
    return null;
  },
});

export const messages = query({
  args: { threadId: v.id("threads"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || (thread.userId !== user.userId && user.role !== "admin")) {
      throw new Error("غير مصرّح");
    }
    return await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const adminSend = mutation({
  args: { userId: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const body = validBody(args.body);
    const thread = await ensureThread(ctx, args.userId);
    await ctx.db.insert("messages", {
      threadId: thread._id,
      senderRole: "admin",
      body,
      isRead: false,
    });
    await ctx.db.patch(thread._id, {
      lastMessageAt: Date.now(),
      userUnread: thread.userUnread + 1,
    });
    return null;
  },
});

export const adminInbox = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("threads")
      .withIndex("by_lastMessageAt")
      .order("desc")
      .paginate(args.paginationOpts);
    const page = await Promise.all(
      result.page.map(async (thread) => {
        const [profile, form] = await Promise.all([
          ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", thread.userId))
            .unique(),
          ctx.db
            .query("forms")
            .withIndex("by_userId", (q) => q.eq("userId", thread.userId))
            .unique(),
        ]);
        const email = profile?.email ?? "";
        const name = form?.answers.name;
        return {
          threadId: thread._id as Id<"threads">,
          userId: thread.userId,
          lastMessageAt: thread.lastMessageAt,
          adminUnread: thread.adminUnread,
          email,
          displayName: typeof name === "string" && name ? name : email,
        };
      }),
    );
    return { ...result, page };
  },
});
