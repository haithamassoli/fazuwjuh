import type { Doc } from "@/convex/_generated/dataModel";
import { QUESTIONS } from "@/lib/forms/questions";

export type FormStatus = Doc<"forms">["status"];

export const STATUS_META: Record<
  FormStatus,
  { label: string; className: string }
> = {
  pending: { label: "قيد المراجعة", className: "bg-sand-light text-khaki" },
  published: { label: "منشورة", className: "bg-olive/10 text-olive" },
  rejected: { label: "مرفوضة", className: "bg-seal/10 text-seal" },
  matched: { label: "تم التوافق", className: "bg-seal text-paper" },
  archived: { label: "مؤرشفة", className: "bg-sand-light text-khaki" },
};

export const STATUS_ORDER: FormStatus[] = [
  "pending",
  "published",
  "rejected",
  "matched",
  "archived",
];

export const TYPE_LABELS: Record<Doc<"forms">["type"], string> = {
  male: "رجال",
  female: "نساء",
};

export function formatValue(
  value: string | number | string[] | undefined,
): string {
  if (value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join("، ");
  return String(value);
}

export function formatDate(timestamp: number): string {
  // Latin digits per the design brief (data/codes).
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(timestamp);
}

export function labelFor(type: Doc<"forms">["type"], key: string): string {
  return QUESTIONS[type].find((q) => q.id === key)?.label ?? key;
}
