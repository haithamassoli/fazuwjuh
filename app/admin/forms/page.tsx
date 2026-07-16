"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Seal } from "@/components/seal";
import {
  STATUS_META,
  STATUS_ORDER,
  TYPE_LABELS,
  formatDate,
  formatValue,
  type FormStatus,
} from "../lib";

const EMPTY_STATES: Record<FormStatus, string> = {
  pending: "لا توجد استمارات قيد المراجعة حاليًا.",
  published: "لا توجد استمارات منشورة.",
  rejected: "لا توجد استمارات مرفوضة.",
  matched: "لم يُسجَّل توافق في أي استمارة بعد.",
  archived: "لا توجد استمارات مؤرشفة.",
};

function isStatus(value: string | null): value is FormStatus {
  return value !== null && STATUS_ORDER.includes(value as FormStatus);
}

function FormsList() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("status");
  const status: FormStatus = isStatus(raw) ? raw : "pending";

  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.admin.listForms,
    { status },
    { initialNumItems: 20 },
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">الاستمارات</h1>

      <nav
        aria-label="حالة الاستمارات"
        className="mt-6 flex gap-1 overflow-x-auto border-b border-sand"
      >
        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/admin/forms?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={`-mb-px min-h-11 shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${
              s === status
                ? "border-olive font-medium text-olive"
                : "border-transparent text-khaki hover:text-ink"
            }`}
          >
            {STATUS_META[s].label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {pageStatus === "LoadingFirstPage" ? (
          <p className="text-sm text-khaki">…جارٍ التحميل</p>
        ) : results.length === 0 ? (
          <div className="rounded-md border border-sand bg-white p-8 text-center">
            <p className="text-sm leading-6 text-khaki">
              {EMPTY_STATES[status]}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-sand bg-white">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-sand text-start text-xs text-khaki">
                  <th className="px-4 py-3 text-start font-medium">الختم</th>
                  <th className="px-4 py-3 text-start font-medium">الاسم</th>
                  <th className="px-4 py-3 text-start font-medium">النوع</th>
                  <th className="px-4 py-3 text-start font-medium">العمر</th>
                  <th className="px-4 py-3 text-start font-medium">السكن</th>
                  <th className="px-4 py-3 text-start font-medium">
                    تاريخ التقديم
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    <span className="sr-only">التفاصيل</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((form) => (
                  <tr
                    key={form._id}
                    className="border-b border-sand last:border-b-0 hover:bg-sand-light/50"
                  >
                    <td className="px-4 py-2">
                      <Seal code={form.shortCode} size={40} />
                    </td>
                    <td className="px-4 py-2 font-medium text-ink">
                      {formatValue(form.answers.name)}
                    </td>
                    <td className="px-4 py-2 text-ink">
                      {TYPE_LABELS[form.type]}
                    </td>
                    <td className="px-4 py-2 text-ink">
                      {formatValue(form.answers.age)}
                    </td>
                    <td className="px-4 py-2 text-ink">
                      {formatValue(form.answers.residence)}
                    </td>
                    <td className="px-4 py-2 text-khaki" dir="ltr">
                      {formatDate(form.submittedAt)}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/forms/${form._id}`}
                        className="inline-flex min-h-11 items-center text-sm font-medium text-olive hover:text-olive-deep hover:underline"
                      >
                        عرض التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageStatus === "CanLoadMore" || pageStatus === "LoadingMore" ? (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="h-11 px-6"
              disabled={pageStatus === "LoadingMore"}
              onClick={() => loadMore(20)}
            >
              {pageStatus === "LoadingMore" ? "…جارٍ التحميل" : "تحميل المزيد"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminFormsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-khaki">…جارٍ التحميل</p>}>
      <FormsList />
    </Suspense>
  );
}
