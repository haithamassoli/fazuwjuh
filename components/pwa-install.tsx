"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * دعوة تثبيت التطبيق (PWA). تسجّل عامل الخدمة، وتعرض شريطًا لتثبيت التطبيق:
 * زر تثبيت أصلي عبر `beforeinstallprompt` على Chrome/Android، وتعليمات يدوية
 * على iOS. يختفي بعد التثبيت أو الإغلاق (يُحفظ في localStorage).
 */
export function PwaInstall() {
  const [mode, setMode] = useState<"install" | "ios" | null>(null);
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {}

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
      setMode("install");
    };
    const onInstalled = () => {
      setMode(null);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {}
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — nudge with manual steps.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const iosTimer = isIOS
      ? window.setTimeout(() => setMode((m) => m ?? "ios"), 2500)
      : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setMode(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {}
    setDeferred(null);
    dismiss();
  }

  if (!mode) return null;

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .pwa-install-in { animation: pwa-install-in 260ms ease-out both; }
        }
        @keyframes pwa-install-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <aside
        aria-label="تثبيت التطبيق"
        className="pwa-install-in fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-sand bg-card p-4 shadow-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.svg"
          alt=""
          width={44}
          height={44}
          className="mt-0.5 size-11 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-ink">ثبّت تطبيق فَزَوِّجُوهُ</p>
          {mode === "install" ? (
            <>
              <p className="mt-1 text-sm leading-6 text-khaki">
                أضِفه إلى جهازك للوصول السريع دون فتح المتصفّح.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-3 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-olive-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
              >
                <Download aria-hidden="true" className="size-4" />
                تثبيت التطبيق
              </button>
            </>
          ) : (
            <p className="mt-1 flex flex-wrap items-center gap-x-1 text-sm leading-6 text-khaki">
              للتثبيت: افتح قائمة المشاركة
              <IosShareGlyph />
              ثم اختر «أضِف إلى الشاشة الرئيسية».
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="إغلاق"
          className="-me-1 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-khaki transition-colors hover:bg-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </aside>
    </>
  );
}

function IosShareGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="inline-block size-4 align-text-bottom text-olive"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M8 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}
