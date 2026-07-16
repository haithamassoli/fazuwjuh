"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { QUESTIONS, type Question } from "@/lib/forms/questions";
import { CONDITIONS, INTRO, OATH, PUBLISH_CONSENT, WAEI_URL } from "@/lib/content/ar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormType = "male" | "female";
type Values = Record<string, string | string[]>;

const STEP_LABELS = ["النوع", "المقدمة", "القسَم", "موافقة النشر", "الشروط", "الأسئلة"];
const ARABIC_DIGITS = ["١", "٢", "٣", "٤", "٥", "٦"];

const linkButtonPrimary =
  "inline-flex h-11 items-center justify-center rounded-md bg-olive px-6 text-base font-medium text-paper transition-colors hover:bg-olive-deep";
const linkButtonOutline =
  "inline-flex h-11 items-center justify-center rounded-md border border-sand px-6 text-base font-medium text-ink transition-colors hover:bg-sand-light";

/* ---------- progress indicator ---------- */

function StepDots({ current }: { current: number }) {
  return (
    <ol className="flex items-center" aria-label="خطوات التقديم">
      {STEP_LABELS.map((label, i) => (
        <li key={label} className="flex items-center last:flex-none [&:not(:last-child)]:flex-1">
          <span
            aria-current={i === current ? "step" : undefined}
            title={label}
            className={
              "flex size-9 shrink-0 items-center justify-center rounded-full border font-display text-lg leading-none " +
              (i === current
                ? "border-olive bg-olive text-white"
                : i < current
                  ? "border-olive text-olive"
                  : "border-sand text-khaki")
            }
          >
            {ARABIC_DIGITS[i]}
          </span>
          {i < STEP_LABELS.length - 1 ? (
            <span className={"mx-1 h-px flex-1 " + (i < current ? "bg-olive" : "bg-sand")} />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/* ---------- consent checkbox ---------- */

function ConsentCheck({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-sand bg-sand-light/50 p-4"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0 accent-olive"
      />
      <span className="font-medium text-ink">{label}</span>
    </label>
  );
}

/* ---------- one question field ---------- */

const selectClasses =
  "h-11 w-full rounded-lg border border-input bg-white px-2.5 text-base text-ink transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function QuestionField({
  q,
  value,
  error,
  onChange,
}: {
  q: Question;
  value: string | string[] | undefined;
  error: string | undefined;
  onChange: (id: string, v: string | string[]) => void;
}) {
  const invalid = error !== undefined;
  return (
    <div id={`q-${q.id}`} className="space-y-2">
      <Label htmlFor={`f-${q.id}`} className="text-sm font-medium text-ink">
        {q.label}
        {q.required || q.adminOnly ? <span className="ms-1 text-seal">*</span> : null}
      </Label>
      {q.type === "textarea" ? (
        <Textarea
          id={`f-${q.id}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(q.id, e.target.value)}
          aria-invalid={invalid || undefined}
          rows={4}
          className="min-h-24 bg-white"
        />
      ) : q.type === "select" ? (
        <select
          id={`f-${q.id}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(q.id, e.target.value)}
          aria-invalid={invalid || undefined}
          className={selectClasses}
        >
          <option value="">— اختر —</option>
          {(q.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : q.type === "multiselect" ? (
        <div className="space-y-1">
          {(q.options ?? []).map((opt) => {
            const selected = Array.isArray(value) ? value : [];
            return (
              <label key={opt} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={(e) =>
                    onChange(
                      q.id,
                      e.target.checked ? [...selected, opt] : selected.filter((o) => o !== opt),
                    )
                  }
                  className="size-4 accent-olive"
                />
                {opt}
              </label>
            );
          })}
        </div>
      ) : (
        <Input
          id={`f-${q.id}`}
          type={q.type === "number" ? "number" : "text"}
          inputMode={q.type === "number" ? "numeric" : undefined}
          dir={q.type === "number" || q.id === "phone" ? "ltr" : undefined}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(q.id, e.target.value)}
          aria-invalid={invalid || undefined}
          className="h-11 bg-white text-start"
        />
      )}
      {invalid ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- condition line (male #11 links to واعي) ---------- */

function ConditionText({ text, linkWaei }: { text: string; linkWaei: boolean }) {
  if (linkWaei && text.includes("«واعي»")) {
    const [before, after] = text.split("«واعي»");
    return (
      <>
        {before}
        <a
          href={WAEI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-olive underline underline-offset-4 hover:text-olive-deep"
        >
          «واعي»
        </a>
        {after}
      </>
    );
  }
  return <>{text}</>;
}

/* ---------- the wizard ---------- */

function ApplyWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "1";

  const me = useQuery(api.users.me);
  const myForm = useQuery(api.forms.getMyForm, me ? {} : "skip");
  const createForm = useMutation(api.forms.createForm);
  const updateForm = useMutation(api.forms.updateForm);

  const [step, setStep] = useState(0);
  const [type, setType] = useState<FormType | null>(null);
  const [oathOk, setOathOk] = useState(false);
  const [publishOk, setPublishOk] = useState(false);
  const [conditionsOk, setConditionsOk] = useState(false);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // edit mode: prefill once from the existing form (consents stay unchecked on purpose)
  const prefilled = useRef(false);
  useEffect(() => {
    if (!editMode || prefilled.current || !myForm) return;
    prefilled.current = true;
    setType(myForm.type);
    const source = myForm.pendingAnswers ?? myForm.answers;
    const next: Values = {};
    for (const [key, val] of Object.entries(source)) {
      next[key] = typeof val === "number" ? String(val) : val;
    }
    setValues(next);
  }, [editMode, myForm]);

  /* ---- gates ---- */

  if (me === undefined || (me !== null && myForm === undefined)) {
    return <p className="py-16 text-center text-khaki">…جارٍ التحميل</p>;
  }

  if (me === null) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">التقديم يتطلب حسابًا</h1>
        <p className="mt-3 leading-7 text-khaki">
          لحفظ استمارتك ومتابعتها مع إدارة المبادرة، ادخل إلى حسابك أو أنشئ حسابًا جديدًا.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/login" className={linkButtonPrimary}>
            ادخل إلى حسابك
          </Link>
          <Link href="/register" className={linkButtonOutline}>
            أنشئ حسابًا
          </Link>
        </div>
      </div>
    );
  }

  if (myForm && !editMode) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">لديك استمارة مسجّلة</h1>
        <p className="mt-3 leading-7 text-khaki">
          لكل حساب استمارة واحدة. يمكنك متابعة حالتها أو تعديلها من صفحة حسابك.
        </p>
        <div className="mt-6">
          <Link href="/account" className={linkButtonPrimary}>
            اذهب إلى حسابي
          </Link>
        </div>
      </div>
    );
  }

  if (editMode && myForm === null) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">لا توجد استمارة لتعديلها</h1>
        <p className="mt-3 leading-7 text-khaki">ابدأ بتقديم استمارة جديدة أولًا.</p>
        <div className="mt-6">
          <Link href="/apply" className={linkButtonPrimary}>
            قدّم استمارتك
          </Link>
        </div>
      </div>
    );
  }

  /* ---- step logic ---- */

  const questions = type ? QUESTIONS[type] : [];

  function setAnswer(id: string, v: string | string[]) {
    setValues((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function validateQuestions(): boolean {
    const next: Record<string, string> = {};
    for (const q of questions) {
      const v = values[q.id];
      const empty =
        v === undefined || (typeof v === "string" ? v.trim() === "" : v.length === 0);
      if ((q.required || q.adminOnly) && empty) {
        next[q.id] = "هذا الحقل مطلوب، يرجى تعبئته.";
      } else if (q.type === "number" && !empty && typeof v === "string" && !Number.isFinite(Number(v))) {
        next[q.id] = "أدخل رقمًا صحيحًا.";
      }
    }
    setErrors(next);
    const firstId = questions.find((q) => q.id in next)?.id;
    if (firstId) {
      document.getElementById(`q-${firstId}`)?.scrollIntoView({ block: "center" });
    }
    return firstId === undefined;
  }

  function buildAnswers(): Record<string, string | number | string[]> {
    const out: Record<string, string | number | string[]> = {};
    for (const q of questions) {
      const v = values[q.id];
      if (v === undefined) continue;
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed === "") continue;
        out[q.id] = q.type === "number" ? Number(trimmed) : trimmed;
      } else if (v.length > 0) {
        out[q.id] = v;
      }
    }
    return out;
  }

  async function submit() {
    if (!type || !validateQuestions()) return;
    setBanner(null);
    setSubmitting(true);
    try {
      const answers = buildAnswers();
      if (editMode) {
        await updateForm({ answers });
      } else {
        await createForm({ type, answers });
      }
      router.push("/account");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const match = raw.match(/Uncaught Error:\s*([^\n]+)/);
      setBanner(
        match?.[1]?.trim() ??
          "تعذّر إرسال الاستمارة. تحقّق من اتصالك بالإنترنت وأعد المحاولة.",
      );
      setSubmitting(false);
    }
  }

  const canContinue =
    step === 0
      ? type !== null
      : step === 2
        ? oathOk
        : step === 3
          ? publishOk
          : step === 4
            ? conditionsOk
            : true;

  const conditions = type ? CONDITIONS[type] : [];

  /* ---- render ---- */

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-ink">
        {editMode ? "تعديل الاستمارة" : "تقديم استمارة"}
      </h1>
      <p className="mt-2 text-sm text-khaki">
        الخطوة {ARABIC_DIGITS[step]} من ٦ — {STEP_LABELS[step]}
      </p>

      <div className="mt-6">
        <StepDots current={step} />
      </div>

      <div key={step} className="mt-8 animate-in fade-in duration-150">
        {step === 0 ? (
          <div className="space-y-4">
            <p className="leading-7 text-khaki">
              {editMode
                ? "نوع الاستمارة ثابت ولا يمكن تغييره بعد التقديم."
                : "اختر نوع الاستمارة التي تريد تقديمها."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["male", "female"] as const).map((t) => {
                const selected = type === t;
                const locked = editMode && type !== null && type !== t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={locked}
                    onClick={() => setType(t)}
                    aria-pressed={selected}
                    className={
                      "rounded-md border-2 bg-white p-6 text-center transition-colors disabled:opacity-40 " +
                      (selected
                        ? "border-olive"
                        : "border-sand hover:border-khaki")
                    }
                  >
                    <span className="block font-display text-2xl font-bold text-ink">
                      {t === "male" ? "استمارة رجل" : "استمارة امرأة"}
                    </span>
                    <span className="mt-2 block text-sm text-khaki">
                      {t === "male" ? "للراغبين في الزواج" : "للراغبات في الزواج"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : step === 1 && type ? (
          <div className="space-y-4 rounded-md border border-sand bg-white p-6 sm:p-8">
            {INTRO[type].map((para) => (
              <p key={para} className="leading-8 text-ink">
                {para}
              </p>
            ))}
          </div>
        ) : step === 2 ? (
          <div className="space-y-6">
            <blockquote className="rounded-md border border-sand bg-white p-6 sm:p-8">
              <p className="font-display text-xl leading-10 text-ink">{OATH}</p>
            </blockquote>
            <ConsentCheck
              id="oath"
              label="أُقسم وأوافق"
              checked={oathOk}
              onChange={setOathOk}
            />
          </div>
        ) : step === 3 ? (
          <div className="space-y-6">
            <div className="rounded-md border border-sand bg-white p-6 sm:p-8">
              <p className="leading-8 text-ink">{PUBLISH_CONSENT}</p>
            </div>
            <ConsentCheck
              id="publish"
              label="أوافق على النشر"
              checked={publishOk}
              onChange={setPublishOk}
            />
          </div>
        ) : step === 4 ? (
          <div className="space-y-6">
            <ol className="space-y-0 rounded-md border border-sand bg-white p-6 sm:p-8">
              {conditions.map((cond, i) => (
                <li
                  key={cond}
                  className="flex gap-4 border-b border-sand py-3 leading-7 last:border-b-0"
                >
                  <span className="font-display text-lg leading-7 text-olive">
                    {(i + 1).toLocaleString("ar-EG")}
                  </span>
                  <span className="text-ink">
                    <ConditionText text={cond} linkWaei={type === "male" && i === 10} />
                  </span>
                </li>
              ))}
            </ol>
            <ConsentCheck
              id="conditions"
              label="أوافق على جميع الشروط"
              checked={conditionsOk}
              onChange={setConditionsOk}
            />
          </div>
        ) : (
          <div className="space-y-10">
            {banner === null ? null : (
              <p
                role="alert"
                className="rounded-md border border-seal/40 bg-seal/5 p-4 text-sm leading-6 text-seal"
              >
                {banner}
              </p>
            )}
            {[...new Set(questions.map((q) => q.group))].map((group) => (
              <section key={group}>
                <h2 className="flex items-center gap-4 text-lg font-bold text-ink after:h-px after:flex-1 after:bg-sand">
                  {group}
                </h2>
                <div className="mt-5 space-y-5">
                  {questions
                    .filter((q) => q.group === group)
                    .map((q) => (
                      <QuestionField
                        key={q.id}
                        q={q}
                        value={values[q.id]}
                        error={errors[q.id]}
                        onChange={setAnswer}
                      />
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-sand pt-6">
        {step > 0 ? (
          <Button
            variant="outline"
            className="h-11 px-6"
            onClick={() => setStep((s) => s - 1)}
            disabled={submitting}
          >
            السابق
          </Button>
        ) : (
          <span />
        )}
        {step < 5 ? (
          <Button
            className="h-11 px-8"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
          >
            متابعة
          </Button>
        ) : (
          <Button className="h-11 px-8" disabled={submitting} onClick={submit}>
            {submitting
              ? "…جارٍ الإرسال"
              : editMode
                ? "أرسِل التعديلات"
                : "أرسِل الاستمارة"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <section className="bg-paper px-4 py-12 sm:py-16">
      <Suspense fallback={<p className="py-16 text-center text-khaki">…جارٍ التحميل</p>}>
        <ApplyWizard />
      </Suspense>
    </section>
  );
}
