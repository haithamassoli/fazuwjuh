"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Seal } from "@/components/seal";
import { QUESTIONS, type Question } from "@/lib/forms/questions";
import { STATUS_META, TYPE_LABELS, formatValue } from "../../lib";

function ContactSection({
  form,
}: {
  form: Doc<"forms"> & { ownerEmail: string };
}) {
  const contactQuestions = QUESTIONS[form.type].filter((q) => q.adminOnly);
  return (
    <section className="rounded-md border border-seal/40 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ink">بيانات التواصل</h2>
        <Badge className="bg-seal/10 text-seal">لا تُنشر للعموم</Badge>
      </div>
      <dl className="mt-4">
        {contactQuestions.map((q) => (
          <div
            key={q.id}
            className="grid grid-cols-1 gap-1 border-b border-sand py-3 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-4"
          >
            <dt className="text-sm text-khaki">{q.label}</dt>
            <dd className="text-sm leading-6 text-ink">
              {q.id === "phone" ? (
                <span dir="ltr" className="font-mono">
                  {formatValue(form.answers[q.id])}
                </span>
              ) : (
                formatValue(form.answers[q.id])
              )}
            </dd>
          </div>
        ))}
        <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-sm text-khaki">البريد الإلكتروني للحساب</dt>
          <dd className="text-sm leading-6 text-ink">
            <span dir="ltr" className="font-mono">
              {form.ownerEmail || "—"}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function AnswerGroups({ form }: { form: Doc<"forms"> }) {
  const groups: { name: string; questions: Question[] }[] = [];
  for (const q of QUESTIONS[form.type]) {
    if (q.adminOnly || form.answers[q.id] === undefined) continue;
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
          <dl className="mt-3">
            {group.questions.map((q) => (
              <div
                key={q.id}
                className="grid grid-cols-1 gap-1 border-b border-sand py-3 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-4"
              >
                <dt className="text-sm text-khaki">{q.label}</dt>
                <dd className="text-sm leading-6 whitespace-pre-line text-ink">
                  {formatValue(form.answers[q.id])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function PendingActions({ formId }: { formId: Id<"forms"> }) {
  const approve = useMutation(api.admin.approve);
  const reject = useMutation(api.admin.reject);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onApprove() {
    setBusy(true);
    setError("");
    try {
      await approve({ formId });
      setApproveOpen(false);
    } catch {
      setError("تعذّر قبول الاستمارة — أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    setBusy(true);
    setError("");
    try {
      await reject({ formId, reason: reason.trim() });
      setRejectOpen(false);
    } catch {
      setError("تعذّر رفض الاستمارة — أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-md border border-sand bg-white p-5">
      <p className="text-sm leading-6 text-khaki">
        هذه الاستمارة قيد المراجعة — قرارك يُبلَّغ لصاحبها فورًا.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogTrigger render={<Button className="h-11 px-6" />}>
            قبول ونشر
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>قبول ونشر الاستمارة</DialogTitle>
              <DialogDescription>
                ستُنشر الاستمارة في صفحة التصفّح العامة دون بيانات التواصل.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" className="h-11 px-4" />}>
                إلغاء
              </DialogClose>
              <Button className="h-11 px-6" disabled={busy} onClick={onApprove}>
                {busy ? "…جارٍ النشر" : "قبول ونشر"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={rejectOpen}
          onOpenChange={(open) => {
            setRejectOpen(open);
            if (!open) setReason("");
          }}
        >
          <DialogTrigger
            render={<Button variant="destructive" className="h-11 px-6" />}
          >
            رفض
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفض الاستمارة</DialogTitle>
              <DialogDescription>
                يظهر السبب لصاحب الاستمارة ليعدّلها ويعيد إرسالها.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">سبب الرفض (إلزامي)</Label>
              <Textarea
                id="rejection-reason"
                value={reason}
                required
                rows={4}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اذكر ما يلزم تصحيحه في الاستمارة"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" className="h-11 px-4" />}>
                إلغاء
              </DialogClose>
              <Button
                variant="destructive"
                className="h-11 px-6"
                disabled={busy || reason.trim() === ""}
                onClick={onReject}
              >
                {busy ? "…جارٍ الرفض" : "رفض الاستمارة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-seal">{error}</p> : null}
    </div>
  );
}

export default function AdminFormDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);
  const form = useQuery(api.admin.getForm, {
    formId: formId as Id<"forms">,
  });

  if (form === undefined) {
    return <p className="text-sm text-khaki">…جارٍ التحميل</p>;
  }

  const status = STATUS_META[form.status];

  return (
    <div>
      <Link
        href="/admin/forms"
        className="text-sm text-khaki hover:text-ink hover:underline"
      >
        → عودة إلى الاستمارات
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Seal
          code={form.shortCode}
          size={72}
          filled={form.status === "matched"}
        />
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            استمارة {formatValue(form.answers.name)}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={status.className}>{status.label}</Badge>
            <Badge variant="outline">{TYPE_LABELS[form.type]}</Badge>
          </div>
        </div>
      </div>

      {form.status === "pending" ? <PendingActions formId={form._id} /> : null}

      {form.status === "rejected" && form.rejectionReason ? (
        <div className="mt-6 rounded-md border border-seal/30 bg-seal/5 p-4">
          <p className="text-sm font-medium text-seal">سبب الرفض الحالي</p>
          <p className="mt-1 text-sm leading-6 text-ink">
            {form.rejectionReason}
          </p>
        </div>
      ) : null}

      {form.status === "published" && form.pendingAnswers ? (
        <div className="mt-6 rounded-md border border-sand bg-sand-light p-4">
          <p className="text-sm leading-6 text-ink">
            لدى هذه الاستمارة تعديل معلّق بانتظار المراجعة.{" "}
            <Link
              href="/admin/edits"
              className="font-medium text-olive hover:text-olive-deep hover:underline"
            >
              راجعه في طلبات التعديل
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <ContactSection form={form} />
        <div className="rounded-md border border-sand bg-white p-5 sm:p-6">
          <AnswerGroups form={form} />
        </div>
      </div>
    </div>
  );
}
