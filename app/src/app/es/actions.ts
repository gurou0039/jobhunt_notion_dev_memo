"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isEsDocumentType } from "@/lib/es";
import { createClient } from "@/lib/supabase/server";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

function parseDocumentValues(formData: FormData) {
  const companyId = getText(formData, "company_id");
  const title = getText(formData, "title");
  const docType = getText(formData, "doc_type");
  const content = String(formData.get("content") ?? "").trim();

  if (!companyId) {
    throw new Error("企業を選択してください");
  }

  if (!title) {
    throw new Error("ESタイトルを入力してください");
  }

  if (title.length > 120) {
    throw new Error("ESタイトルは120文字以内で入力してください");
  }

  if (!isEsDocumentType(docType)) {
    throw new Error("文書種別を選択してください");
  }

  return {
    company_id: companyId,
    title,
    doc_type: docType,
    content,
  };
}

async function ownsCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function createEsDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let values: ReturnType<typeof parseDocumentValues>;

  try {
    values = parseDocumentValues(formData);
  } catch (error) {
    const companyId = getText(formData, "company_id");
    const path = companyId ? `/es/new?company=${encodeURIComponent(companyId)}` : "/es/new";
    redirectWithError(
      path,
      error instanceof Error ? error.message : "入力内容を確認してください",
    );
  }

  if (!(await ownsCompany(supabase, user.id, values.company_id))) {
    redirectWithError("/es/new", "選択した企業を確認できません");
  }

  const { data, error } = await supabase
    .from("es_documents")
    .insert({ ...values, version: 1 })
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError("/es/new", "ESを保存できませんでした");
  }

  revalidatePath("/es");
  revalidatePath(`/companies/${values.company_id}`);
  redirect(`/es/${data.id}?saved=created`);
}

export async function updateEsDocument(formData: FormData) {
  const documentId = getText(formData, "document_id");
  const editPath = documentId ? `/es/${documentId}/edit` : "/es";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!documentId) {
    redirectWithError(editPath, "更新するESを確認できません");
  }

  let values: ReturnType<typeof parseDocumentValues>;

  try {
    values = parseDocumentValues(formData);
  } catch (error) {
    redirectWithError(
      editPath,
      error instanceof Error ? error.message : "入力内容を確認してください",
    );
  }

  if (!(await ownsCompany(supabase, user.id, values.company_id))) {
    redirectWithError(editPath, "選択した企業を確認できません");
  }

  const { data, error } = await supabase
    .from("es_documents")
    .update(values)
    .eq("id", documentId)
    .select("id,version,updated_at")
    .maybeSingle();

  if (error || !data) {
    redirectWithError(editPath, "ESを更新できませんでした");
  }

  revalidatePath("/es");
  revalidatePath(`/es/${documentId}`);
  revalidatePath(`/companies/${values.company_id}`);
  redirect(`/es/${documentId}?saved=updated`);
}

export async function deleteEsDocument(formData: FormData) {
  const documentId = getText(formData, "document_id");
  const detailPath = documentId ? `/es/${documentId}` : "/es";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!documentId) {
    redirectWithError(detailPath, "削除するESを確認できません");
  }

  const { data, error } = await supabase
    .from("es_documents")
    .delete()
    .eq("id", documentId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithError(detailPath, "ESを削除できませんでした");
  }

  revalidatePath("/es");
  redirect("/es?deleted=1");
}
