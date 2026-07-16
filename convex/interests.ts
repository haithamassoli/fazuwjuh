import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { optionalUser, requireAdmin, requireUser } from "./lib/helpers";
import type { Doc, Id } from "./_generated/dataModel";

const interestStatusValidator = v.union(
  v.literal("new"),
  v.literal("in_progress"),
  v.literal("closed_matched"),
  v.literal("closed_rejected"),
);

function isOpen(interest: Doc<"interests">): boolean {
  return interest.status === "new" || interest.status === "in_progress";
}

async function findOpenInterest(
  ctx: QueryCtx,
  fromFormId: Id<"forms">,
  toFormId: Id<"forms">,
): Promise<Doc<"interests"> | null> {
  const pair = await ctx.db
    .query("interests")
    .withIndex("by_fromFormId_and_toFormId", (q) =>
      q.eq("fromFormId", fromFormId).eq("toFormId", toFormId),
    )
    .take(200); // ponytail: bounded 200 open interests per pair, loop if it ever matters
  return pair.find(isOpen) ?? null;
}

async function myForm(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("forms")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

// ---------------------------------------------------------------------------
// User side
// ---------------------------------------------------------------------------

export const express = mutation({
  args: { toFormId: v.id("forms") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const form = await myForm(ctx, user.userId);
    if (!form || form.status !== "published") {
      throw new Error("يجب أن تكون لديك استمارة منشورة لإبداء الاهتمام");
    }
    if (form._id === args.toFormId) {
      throw new Error("لا يمكنك إبداء الاهتمام باستمارتك");
    }
    const target = await ctx.db.get(args.toFormId);
    if (
      !target ||
      target.status !== "published" ||
      target.type === form.type
    ) {
      throw new Error("لا يمكن إبداء الاهتمام بهذه الاستمارة");
    }
    const open = await findOpenInterest(ctx, form._id, args.toFormId);
    if (open) {
      throw new Error("لديك طلب اهتمام قائم لهذه الاستمارة بالفعل");
    }
    await ctx.db.insert("interests", {
      fromFormId: form._id,
      toFormId: args.toFormId,
      status: "new",
    });
    return null;
  },
});

export const myInterestIn = query({
  args: { toFormId: v.id("forms") },
  handler: async (ctx, args) => {
    const user = await optionalUser(ctx);
    if (!user) return null;
    const form = await myForm(ctx, user.userId);
    if (!form) return null;
    const open = await findOpenInterest(ctx, form._id, args.toFormId);
    return open ? { status: open.status } : null;
  },
});

// ---------------------------------------------------------------------------
// Admin side
// ---------------------------------------------------------------------------

async function formSummary(ctx: QueryCtx, formId: Id<"forms">) {
  const form = await ctx.db.get(formId);
  if (!form) return null; // form deleted — skip gracefully
  return {
    formId: form._id,
    shortCode: form.shortCode,
    type: form.type,
    name: String(form.answers.name ?? ""), // admin may see the name
    userId: form.userId,
  };
}

export const list = query({
  args: {
    status: v.optional(interestStatusValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const status = args.status;
    const result =
      status !== undefined
        ? await ctx.db
            .query("interests")
            .withIndex("by_status", (q) => q.eq("status", status))
            .order("desc")
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("interests")
            .order("desc")
            .paginate(args.paginationOpts);
    const page = await Promise.all(
      result.page.map(async (interest) => ({
        ...interest,
        fromForm: await formSummary(ctx, interest.fromFormId),
        toForm: await formSummary(ctx, interest.toFormId),
      })),
    );
    return { ...result, page };
  },
});

export const setStatus = mutation({
  args: {
    interestId: v.id("interests"),
    status: v.union(v.literal("in_progress"), v.literal("closed_rejected")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const interest = await ctx.db.get(args.interestId);
    if (!interest) {
      throw new Error("طلب الاهتمام غير موجود");
    }
    const allowed =
      args.status === "in_progress"
        ? interest.status === "new"
        : isOpen(interest); // closed_rejected: from new or in_progress
    if (!allowed) {
      throw new Error("لا يمكن تغيير حالة الطلب من حالته الحالية");
    }
    await ctx.db.patch(args.interestId, { status: args.status });
    return null;
  },
});

export const announceMatch = mutation({
  args: { interestId: v.id("interests") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const interest = await ctx.db.get(args.interestId);
    if (!interest || !isOpen(interest)) {
      throw new Error("لا يمكن إعلان التوافق لهذا الطلب في حالته الحالية");
    }
    const [formA, formB] = await Promise.all([
      ctx.db.get(interest.fromFormId),
      ctx.db.get(interest.toFormId),
    ]);
    if (
      !formA ||
      !formB ||
      formA.status !== "published" ||
      formB.status !== "published"
    ) {
      throw new Error("لا يمكن إعلان التوافق: إحدى الاستمارتين لم تعد منشورة");
    }

    await ctx.db.insert("matches", {
      formAId: interest.fromFormId,
      formBId: interest.toFormId,
      interestId: args.interestId,
    });
    await ctx.db.patch(formA._id, { status: "matched" });
    await ctx.db.patch(formB._id, { status: "matched" });
    await ctx.db.patch(args.interestId, { status: "closed_matched" });

    // إغلاق تلقائي لكل الاهتمامات المفتوحة المرتبطة بأي من الاستمارتين
    const toClose = new Map<Id<"interests">, Doc<"interests">>();
    for (const formId of [formA._id, formB._id]) {
      const outgoing = await ctx.db
        .query("interests")
        .withIndex("by_fromFormId_and_toFormId", (q) =>
          q.eq("fromFormId", formId),
        )
        .take(200); // ponytail: bounded 200 open interests per form, loop if it ever matters
      const incoming = await ctx.db
        .query("interests")
        .withIndex("by_toFormId", (q) => q.eq("toFormId", formId))
        .take(200); // ponytail: bounded 200 open interests per form, loop if it ever matters
      for (const other of [...outgoing, ...incoming]) {
        if (isOpen(other)) toClose.set(other._id, other);
      }
    }
    for (const id of toClose.keys()) {
      await ctx.db.patch(id, { status: "closed_rejected" });
    }
    return null;
  },
});
