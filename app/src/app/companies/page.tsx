import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { createCompany, deleteCompany } from "./actions";
import { IndustryFields } from "./industry-fields";
import { SELECTION_STATUS_OPTIONS } from "../../lib/selection-status";

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

type PageProps = {
  searchParams: Promise<{
    keyword?: string;
    industry?: string;
    status?: string;
    sort?: string;
  }>;
};

const SORT_OPTIONS = [
  { value: "updated_desc", label: "更新日が新しい順" },
  { value: "updated_asc", label: "更新日が古い順" },
  { value: "motivation_desc", label: "志望度が高い順" },
  { value: "motivation_asc", label: "志望度が低い順" },
  { value: "name_asc", label: "企業名 A-Z" },
];

function getSort(sort: string) {
  switch (sort) {
    case "updated_asc":
      return { column: "updated_at", ascending: true };
    case "motivation_desc":
      return { column: "motivation_level", ascending: false };
    case "motivation_asc":
      return { column: "motivation_level", ascending: true };
    case "name_asc":
      return { column: "company_name", ascending: true };
    default:
      return { column: "updated_at", ascending: false };
  }
}

function getUpdatedLabel(value: string) {
  return new Date(value).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const keyword = String(resolvedSearchParams.keyword ?? "").trim();
  const industry = String(resolvedSearchParams.industry ?? "").trim();
  const status = String(resolvedSearchParams.status ?? "all").trim();
  const sort = String(resolvedSearchParams.sort ?? "updated_desc").trim();
  const sortOption = getSort(sort);

  let query = supabase
    .from("companies")
    .select("*")
    .order(sortOption.column, { ascending: sortOption.ascending });

  if (keyword) {
    query = query.ilike("company_name", `%${keyword}%`);
  }

  if (industry) {
    query = query.ilike("industry", `%${industry}%`);
  }

  if (status !== "all") {
    query = query.eq("selection_status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`企業一覧の取得に失敗しました: ${error.message}`);
  }

  const companies = (data ?? []) as Company[];
  const hasFilters = Boolean(keyword || industry || status !== "all");

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-2xl font-bold text-slate-950">企業一覧</h1>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ダッシュボード
            </Link>
            <Link
              href="/companies/board"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              選考ボード
            </Link>
            <Link href="/settings" className="text-sm text-blue-600 hover:underline">
              設定
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                企業を追加
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                応募予定や選考中の企業を登録して、一覧からすぐ見返せます。
              </p>
            </div>
            <span className="text-sm text-slate-500">
              登録済み {companies.length} 件
            </span>
          </div>

          <form action={createCompany} className="mt-5 grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label
                htmlFor="company_name"
                className="block text-sm font-medium text-slate-700"
              >
                企業名 *
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                placeholder="例: 株式会社サンプル"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
              />
            </div>

            <IndustryFields />

            <div>
              <label
                htmlFor="motivation_level"
                className="block text-sm font-medium text-slate-700"
              >
                志望度
              </label>
              <select
                id="motivation_level"
                name="motivation_level"
                defaultValue="3"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
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
              <label
                htmlFor="selection_status"
                className="block text-sm font-medium text-slate-700"
              >
                選考状況
              </label>
              <select
                id="selection_status"
                name="selection_status"
                defaultValue={SELECTION_STATUS_OPTIONS[0]}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
              >
                {SELECTION_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-4">
              <label
                htmlFor="memo"
                className="block text-sm font-medium text-slate-700"
              >
                メモ
              </label>
              <textarea
                id="memo"
                name="memo"
                rows={3}
                placeholder="企業研究メモ、気になる点、次に確認すること"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                企業を登録
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                登録済み企業
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                検索結果: {companies.length} 件
              </p>
            </div>

            <form method="get" className="grid gap-3 md:grid-cols-5">
              <div>
                <label
                  htmlFor="keyword"
                  className="block text-sm font-medium text-slate-700"
                >
                  企業名
                </label>
                <input
                  id="keyword"
                  name="keyword"
                  type="search"
                  defaultValue={keyword}
                  placeholder="企業名で検索"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                />
              </div>

              <div>
                <label
                  htmlFor="industry"
                  className="block text-sm font-medium text-slate-700"
                >
                  業界
                </label>
                <input
                  id="industry"
                  name="industry"
                  type="search"
                  defaultValue={industry}
                  placeholder="業界で絞り込み"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-slate-700"
                >
                  選考状況
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                >
                  <option value="all">すべて</option>
                  {SELECTION_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sort"
                  className="block text-sm font-medium text-slate-700"
                >
                  並び順
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  検索
                </button>
                <Link
                  href="/companies"
                  className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-300"
                >
                  リセット
                </Link>
              </div>
            </form>
          </div>

          {companies.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                {hasFilters
                  ? "条件に一致する企業がありません"
                  : "まだ企業が登録されていません"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {hasFilters
                  ? "検索条件を変えるか、リセットして一覧を確認してください。"
                  : "上のフォームから最初の企業を登録してください。"}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {companies.map((company) => (
                <article
                  key={company.id}
                  className="flex min-h-64 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/companies/${company.id}`}
                          className="text-lg font-semibold text-slate-950 hover:text-blue-600 hover:underline"
                        >
                          {company.company_name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-600">
                          {company.industry || "業界未設定"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {company.selection_status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        志望度
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <span
                            key={level}
                            className={`h-2 flex-1 rounded-full ${
                              level <= company.motivation_level
                                ? "bg-amber-400"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="line-clamp-3 text-sm text-slate-700">
                      {company.memo || "メモはまだありません。"}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500">
                      更新: {getUpdatedLabel(company.updated_at)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/companies/${company.id}`}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/companies/${company.id}/edit`}
                        className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-slate-300"
                      >
                        編集
                      </Link>
                      <form action={deleteCompany}>
                        <input
                          type="hidden"
                          name="company_id"
                          value={company.id}
                        />
                        <button
                          type="submit"
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                        >
                          削除
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
