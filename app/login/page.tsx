"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function arabicError(error: { code?: string; status: number }): string {
  if (error.code === "INVALID_EMAIL_OR_PASSWORD" || error.status === 401) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقّق منهما وأعد المحاولة.";
  }
  return "تعذّر تسجيل الدخول. أعد المحاولة بعد قليل.";
}

export default function LoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    const result = await authClient.signIn.email({
      email: data.get("email") as string,
      password: data.get("password") as string,
    });
    if (result.error) {
      setError(arabicError(result.error));
      setPending(false);
    } else {
      router.push("/account");
    }
  }

  return (
    <section className="bg-paper px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 sm:p-10">
        <h1 className="font-display text-3xl font-bold text-ink">دخول</h1>
        <p className="mt-2 text-sm leading-6 text-khaki">
          ادخل إلى حسابك لمتابعة استمارتك ومحادثة إدارة المبادرة.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              dir="ltr"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              className="h-11 text-start"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-11"
            />
          </div>

          {error === null ? null : (
            <p role="alert" className="text-sm leading-6 text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="h-11 w-full text-base">
            {pending ? "جارٍ الدخول…" : "ادخل"}
          </Button>
        </form>

        <p className="mt-6 border-t border-sand pt-5 text-center text-sm text-khaki">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-medium text-olive hover:text-olive-deep hover:underline">
            سجّل الآن
          </Link>
        </p>
      </div>
    </section>
  );
}
