"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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

function InterestArea({ formId }: { formId: string }) {
  const me = useQuery(api.users.me);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  void formId; // M6: wire api.interests.express with { toFormId: formId }

  if (me === undefined) {
    return null;
  }

  return (
    <div className="mt-10 border-t border-sand pt-8 text-center">
      {me === null ? (
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
      ) : (
        <>
          {/* M6: wire api.interests.express */}
          <Button disabled className="h-11 min-w-56 text-base">
            أبدِ اهتمامًا
          </Button>
          <p className="mt-3 text-sm text-khaki">
            سيُفعَّل إبداء الاهتمام قريبًا
          </p>
        </>
      )}
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

          <InterestArea formId={form.formId} />
        </article>
      )}
    </section>
  );
}
