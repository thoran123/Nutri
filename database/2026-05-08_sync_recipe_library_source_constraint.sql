-- Sync recipe_library.source values + constraint.
-- Safe to run multiple times.

begin;

update public.recipe_library
set source = 'admin_created'
where source = 'admin_manual';

alter table public.recipe_library
  drop constraint if exists recipe_library_source_check;

alter table public.recipe_library
  add constraint recipe_library_source_check
  check (source in ('user_created', 'admin_created', 'admin_ai', 'imported', 'legacy_migration'));

commit;
