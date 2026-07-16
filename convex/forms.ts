import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireUser } from "./lib/helpers";
import { QUESTIONS } from "../lib/forms/questions";

const answersValidator = v.record(
  v.string(),
  v.union(v.string(), v.number(), v.array(v.string())),
);

type Answers = Record<string, string | number | string[]>;

function isEmpty(value: string | number | string[] | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false; // numbers count as answered
}

function validateAnswers(type: "male" | "female", answers: Answers) {
  const questions = QUESTIONS[type];
  const byId = new Map(questions.map((q) => [q.id, q]));

  for (const key of Object.keys(answers)) {
    if (!byId.has(key)) {
      throw new Error(`حقل غير معروف في الإجابات: ${key}`);
    }
  }

  for (const q of questions) {
    const value = answers[q.id];
    const required = q.required === true || q.id === "name" || q.id === "phone";
    if (required && isEmpty(value)) {
      throw new Error(`يرجى الإجابة عن سؤال «${q.label}»`);
    }
    if (value === undefined) continue;

    switch (q.type) {
      case "number":
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(`يجب أن تكون الإجابة عن «${q.label}» رقمًا صحيحًا`);
        }
        break;
      case "select":
        if (typeof value !== "string" || !(q.options ?? []).includes(value)) {
          throw new Error(`قيمة غير صالحة لسؤال «${q.label}»`);
        }
        break;
      case "multiselect":
        if (
          !Array.isArray(value) ||
          !value.every((item) => (q.options ?? []).includes(item))
        ) {
          throw new Error(`قيمة غير صالحة لسؤال «${q.label}»`);
        }
        break;
      default: // text | textarea
        if (typeof value !== "string") {
          throw new Error(`يجب أن تكون الإجابة عن «${q.label}» نصًّا`);
        }
    }
  }
}

const SHORT_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

async function generateShortCode(ctx: MutationCtx): Promise<string> {
  for (;;) {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code +=
        SHORT_CODE_ALPHABET[
          Math.floor(Math.random() * SHORT_CODE_ALPHABET.length)
        ];
    }
    const clash = await ctx.db
      .query("forms")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", code))
      .unique();
    if (!clash) return code;
  }
}

export const createForm = mutation({
  args: {
    type: v.union(v.literal("male"), v.literal("female")),
    answers: answersValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("forms")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique();
    if (existing) {
      throw new Error("لديك استمارة مسجّلة مسبقًا؛ لكل حساب استمارة واحدة فقط");
    }
    validateAnswers(args.type, args.answers);
    const shortCode = await generateShortCode(ctx);
    await ctx.db.insert("forms", {
      userId: user.userId,
      type: args.type,
      shortCode,
      status: "pending",
      answers: args.answers,
      submittedAt: Date.now(),
    });
    return { shortCode };
  },
});

export const getMyForm = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("forms")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique();
  },
});

export const updateForm = mutation({
  args: { answers: answersValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const form = await ctx.db
      .query("forms")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique();
    if (!form) {
      throw new Error("لا توجد استمارة لتعديلها");
    }
    validateAnswers(form.type, args.answers);

    switch (form.status) {
      case "pending":
      case "rejected":
        await ctx.db.patch(form._id, {
          answers: args.answers,
          status: "pending",
          rejectionReason: undefined,
        });
        break;
      case "published":
        // النسخة المنشورة تبقى ظاهرة حتى يبتّ الأدمن في التعديل
        await ctx.db.patch(form._id, { pendingAnswers: args.answers });
        break;
      default: // matched | archived
        throw new Error("لا يمكن تعديل الاستمارة في حالتها الحالية");
    }
    return null;
  },
});
