"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, usePaginatedQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "../lib";

type InboxRow = {
  threadId: Id<"threads">;
  userId: string;
  lastMessageAt: number;
  adminUnread: number;
  email: string;
  displayName: string;
};

const RTF = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function relativeTime(ts: number): string {
  const minutes = Math.round((Date.now() - ts) / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return RTF.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return RTF.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return RTF.format(-days, "day");
  return formatDate(ts);
}

function errorText(e: unknown): string {
  const message = e instanceof Error ? e.message : "";
  const match = message.match(/Uncaught Error:\s*([^\n]+)/);
  return match ? match[1].trim() : "تعذّر إرسال الرسالة — أعد المحاولة.";
}

function InboxRowButton({
  row,
  active,
  onSelect,
}: {
  row: InboxRow;
  active: boolean;
  onSelect: (userId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(row.userId)}
      aria-current={active ? "true" : undefined}
      className={`flex min-h-11 w-full items-center gap-3 px-4 py-3 text-start transition-colors ${
        active ? "bg-sand-light" : "hover:bg-sand-light/60"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {row.displayName}
        </p>
        <p className="truncate text-xs text-khaki">{row.email}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs text-khaki">
          {relativeTime(row.lastMessageAt)}
        </span>
        {row.adminUnread > 0 ? (
          <span
            aria-label={`${row.adminUnread} رسائل غير مقروءة`}
            className="inline-flex min-w-5 items-center justify-center rounded-full bg-seal px-1.5 py-0.5 font-mono text-xs text-paper"
          >
            {row.adminUnread}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function Composer({ userId }: { userId: string }) {
  const adminSend = useMutation(api.chat.adminSend);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const trimmed = body.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    try {
      await adminSend({ userId, body: trimmed });
      setBody("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-sand p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="اكتب ردّ الإدارة…"
          aria-label="نص الرسالة"
          className="max-h-40 min-h-11 flex-1"
        />
        <Button
          className="h-11 shrink-0 px-5"
          disabled={busy || body.trim().length === 0}
          onClick={() => void send()}
        >
          {busy ? "…جارٍ الإرسال" : "إرسال"}
        </Button>
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-seal">{error}</p> : null}
    </div>
  );
}

function Thread({ row }: { row: InboxRow }) {
  const markRead = useMutation(api.chat.markRead);
  const { results, status, loadMore } = usePaginatedQuery(
    api.chat.messages,
    { threadId: row.threadId },
    { initialNumItems: 30 },
  );
  // Query returns newest-first; render oldest → newest.
  const ordered = results.slice().reverse();
  const lastId = ordered.at(-1)?._id;

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  // Clear admin unread on open and whenever new user messages arrive.
  const { threadId, adminUnread } = row;
  useEffect(() => {
    if (adminUnread > 0) {
      void markRead({ threadId });
    }
  }, [threadId, adminUnread, markRead]);

  return (
    <>
      <div ref={listRef} className="h-[55vh] overflow-y-auto p-4">
        {status === "LoadingFirstPage" ? (
          <p className="text-sm text-khaki">…جارٍ التحميل</p>
        ) : (
          <>
            {status === "CanLoadMore" || status === "LoadingMore" ? (
              <div className="mb-4 text-center">
                <Button
                  variant="outline"
                  className="h-9 px-4 text-xs"
                  disabled={status === "LoadingMore"}
                  onClick={() => loadMore(30)}
                >
                  {status === "LoadingMore"
                    ? "…جارٍ التحميل"
                    : "تحميل رسائل أقدم"}
                </Button>
              </div>
            ) : null}
            {ordered.length === 0 ? (
              <p className="text-center text-sm text-khaki">
                لا رسائل في هذه المحادثة بعد.
              </p>
            ) : (
              <ul className="space-y-3">
                {ordered.map((message) => {
                  const fromAdmin = message.senderRole === "admin";
                  return (
                    <li
                      key={message._id}
                      className={`flex flex-col ${
                        fromAdmin ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap rounded-md px-3.5 py-2.5 text-sm leading-6 sm:max-w-[70%] ${
                          fromAdmin
                            ? "bg-olive text-paper"
                            : "border border-sand bg-white text-ink"
                        }`}
                      >
                        {message.body}
                      </div>
                      <span className="mt-1 text-[11px] text-khaki" dir="ltr">
                        {TIME_FMT.format(message._creationTime)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
      <Composer userId={row.userId} />
    </>
  );
}

function ChatsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("user");

  const { results, status, loadMore } = usePaginatedQuery(
    api.chat.adminInbox,
    {},
    { initialNumItems: 20 },
  );

  const selectedRow =
    selectedUserId === null
      ? undefined
      : results.find((r) => r.userId === selectedUserId);
  // ponytail: a threaded user beyond the loaded inbox pages falls into the
  // "no thread yet" panel — adminSend appends to the existing thread anyway,
  // and sending bumps it into the first page.

  function select(userId: string) {
    router.replace(`/admin/chats?user=${encodeURIComponent(userId)}`);
  }

  const hasSelection = selectedUserId !== null;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">المحادثات</h1>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Inbox — hidden on mobile while a thread is open */}
        <aside
          className={`shrink-0 lg:block lg:w-80 ${hasSelection ? "hidden" : ""}`}
        >
          <div className="overflow-hidden rounded-md border border-sand bg-white">
            {status === "LoadingFirstPage" ? (
              <p className="p-4 text-sm text-khaki">…جارٍ التحميل</p>
            ) : results.length === 0 ? (
              <p className="p-6 text-center text-sm leading-6 text-khaki">
                لا محادثات بعد. تبدأ المحادثة عندما يراسل مستخدم الإدارة، أو
                عند مراسلته من صفحة الاهتمامات.
              </p>
            ) : (
              <div className="divide-y divide-sand">
                {results.map((row) => (
                  <InboxRowButton
                    key={row.threadId}
                    row={row}
                    active={row.userId === selectedUserId}
                    onSelect={select}
                  />
                ))}
              </div>
            )}
          </div>
          {status === "CanLoadMore" || status === "LoadingMore" ? (
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                className="h-11 px-6"
                disabled={status === "LoadingMore"}
                onClick={() => loadMore(20)}
              >
                {status === "LoadingMore" ? "…جارٍ التحميل" : "تحميل المزيد"}
              </Button>
            </div>
          ) : null}
        </aside>

        {/* Detail — full width on mobile when selected */}
        <section
          className={`min-w-0 flex-1 lg:block ${hasSelection ? "" : "hidden"}`}
        >
          {selectedUserId === null ? (
            <div className="rounded-md border border-sand bg-white p-10 text-center">
              <p className="text-sm text-khaki">اختر محادثة</p>
            </div>
          ) : status === "LoadingFirstPage" ? (
            <div className="rounded-md border border-sand bg-white p-10 text-center">
              <p className="text-sm text-khaki">…جارٍ التحميل</p>
            </div>
          ) : (
            <div className="flex flex-col rounded-md border border-sand bg-white">
              <header className="flex items-center gap-3 border-b border-sand px-4 py-3">
                <button
                  type="button"
                  onClick={() => router.replace("/admin/chats")}
                  aria-label="عودة إلى قائمة المحادثات"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-khaki transition-colors hover:bg-sand-light hover:text-ink lg:hidden"
                >
                  <ArrowRight aria-hidden className="size-5" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {selectedRow?.displayName ?? "مستخدم"}
                  </p>
                  {selectedRow ? (
                    <p className="truncate text-xs text-khaki">
                      {selectedRow.email}
                    </p>
                  ) : null}
                </div>
              </header>
              {selectedRow ? (
                <Thread row={selectedRow} />
              ) : (
                <>
                  <div className="flex h-[55vh] items-center justify-center p-6">
                    <p className="text-center text-sm leading-6 text-khaki">
                      لا محادثة لهذا المستخدم بعد. اكتب رسالة أدناه لبدء
                      المحادثة.
                    </p>
                  </div>
                  <Composer userId={selectedUserId} />
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AdminChatsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-khaki">…جارٍ التحميل</p>}>
      <ChatsView />
    </Suspense>
  );
}
