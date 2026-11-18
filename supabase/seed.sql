-- Seed data for `supabase db reset`.
--
-- User-owned rows cannot be seeded meaningfully without an auth.users record,
-- and the web app seeds a demo workspace client-side on first load. This file
-- only documents the demo credentials for local development.
--
-- Create a local user with:
--   supabase auth admin create-user --email demo@example.com --password demo12345
--
-- Then sign in through the app; spaces, notes, quizzes and plans can be created
-- normally, and RLS scopes every row to that user.

select 'StudyAssistant local database ready' as status;
