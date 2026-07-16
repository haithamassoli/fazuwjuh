import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-paper px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center sm:p-10">
        <p className="font-mono text-sm text-khaki" dir="ltr">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">
          هذه الصفحة غير موجودة
        </h1>
        <p className="mt-3 text-sm leading-6 text-khaki">
          قد يكون الرابط غير صحيح أو أن الصفحة أُزيلت.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md bg-olive px-6 text-base font-medium text-paper transition-colors hover:bg-olive-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
          >
            الصفحة الرئيسة
          </Link>
          <Link
            href="/browse"
            className="inline-flex h-11 items-center justify-center rounded-md border border-sand px-6 text-base font-medium text-ink transition-colors hover:bg-sand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
          >
            تصفّح الاستمارات
          </Link>
        </div>
      </div>
    </section>
  );
}
