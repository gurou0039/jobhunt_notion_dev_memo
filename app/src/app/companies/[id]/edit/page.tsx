import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { updateCompany } from "../../actions";
import { getIndustryFormValues } from "../../industry";
import { IndustryFields } from "../../industry-fields";

type Company = {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  industry_category: string | null;
  motivation_level: number;
  selection_status: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CompanyEditPage({ params }: PageProps) {
  const { id } = await params;

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
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const company = data as Company;
  const industryFormValues = getIndustryFormValues(
    company.industry_category,
    company.industry,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto h-16 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">企業編集</h1>

          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${company.id}`}
              className="text-blue-600 hover:underline"
            >
              企業詳細へ戻る
            </Link>

            <Link href="/companies" className="text-blue-600 hover:underline">
              企業一覧へ戻る
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-black mb-6">企業情報を編集</h2>

          <form action={updateCompany} className="grid gap-4">
            <input type="hidden" name="company_id" value={company.id} />

            <div>
              <label className="block text-black mb-1">企業名 *</label>
              <input
                name="company_name"
                type="text"
                required
                defaultValue={company.company_name}
                className="w-full border text-black px-3 py-2"
              />
            </div>

            <IndustryFields
              initialCategory={industryFormValues.category}
              initialOther={industryFormValues.other}
            />

            <div>
              <label className="block text-black mb-1">志望度</label>
              <select
                name="motivation_level"
                defaultValue={String(company.motivation_level)}
                className="w-full border text-black px-3 py-2"
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div>
              <label className="block text-black mb-1">選考ステータス</label>
              <select
                name="selection_status"
                defaultValue={company.selection_status}
                className="w-full border text-black px-3 py-2"
              >
                <option value="未エントリー">未エントリー</option>
                <option value="ES提出">ES提出</option>
                <option value="Webテスト">Webテスト</option>
                <option value="1次面接">1次面接</option>
                <option value="2次面接">2次面接</option>
                <option value="最終面接">最終面接</option>
                <option value="内定">内定</option>
                <option value="お祈り">お祈り</option>
              </select>
            </div>

            <div>
              <label className="block text-black mb-1">メモ</label>
              <textarea
                name="memo"
                rows={5}
                defaultValue={company.memo ?? ""}
                className="w-full border text-black px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled
                className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                更新する
              </button>

              <Link
                href={`/companies/${company.id}`}
                className="px-5 py-2 rounded-md bg-slate-200 text-black hover:bg-slate-300"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
