# Supabase schema setup

This directory contains the reproducible database setup for the Shukatsu OS MVP.

## Files

- `migrations/202606270001_mvp_schema_and_rls.sql`
  - Creates the MVP tables from the DB design document and Issue #19.
  - Enables row-level security for every user-owned table.
  - Adds policies so each authenticated user can only read and write their own data.
  - Keeps the current app compatible with `companies.user_id` while also adding `workspaces` and `companies.workspace_id`.
- `migrations/202610170001_es_document_versioning.sql`
  - Increments `es_documents.version` for every update.
  - Uses the existing `touch_es_documents_updated_at` trigger to keep the displayed final-update time current.
  - Keeps historical content snapshots out of the MVP; Issue #61 tracks submission-version history.

## MVP tables

The migration creates these tables:

- `users`
- `workspaces`
- `companies`
- `applications`
- `es_documents`
- `interview_logs`
- `tasks`
- `events`
- `pages`
- `page_blocks`
- `templates`

`users` is a public profile table keyed by `auth.users.id`. A trigger on `auth.users` creates the public profile and a default workspace when a new user signs up.

## Current app compatibility

The existing Next.js screens already read and write `companies.user_id`.

The schema keeps `companies.user_id` as a required column and adds `companies.workspace_id`. A database trigger fills `workspace_id` with the user's default workspace when existing app code inserts a company without a workspace value.

This means the current companies list, detail, edit, delete, and dashboard queries remain consistent with the new workspace-based schema.

## Local setup

1. Create `app/.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Apply the migration.

   Option A: Supabase SQL editor

   - Open the Supabase project.
   - Go to SQL Editor.
   - Paste `supabase/migrations/202606270001_mvp_schema_and_rls.sql`.
   - Run the SQL.

   Option B: Supabase CLI

   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

3. Run the app:

   ```bash
   cd app
   npm install
   npm run dev
   ```

## Production setup

1. Apply the same migration to the production Supabase project.
2. Set these Vercel environment variables for the production deployment:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-production-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   ```

3. Confirm that Supabase Auth email settings and redirect URLs match the deployed app URL.

## RLS model

- `users`: access is limited to `auth.uid() = users.id`.
- `workspaces`: access is limited to the owning `user_id`.
- `companies`: access is limited to `companies.user_id = auth.uid()`.
- `applications`, `es_documents`, and `interview_logs`: access is inherited through the related company.
- `tasks`, `events`, `pages`, and `templates`: access is inherited through the related workspace.
- `page_blocks`: access is inherited through the parent page and workspace.

Use the authenticated Supabase client from the app. Do not use the service role key in browser or client-side code.
