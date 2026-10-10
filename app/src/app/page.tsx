import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import { SELECTION_STATUS_OPTIONS } from "../lib/selection-status";
import { UpcomingEvents } from "@/components/calendar/upcoming-events";
import { CalendarEvent } from "@/lib/calendar";

type Company = {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  motivation_level: number;
  selection_status: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`企業データの取得に失敗しました: ${error.message}`);
  }

  const companies = (data ?? []) as Company[];

  const totalCompanies = companies.length;
  const notEnteredCount = companies.filter(
    (company) => company.selection_status === SELECTION_STATUS_OPTIONS[0],
  ).length;
  const interviewCount = companies.filter((company) =>
    ["一次面接", "二次面接", "最終面接"].includes(company.selection_status),
  ).length;
  const offerCount = companies.filter(
    (company) => company.selection_status === "内定",
  ).length;

  const recentCompanies = companies.slice(0, 5);
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("id,title,event_type,start_at,end_at,related_company_id")
    .gte("start_at", now.toISOString())
    .lt("start_at", sevenDaysLater.toISOString())
    .order("start_at", { ascending: true })
    .limit(5);
  const upcomingEvents = (eventData ?? []) as CalendarEvent[];

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:py-0">
          <h1 className="text-xl font-bold text-black sm:text-2xl">Job Hunt Dashboard</h1>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-slate-700 md:inline">
              {user.user_metadata?.display_name || user.email}
            </span>

            <Link href="/settings" className="text-sm text-blue-600 hover:underline">
              設定
            </Link>

            <form action="/logout" method="post">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-xl shadow p-8">
          <h2 className="text-3xl font-bold text-black mb-3">
            ようこそ、{user.user_metadata?.display_name || user.email}さん
          </h2>
          <p className="text-slate-600">
            就活管理アプリのダッシュボードです。企業情報や選考状況をここから確認できます。
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/companies"
              className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              企業一覧を見る
            </Link>

            <Link
              href="/companies/board"
              className="px-5 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-900"
            >
              選考管理ボードを見る
            </Link>

            <Link
              href="/calendar"
              className="px-5 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700"
            >
              カレンダーを見る
            </Link>

            <Link
              href={`/companies?status=${SELECTION_STATUS_OPTIONS[0]}`}
              className="px-5 py-2 rounded-md bg-slate-200 text-black hover:bg-slate-300"
            >
              未応募を確認
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-slate-500 mb-2">登録企業数</p>
            <p className="text-3xl font-bold text-black">{totalCompanies}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-slate-500 mb-2">未応募</p>
            <p className="text-3xl font-bold text-black">{notEnteredCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-slate-500 mb-2">面接中</p>
            <p className="text-3xl font-bold text-black">{interviewCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-slate-500 mb-2">内定</p>
            <p className="text-3xl font-bold text-black">{offerCount}</p>
          </div>
        </section>

        <UpcomingEvents events={upcomingEvents} hasError={Boolean(eventError)} />

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-black">最近更新した企業</h3>
              <Link href="/companies" className="text-blue-600 hover:underline">
                一覧を見る
              </Link>
            </div>

            {recentCompanies.length === 0 ? (
              <p className="text-slate-500">まだ企業が登録されていません。</p>
            ) : (
              <div className="space-y-3">
                {recentCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="border rounded-lg p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-semibold text-black hover:text-blue-600 hover:underline"
                      >
                        {company.company_name}
                      </Link>

                      <p className="text-sm text-slate-600 mt-1">
                        業界: {company.industry || "未設定"}
                      </p>
                    </div>

                    <span className="shrink-0 px-3 py-1 rounded-full bg-slate-100 text-black text-sm">
                      {company.selection_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-2xl font-bold text-black mb-4">アカウント情報</h3>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-slate-500">メールアドレス</dt>
                <dd className="text-black">{user.email}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">ユーザーID</dt>
                <dd className="text-black break-all">{user.id}</dd>
              </div>

              <div>
                <dt className="text-sm text-slate-500">登録日</dt>
                <dd className="text-black">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("ja-JP")
                    : "取得不可"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t pt-6">
              <h4 className="text-lg font-semibold text-black mb-3">
                次のおすすめ実装
              </h4>
              <ul className="space-y-2 text-slate-700">
                <li>・面接ログ機能の追加</li>
                <li>・ES管理ページの追加</li>
                <li>・締切タスク管理の追加</li>
                <li>・カレンダーで予定を登録・編集</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
