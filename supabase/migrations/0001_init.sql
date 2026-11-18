-- StudyAssistant initial schema.
-- Every table carries user_id and is protected by RLS (user_id = auth.uid()).
-- Public sharing is only possible through SECURITY DEFINER RPCs keyed by token.

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Enums (idempotent so migrations can be replayed on a fresh database)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.card_rating as enum ('easy', 'medium', 'hard', 'needs_revision');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quiz_question_type as enum ('single', 'multi', 'tf');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_topic_status as enum ('not_started', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.study_session_kind as enum ('chat', 'quiz', 'flashcards', 'lesson', 'revision', 'plan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.education_level as enum ('school', 'high_school', 'undergraduate', 'postgraduate', 'self_taught');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.explanation_style as enum ('concise', 'step_by_step', 'eli5', 'exam_focused');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null default 'Learner',
  education_level public.education_level not null default 'high_school',
  language text not null default 'English',
  explanation_style public.explanation_style not null default 'step_by_step',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  subject text not null default 'General',
  color text not null default 'indigo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_id uuid not null references public.chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  tool jsonb,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete set null,
  name text not null,
  storage_path text not null,
  mime text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  pages integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.file_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_id uuid not null references public.files (id) on delete cascade,
  page integer not null default 1,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete set null,
  title text not null default 'Untitled note',
  markdown text not null default '',
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete set null,
  title text not null,
  topic text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  questions jsonb not null default '[]'::jsonb,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score_pct integer not null check (score_pct between 0 and 100),
  feedback text,
  created_at timestamptz not null default now()
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete set null,
  name text not null,
  topic text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  front text not null,
  back text not null,
  rating public.card_rating,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  rating public.card_rating not null,
  reviewed_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists topics_space_name_key
  on public.topics (user_id, coalesce(space_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table if not exists public.topic_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null unique references public.topics (id) on delete cascade,
  strength integer not null default 40 check (strength between 0 and 100),
  last_studied_at timestamptz not null default now(),
  next_review_at timestamptz not null default now() + interval '1 day',
  reason text not null default 'New topic — take a quiz or rate a card to set your baseline.',
  streak integer not null default 0,
  reviews integer not null default 0,
  last_signal jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_name text not null,
  exam_date date not null,
  class_stream text,
  subjects jsonb not null default '[]'::jsonb,
  daily_minutes integer not null default 60 check (daily_minutes between 15 and 720),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.exam_plans (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_day_id uuid not null references public.plan_days (id) on delete cascade,
  name text not null,
  subject text not null,
  minutes integer not null default 45 check (minutes between 5 and 240),
  status public.plan_topic_status not null default 'not_started',
  lesson_markdown text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  kind public.study_session_kind not null default 'revision',
  duration_min integer not null default 1 check (duration_min > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null check (entity_type in ('note', 'quiz', 'deck', 'chat', 'topic')),
  entity_id uuid not null,
  folder text not null default 'Saved',
  created_at timestamptz not null default now()
);

-- Token accounting for the per-user daily AI budget. Service-role only.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  tokens integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists spaces_user_idx on public.spaces (user_id);
create index if not exists chats_user_space_idx on public.chats (user_id, space_id);
create index if not exists messages_chat_idx on public.messages (chat_id, created_at);
create index if not exists files_space_idx on public.files (space_id);
create index if not exists file_chunks_file_idx on public.file_chunks (file_id);
create index if not exists notes_user_idx on public.notes (user_id, updated_at desc);
create index if not exists quizzes_user_idx on public.quizzes (user_id);
create index if not exists decks_user_idx on public.decks (user_id);
create index if not exists cards_deck_idx on public.cards (deck_id);
create index if not exists topics_user_idx on public.topics (user_id);
create index if not exists topic_memory_due_idx on public.topic_memory (user_id, next_review_at);
create index if not exists exam_plans_user_idx on public.exam_plans (user_id);
create index if not exists plan_days_plan_idx on public.plan_days (plan_id, date);
create index if not exists plan_topics_day_idx on public.plan_topics (plan_day_id);
create index if not exists study_sessions_user_idx on public.study_sessions (user_id, created_at desc);

-- Vector similarity index (cosine distance). Lists tuned for a small dataset.
create index if not exists file_chunks_embedding_idx
  on public.file_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
do $$
declare
  table_name text;
  protected_tables text[] := array[
    'profiles', 'spaces', 'chats', 'messages', 'files', 'file_chunks', 'notes',
    'quizzes', 'quiz_attempts', 'decks', 'cards', 'card_reviews', 'topics',
    'topic_memory', 'exam_plans', 'plan_days', 'plan_topics', 'study_sessions',
    'bookmarks'
  ];
begin
  foreach table_name in array protected_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "owner_full_access" on public.%I', table_name);
    execute format(
      'create policy "owner_full_access" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name
    );
  end loop;
end $$;

-- ai_usage is only touched by Edge Functions with the service role key.
alter table public.ai_usage enable row level security;

-- updated_at maintenance
do $$
declare
  table_name text;
  tables text[] := array[
    'profiles', 'spaces', 'chats', 'notes', 'quizzes', 'decks', 'cards', 'topics',
    'topic_memory', 'exam_plans', 'plan_days', 'plan_topics'
  ];
begin
  foreach table_name in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Profile bootstrap
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'learner'), '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Public sharing: token-scoped SECURITY DEFINER RPCs. Base tables stay closed.
-- ---------------------------------------------------------------------------
create or replace function public.get_shared_note(p_token text)
returns table (title text, markdown text, created_at timestamptz, updated_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select n.title, n.markdown, n.created_at, n.updated_at
  from public.notes n
  where n.share_token = p_token
  limit 1;
$$;

create or replace function public.get_shared_quiz(p_token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'title', q.title,
    'topic', q.topic,
    'difficulty', q.difficulty,
    'questions', q.questions
  )
  from public.quizzes q
  where q.share_token = p_token
  limit 1;
$$;

revoke all on function public.get_shared_note(text) from public;
revoke all on function public.get_shared_quiz(text) from public;
grant execute on function public.get_shared_note(text) to anon, authenticated;
grant execute on function public.get_shared_quiz(text) to anon, authenticated;

-- Token generation helper used when a note or quiz is shared.
create or replace function public.generate_share_token()
returns text
language sql
volatile
as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

-- ---------------------------------------------------------------------------
-- Similarity search used by the chat function
-- ---------------------------------------------------------------------------
create or replace function public.match_file_chunks(
  p_user_id uuid,
  p_file_ids uuid[],
  p_embedding vector(1536),
  p_match_count integer default 6
)
returns table (file_id uuid, page integer, content text, similarity double precision)
language sql
security definer
set search_path = public
stable
as $$
  select fc.file_id, fc.page, fc.content,
         1 - (fc.embedding <=> p_embedding) as similarity
  from public.file_chunks fc
  where fc.user_id = p_user_id
    and fc.embedding is not null
    and (p_file_ids is null or fc.file_id = any (p_file_ids))
  order by fc.embedding <=> p_embedding
  limit least(coalesce(p_match_count, 6), 20);
$$;

revoke all on function public.match_file_chunks(uuid, uuid[], vector, integer) from public;
grant execute on function public.match_file_chunks(uuid, uuid[], vector, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Storage: one private bucket, files scoped to a folder named after the user id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('study-files', 'study-files', false)
on conflict (id) do nothing;

drop policy if exists "study files are private to their owner" on storage.objects;
create policy "study files are private to their owner"
  on storage.objects for all to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text);
