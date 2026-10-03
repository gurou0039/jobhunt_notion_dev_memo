export const INDUSTRY_CATEGORY_OTHER = "その他";

export const INDUSTRY_CATEGORIES = [
  "IT・インターネット",
  "メーカー",
  "商社",
  "金融",
  "不動産・建設",
  "運輸・物流",
  "小売・流通",
  "広告・出版・マスコミ",
  "人材・教育",
  "医療・福祉",
  "官公庁・団体",
  INDUSTRY_CATEGORY_OTHER,
] as const;

export type IndustryCategory = (typeof INDUSTRY_CATEGORIES)[number];

export function isIndustryCategory(value: string): value is IndustryCategory {
  return INDUSTRY_CATEGORIES.includes(value as IndustryCategory);
}

export function getIndustryFormValues(
  category: string | null | undefined,
  industry: string | null | undefined,
) {
  const normalizedCategory = category?.trim() ?? "";
  const normalizedIndustry = industry?.trim() ?? "";

  if (normalizedCategory === INDUSTRY_CATEGORY_OTHER) {
    return {
      category: INDUSTRY_CATEGORY_OTHER,
      other: normalizedIndustry,
    };
  }

  if (isIndustryCategory(normalizedCategory)) {
    return { category: normalizedCategory, other: "" };
  }

  if (isIndustryCategory(normalizedIndustry)) {
    return { category: normalizedIndustry, other: "" };
  }

  return {
    category: normalizedIndustry ? INDUSTRY_CATEGORY_OTHER : "",
    other: normalizedIndustry,
  };
}

