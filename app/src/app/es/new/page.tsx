import Link from "next/link";
import { redirect } from "next/navigation";
import { EsForm } from "@/components/es/es-form";
import { createClient } from "@/lib/supabase/server";
import { createEsDocument } from "../actions";

type PageProps = {
  searchParams: Promise<{ company?: string; error?: string }>;
};

export default async function NewEsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id,company_name")
    .eq("user_id", user.id)
    .order("company_name", { ascending: true });
  const params = await searchParams;

  if (error) {
    throw new Error("企業一覧を取得できませんでした");
  }

  const companies = data ?? [];

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-blue-600">ES管理</p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">新しいES</h1>
          </div>
          <Link href="/es" className="text-sm font-medium text-blue-600 hover:underline">ES一覧へ戻る</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-3 py-6 sm:px-4 sm:py-8">
        {companies.length === 0 ? (
          <section className="rounded-xl bg-white p-8 text-center shadow">
            <h2 className="text-lg font-bold text-slate-950">先に企業を登録してください</h2>
            <p className="mt-2 text-sm text-slate-600">ESは企業に紐付けて保存します。</p>
            <Link href="/companies" className="mt-5 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">企業を登録</Link>
          </section>
        ) : (
          <section className="rounded-xl bg-white p-5 shadow sm:p-7">
            <EsForm action={createEsDocument} companies={companies} defaultCompanyId={params.company} error={params.error} submitLabel="下書きを保存" />
          </section>
        )}
      </main>
    </div>
  );
}
