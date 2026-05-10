-- Paper Rosie V2 customers and quotes additions.
-- All objects intentionally use the pr2_ prefix.

alter table public.pr2_customers
  add column if not exists company text;
