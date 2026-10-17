"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  CalendarEvent,
  EVENT_TYPE_OPTIONS,
  EventFormState,
  formatDateTimeLocal,
} from "@/lib/calendar";

type CompanyOption = {
  id: string;
  company_name: string;
};

type EventFormProps = {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  companies: CompanyOption[];
  error?: string;
  event?: CalendarEvent;
  submitLabel: string;
};

export function EventForm({
  action,
  companies,
  error,
  event,
  submitLabel,
}: EventFormProps) {
  const [state, formAction] = useActionState(action, {
    error: error ?? null,
    values: {
      title: event?.title ?? "",
      event_type: event?.event_type ?? "interview",
      start_at: formatDateTimeLocal(event?.start_at),
      end_at: formatDateTimeLocal(event?.end_at),
      related_company_id: event?.related_company_id ?? "",
    },
  });

  return (
    <form key={JSON.stringify(state.values)} action={formAction} className="space-y-5">
      {event ? <input type="hidden" name="event_id" value={event.id} /> : null}

      {state.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          予定名 <span className="text-rose-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          defaultValue={state.values.title}
          placeholder="例: 株式会社サンプル 最終面接"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-slate-700">
            種別 <span className="text-rose-600">*</span>
          </label>
          <select
            id="event_type"
            name="event_type"
            required
            defaultValue={state.values.event_type}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          >
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="related_company_id" className="block text-sm font-medium text-slate-700">
            関連企業
          </label>
          <select
            id="related_company_id"
            name="related_company_id"
            defaultValue={state.values.related_company_id}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          >
            <option value="">企業を指定しない</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_at" className="block text-sm font-medium text-slate-700">
            開始日時 <span className="text-rose-600">*</span>
          </label>
          <input
            id="start_at"
            name="start_at"
            type="datetime-local"
            required
            defaultValue={state.values.start_at}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          />
        </div>

        <div>
          <label htmlFor="end_at" className="block text-sm font-medium text-slate-700">
            終了日時
          </label>
          <input
            id="end_at"
            name="end_at"
            type="datetime-local"
            defaultValue={state.values.end_at}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          />
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        日時は日本時間（Asia/Tokyo）として保存されます。
      </p>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/calendar"
          className="rounded-md border border-slate-300 px-5 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
