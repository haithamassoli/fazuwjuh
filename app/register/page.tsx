"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function arabicError(error: { code?: string; status: number }): string {
  if (error.code === "USER_ALREADY_EXISTS" || error.status === 422) {
    return "يوجد حساب بهذا البريد مسبقًا. يمكنك الدخول به مباشرة.";
  }
  if (error.code === "PASSWORD_TOO_SHORT") {
    return "كلمة المرور قصيرة؛ استخدم 8 أحرف على الأقل.";
  }
  return "تعذّر إنشاء الحساب. تحقّق من البيانات وأعد المحاولة.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;
    if (password !== data.get("confirm")) {
      setError("كلمتا المرور غير متطابقتين. أعد كتابتهما بشكل متطابق.");
      return;
    }
    setError(null);
    setPending(true);
    const result = await authClient.signUp.email({
      name: data.get("name") as string,
      email: data.get("email") as string,
      password,
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
        <h1 className="font-display text-3xl font-bold text-ink">حساب جديد</h1>
        <p className="mt-2 text-sm leading-6 text-khaki">
          التسجيل يتيح لك تقديم استمارتك والمحادثة مع إدارة المبادرة. اسمك لا
          يظهر للعموم.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input id="name" name="name" required autoComplete="name" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              dir="ltr"
              autoComplete="email"
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
              minLength={8}
              autoComplete="new-password"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className="h-11"
            />
          </div>

          {error === null ? null : (
            <p role="alert" className="text-sm leading-6 text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="h-11 w-full text-base">
            {pending ? "جارٍ إنشاء الحساب…" : "أنشئ الحساب"}
          </Button>
        </form>

        <p className="mt-6 border-t border-sand pt-5 text-center text-sm text-khaki">
          لديك حساب؟{" "}
          <Link href="/login" className="font-medium text-olive hover:text-olive-deep hover:underline">
            ادخل
          </Link>
        </p>
      </div>
    </section>
  );
}
