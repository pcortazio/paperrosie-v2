-- Paper Rosie V2 product and packaging foundation additions.
-- All objects intentionally use the pr2_ prefix.

alter table public.pr2_packaging
  add column if not exists image_url text;
