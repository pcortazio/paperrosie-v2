-- Paper Rosie V2 schema foundation.
-- IMPORTANT: every object created for this app uses the pr2_ prefix.
-- Do not create or modify legacy Paper Rosie tables from previous apps.

create type public.pr2_purchase_status as enum ('ordered', 'received', 'cancelled');
create type public.pr2_quote_status as enum ('draft', 'approved', 'cancelled');
create type public.pr2_order_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type public.pr2_inventory_count_status as enum ('draft', 'completed', 'cancelled');
create type public.pr2_stock_movement_type as enum ('purchase_received', 'order_completed', 'inventory_adjustment');

create or replace function public.pr2_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.pr2_units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbreviation text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  website text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.pr2_material_categories(id),
  unit_id uuid not null references public.pr2_units(id),
  current_stock numeric(12, 3) not null default 0,
  minimum_stock numeric(12, 3) not null default 0,
  reference_cost_per_unit numeric(12, 4) not null default 0,
  preferred_supplier_id uuid references public.pr2_suppliers(id),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_materials_current_stock_non_negative check (current_stock >= 0),
  constraint pr2_materials_minimum_stock_non_negative check (minimum_stock >= 0),
  constraint pr2_materials_reference_cost_non_negative check (reference_cost_per_unit >= 0)
);

create table public.pr2_purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.pr2_suppliers(id),
  ordered_at date not null default current_date,
  received_at date,
  status public.pr2_purchase_status not null default 'ordered',
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.pr2_purchases(id),
  material_id uuid not null references public.pr2_materials(id),
  quantity numeric(12, 3) not null,
  unit_id uuid not null references public.pr2_units(id),
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  shipping_allocated numeric(12, 2) not null default 0,
  total_cost numeric(12, 2) not null default 0,
  unit_cost numeric(12, 4) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_purchase_items_quantity_positive check (quantity > 0),
  constraint pr2_purchase_items_costs_non_negative check (
    subtotal >= 0 and tax >= 0 and shipping_allocated >= 0 and total_cost >= 0 and unit_cost >= 0
  )
);

create table public.pr2_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.pr2_product_categories(id),
  description text,
  image_url text,
  default_margin_percent numeric(6, 3) not null default 0,
  default_packaging_id uuid,
  labor_cost_fixed numeric(12, 2) not null default 0,
  extra_cost_fixed numeric(12, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_products_margin_non_negative check (default_margin_percent >= 0),
  constraint pr2_products_fixed_costs_non_negative check (labor_cost_fixed >= 0 and extra_cost_fixed >= 0)
);

create table public.pr2_packaging (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  margin_percent numeric(6, 3) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_packaging_margin_non_negative check (margin_percent >= 0)
);

alter table public.pr2_products
  add constraint pr2_products_default_packaging_id_fkey
  foreign key (default_packaging_id) references public.pr2_packaging(id);

create table public.pr2_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.pr2_products(id),
  name text not null,
  sku text,
  description text,
  image_url text,
  margin_percent numeric(6, 3),
  labor_cost_fixed numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_product_variants_margin_non_negative check (margin_percent is null or margin_percent >= 0),
  constraint pr2_product_variants_labor_non_negative check (labor_cost_fixed is null or labor_cost_fixed >= 0)
);

create table public.pr2_product_materials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.pr2_products(id),
  variant_id uuid references public.pr2_product_variants(id),
  material_id uuid not null references public.pr2_materials(id),
  quantity numeric(12, 3) not null,
  unit_id uuid not null references public.pr2_units(id),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_product_materials_quantity_positive check (quantity > 0)
);

create table public.pr2_packaging_materials (
  id uuid primary key default gen_random_uuid(),
  packaging_id uuid not null references public.pr2_packaging(id),
  material_id uuid not null references public.pr2_materials(id),
  quantity numeric(12, 3) not null,
  unit_id uuid not null references public.pr2_units(id),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_packaging_materials_quantity_positive check (quantity > 0)
);

create table public.pr2_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  customer_id uuid not null references public.pr2_customers(id),
  status public.pr2_quote_status not null default 'draft',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text,
  language_preference text not null default 'en',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_quotes_amounts_non_negative check (subtotal >= 0 and discount >= 0 and total >= 0)
);

create table public.pr2_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.pr2_quotes(id),
  product_id uuid not null references public.pr2_products(id),
  variant_id uuid references public.pr2_product_variants(id),
  packaging_id uuid references public.pr2_packaging(id),
  quantity integer not null,
  unit_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_quote_items_quantity_positive check (quantity > 0),
  constraint pr2_quote_items_prices_non_negative check (unit_price >= 0 and total_price >= 0)
);

create table public.pr2_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  quote_id uuid references public.pr2_quotes(id),
  customer_id uuid not null references public.pr2_customers(id),
  status public.pr2_order_status not null default 'pending',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_orders_amounts_non_negative check (subtotal >= 0 and discount >= 0 and total >= 0)
);

create table public.pr2_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pr2_orders(id),
  quote_item_id uuid references public.pr2_quote_items(id),
  product_id uuid not null references public.pr2_products(id),
  variant_id uuid references public.pr2_product_variants(id),
  packaging_id uuid references public.pr2_packaging(id),
  quantity integer not null,
  unit_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_order_items_quantity_positive check (quantity > 0),
  constraint pr2_order_items_prices_non_negative check (unit_price >= 0 and total_price >= 0)
);

create table public.pr2_inventory_counts (
  id uuid primary key default gen_random_uuid(),
  counted_at date not null default current_date,
  status public.pr2_inventory_count_status not null default 'draft',
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pr2_inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  inventory_count_id uuid not null references public.pr2_inventory_counts(id),
  material_id uuid not null references public.pr2_materials(id),
  expected_quantity numeric(12, 3) not null default 0,
  counted_quantity numeric(12, 3) not null default 0,
  quantity_difference numeric(12, 3) not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_inventory_count_items_expected_non_negative check (expected_quantity >= 0),
  constraint pr2_inventory_count_items_counted_non_negative check (counted_quantity >= 0),
  constraint pr2_inventory_count_items_unique_material unique (inventory_count_id, material_id)
);

create table public.pr2_stock_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.pr2_materials(id),
  type public.pr2_stock_movement_type not null,
  quantity_change numeric(12, 3) not null,
  previous_quantity numeric(12, 3) not null,
  new_quantity numeric(12, 3) not null,
  source_type text not null,
  source_id uuid not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pr2_stock_movements_previous_non_negative check (previous_quantity >= 0),
  constraint pr2_stock_movements_new_non_negative check (new_quantity >= 0)
);

create index pr2_materials_name_idx on public.pr2_materials using btree (name);
create index pr2_materials_active_idx on public.pr2_materials using btree (active);
create index pr2_materials_category_id_idx on public.pr2_materials using btree (category_id);
create index pr2_purchases_supplier_status_idx on public.pr2_purchases using btree (supplier_id, status);
create index pr2_products_name_idx on public.pr2_products using btree (name);
create index pr2_quotes_customer_status_idx on public.pr2_quotes using btree (customer_id, status);
create index pr2_orders_customer_status_idx on public.pr2_orders using btree (customer_id, status);
create index pr2_stock_movements_material_created_idx on public.pr2_stock_movements using btree (material_id, created_at desc);

create or replace function public.pr2_apply_purchase_received()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_item record;
  pr2_previous_quantity numeric(12, 3);
  pr2_new_quantity numeric(12, 3);
begin
  if new.status = 'received' and old.status is distinct from 'received' then
    for pr2_item in
      select material_id, quantity
      from public.pr2_purchase_items
      where purchase_id = new.id
        and active = true
    loop
      select current_stock
      into pr2_previous_quantity
      from public.pr2_materials
      where id = pr2_item.material_id
      for update;

      pr2_new_quantity := pr2_previous_quantity + pr2_item.quantity;

      update public.pr2_materials
      set current_stock = pr2_new_quantity
      where id = pr2_item.material_id;

      insert into public.pr2_stock_movements (
        material_id,
        type,
        quantity_change,
        previous_quantity,
        new_quantity,
        source_type,
        source_id,
        notes
      ) values (
        pr2_item.material_id,
        'purchase_received',
        pr2_item.quantity,
        pr2_previous_quantity,
        pr2_new_quantity,
        'pr2_purchases',
        new.id,
        'Purchase marked as received'
      );
    end loop;
  end if;

  return new;
end;
$$;

create or replace function public.pr2_apply_order_completed()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_required_material record;
  pr2_previous_quantity numeric(12, 3);
  pr2_new_quantity numeric(12, 3);
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    for pr2_required_material in
      select
        pm.material_id,
        sum(pm.quantity * oi.quantity)::numeric(12, 3) as required_quantity
      from public.pr2_order_items oi
      join public.pr2_product_materials pm
        on pm.product_id = oi.product_id
       and pm.active = true
       and (pm.variant_id is null or pm.variant_id = oi.variant_id)
      where oi.order_id = new.id
        and oi.active = true
      group by pm.material_id

      union all

      select
        pkm.material_id,
        sum(pkm.quantity * oi.quantity)::numeric(12, 3) as required_quantity
      from public.pr2_order_items oi
      join public.pr2_packaging_materials pkm
        on pkm.packaging_id = oi.packaging_id
       and pkm.active = true
      where oi.order_id = new.id
        and oi.active = true
        and oi.packaging_id is not null
      group by pkm.material_id
    loop
      select current_stock
      into pr2_previous_quantity
      from public.pr2_materials
      where id = pr2_required_material.material_id
      for update;

      pr2_new_quantity := pr2_previous_quantity - pr2_required_material.required_quantity;

      update public.pr2_materials
      set current_stock = pr2_new_quantity
      where id = pr2_required_material.material_id;

      insert into public.pr2_stock_movements (
        material_id,
        type,
        quantity_change,
        previous_quantity,
        new_quantity,
        source_type,
        source_id,
        notes
      ) values (
        pr2_required_material.material_id,
        'order_completed',
        -pr2_required_material.required_quantity,
        pr2_previous_quantity,
        pr2_new_quantity,
        'pr2_orders',
        new.id,
        'Order marked as completed'
      );
    end loop;
  end if;

  return new;
end;
$$;

create or replace function public.pr2_apply_inventory_count_completed()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_item record;
  pr2_previous_quantity numeric(12, 3);
  pr2_quantity_change numeric(12, 3);
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    for pr2_item in
      select id, material_id, counted_quantity
      from public.pr2_inventory_count_items
      where inventory_count_id = new.id
        and active = true
    loop
      select current_stock
      into pr2_previous_quantity
      from public.pr2_materials
      where id = pr2_item.material_id
      for update;

      pr2_quantity_change := pr2_item.counted_quantity - pr2_previous_quantity;

      update public.pr2_inventory_count_items
      set expected_quantity = pr2_previous_quantity,
          quantity_difference = pr2_quantity_change
      where id = pr2_item.id;

      update public.pr2_materials
      set current_stock = pr2_item.counted_quantity
      where id = pr2_item.material_id;

      insert into public.pr2_stock_movements (
        material_id,
        type,
        quantity_change,
        previous_quantity,
        new_quantity,
        source_type,
        source_id,
        notes
      ) values (
        pr2_item.material_id,
        'inventory_adjustment',
        pr2_quantity_change,
        pr2_previous_quantity,
        pr2_item.counted_quantity,
        'pr2_inventory_counts',
        new.id,
        'Inventory count finalized'
      );
    end loop;
  end if;

  return new;
end;
$$;

create trigger pr2_apply_purchase_received
after update of status on public.pr2_purchases
for each row
execute function public.pr2_apply_purchase_received();

create trigger pr2_apply_order_completed
after update of status on public.pr2_orders
for each row
execute function public.pr2_apply_order_completed();

create trigger pr2_apply_inventory_count_completed
after update of status on public.pr2_inventory_counts
for each row
execute function public.pr2_apply_inventory_count_completed();

revoke all on function public.pr2_set_updated_at() from public;
revoke all on function public.pr2_apply_purchase_received() from public;
revoke all on function public.pr2_apply_order_completed() from public;
revoke all on function public.pr2_apply_inventory_count_completed() from public;

grant execute on function public.pr2_set_updated_at() to authenticated;
grant execute on function public.pr2_apply_purchase_received() to authenticated;
grant execute on function public.pr2_apply_order_completed() to authenticated;
grant execute on function public.pr2_apply_inventory_count_completed() to authenticated;

create view public.pr2_low_stock_materials_view
with (security_invoker = true) as
select
  m.id,
  m.name,
  m.category_id,
  m.unit_id,
  m.current_stock,
  m.minimum_stock,
  greatest(m.minimum_stock - m.current_stock, 0) as needed_quantity,
  m.preferred_supplier_id,
  m.active,
  m.created_at,
  m.updated_at
from public.pr2_materials m
where m.active = true
  and m.current_stock < m.minimum_stock;

create view public.pr2_shopping_list_view
with (security_invoker = true) as
select
  m.id as material_id,
  m.name as material_name,
  m.unit_id,
  m.current_stock,
  m.minimum_stock,
  greatest(m.minimum_stock - m.current_stock, 0) as needed_quantity,
  m.preferred_supplier_id,
  s.name as preferred_supplier_name
from public.pr2_materials m
left join public.pr2_suppliers s on s.id = m.preferred_supplier_id
where m.active = true
  and m.current_stock < m.minimum_stock;

do $$
declare
  pr2_table_name text;
begin
  foreach pr2_table_name in array array[
    'pr2_units',
    'pr2_material_categories',
    'pr2_product_categories',
    'pr2_suppliers',
    'pr2_customers',
    'pr2_settings',
    'pr2_materials',
    'pr2_purchases',
    'pr2_purchase_items',
    'pr2_products',
    'pr2_product_variants',
    'pr2_product_materials',
    'pr2_packaging',
    'pr2_packaging_materials',
    'pr2_quotes',
    'pr2_quote_items',
    'pr2_orders',
    'pr2_order_items',
    'pr2_inventory_counts',
    'pr2_inventory_count_items',
    'pr2_stock_movements'
  ]
  loop
    execute format(
      'create trigger pr2_set_updated_at before update on public.%I for each row execute function public.pr2_set_updated_at()',
      pr2_table_name
    );

    execute format('alter table public.%I enable row level security', pr2_table_name);

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      pr2_table_name || '_select_authenticated',
      pr2_table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      pr2_table_name || '_insert_authenticated',
      pr2_table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      pr2_table_name || '_update_authenticated',
      pr2_table_name
    );
  end loop;
end $$;
