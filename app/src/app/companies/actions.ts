"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import {
  INDUSTRY_CATEGORY_OTHER,
  isIndustryCategory,
} from "./industry";

function getIndustryValues(formData: FormData) {
  const category = String(formData.get("industry_category") || "").trim();
  const other = String(formData.get("industry_other") || "").trim();
  const legacyIndustry = String(formData.get("industry") || "").trim();
  const categoryRequired = formData.has("industry_category_required");

  if (!category) {
    if (legacyIndustry) {
      return { category: null, industry: legacyIndustry };
    }

    if (!categoryRequired) {
      return { category: null, industry: null };
    }

    throw new Error("業界カテゴリを選択してください。もう一度入力してください。");
  }

  if (!isIndustryCategory(category)) {
    throw new Error("業界カテゴリの選択が正しくありません");
  }

  if (category === INDUSTRY_CATEGORY_OTHER) {
    const customIndustry = other || legacyIndustry;

    if (!customIndustry) {
      throw new Error("その他の業界名を入力してください");
    }

    return { category, industry: customIndustry };
  }

  return { category, industry: category };
}

export async function createCompany(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  const company_name = String(formData.get("company_name") || "").trim();
  const { category: industry_category, industry } = getIndustryValues(formData);
  const motivation_level = Number(formData.get("motivation_level") || 0);
  const selection_status = String(
    formData.get("selection_status") || "未エントリー",
  ).trim();
  const memo = String(formData.get("memo") || "").trim();

  if (!company_name) {
    throw new Error("企業名は必須です");
  }

  const safeMotivationLevel = Math.min(Math.max(motivation_level, 0), 5);

  const { error } = await supabase.from("companies").insert({
    user_id: user.id,
    company_name,
    industry_category,
    industry: industry || null,
    motivation_level: safeMotivationLevel,
    selection_status,
    memo: memo || null,
  });

  if (error) {
    throw new Error(`企業登録に失敗しました: ${error.message}`);
  }

  revalidatePath("/companies");
}

export async function deleteCompany(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  const companyId = String(formData.get("company_id") || "").trim();

  if (!companyId) {
    throw new Error("削除対象の企業IDがありません");
  }

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`企業削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/companies");
}

export async function updateCompany(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  const companyId = String(formData.get("company_id") || "").trim();
  const company_name = String(formData.get("company_name") || "").trim();
  const { category: industry_category, industry } = getIndustryValues(formData);
  const motivation_level = Number(formData.get("motivation_level") || 0);
  const selection_status = String(
    formData.get("selection_status") || "未エントリー",
  ).trim();
  const memo = String(formData.get("memo") || "").trim();

  if (!companyId) {
    throw new Error("更新対象の企業IDがありません");
  }

  if (!company_name) {
    throw new Error("企業名は必須です");
  }

  const safeMotivationLevel = Math.min(Math.max(motivation_level, 0), 5);

  const { error } = await supabase
    .from("companies")
    .update({
      company_name,
      industry_category,
      industry: industry || null,
      motivation_level: safeMotivationLevel,
      selection_status,
      memo: memo || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`企業更新に失敗しました: ${error.message}`);
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}
