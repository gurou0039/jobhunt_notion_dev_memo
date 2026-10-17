import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildCalendarHref,
  CalendarEvent,
  CalendarView,
  dateKeyToStartIso,
  eventOccursOnDate,
  formatDateLabel,
  formatEventDateTime,
  formatEventTime,
  getCalendarPeriod,
  getEventTypeLabel,
  getEventTypeStyle,
  normalizeDateKey,
  shiftDateKey,
  todayDateKey,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type PageProps = {
  searchParams: Promise<{
    view?: string;
    date?: string;
    event?: string;
  }>;
};

function EventLink({
  event,
  view,
  anchorKey,
  compact = false,
}: {
  event: CalendarEvent;
  view: CalendarView;
  anchorKey: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={buildCalendarHref(view, anchorKey, event.id)}
      className={`block rounded-md border transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${getEventTypeStyle(event.event_type)} ${compact ? "px-1.5 py-1" : "p-3"}`}
    >
      <span className={`${compact ? "text-[11px]" : "text-xs"} block font-medium`}>
        {getEventTypeLabel(event.event_type)} · {formatEventTime(event.start_at)}
      </span>
      <span className={`${compact ? "text-xs" : "text-sm"} mt-0.5 block truncate font-semibold`}>
        {event.title}
      </span>
    </Link>
  );
}

function getPreviewEvents(anchorKey: string): CalendarEvent[] {
  const at = (dateKey: string, time: string) =>
    new Date(`${dateKey}T${time}:00+09:00`).toISOString();

  return [
    {
      id: "preview-interview",
      title: "最終面接",
      event_type: "interview",
      start_at: at(anchorKey, "10:00"),
      end_at: at(anchorKey, "11:00"),
      related_company_id: null,
    },
    {
      id: "preview-briefing",
      title: "オンライン会社説明会",
      event_type: "briefing",
      start_at: at(shiftDateKey(anchorKey, 1), "14:00"),
      end_at: at(shiftDateKey(anchorKey, 1), "15:30"),
      related_company_id: null,
    },
    {
      id: "preview-deadline",
      title: "エントリーシート提出締切",
      event_type: "deadline",
      start_at: at(shiftDateKey(anchorKey, 3), "18:00"),
      end_at: null,
      related_company_id: null,
    },
  ];
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const isLocalPreview = process.env.CALENDAR_PREVIEW === "true";
  const supabase = await createClient();

  if (!isLocalPreview) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
  }

  const params = await searchParams;
  const view: CalendarView = params.view === "week" ? "week" : "month";
  const anchorKey = normalizeDateKey(params.date) ?? todayDateKey();
  const period = getCalendarPeriod(view, anchorKey);
  const periodStartIso = dateKeyToStartIso(period.startKey);
  const queryResult = isLocalPreview
    ? { data: getPreviewEvents(anchorKey), error: null }
    : await supabase
        .from("events")
        .select("id,title,event_type,start_at,end_at,related_company_id")
        .lt("start_at", dateKeyToStartIso(period.endKeyExclusive))
        .or(`start_at.gte.${periodStartIso},end_at.gt.${periodStartIso}`)
        .order("start_at", { ascending: true });
  const { data, error } = queryResult;
  const events = (data ?? []) as CalendarEvent[];
  const eventsByDate = new Map<string, CalendarEvent[]>();

  for (const dateKey of period.dayKeys) {
    const dayEvents = events.filter((event) => eventOccursOnDate(event, dateKey));

    if (dayEvents.length > 0) {
      eventsByDate.set(dateKey, dayEvents);
    }
  }

  const selectedEvent = params.event
    ? events.find((event) => event.id === params.event)
    : undefined;
  const monthKey = anchorKey.slice(0, 7);
  const agendaDays = period.dayKeys.filter((dateKey) =>
    view === "week"
      ? true
      : dateKey.startsWith(monthKey) && (eventsByDate.get(dateKey)?.length ?? 0) > 0,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:py-0">
          <div>
            <p className="text-xs font-medium text-blue-600">Job Hunt Dashboard</p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">カレンダー</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">ダッシュボード</Link>
            <Link href="/settings" className="text-blue-600 hover:underline">設定</Link>
            <form action="/logout" method="post">
              <button type="submit" className="rounded-md bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:px-4 sm:py-8">
        <section className="rounded-xl bg-white p-4 shadow sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">予定を見渡す</h2>
              <p className="mt-1 text-sm text-slate-600">
                面接・説明会・締切を月または週単位で確認できます。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1" aria-label="表示期間">
                <Link
                  href={buildCalendarHref("month", anchorKey)}
                  aria-current={view === "month" ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${view === "month" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
                >
                  月
                </Link>
                <Link
                  href={buildCalendarHref("week", anchorKey)}
                  aria-current={view === "week" ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${view === "week" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
                >
                  週
                </Link>
              </div>
              <Link href={buildCalendarHref(view, todayDateKey())} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                今日
              </Link>
              <Link href="/calendar/events/new" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                予定を追加
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <Link href={buildCalendarHref(view, period.previousKey)} aria-label="前の期間" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              ← 前へ
            </Link>
            <p className="text-center text-base font-bold text-slate-950 sm:text-lg">{period.label}</p>
            <Link href={buildCalendarHref(view, period.nextKey)} aria-label="次の期間" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              次へ →
            </Link>
          </div>
        </section>

        {error ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="alert">
            <h2 className="font-bold">予定を取得できませんでした</h2>
            <p className="mt-1 text-sm">時間を置いて再読み込みしてください。</p>
          </section>
        ) : (
          <>
            <section className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow md:block" aria-label={`${view === "month" ? "月" : "週"}表示カレンダー`}>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {WEEKDAYS.map((weekday, index) => (
                  <div key={weekday} className={`px-2 py-3 text-center text-sm font-medium ${index === 0 ? "text-rose-600" : index === 6 ? "text-blue-600" : "text-slate-600"}`}>
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {period.dayKeys.map((dateKey) => {
                  const dayEvents = eventsByDate.get(dateKey) ?? [];
                  const isToday = dateKey === todayDateKey();
                  const isOutsideMonth = view === "month" && !dateKey.startsWith(monthKey);

                  return (
                    <div key={dateKey} className={`min-h-36 border-b border-r border-slate-200 p-2 last:border-r-0 ${isOutsideMonth ? "bg-slate-50" : "bg-white"}`}>
                      <time dateTime={dateKey} className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-medium ${isToday ? "bg-blue-600 text-white" : isOutsideMonth ? "text-slate-400" : "text-slate-700"}`}>
                        {Number(dateKey.slice(-2))}
                      </time>
                      <div className="mt-2 space-y-1.5">
                        {dayEvents.map((event) => (
                          <EventLink key={event.id} event={event} view={view} anchorKey={anchorKey} compact />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 md:hidden" aria-label={`${view === "month" ? "月" : "週"}表示予定一覧`}>
              {agendaDays.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                  <p className="font-semibold text-slate-800">この月の予定はありません</p>
                  <p className="mt-1 text-sm text-slate-500">予定が登録されると、日付ごとにここへ表示されます。</p>
                </div>
              ) : (
                agendaDays.map((dateKey) => {
                  const dayEvents = eventsByDate.get(dateKey) ?? [];

                  return (
                    <article key={dateKey} className="rounded-xl bg-white p-4 shadow-sm">
                      <h3 className={`text-sm font-bold ${dateKey === todayDateKey() ? "text-blue-700" : "text-slate-700"}`}>
                        <time dateTime={dateKey}>{formatDateLabel(dateKey)}</time>
                        {dateKey === todayDateKey() ? " · 今日" : ""}
                      </h3>
                      {dayEvents.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-400">予定なし</p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {dayEvents.map((event) => (
                            <EventLink key={event.id} event={event} view={view} anchorKey={anchorKey} />
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          </>
        )}

        {selectedEvent ? (
          <section id="event-detail" className="scroll-mt-4 rounded-xl border border-blue-200 bg-white p-5 shadow sm:p-6" aria-labelledby="event-detail-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getEventTypeStyle(selectedEvent.event_type)}`}>
                  {getEventTypeLabel(selectedEvent.event_type)}
                </span>
                <h2 id="event-detail-title" className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">{selectedEvent.title}</h2>
              </div>
              <Link href={buildCalendarHref(view, anchorKey)} className="shrink-0 text-sm font-medium text-slate-500 hover:text-slate-950">
                閉じる
              </Link>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">開始</dt>
                <dd className="mt-1 font-medium text-slate-900">{formatEventDateTime(selectedEvent.start_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">終了</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {selectedEvent.end_at ? formatEventDateTime(selectedEvent.end_at) : "未設定"}
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500">
              この画面では、予定の種別と開始・終了日時を確認できます。
            </p>
            <Link
              href={`/calendar/events/${selectedEvent.id}/edit`}
              className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              予定を編集
            </Link>
          </section>
        ) : params.event && !error ? (
          <section id="event-detail" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="status">
            指定された予定はこの表示期間にないか、閲覧できません。
          </section>
        ) : null}
      </main>
    </div>
  );
}
