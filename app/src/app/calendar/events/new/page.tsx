import Link from "next/link";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/calendar/event-form";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "../../actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewEventPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("companies")
    .select("id,company_name")
    .eq("user_id", user.id)
    .order("company_name", { ascending: true });
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-blue-600">カレンダー</p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">予定を追加</h1>
          </div>
          <Link href="/calendar" className="text-sm font-medium text-blue-600 hover:underline">
            カレンダーへ戻る
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        <section className="rounded-xl bg-white p-5 shadow sm:p-7">
          <EventForm
            action={createEvent}
            companies={data ?? []}
            error={params.error}
            submitLabel="予定を保存"
          />
        </section>
      </main>
    </div>
  );
}
