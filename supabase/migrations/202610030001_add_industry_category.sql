alter table public.companies
  add column if not exists industry_category text;

create index if not exists idx_companies_industry_category
  on public.companies(industry_category);

