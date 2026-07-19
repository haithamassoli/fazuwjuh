"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TIME_FORMAT = new Intl.DateTimeFormat("ar-JO-u-nu-latn", {
  dateStyle: "short",
  timeStyle: "short",
});

function MessageBubble({ message }: { message: Doc<"messages"> }) {
  const time = (
    <p className="mt-1 text-xs text-khaki">
      {TIME_FORMAT.format(message._creationTime)}
    </p>
  );
  if (message.senderRole === "admin") {
    return (
      <div className="max-w-[85%] self-start rounded-md border border-sand border-s-2 border-s-olive bg-white px-4 py-3">
        <p className="text-xs font-medium text-olive">الإدارة</p>
        <p className="mt-1 text-sm leading-6 whitespace-pre-line text-ink">
          {message.body}
        </p>
        {time}
      </div>
    );
  }
  return (
    <div className="max-w-[85%] self-end rounded-md bg-sand-light px-4 py-3">
      <p className="text-sm leading-6 whitespace-pre-line text-ink">
        {message.body}
      </p>
      {time}
    </div>
  );
}

function ChatPanel() {
  const myThread = useQuery(api.chat.myThread);
  const threadId = myThread?.threadId;
  const userUnread = myThread?.userUnread ?? 0;

  const { results, status, loadMore } = usePaginatedQuery(
    api.chat.messages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 40 },
  );
  const ordered = [...results].reverse(); // query is desc; render oldest→newest
  const newestId = results[0]?._id;

  const send = useMutation(api.chat.send);
  const markRead = useMutation(api.chat.markRead);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages (newestId is stable across loadMore).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [newestId]);

  // Mark admin messages read when the thread loads / new ones arrive while visible.
  // userUnread > 0 guards against loops: after markRead it drops to 0 reactively.
  useEffect(() => {
    if (!threadId || userUnread === 0) {
      return;
    }
    const mark = () => {
      if (document.visibilityState === "visible") {
        void markRead({ threadId });
      }
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [threadId, userUnread, newestId, markRead]);

  async function onSend() {
    const body = draft.trim();
    if (!body || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await send({ body });
      setDraft("");
    } catch {
      setError("تعذّر إرسال الرسالة — تحقّق من اتصالك ثم أعد المحاولة");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 rounded-md border border-sand bg-white">
      <div
        ref={scrollRef}
        className="flex max-h-[55vh] min-h-64 flex-col gap-3 overflow-y-auto overscroll-contain p-4 sm:p-6"
      >
        {status === "CanLoadMore" ? (
          <button
            type="button"
            onClick={() => loadMore(40)}
            className="inline-flex min-h-11 items-center self-center rounded-md px-3 py-2 text-sm font-medium text-olive hover:text-olive-deep hover:underline"
          >
            عرض رسائل أسبق
          </button>
        ) : null}
        {myThread === undefined ||
        (myThread !== null && status === "LoadingFirstPage") ? (
          <p className="m-auto text-sm text-khaki">…جارٍ التحميل</p>
        ) : myThread === null || ordered.length === 0 ? (
          <div className="m-auto max-w-sm py-8 text-center">
            <p className="text-sm leading-6 text-khaki">
              أهلًا بك. اكتب رسالتك الأولى هنا وستصل إلى إدارة المبادرة مباشرة،
              وسيُرَدّ عليك في هذه الصفحة.
            </p>
          </div>
        ) : (
          ordered.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))
        )}
      </div>

      {error ? (
        <div className="border-t border-seal/30 bg-seal/5 px-4 py-3">
          <p role="alert" className="text-sm text-seal">{error}</p>
        </div>
      ) : null}

      <form
        className="flex items-end gap-3 border-t border-sand p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          placeholder="اكتب رسالتك…"
          aria-label="نص الرسالة"
          disabled={sending}
          className="max-h-40 min-h-11 bg-white"
        />
        <Button
          type="submit"
          disabled={sending || draft.trim().length === 0}
          className="h-11 shrink-0 px-6"
        >
          إرسال
        </Button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  const me = useQuery(api.users.me);

  if (me === undefined) {
    return (
      <section className="bg-paper px-4 py-16">
        <p className="mx-auto max-w-3xl text-sm text-khaki">…جارٍ التحميل</p>
      </section>
    );
  }

  if (me === null) {
    return (
      <section className="bg-paper px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-md border border-sand bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">المحادثة</h1>
          <p className="mt-3 text-sm leading-6 text-khaki">
            للتواصل مع إدارة المبادرة سجّل الدخول أولًا — التسجيل وحده يكفي
            لبدء المحادثة، دون الحاجة إلى تقديم استمارة.
          </p>
          <Button
            className="mt-6 h-11 px-6 text-base"
            nativeButton={false}
            render={<Link href="/login">ادخل إلى حسابك</Link>}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-paper px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-ink">
          محادثتك مع إدارة المبادرة
        </h1>
        <p className="mt-2 text-sm leading-6 text-khaki">
          هذه المحادثة خاصة وسرّية؛ تصل رسائلك إلى إدارة المبادرة فقط.
        </p>
        <ChatPanel />
      </div>
    </section>
  );
}
