import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const answersValidator = v.record(
  v.string(),
  v.union(v.string(), v.number(), v.array(v.string())),
);

export default defineSchema({
  profiles: defineTable({
    userId: v.string(), // better-auth user id
    email: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  forms: defineTable({
    userId: v.string(),
    type: v.union(v.literal("male"), v.literal("female")),
    shortCode: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("published"),
      v.literal("rejected"),
      v.literal("matched"),
      v.literal("archived"),
    ),
    answers: answersValidator,
    pendingAnswers: v.optional(answersValidator),
    rejectionReason: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    submittedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_shortCode", ["shortCode"])
    .index("by_status", ["status"])
    .index("by_type_and_status_and_publishedAt", [
      "type",
      "status",
      "publishedAt",
    ]),

  interests: defineTable({
    fromFormId: v.id("forms"),
    toFormId: v.id("forms"),
    status: v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("closed_matched"),
      v.literal("closed_rejected"),
    ),
  })
    .index("by_fromFormId_and_toFormId", ["fromFormId", "toFormId"])
    .index("by_toFormId", ["toFormId"])
    .index("by_status", ["status"]),

  matches: defineTable({
    formAId: v.id("forms"),
    formBId: v.id("forms"),
    interestId: v.id("interests"),
  }),

  threads: defineTable({
    userId: v.string(),
    lastMessageAt: v.number(),
    userUnread: v.number(),
    adminUnread: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  messages: defineTable({
    threadId: v.id("threads"),
    senderRole: v.union(v.literal("user"), v.literal("admin")),
    body: v.string(),
    isRead: v.boolean(),
  }).index("by_threadId", ["threadId"]),

  deletionRequests: defineTable({
    userId: v.string(),
    status: v.union(v.literal("pending"), v.literal("done")),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
});
