export const ES_DOCUMENT_TYPE_OPTIONS = [
  { value: "entry_sheet", label: "エントリーシート" },
  { value: "self_pr", label: "自己PR" },
  { value: "gakuchika", label: "ガクチカ" },
  { value: "motivation", label: "志望動機" },
  { value: "other", label: "その他" },
] as const;

export type EsDocumentType = (typeof ES_DOCUMENT_TYPE_OPTIONS)[number]["value"];

export type EsDocument = {
  id: string;
  company_id: string;
  doc_type: string;
  title: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export function isEsDocumentType(value: string): value is EsDocumentType {
  return ES_DOCUMENT_TYPE_OPTIONS.some((option) => option.value === value);
}

export function getEsDocumentTypeLabel(value: string) {
  return (
    ES_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    "その他"
  );
}

export function formatEsUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
