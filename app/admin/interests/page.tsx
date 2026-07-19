"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, usePaginatedQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
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
import { Seal } from "@/components/seal";
import { formatDate } from "../lib";

type InterestStatus = Doc<"interests">["status"];
type Tab = "all" | InterestStatus;

type FormSummary = {
  formId: Id<"forms">;
  shortCode: string;
  type: Doc<"forms">["type"];
  name: string;
  userId: string;
} | null;

type InterestItem = Doc<"interests"> & {
  fromForm: FormSummary;
  toForm: FormSummary;
};

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "new", label: "جديد" },
  { key: "in_progress", label: "قيد المتابعة" },
  { key: "closed_matched", label: "مغلق (توافق)" },
  { key: "closed_rejected", label: "مغلق (مرفوض)" },
];

const STATUS_META: Record<InterestStatus, { label: string; className: string }> = {
  new: { label: "جديد", className: "border border-seal bg-transparent text-seal" },
  in_progress: { label: "قيد المتابعة", className: "bg-olive/10 text-olive" },
  closed_matched: { label: "مغلق (توافق)", className: "bg-seal text-paper" },
  closed_rejected: { label: "مغلق (مرفوض)", className: "bg-sand-light text-khaki" },
};

const PERSON_LABELS: Record<Doc<"forms">["type"], string> = {
  male: "رجل",
  female: "امرأة",
};

const EMPTY_STATES: Record<Tab, string> = {
  all: "لم يُسجَّل أي طلب اهتمام بعد.",
  new: "لا توجد طلبات اهتمام جديدة.",
  in_progress: "لا توجد طلبات قيد المتابعة حاليًا.",
  closed_matched: "لا توجد طلبات مغلقة بتوافق.",
  closed_rejected: "لا توجد طلبات مغلقة بالرفض.",
};

function isTab(value: string | null): value is Tab {
  return value !== null && TABS.some((t) => t.key === value);
}

function errorText(e: unknown): string {
  // Convex wraps thrown server errors as "... Uncaught Error: <message>".
  const message = e instanceof Error ? e.message : "";
  const match = message.match(/Uncaught Error:\s*([^\n]+)/);
  return match ? match[1].trim() : "تعذّر تنفيذ الإجراء — أعد المحاولة.";
}

function FormSide({ label, form }: { label: string; form: FormSummary }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {form ? <Seal code={form.shortCode} size={44} /> : null}
      <div className="min-w-0">
        <p className="text-xs text-khaki">{label}</p>
        {form ? (
          <>
            <p className="truncate text-sm font-medium text-ink">
              {form.name || "—"}
            </p>
            <p className="text-xs text-khaki">{PERSON_LABELS[form.type]}</p>
          </>
        ) : (
          <p className="text-sm text-khaki">استمارة محذوفة</p>
        )}
      </div>
    </div>
  );
}

function RowActions({ interest }: { interest: InterestItem }) {
  const setStatus = useMutation(api.interests.setStatus);
  const announceMatch = useMutation(api.interests.announceMatch);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open =
    interest.status === "new" || interest.status === "in_progress";

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      setRejectOpen(false);
      setMatchOpen(false);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-sand pt-4">
      <div className="flex flex-wrap items-center gap-3">
        {interest.status === "new" ? (
          <Button
            className="h-11 px-5"
            disabled={busy}
            onClick={() =>
              run(() =>
                setStatus({ interestId: interest._id, status: "in_progress" }),
              )
            }
          >
            {busy ? "…جارٍ الحفظ" : "بدء المتابعة"}
          </Button>
        ) : null}

        {open ? (
          <>
            <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
              <DialogTrigger
                render={<Button variant="outline" className="h-11 px-5 border-seal text-seal hover:bg-seal/5 hover:text-seal" />}
              >
                إعلان التوافق
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إعلان التوافق</DialogTitle>
                  <DialogDescription>
                    سيتم نقل الاستمارتين إلى (تم التوافق)، وإخفاؤهما من
                    التصفح، وإغلاق كل الاهتمامات المفتوحة المرتبطة بهما
                    تلقائيًا. هذا الإجراء لا يمكن التراجع عنه.
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
                    onClick={() =>
                      run(() => announceMatch({ interestId: interest._id }))
                    }
                  >
                    {busy ? "…جارٍ الإعلان" : "تأكيد إعلان التوافق"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger
                render={<Button variant="outline" className="h-11 px-5" />}
              >
                إغلاق (رفض)
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إغلاق طلب الاهتمام (رفض)</DialogTitle>
                  <DialogDescription>
                    سيُغلق هذا الطلب دون توافق، وتبقى الاستمارتان منشورتين.
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
                    onClick={() =>
                      run(() =>
                        setStatus({
                          interestId: interest._id,
                          status: "closed_rejected",
                        }),
                      )
                    }
                  >
                    {busy ? "…جارٍ الإغلاق" : "إغلاق الطلب"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}

        {interest.fromForm ? (
          <Link
            href={`/admin/chats?user=${interest.fromForm.userId}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-olive hover:text-olive-deep hover:underline"
          >
            محادثة المُبدي
          </Link>
        ) : null}
        {interest.toForm ? (
          <Link
            href={`/admin/chats?user=${interest.toForm.userId}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-olive hover:text-olive-deep hover:underline"
          >
            محادثة صاحب/ة الاستمارة
          </Link>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-seal">{error}</p> : null}
    </div>
  );
}

function InterestCard({ interest }: { interest: InterestItem }) {
  const status = STATUS_META[interest.status];
  return (
    <article className="rounded-md border border-sand bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <FormSide label="من" form={interest.fromForm} />
        <ArrowLeft aria-hidden className="size-4 shrink-0 text-khaki" />
        <FormSide label="إلى" form={interest.toForm} />
        <div className="ms-auto flex items-center gap-3">
          <span className="text-xs text-khaki" dir="ltr">
            {formatDate(interest._creationTime)}
          </span>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
      </div>
      <RowActions interest={interest} />
    </article>
  );
}

function InterestsList() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("status");
  const tab: Tab = isTab(raw) ? raw : "all";

  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.interests.list,
    { status: tab === "all" ? undefined : tab },
    { initialNumItems: 20 },
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">الاهتمامات</h1>

      <nav
        aria-label="حالة طلبات الاهتمام"
        className="mt-6 flex gap-1 overflow-x-auto border-b border-sand"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/interests?status=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={`-mb-px min-h-11 shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${
              t.key === tab
                ? "border-olive font-medium text-olive"
                : "border-transparent text-khaki hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {pageStatus === "LoadingFirstPage" ? (
          <p className="text-sm text-khaki">…جارٍ التحميل</p>
        ) : results.length === 0 ? (
          <div className="rounded-md border border-sand bg-white p-8 text-center">
            <p className="text-sm leading-6 text-khaki">{EMPTY_STATES[tab]}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((interest) => (
              <InterestCard key={interest._id} interest={interest} />
            ))}
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

export default function AdminInterestsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-khaki">…جارٍ التحميل</p>}>
      <InterestsList />
    </Suspense>
  );
}
