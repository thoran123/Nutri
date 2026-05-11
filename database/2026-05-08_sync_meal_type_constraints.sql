-- Sync meal_type values + constraints across recipe_library and recipe_library_import_queue.
-- Safe to run multiple times.

begin;

-- 1) Drop old constraints first, because some live DBs still reject the new
-- canonical value "other".
alter table public.recipe_library
  drop constraint if exists recipe_library_meal_type_check;

alter table public.recipe_library_import_queue
  drop constraint if exists recipe_library_import_queue_meal_type_check;

-- 2) Normalize existing legacy values to the new canonical set.
update public.recipe_library
set meal_type = 'other'
where lower(coalesce(meal_type, '')) in (
  'snack', 'snacks',
  'dessert', 'desserts',
  'drink', 'drinks',
  'beverage', 'beverages'
);

update public.recipe_library_import_queue
set meal_type = 'other'
where lower(coalesce(meal_type, '')) in (
  'snack', 'snacks',
  'dessert', 'desserts',
  'drink', 'drinks',
  'beverage', 'beverages'
);

-- 3) Recreate canonical constraints.
alter table public.recipe_library
  add constraint recipe_library_meal_type_check
  check (meal_type in ('breakfast', 'lunch', 'dinner', 'other'));

alter table public.recipe_library_import_queue
  add constraint recipe_library_import_queue_meal_type_check
  check (meal_type is null or meal_type in ('breakfast', 'lunch', 'dinner', 'other'));

commit;
