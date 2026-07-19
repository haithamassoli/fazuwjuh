"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const PUBLIC_NAV = [
  { href: "/browse", label: "التصفّح" },
  { href: "/apply", label: "قدّم استمارتك" },
] as const;

const USER_NAV = [
  { href: "/account", label: "حسابي" },
  { href: "/chat", label: "المحادثة" },
] as const;

export function SiteHeader() {
  const router = useRouter();
  const me = useQuery(api.users.me);
  const thread = useQuery(api.chat.myThread, me ? {} : "skip");
  const hasUnread = (thread?.userUnread ?? 0) > 0;
  const nav = me
    ? me.role === "admin"
      ? [...PUBLIC_NAV, ...USER_NAV, { href: "/admin", label: "لوحة الإدارة" }]
      : [...PUBLIC_NAV, ...USER_NAV]
    : PUBLIC_NAV;

  async function onSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
        <Link
          href="/"
          className="py-1 font-display text-2xl font-bold text-ink hover:text-olive-deep"
        >
          فَزَوِّجُوهُ
        </Link>
        <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2.5 text-ink hover:bg-muted hover:text-olive-deep"
            >
              {item.label}
              {item.href === "/chat" && hasUnread ? (
                <span
                  aria-label="لديك رسائل غير مقروءة"
                  className="ms-1.5 inline-block size-2 rounded-full bg-seal align-middle"
                />
              ) : null}
            </Link>
          ))}
        </nav>
        {me === undefined ? (
          <span className="ms-auto min-h-11" aria-hidden="true" />
        ) : me === null ? (
          <Link
            href="/login"
            className="ms-auto inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-olive-deep"
          >
            دخول
          </Link>
        ) : (
          <button
            type="button"
            onClick={onSignOut}
            className="ms-auto inline-flex min-h-11 items-center rounded-md border border-sand px-5 text-sm font-medium text-ink hover:bg-sand-light"
          >
            خروج
          </button>
        )}
      </div>
    </header>
  );
}
