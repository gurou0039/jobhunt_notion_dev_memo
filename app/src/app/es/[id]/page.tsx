import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  EsDocument,
  formatEsUpdatedAt,
  getEsDocumentTypeLabel,
} from "@/lib/es";
import { createClient } from "@/lib/supabase/server";
import { deleteEsDocument } from "../actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function EsDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("es_documents")
    .select("id,company_id,doc_type,title,content,version,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const document = data as EsDocument;
  const { data: company } = await supabase
    .from("companies")
    .select("id,company_name")
    .eq("id", document.company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/es" className="text-sm font-medium text-blue-600 hover:underline">← ES一覧</Link>
          <div className="flex items-center gap-3">
            <Link href={`/es?company=${company.id}`} className="text-sm text-blue-600 hover:underline">{company.company_name}のES</Link>
            <Link href={`/es/${id}/edit`} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">編集</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-5 px-3 py-6 sm:px-4 sm:py-8">
        {query.saved === "1" ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">ESを保存しました。</div> : null}
        {query.error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">{query.error}</div> : null}

        <article className="rounded-xl bg-white p-5 shadow sm:p-8">
          <header className="border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">{getEsDocumentTypeLabel(document.doc_type)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">v{document.version}</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">{document.title}</h1>
            <p className="mt-2 font-medium text-slate-700">{company.company_name}</p>
            <p className="mt-2 text-xs text-slate-500">最終更新 {formatEsUpdatedAt(document.updated_at)}</p>
          </header>

          <div className="min-h-64 whitespace-pre-wrap py-6 leading-8 text-slate-800">
            {document.content || "本文はまだありません。編集画面から入力できます。"}
          </div>
        </article>

        <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">このESを削除</h2>
          <p className="mt-1 text-sm text-slate-600">削除した内容は元に戻せません。</p>
          <form action={deleteEsDocument} className="mt-4">
            <input type="hidden" name="document_id" value={document.id} />
            <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">ESを削除</button>
          </form>
        </section>
      </main>
    </div>
  );
}
