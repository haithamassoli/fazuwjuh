import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { QUESTIONS, CARD_FIELDS } from "../lib/forms/questions";

// كل ما هو adminOnly (الاسم والهاتف) لا يغادر الخادم أبدًا — القاعدة الثابتة في الـ PRD.
const ADMIN_ONLY_IDS = new Set(
  [...QUESTIONS.male, ...QUESTIONS.female]
    .filter((q) => q.adminOnly)
    .map((q) => q.id),
);

/**
 * Shared strip/shape helper: reads one answer for public display.
 * adminOnly ids always return undefined; multiselect arrays join with «، ».
 */
function publicAnswer(
  doc: Doc<"forms">,
  id: string,
): string | number | undefined {
  if (ADMIN_ONLY_IDS.has(id)) return undefined;
  const value = doc.answers[id];
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value.join("، ") : value;
}

function toCard(doc: Doc<"forms">) {
  const card: Record<string, string | number | undefined> = {};
  for (const id of CARD_FIELDS) {
    card[id] = publicAnswer(doc, id);
  }
  return {
    formId: doc._id,
    shortCode: doc.shortCode,
    type: doc.type,
    publishedAt: doc.publishedAt,
    card,
  };
}

export const listPublished = query({
  args: {
    type: v.union(v.literal("male"), v.literal("female")),
    ageMin: v.optional(v.number()),
    ageMax: v.optional(v.number()),
    residence: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { ageMin, ageMax, residence, maritalStatus } = args;
    let q = ctx.db
      .query("forms")
      .withIndex("by_type_and_status_and_publishedAt", (q) =>
        q.eq("type", args.type).eq("status", "published"),
      )
      .order("desc");
    // ponytail: post-index .filter() scans only published rows of this type —
    // fine at initiative scale; add dedicated indexes if browse volume grows.
    if (ageMin !== undefined) {
      q = q.filter((f) => f.gte(f.field("answers.age"), ageMin));
    }
    if (ageMax !== undefined) {
      q = q.filter((f) => f.lte(f.field("answers.age"), ageMax));
    }
    if (residence !== undefined) {
      q = q.filter((f) => f.eq(f.field("answers.residence"), residence));
    }
    if (maritalStatus !== undefined) {
      q = q.filter((f) => f.eq(f.field("answers.maritalStatus"), maritalStatus));
    }
    const result = await q.paginate(args.paginationOpts);
    return { ...result, page: result.page.map(toCard) };
  },
});

export const getByShortCode = query({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("forms")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", args.shortCode))
      .unique();
    // matched / archived / pending / rejected استمارات غير مرئية للعموم.
    if (!doc || doc.status !== "published") return null;

    const groups: {
      title: string;
      items: { id: string; label: string; value: string | number }[];
    }[] = [];
    for (const question of QUESTIONS[doc.type]) {
      if (question.adminOnly) continue;
      const value = publicAnswer(doc, question.id);
      if (value === undefined) continue;
      let group = groups.find((g) => g.title === question.group);
      if (!group) {
        group = { title: question.group, items: [] };
        groups.push(group);
      }
      group.items.push({ id: question.id, label: question.label, value });
    }

    return {
      formId: doc._id,
      shortCode: doc.shortCode,
      type: doc.type,
      publishedAt: doc.publishedAt,
      groups,
    };
  },
});
