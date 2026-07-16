"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Seal } from "@/components/seal";
import { QUESTIONS, type Question } from "@/lib/forms/questions";

const STATUS: Record<
  Doc<"forms">["status"],
  { label: string; className: string }
> = {
  pending: { label: "قيد المراجعة", className: "bg-sand-light text-khaki" },
  published: { label: "منشورة", className: "bg-olive/10 text-olive" },
  rejected: { label: "مرفوضة", className: "bg-seal/10 text-seal" },
  matched: { label: "تم التوافق", className: "bg-seal text-paper" },
  archived: { label: "مؤرشفة", className: "bg-sand-light text-khaki" },
};

function formatAnswer(value: string | number | string[]): string {
  if (Array.isArray(value)) return value.join("، ");
  return String(value);
}

function AnswerGroups({ form }: { form: Doc<"forms"> }) {
  const questions = QUESTIONS[form.type];
  const groups: { name: string; questions: Question[] }[] = [];
  for (const q of questions) {
    if (form.answers[q.id] === undefined) continue;
    const last = groups[groups.length - 1];
    if (last && last.name === q.group) {
      last.questions.push(q);
    } else {
      groups.push({ name: q.group, questions: [q] });
    }
  }
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.name}>
          <div className="flex items-center gap-3">
            <h3 className="shrink-0 text-sm font-medium text-khaki">
              {group.name}
            </h3>
            <span aria-hidden className="h-px grow bg-sand" />
          </div>
          {group.questions.some((q) => q.adminOnly) ? (
            <p className="mt-2 text-xs leading-5 text-khaki">
              يظهران للإدارة فقط ولا يُنشران
            </p>
          ) : null}
          <dl className="mt-3">
            {group.questions.map((q) => (
              <div
                key={q.id}
                className="grid grid-cols-1 gap-1 border-b border-sand py-3 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-4"
              >
                <dt className="text-sm text-khaki">{q.label}</dt>
                <dd className="text-sm leading-6 whitespace-pre-line text-ink">
                  {q.id === "phone" ? (
                    <span dir="ltr" className="font-mono">
                      {formatAnswer(form.answers[q.id])}
                    </span>
                  ) : (
                    formatAnswer(form.answers[q.id])
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function FormCard({ form }: { form: Doc<"forms"> }) {
  const status = STATUS[form.status];
  const editable = form.status !== "matched" && form.status !== "archived";
  return (
    <div className="rounded-md border border-sand bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Seal code={form.shortCode} size={72} filled={form.status === "matched"} />
          <div>
            <h2 className="text-lg font-bold text-ink">استمارتي</h2>
            <Badge className={`mt-1 ${status.className}`}>{status.label}</Badge>
          </div>
        </div>
        {editable ? (
          <Button
            variant="outline"
            className="h-11 px-4"
            nativeButton={false}
            render={<Link href="/apply?edit=1">تعديل الاستمارة</Link>}
          />
        ) : null}
      </div>

      {form.status === "rejected" && form.rejectionReason ? (
        <div className="mt-6 rounded-md border border-seal/30 bg-seal/5 p-4">
          <p className="text-sm font-medium text-seal">سبب الرفض</p>
          <p className="mt-1 text-sm leading-6 text-ink">
            {form.rejectionReason}
          </p>
          <Link
            href="/apply?edit=1"
            className="mt-3 inline-block text-sm font-medium text-olive hover:text-olive-deep hover:underline"
          >
            عدّل استمارتك وأعد إرسالها
          </Link>
        </div>
      ) : null}

      {form.status === "published" && form.pendingAnswers ? (
        <div className="mt-6 rounded-md border border-sand bg-sand-light p-4">
          <p className="text-sm leading-6 text-ink">
            لديك تعديل قيد مراجعة الإدارة
          </p>
        </div>
      ) : null}

      <div className="mt-8">
        <AnswerGroups form={form} />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const me = useQuery(api.users.me);
  const form = useQuery(api.forms.getMyForm, me ? {} : "skip");

  if (me === undefined) {
    return (
      <section className="bg-paper px-4 py-16">
        <p className="mx-auto max-w-3xl text-sm text-khaki">…جارٍ التحميل</p>
      </section>
    );
  }

  if (me === null) {
    return (
      <section className="bg-paper px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">حسابي</h1>
          <p className="mt-3 text-sm leading-6 text-khaki">
            هذه الصفحة تتطلّب تسجيل الدخول لعرض بيانات حسابك واستمارتك.
          </p>
          <Button
            className="mt-6 h-11 px-6 text-base"
            nativeButton={false}
            render={<Link href="/login">ادخل إلى حسابك</Link>}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-paper px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-ink">حسابي</h1>
        <p className="mt-2 text-sm text-khaki">
          <span dir="ltr">{me.email}</span>
        </p>

        <div className="mt-8">
          {form === undefined ? (
            <p className="text-sm text-khaki">…جارٍ التحميل</p>
          ) : form === null ? (
            <div className="rounded-md border border-sand bg-white p-8 text-center">
              <p className="text-sm leading-6 text-khaki">
                لم تقدّم استمارة بعد — قدّم استمارتك الآن
              </p>
              <Button
                className="mt-5 h-11 px-6 text-base"
                nativeButton={false}
                render={<Link href="/apply">قدّم استمارتك</Link>}
              />
            </div>
          ) : (
            <FormCard form={form} />
          )}
        </div>
      </div>
    </section>
  );
}
