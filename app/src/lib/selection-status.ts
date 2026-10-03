export const SELECTION_STATUS_OPTIONS = [
  "未応募",
  "応募済み",
  "書類選考中",
  "一次面接",
  "二次面接",
  "最終面接",
  "内定",
  "不採用",
  "辞退",
] as const;

export type SelectionStatus = (typeof SELECTION_STATUS_OPTIONS)[number];

const LEGACY_STATUS_MAP: Record<string, SelectionStatus> = {
  未エントリー: "未応募",
  ES提出: "応募済み",
  Webテスト: "書類選考中",
  "1次面接": "一次面接",
  "2次面接": "二次面接",
  お祈り: "不採用",
  not_entered: "未応募",
};

export function isSelectionStatus(value: string): value is SelectionStatus {
  return SELECTION_STATUS_OPTIONS.includes(value as SelectionStatus);
}

export function normalizeSelectionStatus(value: string): SelectionStatus {
  if (isSelectionStatus(value)) {
    return value;
  }

  return LEGACY_STATUS_MAP[value] ?? "未応募";
}

export function getSelectionStatusIndex(value: string) {
  return SELECTION_STATUS_OPTIONS.indexOf(normalizeSelectionStatus(value));
}

export function canAdvanceSelectionStatus(current: string, next: string) {
  if (!isSelectionStatus(next)) {
    return false;
  }

  return getSelectionStatusIndex(next) >= getSelectionStatusIndex(current);
}
