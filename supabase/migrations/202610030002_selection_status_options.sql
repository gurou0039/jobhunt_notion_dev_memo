update public.companies
set selection_status = case selection_status
  when '未エントリー' then '未応募'
  when 'ES提出' then '応募済み'
  when 'Webテスト' then '書類選考中'
  when '1次面接' then '一次面接'
  when '2次面接' then '二次面接'
  when 'お祈り' then '不採用'
  when 'not_entered' then '未応募'
  else selection_status
end
where selection_status in (
  '未エントリー',
  'ES提出',
  'Webテスト',
  '1次面接',
  '2次面接',
  'お祈り',
  'not_entered'
);

alter table public.companies
  alter column selection_status set default '未応募';

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'companies_selection_status_allowed'
       and conrelid = 'public.companies'::regclass
  ) then
    alter table public.companies add constraint companies_selection_status_allowed
      check (selection_status in (
        '未応募',
        '応募済み',
        '書類選考中',
        '一次面接',
        '二次面接',
        '最終面接',
        '内定',
        '不採用',
        '辞退'
      )) not valid;
  end if;
end;
$$;

alter table public.companies validate constraint companies_selection_status_allowed;
