import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { SELECTION_STATUS_OPTIONS } from "../../../lib/selection-status";

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

export default async function CompaniesBoardPage() {
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

  const groupedCompanies = SELECTION_STATUS_OPTIONS.map((status) => ({
    status,
    items: companies.filter((company) => company.selection_status === status),
  }));

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">選考管理ボード</h1>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:underline">
              ダッシュボードへ戻る
            </Link>

            <Link href="/companies" className="text-blue-600 hover:underline">
              企業一覧へ戻る
            </Link>

            <Link href="/settings" className="text-blue-600 hover:underline">
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

      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-black mb-2">
            選考状況を一覧で確認
          </h2>
          <p className="text-slate-600">
            企業を選考ステータスごとに並べて確認できます。
          </p>
        </section>

        <section className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[320px] gap-4 min-w-max">
            {groupedCompanies.map((group) => (
              <div
                key={group.status}
                className="bg-white rounded-xl shadow p-4 flex flex-col gap-4 min-h-[500px]"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-bold text-black">{group.status}</h3>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-black text-sm">
                    {group.items.length}件
                  </span>
                </div>

                {group.items.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    このステータスの企業はありません。
                  </p>
                ) : (
                  <div className="space-y-3">
                    {group.items.map((company) => (
                      <Link
                        key={company.id}
                        href={`/companies/${company.id}`}
                        className="block border rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition"
                      >
                        <h4 className="font-semibold text-black">
                          {company.company_name}
                        </h4>

                        <p className="text-sm text-slate-600 mt-2">
                          業界: {company.industry || "未設定"}
                        </p>
                        <p className="text-sm text-slate-600">
                          志望度: {company.motivation_level}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-3">
                          メモ: {company.memo || "なし"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
