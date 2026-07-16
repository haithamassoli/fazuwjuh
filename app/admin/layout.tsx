"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin/forms", label: "الاستمارات" },
  { href: "/admin/edits", label: "طلبات التعديل" },
  { href: "/admin/interests", label: "الاهتمامات" },
  { href: "/admin/chats", label: "المحادثات" },
  { href: "/admin/deletions", label: "طلبات الحذف" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = useQuery(api.users.me);
  const pathname = usePathname();

  if (me === undefined) {
    return (
      <section className="bg-paper px-4 py-16">
        <p className="mx-auto max-w-3xl text-sm text-khaki">…جارٍ التحميل</p>
      </section>
    );
  }

  if (me === null || me.role !== "admin") {
    return (
      <section className="bg-paper px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">
            غير مصرّح
          </h1>
          <p className="mt-3 text-sm leading-6 text-khaki">
            هذه الصفحة مخصّصة لإدارة المبادرة فقط.
          </p>
          <Button
            className="mt-6 h-11 px-6 text-base"
            nativeButton={false}
            render={<Link href="/">عُد إلى الصفحة الرئيسة</Link>}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-paper px-4 py-8 sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-44">
          <p className="text-xs font-medium tracking-wide text-khaki">
            لوحة الإدارة
          </p>
          <nav
            aria-label="أقسام لوحة الإدارة"
            className="mt-3 flex gap-1 overflow-x-auto lg:flex-col"
          >
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`min-h-11 shrink-0 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-sand-light font-medium text-ink"
                      : "text-khaki hover:bg-sand-light/60 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}
