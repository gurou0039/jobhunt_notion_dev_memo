import Link from "next/link";
import {
  EsDocument,
  ES_DOCUMENT_TYPE_OPTIONS,
} from "@/lib/es";

export type EsCompanyOption = {
  id: string;
  company_name: string;
};

type EsFormProps = {
  action: (formData: FormData) => Promise<void>;
  companies: EsCompanyOption[];
  defaultCompanyId?: string;
  document?: EsDocument;
  error?: string;
  submitLabel: string;
};

export function EsForm({
  action,
  companies,
  defaultCompanyId,
  document,
  error,
  submitLabel,
}: EsFormProps) {
  return (
    <form action={action} className="space-y-5">
      {document ? (
        <input type="hidden" name="document_id" value={document.id} />
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company_id" className="block text-sm font-medium text-slate-700">
            企業 <span className="text-rose-600">*</span>
          </label>
          <select
            id="company_id"
            name="company_id"
            required
            defaultValue={document?.company_id ?? defaultCompanyId ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          >
            <option value="" disabled>企業を選択</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="doc_type" className="block text-sm font-medium text-slate-700">
            文書種別 <span className="text-rose-600">*</span>
          </label>
          <select
            id="doc_type"
            name="doc_type"
            required
            defaultValue={document?.doc_type ?? "entry_sheet"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
          >
            {ES_DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          ESタイトル <span className="text-rose-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          defaultValue={document?.title ?? ""}
          placeholder="例: 本選考 エントリーシート"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-slate-700">
          本文
        </label>
        <textarea
          id="content"
          name="content"
          rows={18}
          defaultValue={document?.content ?? ""}
          placeholder="設問、回答、推敲中のメモを入力"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 leading-7 text-slate-950"
        />
        <p className="mt-1 text-xs text-slate-500">本文が空でも下書きとして保存できます。</p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Link
          href={document ? `/es/${document.id}` : "/es"}
          className="rounded-md border border-slate-300 px-5 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          キャンセル
        </Link>
        <button type="submit" className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
