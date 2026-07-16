"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { formatDate } from "../lib";

function errorText(e: unknown): string {
  // Convex wraps thrown server errors as "... Uncaught Error: <message>".
  const message = e instanceof Error ? e.message : "";
  const match = message.match(/Uncaught Error:\s*([^\n]+)/);
  return match ? match[1].trim() : "تعذّر تنفيذ الحذف — أعد المحاولة.";
}

function ExecuteAction({ requestId }: { requestId: Id<"deletionRequests"> }) {
  const execute = useMutation(api.deletion.execute);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await execute({ requestId });
      setOpen(false);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              className="h-11 border-seal px-4 text-seal hover:bg-seal/5 hover:text-seal"
            />
          }
        >
          تنفيذ الحذف النهائي
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تنفيذ الحذف النهائي</DialogTitle>
            <DialogDescription>
              سيُحذف نهائيًا: الاستمارة، الاهتمامات، المحادثة، الملف؛ لا
              تراجع.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" className="h-11 px-4" />}
            >
              إلغاء
            </DialogClose>
            <Button
              variant="destructive"
              className="h-11 px-6"
              disabled={busy}
              onClick={confirm}
            >
              {busy ? "…جارٍ التنفيذ" : "تأكيد الحذف النهائي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {error ? (
        <p className="mt-2 text-sm leading-6 text-seal">{error}</p>
      ) : null}
    </div>
  );
}

export default function AdminDeletionsPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.deletion.adminList,
    {},
    { initialNumItems: 20 },
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">
        طلبات الحذف
      </h1>

      <div className="mt-6">
        {status === "LoadingFirstPage" ? (
          <p className="text-sm text-khaki">…جارٍ التحميل</p>
        ) : results.length === 0 ? (
          <div className="rounded-md border border-sand bg-white p-8 text-center">
            <p className="text-sm leading-6 text-khaki">
              لا توجد طلبات حذف معلّقة
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-sand bg-white">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-sand text-xs text-khaki">
                  <th className="px-4 py-3 text-start font-medium">
                    البريد الإلكتروني
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    الاستمارة
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    تاريخ الطلب
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    <span className="sr-only">الإجراء</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((req) => (
                  <tr
                    key={req._id}
                    className="border-b border-sand last:border-b-0 hover:bg-sand-light/50"
                  >
                    <td className="px-4 py-3 text-ink" dir="ltr">
                      {req.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {req.form ? (
                        <span className="flex items-center gap-3">
                          <Seal code={req.form.shortCode} size={40} />
                          <span className="font-medium text-ink">
                            {req.form.name || "—"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-khaki">بلا استمارة</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-khaki" dir="ltr">
                      {formatDate(req._creationTime)}
                    </td>
                    <td className="px-4 py-3">
                      <ExecuteAction requestId={req._id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {status === "CanLoadMore" || status === "LoadingMore" ? (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="h-11 px-6"
              disabled={status === "LoadingMore"}
              onClick={() => loadMore(20)}
            >
              {status === "LoadingMore" ? "…جارٍ التحميل" : "تحميل المزيد"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
