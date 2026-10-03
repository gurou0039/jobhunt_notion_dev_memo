"use client";

import { useEffect, useRef, useState } from "react";
import {
  INDUSTRY_CATEGORIES,
  INDUSTRY_CATEGORY_OTHER,
} from "./industry";

type IndustryFieldsProps = {
  initialCategory?: string;
  initialOther?: string;
};

export function IndustryFields({
  initialCategory = "",
  initialOther = "",
}: IndustryFieldsProps) {
  const [category, setCategory] = useState(initialCategory);
  const fieldsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = fieldsRef.current?.closest("form");
    const submitButtons = form?.querySelectorAll<HTMLButtonElement>(
      'button[type="submit"]',
    );

    submitButtons?.forEach((button) => {
      button.disabled = !category;
    });
  }, [category]);

  return (
    <div ref={fieldsRef} className="space-y-3">
      <input type="hidden" name="industry_category_required" value="true" />
      <div>
        <label
          htmlFor="industry_category"
          className="block text-sm font-medium text-slate-700"
        >
          業界カテゴリ
        </label>
        <select
          id="industry_category"
          name="industry_category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
        >
          <option value="">選択してください</option>
          {INDUSTRY_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {!category && (
          <p className="mt-1 text-sm text-red-600">
            業界カテゴリを選択してください。もう一度入力してください。
          </p>
        )}
      </div>

      {category === INDUSTRY_CATEGORY_OTHER && (
        <div>
          <label
            htmlFor="industry_other"
            className="block text-sm font-medium text-slate-700"
          >
            業界名を入力
          </label>
          <input
            id="industry_other"
            name="industry_other"
            type="text"
            required
            defaultValue={initialOther}
            placeholder="例: エンタメ"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          />
        </div>
      )}
    </div>
  );
}
