alter table public.recipes
  add column if not exists visibility text not null default 'user_private';

alter table public.recipes
  add column if not exists published_at timestamptz;

alter table public.recipes
  add column if not exists is_published boolean not null default false;

alter table public.recipes
  drop constraint if exists recipes_visibility_check;

alter table public.recipes
  add constraint recipes_visibility_check
  check (visibility in ('user_private', 'community_pending', 'community', 'community_rejected'));

update public.recipes
set visibility = case
  when visibility in ('user_private', 'community_pending', 'community', 'community_rejected') then visibility
  when is_published = true then 'community'
  else 'user_private'
end;

update public.recipes
set is_published = true
where visibility = 'community';

update public.recipes
set is_published = false,
    published_at = null
where visibility <> 'community';

create index if not exists recipes_visibility_idx
  on public.recipes (visibility, is_published, published_at);
