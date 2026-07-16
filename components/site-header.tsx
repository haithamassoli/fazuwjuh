import Link from "next/link";

const NAV = [
  { href: "/browse", label: "التصفّح" },
  { href: "/apply", label: "قدّم استمارتك" },
  { href: "/account", label: "حسابي" },
  { href: "/chat", label: "المحادثة" },
] as const;

// M2 makes the «دخول» action auth-aware.
export function SiteHeader() {
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
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2.5 text-ink hover:bg-muted hover:text-olive-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="ms-auto inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-olive-deep"
        >
          دخول
        </Link>
      </div>
    </header>
  );
}
