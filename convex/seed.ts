import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { QUESTIONS } from "../lib/forms/questions";

// Same alphabet as convex/forms.ts (not exported there — replicated).
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

// Small pools for varied, realistic-ish placeholder text answers.
const TEXT_POOLS: Record<string, string[]> = {
  healthStatus: ["جيدة والحمد لله", "ممتازة", "جيدة مع حساسية موسمية بسيطة"],
  quranMemorization: ["جزء عمّ", "خمسة أجزاء", "عشرة أجزاء", "حافظ/ة لكتاب الله"],
  religiousCommitmentDesc: [
    "التزام وسطي مع حرص على الفرائض والسنن",
    "محافظة على الأذكار وقيام الليل قدر المستطاع",
    "التزام منذ الصغر في بيئة أسرية متدينة",
  ],
  fieldOfStudy: ["هندسة", "شريعة", "محاسبة", "تمريض", "علوم حاسوب", "تربية"],
  job: ["موظف قطاع خاص", "معلم/ة", "مهندس/ة", "يعمل في التجارة", "ممرض/ة"],
  monthlyIncome: ["400-600 دينار", "600-900 دينار", "أكثر من 900 دينار"],
  aboutMe: [
    "هادئ الطباع، أحب القراءة وصلة الرحم",
    "اجتماعي/ة ومحب/ة للخير والعمل التطوعي",
    "جاد/ة في الحياة مع روح مرحة داخل البيت",
  ],
  familyDescription: [
    "أسرة محافظة ميسورة الحال",
    "أسرة ملتزمة معروفة في منطقتها",
    "أسرة متوسطة الحال متدينة",
  ],
  seeking: [
    "ملتزمة بدينها، حسنة الخلق، من أسرة طيبة",
    "شريك ملتزم يخاف الله ويصون بيته",
    "شخص متدين متفاهم يقدّر الحياة الأسرية",
  ],
  seekingAgeRange: ["من 20 إلى 28", "من 25 إلى 33", "من 28 إلى 40"],
};

function seedAnswers(
  type: "male" | "female",
  i: number,
): Record<string, string | number | string[]> {
  const answers: Record<string, string | number | string[]> = {};
  for (const q of QUESTIONS[type]) {
    // name/phone exist in stored answers but must never surface publicly.
    if (q.id === "name") {
      answers[q.id] = `مستخدم تجريبي ${i + 1}`;
      continue;
    }
    if (q.id === "phone") {
      answers[q.id] = "0" + (790000000 + i + (type === "female" ? 50 : 0));
      continue;
    }
    if (q.id === "age") {
      answers[q.id] = 22 + ((i * 3) % 24); // spread 22–45
      continue;
    }
    switch (q.type) {
      case "select":
        answers[q.id] = q.options![i % q.options!.length];
        break;
      case "multiselect":
        answers[q.id] = q.options!.slice(0, 1 + (i % q.options!.length));
        break;
      case "number":
        answers[q.id] =
          q.id === "height"
            ? 155 + ((i * 4) % 35)
            : q.id === "weight"
              ? 55 + ((i * 5) % 40)
              : i % 3; // childrenCount etc.
        break;
      default: {
        const pool = TEXT_POOLS[q.id];
        answers[q.id] = pool
          ? pool[i % pool.length]
          : `${q.label} — إجابة تجريبية ${i + 1}`;
      }
    }
  }
  return answers;
}

export const seedPublished = internalMutation({
  args: { perType: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const perType = args.perType ?? 8;
    const now = Date.now();
    const codes: string[] = [];
    for (const type of ["male", "female"] as const) {
      for (let i = 0; i < perType; i++) {
        const shortCode = await generateShortCode(ctx);
        const publishedAt = now - i * 86400000; // staggered over past days
        await ctx.db.insert("forms", {
          userId: `seed:${type}:${i}`,
          type,
          shortCode,
          status: "published",
          answers: seedAnswers(type, i),
          publishedAt,
          submittedAt: publishedAt - 6 * 3600000,
        });
        codes.push(shortCode);
      }
    }
    return { inserted: codes.length, shortCodes: codes };
  },
});

export const clearSeeds = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;
    for (;;) {
      // "seed;" is the next string after the "seed:" prefix range.
      const batch = await ctx.db
        .query("forms")
        .withIndex("by_userId", (q) =>
          q.gte("userId", "seed:").lt("userId", "seed;"),
        )
        .take(100);
      if (batch.length === 0) break;
      for (const doc of batch) {
        await ctx.db.delete(doc._id);
      }
      deleted += batch.length;
    }
    return { deleted };
  },
});
