import Link from "next/link";
import {
  buildCalendarHref,
  CalendarEvent,
  eventDateKey,
  formatEventDateTime,
  getEventTypeLabel,
  getEventTypeStyle,
} from "@/lib/calendar";

type UpcomingEventsProps = {
  events: CalendarEvent[];
  hasError?: boolean;
};

export function UpcomingEvents({ events, hasError = false }: UpcomingEventsProps) {
  return (
    <section className="rounded-xl bg-white p-5 shadow sm:p-6" aria-labelledby="upcoming-events-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">次の7日間</p>
          <h3 id="upcoming-events-title" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
            直近の予定
          </h3>
        </div>
        <Link href="/calendar" className="shrink-0 text-sm font-medium text-blue-600 hover:underline">
          カレンダー
        </Link>
      </div>

      {hasError ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          予定を取得できませんでした。時間を置いて再読み込みしてください。
        </div>
      ) : events.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-5 text-center">
          <p className="font-medium text-slate-800">直近の予定はありません</p>
          <p className="mt-1 text-sm text-slate-500">
            登録した面接や説明会は、ここからすぐ確認できます。
          </p>
          <Link href="/calendar" className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:underline">
            カレンダーを確認する
          </Link>
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={buildCalendarHref("week", eventDateKey(event.start_at), event.id)}
                className="flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${getEventTypeStyle(event.event_type)}`}>
                  {getEventTypeLabel(event.event_type)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-950">{event.title}</span>
                  <time dateTime={event.start_at} className="mt-0.5 block text-sm text-slate-600">
                    {formatEventDateTime(event.start_at)}
                  </time>
                </span>
                <span aria-hidden="true" className="text-slate-400">›</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
