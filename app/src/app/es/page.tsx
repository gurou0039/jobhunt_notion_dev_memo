import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EsDocument,
  formatEsUpdatedAt,
  getEsDocumentTypeLabel,
} from "@/lib/es";
import { createClient } from "@/lib/supabase/server";

type Company = {
  id: string;
  company_name: string;
};

type PageProps = {
  searchParams: Promise<{ company?: string; deleted?: string }>;
};

export default async function EsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const [{ data: companyData, error: companyError }, documentsResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id,company_name")
      .eq("user_id", user.id)
      .order("company_name", { ascending: true }),
    (() => {
      let query = supabase
        .from("es_documents")
        .select("id,company_id,doc_type,title,content,version,created_at,updated_at")
        .order("updated_at", { ascending: false });

      if (params.company) {
        query = query.eq("company_id", params.company);
      }

      return query;
    })(),
  ]);

  if (companyError) {
    throw new Error("企業一覧を取得できませんでした");
  }

  if (documentsResult.error) {
    throw new Error("ES一覧を取得できませんでした");
  }

  const companies = (companyData ?? []) as Company[];
  const documents = (documentsResult.data ?? []) as EsDocument[];
  const companyNames = new Map(companies.map((company) => [company.id, company.company_name]));
  const selectedCompany = companies.find((company) => company.id === params.company);

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap">
          <div>
            <p className="text-xs font-medium text-blue-600">Job Hunt Dashboard</p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">ES管理</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">ダッシュボード</Link>
            <Link href="/companies" className="text-blue-600 hover:underline">企業一覧</Link>
            <form action="/logout" method="post">
              <button type="submit" className="rounded-md bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700">ログアウト</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:px-4 sm:py-8">
        {params.deleted === "1" ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            ESを削除しました。
          </div>
        ) : null}

        <section className="rounded-xl bg-white p-5 shadow sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">保存したES</h2>
              <p className="mt-1 text-sm text-slate-600">
                {selectedCompany ? `${selectedCompany.company_name}のESを表示中` : "企業ごとのESを作成・編集できます。"}
              </p>
            </div>
            <Link href={selectedCompany ? `/es/new?company=${selectedCompany.id}` : "/es/new"} className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700">
              新しいESを作成
            </Link>
          </div>

          <form className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="company" className="block text-sm font-medium text-slate-700">企業で絞り込む</label>
              <select id="company" name="company" defaultValue={params.company ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950">
                <option value="">すべての企業</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.company_name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">表示</button>
            {params.company ? <Link href="/es" className="rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">解除</Link> : null}
          </form>
        </section>

        {documents.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">該当するESはありません</h2>
            <p className="mt-2 text-sm text-slate-500">企業を登録し、最初のESを下書きとして保存しましょう。</p>
            <Link href={selectedCompany ? `/es/new?company=${selectedCompany.id}` : "/es/new"} className="mt-5 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">ESを作成</Link>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {documents.map((document) => (
              <Link key={document.id} href={`/es/${document.id}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-blue-600">{getEsDocumentTypeLabel(document.doc_type)}</p>
                    <h2 className="mt-1 truncate text-lg font-bold text-slate-950">{document.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">現在 v{document.version}</span>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">{companyNames.get(document.company_id) ?? "企業不明"}</p>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{document.content || "本文はまだありません。"}</p>
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">最終更新日時 {formatEsUpdatedAt(document.updated_at)}</p>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
