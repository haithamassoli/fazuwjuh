"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { QUESTIONS, CARD_FIELDS } from "@/lib/forms/questions";
import { Seal } from "@/components/seal";
import { Input } from "@/components/ui/input";

type FormType = "male" | "female";

const ALL = "__all__";

const selectClass =
  "h-11 w-full rounded-md border border-sand bg-white px-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-olive focus-visible:ring-2 focus-visible:ring-olive/40";

function optionsOf(type: FormType, id: string): string[] {
  return QUESTIONS[type].find((q) => q.id === id)?.options ?? [];
}

function labelsOf(type: FormType): Record<string, string> {
  const map: Record<string, string> = {};
  for (const q of QUESTIONS[type]) map[q.id] = q.label;
  return map;
}

type CardItem = {
  formId: string;
  shortCode: string;
  card: Record<string, string | number | undefined>;
};

function FormCard({
  item,
  labels,
}: {
  item: CardItem;
  labels: Record<string, string>;
}) {
  return (
    <article className="flex flex-col rounded-md border border-sand bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]">
      <div className="flex items-start">
        <Seal code={item.shortCode} size={56} />
      </div>
      <dl className="mt-4 flex-1">
        {CARD_FIELDS.map((id) => (
          <div
            key={id}
            className="flex gap-4 border-b border-sand py-2.5 text-sm last:border-b-0"
          >
            <dt className="w-28 shrink-0 font-medium text-khaki">
              {labels[id]}
            </dt>
            <dd className="min-w-0 text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
              {item.card[id] ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
      <footer className="mt-4 border-t border-sand pt-3">
        <Link
          href={`/forms/${item.shortCode}`}
          className="text-sm font-medium text-olive transition-colors hover:text-olive-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
        >
          عرض التفاصيل
        </Link>
      </footer>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-md border border-sand bg-white p-5">
      <div className="size-14 rounded-full bg-sand-light" />
      <div className="mt-4 space-y-3">
        {CARD_FIELDS.map((id) => (
          <div key={id} className="h-4 rounded bg-sand-light" />
        ))}
      </div>
      <div className="mt-4 h-4 w-24 rounded bg-sand-light" />
    </div>
  );
}

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type: FormType =
    searchParams.get("type") === "female" ? "female" : "male";

  // فلاتر — العمر بنصّه الخام ثم قيمة مؤجّلة (debounce) تُرسل للاستعلام.
  const [ageMinText, setAgeMinText] = useState("");
  const [ageMaxText, setAgeMaxText] = useState("");
  const [ageMin, setAgeMin] = useState<number | undefined>(undefined);
  const [ageMax, setAgeMax] = useState<number | undefined>(undefined);
  const [residence, setResidence] = useState(ALL);
  const [maritalStatus, setMaritalStatus] = useState(ALL);

  useEffect(() => {
    const t = setTimeout(() => {
      const min = Number.parseInt(ageMinText, 10);
      const max = Number.parseInt(ageMaxText, 10);
      setAgeMin(Number.isNaN(min) ? undefined : min);
      setAgeMax(Number.isNaN(max) ? undefined : max);
    }, 400);
    return () => clearTimeout(t);
  }, [ageMinText, ageMaxText]);

  const labels = useMemo(() => labelsOf(type), [type]);
  const residenceOptions = optionsOf(type, "residence");
  const maritalOptions = optionsOf(type, "maritalStatus");

  function switchType(next: FormType) {
    if (next === type) return;
    // خيارات الحالة الاجتماعية تختلف بين النوعين — تُصفَّر عند التبديل.
    setMaritalStatus(ALL);
    router.replace(`/browse?type=${next}`, { scroll: false });
  }

  function clearFilters() {
    setAgeMinText("");
    setAgeMaxText("");
    setAgeMin(undefined);
    setAgeMax(undefined);
    setResidence(ALL);
    setMaritalStatus(ALL);
  }

  const { results, status, loadMore } = usePaginatedQuery(
    api.browse.listPublished,
    {
      type,
      ...(ageMin !== undefined ? { ageMin } : {}),
      ...(ageMax !== undefined ? { ageMax } : {}),
      ...(residence !== ALL ? { residence } : {}),
      ...(maritalStatus !== ALL ? { maritalStatus } : {}),
    },
    { initialNumItems: 12 },
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header>
        <p className="text-sm font-medium text-khaki">السجل العام</p>
        <h1 className="mt-1 flex items-baseline gap-4 font-sans text-2xl font-bold text-ink sm:text-3xl">
          تصفّح الاستمارات المنشورة
          <span aria-hidden="true" className="h-px flex-1 bg-sand" />
        </h1>
      </header>

      {/* تبويبا الرجال والنساء */}
      <div role="tablist" aria-label="نوع الاستمارات" className="mt-8 flex border-b border-sand">
        {(
          [
            ["male", "رجال"],
            ["female", "نساء"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={type === value}
            onClick={() => switchType(value)}
            className={
              "-mb-px h-12 min-w-28 border-b-2 px-6 text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive " +
              (type === value
                ? "border-olive font-bold text-olive-deep"
                : "border-transparent text-khaki hover:text-ink")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* شريط الفلاتر */}
      <div className="mt-6 rounded-md border border-sand bg-sand-light/60 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[1fr_1fr_1.4fr_1.4fr_auto] lg:items-end">
          <div>
            <label htmlFor="ageMin" className="mb-1.5 block text-sm font-medium text-khaki">
              العمر من
            </label>
            <Input
              id="ageMin"
              type="number"
              inputMode="numeric"
              min={18}
              value={ageMinText}
              onChange={(e) => setAgeMinText(e.target.value)}
              className="h-11 bg-white"
            />
          </div>
          <div>
            <label htmlFor="ageMax" className="mb-1.5 block text-sm font-medium text-khaki">
              العمر إلى
            </label>
            <Input
              id="ageMax"
              type="number"
              inputMode="numeric"
              min={18}
              value={ageMaxText}
              onChange={(e) => setAgeMaxText(e.target.value)}
              className="h-11 bg-white"
            />
          </div>
          <div>
            <label htmlFor="residence" className="mb-1.5 block text-sm font-medium text-khaki">
              السكن
            </label>
            <select
              id="residence"
              value={residence}
              onChange={(e) => setResidence(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>الكل</option>
              {residenceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="maritalStatus" className="mb-1.5 block text-sm font-medium text-khaki">
              الحالة الاجتماعية
            </label>
            <select
              id="maritalStatus"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>الكل</option>
              {maritalOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="col-span-2 h-11 rounded-md border border-sand bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-sand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive sm:col-span-4 lg:col-span-1"
          >
            مسح الفلاتر
          </button>
        </div>
      </div>

      {/* النتائج */}
      {status === "LoadingFirstPage" ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-8 rounded-md border border-sand bg-white px-6 py-16 text-center">
          <p className="text-base text-ink">
            لا توجد استمارات منشورة تطابق هذه الفلاتر
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm font-medium text-olive transition-colors hover:text-olive-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
          >
            مسح الفلاتر
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item) => (
              <FormCard key={item.formId} item={item} labels={labels} />
            ))}
          </div>
          {status === "CanLoadMore" || status === "LoadingMore" ? (
            <div className="mt-10 text-center">
              <button
                onClick={() => loadMore(12)}
                disabled={status === "LoadingMore"}
                className="inline-flex h-12 min-w-44 items-center justify-center rounded-md border border-sand bg-white px-6 text-base font-medium text-ink transition-colors hover:bg-sand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "LoadingMore" ? "…جارٍ التحميل" : "تحميل المزيد"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function BrowsePage() {
  // useSearchParams يستلزم حدّ Suspense في صفحات العميل.
  return (
    <Suspense fallback={null}>
      <BrowseContent />
    </Suspense>
  );
}
