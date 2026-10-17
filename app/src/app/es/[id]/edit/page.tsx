import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EsForm } from "@/components/es/es-form";
import { EsDocument } from "@/lib/es";
import { createClient } from "@/lib/supabase/server";
import { updateEsDocument } from "../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EsEditPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: document }, { data: companies, error }] = await Promise.all([
    supabase
      .from("es_documents")
      .select("id,company_id,doc_type,title,content,version,created_at,updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("id,company_name")
      .eq("user_id", user.id)
      .order("company_name", { ascending: true }),
  ]);

  if (!document || error) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-blue-600">ES管理</p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">ESを編集</h1>
          </div>
          <Link href={`/es/${id}`} className="text-sm font-medium text-blue-600 hover:underline">詳細へ戻る</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-3 py-6 sm:px-4 sm:py-8">
        <section className="rounded-xl bg-white p-5 shadow sm:p-7">
          <EsForm action={updateEsDocument} companies={companies ?? []} document={document as EsDocument} error={query.error} submitLabel="変更を保存" />
        </section>
      </main>
    </div>
  );
}
