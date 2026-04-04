create table if not exists user_cards (
  id          text primary key,
  user_id     uuid references auth.users not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table user_cards enable row level security;

create policy "users can manage own cards" on user_cards
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_user_cards_user_id on user_cards(user_id);
create index idx_user_cards_updated on user_cards(user_id, updated_at);
