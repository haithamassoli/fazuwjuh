"use client";

// Next 16: the second prop is `retry` (renamed from `reset`).
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="bg-paper px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center sm:p-10">
        <h1 className="font-display text-2xl font-bold text-ink">
          حدث خطأ غير متوقع
        </h1>
        <p className="mt-3 text-sm leading-6 text-khaki">
          لم تُحمَّل هذه الصفحة بشكل صحيح. أعد المحاولة، وإن تكرر الخطأ راسل
          إدارة المبادرة من صفحة المحادثة.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-khaki" dir="ltr">
            {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-olive px-6 text-base font-medium text-paper transition-colors hover:bg-olive-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
        >
          أعد المحاولة
        </button>
      </div>
    </section>
  );
}
