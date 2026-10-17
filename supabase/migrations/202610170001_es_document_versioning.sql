-- Increment the current ES version whenever its persisted content or metadata changes.
-- Historical content snapshots are intentionally outside the MVP scope (Issue #61).

create or replace function public.increment_es_document_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists increment_es_document_version_before_update on public.es_documents;
create trigger increment_es_document_version_before_update
before update on public.es_documents
for each row execute function public.increment_es_document_version();
