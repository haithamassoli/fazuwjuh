"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Seal } from "@/components/seal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const dateFormatter = new Intl.DateTimeFormat("ar-JO-u-nu-latn", {
  dateStyle: "long",
});

function NotFoundCard() {
  return (
    <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center sm:p-10">
      <h1 className="font-display text-2xl font-bold text-ink">
        هذه الاستمارة غير موجودة أو غير منشورة
      </h1>
      <p className="mt-3 text-sm leading-6 text-khaki">
        قد تكون الاستمارة قد أُغلقت أو أن الرمز غير صحيح.
      </p>
      <Link
        href="/browse"
        className="mt-6 inline-block text-olive underline underline-offset-4 hover:text-olive-deep"
      >
        العودة إلى تصفّح الاستمارات
      </Link>
    </div>
  );
}

/** يستخرج رسالة الخطأ العربية من خطأ Convex؛ يعيد null إذا لم توجد. */
function arabicErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/Uncaught Error:\s*([^\n]+)/);
  const message = (match ? match[1] : error.message).trim();
  return /[؀-ۿ]/.test(message) ? message : null;
}

function InterestArea({
  formId,
  formType,
}: {
  formId: Id<"forms">;
  formType: "male" | "female";
}) {
  const me = useQuery(api.users.me);
  const myForm = useQuery(api.forms.getMyForm, me ? {} : "skip");
  const myInterest = useQuery(
    api.interests.myInterestIn,
    me ? { toFormId: formId } : "skip",
  );
  const express = useMutation(api.interests.express);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (
    me === undefined ||
    (me !== null && (myForm === undefined || myInterest === undefined))
  ) {
    return null;
  }

  async function confirmInterest() {
    setPending(true);
    setError(null);
    try {
      await express({ toFormId: formId });
      // نجاح: myInterestIn سيتحدّث تفاعليًا وتظهر حالة التأكيد
    } catch (err) {
      setError(
        arabicErrorMessage(err) ??
          "تعذّر إرسال الاهتمام. أعد المحاولة، وإن تكرر الخطأ راسل الإدارة.",
      );
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  }

  let body: React.ReactNode;
  if (me === null) {
    body = (
      <>
        <Button
          className="h-11 min-w-56 text-base"
          onClick={() => setGuestDialogOpen(true)}
        >
          أبدِ اهتمامًا
        </Button>
        <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>سجّل الدخول أولًا</DialogTitle>
              <DialogDescription className="leading-6">
                إبداء الاهتمام متاح للمسجّلين في المبادرة فقط، حفاظًا على
                خصوصية أصحاب الاستمارات. ادخل إلى حسابك أو أنشئ حسابًا جديدًا
                ثم عد إلى هذه الاستمارة.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                render={<Link href="/login" />}
                nativeButton={false}
                className="h-10"
              >
                دخول
              </Button>
              <Button
                render={<Link href="/register" />}
                nativeButton={false}
                variant="outline"
                className="h-10"
              >
                إنشاء حساب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  } else if (myForm?._id === formId) {
    body = <p className="text-sm text-khaki">هذه استمارتك</p>;
  } else if (!myForm || myForm.status !== "published") {
    body = (
      <>
        <Button disabled className="h-11 min-w-56 text-base">
          أبدِ اهتمامًا
        </Button>
        <p className="mt-3 text-sm text-khaki">
          يتطلب إبداء الاهتمام أن تكون لديك استمارة منشورة{" "}
          <Link
            href={myForm ? "/account" : "/apply"}
            className="text-olive underline underline-offset-4 hover:text-olive-deep"
          >
            {myForm ? "تابع حالة استمارتك" : "قدّم استمارتك"}
          </Link>
        </p>
      </>
    );
  } else if (myInterest !== null) {
    body = (
      <p className="rounded-md border border-olive/40 bg-olive/5 px-4 py-3 text-sm leading-6 text-olive-deep">
        تم إرسال اهتمامك إلى الإدارة، وستتولى التنسيق
      </p>
    );
  } else if (myForm.type === formType) {
    body = (
      <p className="text-sm text-khaki">
        إبداء الاهتمام متاح للاستمارات من النوع الآخر فقط
      </p>
    );
  } else {
    body = (
      <>
        <Button
          className="h-11 min-w-56 text-base"
          onClick={() => setConfirmOpen(true)}
        >
          أبدِ اهتمامًا
        </Button>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد إبداء الاهتمام</DialogTitle>
              <DialogDescription className="leading-6">
                سيصل اهتمامك إلى إدارة المبادرة لتتولى الوساطة بين الطرفين —
                لا يُشارك اسمك أو هاتفك مع الطرف الآخر.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                className="h-10"
                disabled={pending}
                onClick={confirmInterest}
              >
                {pending ? "…جارٍ الإرسال" : "تأكيد الاهتمام"}
              </Button>
              <Button
                variant="outline"
                className="h-10"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="mt-10 border-t border-sand pt-8 text-center">
      {error === null ? null : (
        <p className="mb-4 rounded-md border border-seal/40 bg-seal/5 px-4 py-3 text-sm leading-6 text-seal">
          {error}
        </p>
      )}
      {body}
    </div>
  );
}

export default function FormDetailPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = use(params);
  const form = useQuery(api.browse.getByShortCode, { shortCode });

  return (
    <section className="bg-paper px-4 py-16 sm:py-20">
      {form === undefined ? (
        <p className="text-center text-khaki">…جارٍ التحميل</p>
      ) : form === null ? (
        <NotFoundCard />
      ) : (
        <article className="mx-auto max-w-2xl rounded-md border border-sand bg-white p-6 sm:p-10">
          <header className="flex flex-col items-center gap-4 border-b border-sand pb-8 text-center">
            <Seal code={form.shortCode} size={96} />
            <div>
              <h1 className="font-display text-3xl font-bold text-ink">
                {form.type === "male" ? "استمارة رجل" : "استمارة امرأة"}
              </h1>
              {form.publishedAt === undefined ? null : (
                <p className="mt-2 text-sm text-khaki">
                  نُشرت في {dateFormatter.format(new Date(form.publishedAt))}
                </p>
              )}
            </div>
          </header>

          {form.groups.map((group) => (
            <section key={group.title} className="mt-8">
              <div className="flex items-center gap-3">
                <h2 className="shrink-0 text-lg font-bold text-ink">
                  {group.title}
                </h2>
                <span aria-hidden className="h-px grow bg-sand" />
              </div>
              <dl className="mt-4">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 border-b border-sand py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="w-44 shrink-0 text-sm font-medium text-khaki">
                      {item.label}
                    </dt>
                    <dd className="leading-7 text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <InterestArea formId={form.formId} formType={form.type} />
        </article>
      )}
    </section>
  );
}
