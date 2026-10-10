import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/calendar/event-form";
import { CalendarEvent } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent, updateEvent } from "../../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditEventPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: event }, { data: companies }] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,event_type,start_at,end_at,related_company_id")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("id,company_name")
      .eq("user_id", user.id)
      .order("company_name", { ascending: true }),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-blue-600">カレンダー</p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">予定を編集</h1>
          </div>
          <Link href="/calendar" className="text-sm font-medium text-blue-600 hover:underline">
            カレンダーへ戻る
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl space-y-5 px-3 py-6 sm:px-4 sm:py-8">
        <section className="rounded-xl bg-white p-5 shadow sm:p-7">
          <EventForm
            action={updateEvent}
            companies={companies ?? []}
            error={query.error}
            event={event as CalendarEvent}
            submitLabel="変更を保存"
          />
        </section>

        <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-bold text-slate-950">予定を削除</h2>
          <p className="mt-1 text-sm text-slate-600">削除した予定は元に戻せません。</p>
          <form action={deleteEvent} className="mt-4">
            <input type="hidden" name="event_id" value={id} />
            <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
              この予定を削除
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
