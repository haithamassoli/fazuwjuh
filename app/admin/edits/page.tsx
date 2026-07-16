"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
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
import { Seal } from "@/components/seal";
import { QUESTIONS } from "@/lib/forms/questions";
import { formatValue, labelFor } from "../lib";

type DiffRow = { key: string; label: string; oldValue: string; newValue: string };

function diffRows(form: Doc<"forms">): DiffRow[] {
  const pending = form.pendingAnswers ?? {};
  const ordered = QUESTIONS[form.type].map((q) => q.id);
  const union = new Set([...Object.keys(form.answers), ...Object.keys(pending)]);
  const keys = [
    ...ordered.filter((k) => union.has(k)),
    ...[...union].filter((k) => !ordered.includes(k)),
  ];
  return keys
    .map((key) => ({
      key,
      label: labelFor(form.type, key),
      oldValue: formatValue(form.answers[key]),
      newValue: formatValue(pending[key]),
    }))
    .filter((row) => row.oldValue !== row.newValue);
}

function EditRequestCard({ form }: { form: Doc<"forms"> }) {
  const approveEdit = useMutation(api.admin.approveEdit);
  const rejectEdit = useMutation(api.admin.rejectEdit);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rows = diffRows(form);

  async function run(action: "approve" | "reject") {
    setBusy(true);
    setError("");
    try {
      if (action === "approve") {
        await approveEdit({ formId: form._id });
        setApproveOpen(false);
      } else {
        await rejectEdit({ formId: form._id });
        setRejectOpen(false);
      }
    } catch {
      setError("تعذّر تنفيذ الإجراء — أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-sand bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Seal code={form.shortCode} size={48} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-ink">
            {formatValue(form.answers.name)}
          </h2>
          <Link
            href={`/admin/forms/${form._id}`}
            className="text-sm text-olive hover:text-olive-deep hover:underline"
          >
            عرض الاستمارة كاملة
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-khaki">
          لا فروق فعلية بين النسختين — يمكن قبول التعديل أو رفضه لإغلاق الطلب.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-sand">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-sand text-xs text-khaki">
                <th className="px-4 py-2.5 text-start font-medium">الحقل</th>
                <th className="px-4 py-2.5 text-start font-medium">القديم</th>
                <th className="px-4 py-2.5 text-start font-medium">الجديد</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-sand last:border-b-0"
                >
                  <td className="px-4 py-2.5 align-top text-khaki">
                    {row.label}
                  </td>
                  <td className="px-4 py-2.5 align-top leading-6 whitespace-pre-line text-ink">
                    {row.oldValue}
                  </td>
                  <td className="bg-olive/10 px-4 py-2.5 align-top leading-6 font-medium whitespace-pre-line text-olive-deep">
                    {row.newValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogTrigger render={<Button className="h-11 px-6" />}>
            قبول التعديل
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>قبول التعديل</DialogTitle>
              <DialogDescription>
                تحلّ الإجابات الجديدة محلّ الحالية وتظهر مباشرة في الاستمارة
                المنشورة.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" className="h-11 px-4" />}>
                إلغاء
              </DialogClose>
              <Button
                className="h-11 px-6"
                disabled={busy}
                onClick={() => run("approve")}
              >
                {busy ? "…جارٍ الحفظ" : "قبول التعديل"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger
            render={<Button variant="destructive" className="h-11 px-6" />}
          >
            رفض التعديل
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفض التعديل</DialogTitle>
              <DialogDescription>
                يُحذف التعديل المعلّق وتبقى الاستمارة المنشورة كما هي.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" className="h-11 px-4" />}>
                إلغاء
              </DialogClose>
              <Button
                variant="destructive"
                className="h-11 px-6"
                disabled={busy}
                onClick={() => run("reject")}
              >
                {busy ? "…جارٍ الحذف" : "رفض التعديل"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {error ? <p className="mt-3 text-sm text-seal">{error}</p> : null}
    </div>
  );
}

export default function AdminEditsPage() {
  const forms = useQuery(api.admin.listPendingEdits);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">
        طلبات التعديل
      </h1>
      <div className="mt-6">
        {forms === undefined ? (
          <p className="text-sm text-khaki">…جارٍ التحميل</p>
        ) : forms.length === 0 ? (
          <div className="rounded-md border border-sand bg-white p-8 text-center">
            <p className="text-sm leading-6 text-khaki">
              لا توجد طلبات تعديل معلّقة حاليًا.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {forms.map((form) => (
              <EditRequestCard key={form._id} form={form} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
