export const APP_TIME_ZONE = "Asia/Tokyo";

export type CalendarView = "month" | "week";

export type CalendarEvent = {
  id: string;
  title: string;
  event_type: string;
  start_at: string;
  end_at: string | null;
  related_company_id: string | null;
};

export const EVENT_TYPE_OPTIONS = [
  { value: "briefing", label: "説明会" },
  { value: "interview", label: "面接" },
  { value: "deadline", label: "締切" },
  { value: "other", label: "その他" },
] as const;

export type EventType = (typeof EVENT_TYPE_OPTIONS)[number]["value"];

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const EVENT_TYPE_LABELS: Record<string, string> = {
  briefing: "説明会",
  seminar: "説明会",
  interview: "面接",
  deadline: "締切",
  other: "その他",
};

const EVENT_TYPE_STYLES: Record<string, string> = {
  briefing: "border-sky-200 bg-sky-50 text-sky-800",
  seminar: "border-sky-200 bg-sky-50 text-sky-800",
  interview: "border-violet-200 bg-violet-50 text-violet-800",
  deadline: "border-rose-200 bg-rose-50 text-rose-800",
  other: "border-slate-200 bg-slate-50 text-slate-700",
};

function parseDateKeyParts(value: string): DateParts | null {
  const match = DATE_KEY_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function fromUtcDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function normalizeDateKey(value: string | undefined) {
  if (!value || !parseDateKeyParts(value)) {
    return null;
  }

  return value;
}

export function todayDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function eventDateKey(value: string) {
  return todayDateKey(new Date(value));
}

export function shiftDateKey(value: string, amount: number) {
  const parts = parseDateKeyParts(value);

  if (!parts) {
    throw new Error(`Invalid date key: ${value}`);
  }

  return fromUtcDate(
    new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount)),
  );
}

function getWeekday(value: string) {
  const parts = parseDateKeyParts(value);

  if (!parts) {
    throw new Error(`Invalid date key: ${value}`);
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function getCalendarPeriod(view: CalendarView, anchorKey: string) {
  const parts = parseDateKeyParts(anchorKey);

  if (!parts) {
    throw new Error(`Invalid date key: ${anchorKey}`);
  }

  if (view === "week") {
    const startKey = shiftDateKey(anchorKey, -getWeekday(anchorKey));
    const dayKeys = Array.from({ length: 7 }, (_, index) =>
      shiftDateKey(startKey, index),
    );

    return {
      startKey,
      endKeyExclusive: shiftDateKey(startKey, 7),
      dayKeys,
      previousKey: shiftDateKey(anchorKey, -7),
      nextKey: shiftDateKey(anchorKey, 7),
      label: `${formatDateLabel(dayKeys[0], false)}〜${formatDateLabel(dayKeys[6], false)}`,
    };
  }

  const monthStartKey = `${parts.year}-${String(parts.month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(
    Date.UTC(parts.year, parts.month, 0),
  ).getUTCDate();
  const gridStartKey = shiftDateKey(monthStartKey, -getWeekday(monthStartKey));
  const cellCount = Math.ceil((getWeekday(monthStartKey) + daysInMonth) / 7) * 7;
  const dayKeys = Array.from({ length: cellCount }, (_, index) =>
    shiftDateKey(gridStartKey, index),
  );
  const previousMonth = new Date(Date.UTC(parts.year, parts.month - 2, 1));
  const nextMonth = new Date(Date.UTC(parts.year, parts.month, 1));

  return {
    startKey: gridStartKey,
    endKeyExclusive: shiftDateKey(gridStartKey, cellCount),
    dayKeys,
    previousKey: fromUtcDate(previousMonth),
    nextKey: fromUtcDate(nextMonth),
    label: `${parts.year}年${parts.month}月`,
  };
}

export function dateKeyToStartIso(value: string) {
  return new Date(`${value}T00:00:00+09:00`).toISOString();
}

export function formatDateLabel(value: string, includeWeekday = true) {
  const parts = parseDateKeyParts(value);

  if (!parts) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(includeWeekday ? { weekday: "short" as const } : {}),
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

export function formatEventDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getEventTypeLabel(eventType: string) {
  return EVENT_TYPE_LABELS[eventType] ?? "その他";
}

export function getEventTypeStyle(eventType: string) {
  return EVENT_TYPE_STYLES[eventType] ?? EVENT_TYPE_STYLES.other;
}

export function isEventType(value: string): value is EventType {
  return EVENT_TYPE_OPTIONS.some((option) => option.value === value);
}

export function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function buildCalendarHref(
  view: CalendarView,
  date: string,
  eventId?: string,
) {
  const params = new URLSearchParams({ view, date });

  if (eventId) {
    params.set("event", eventId);
  }

  return `/calendar?${params.toString()}${eventId ? "#event-detail" : ""}`;
}
