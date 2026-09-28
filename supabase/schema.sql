-- 在 Supabase SQL Editor 中运行。仅使用 publishable / anon key，禁止在前端放 service_role key。
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.player_saves enable row level security;
create policy "Read own save" on public.player_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own save" on public.player_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own save" on public.player_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
