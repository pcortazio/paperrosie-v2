-- Paper Rosie V2 stock foundation.
-- All objects intentionally use the pr2_ prefix.

alter table public.pr2_purchases
  add column if not exists purchase_number text;

update public.pr2_purchases
set purchase_number = 'P-' || upper(left(id::text, 8))
where purchase_number is null;

alter table public.pr2_purchases
  alter column purchase_number set not null;

alter table public.pr2_purchases
  add constraint pr2_purchases_purchase_number_key unique (purchase_number);

create or replace function public.pr2_recalculate_material_reference_cost(pr2_material_id uuid)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_reference_cost numeric(12, 4);
begin
  select coalesce(max(unit_cost), 0)
  into pr2_reference_cost
  from (
    select pi.unit_cost
    from public.pr2_purchase_items pi
    join public.pr2_purchases p on p.id = pi.purchase_id
    where pi.material_id = pr2_material_id
      and pi.active = true
      and p.active = true
      and p.status = 'received'
      and pi.unit_cost >= 0
    order by coalesce(p.received_at, p.ordered_at) desc, p.created_at desc
    limit 5
  ) recent_costs;

  update public.pr2_materials
  set reference_cost_per_unit = pr2_reference_cost
  where id = pr2_material_id;

  return pr2_reference_cost;
end;
$$;

create or replace function public.pr2_apply_purchase_items_to_stock(
  pr2_purchase_id uuid,
  pr2_note text default 'Purchase stock recalculation'
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_item record;
  pr2_previous_quantity numeric(12, 3);
  pr2_new_quantity numeric(12, 3);
begin
  for pr2_item in
    select material_id, sum(quantity)::numeric(12, 3) as quantity
    from public.pr2_purchase_items
    where purchase_id = pr2_purchase_id
      and active = true
    group by material_id
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
      pr2_purchase_id,
      pr2_note
    );

    perform public.pr2_recalculate_material_reference_cost(pr2_item.material_id);
  end loop;
end;
$$;

create or replace function public.pr2_reverse_purchase_stock(
  pr2_purchase_id uuid,
  pr2_note text default 'Reverse received purchase stock'
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_existing record;
  pr2_previous_quantity numeric(12, 3);
  pr2_new_quantity numeric(12, 3);
begin
  for pr2_existing in
    select material_id, coalesce(sum(quantity_change), 0)::numeric(12, 3) as net_quantity
    from public.pr2_stock_movements
    where source_type = 'pr2_purchases'
      and source_id = pr2_purchase_id
      and type = 'purchase_received'
    group by material_id
    having coalesce(sum(quantity_change), 0) <> 0
  loop
    select current_stock
    into pr2_previous_quantity
    from public.pr2_materials
    where id = pr2_existing.material_id
    for update;

    pr2_new_quantity := pr2_previous_quantity - pr2_existing.net_quantity;

    update public.pr2_materials
    set current_stock = pr2_new_quantity
    where id = pr2_existing.material_id;

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
      pr2_existing.material_id,
      'purchase_received',
      -pr2_existing.net_quantity,
      pr2_previous_quantity,
      pr2_new_quantity,
      'pr2_purchases',
      pr2_purchase_id,
      pr2_note
    );

    perform public.pr2_recalculate_material_reference_cost(pr2_existing.material_id);
  end loop;
end;
$$;

create or replace function public.pr2_recalculate_received_purchase(pr2_purchase_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_purchase_status public.pr2_purchase_status;
begin
  select status
  into pr2_purchase_status
  from public.pr2_purchases
  where id = pr2_purchase_id
  for update;

  if pr2_purchase_status <> 'received' then
    return;
  end if;

  perform public.pr2_reverse_purchase_stock(pr2_purchase_id, 'Reversal before received purchase recalculation');
  perform public.pr2_apply_purchase_items_to_stock(pr2_purchase_id, 'Reapplied received purchase after edit');
end;
$$;

create or replace function public.pr2_receive_purchase(pr2_purchase_id uuid, pr2_received_at date default current_date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_purchase_status public.pr2_purchase_status;
begin
  select status
  into pr2_purchase_status
  from public.pr2_purchases
  where id = pr2_purchase_id
  for update;

  if pr2_purchase_status = 'cancelled' then
    raise exception 'Cancelled purchases cannot be received.';
  end if;

  if pr2_purchase_status = 'received' then
    update public.pr2_purchases
    set received_at = pr2_received_at
    where id = pr2_purchase_id;

    perform public.pr2_recalculate_received_purchase(pr2_purchase_id);
    return;
  end if;

  update public.pr2_purchases
  set status = 'received',
      received_at = pr2_received_at
  where id = pr2_purchase_id;
end;
$$;

create or replace function public.pr2_cancel_purchase(pr2_purchase_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_purchase_status public.pr2_purchase_status;
begin
  select status
  into pr2_purchase_status
  from public.pr2_purchases
  where id = pr2_purchase_id
  for update;

  if pr2_purchase_status = 'received' then
    perform public.pr2_reverse_purchase_stock(pr2_purchase_id, 'Reversal because purchase was cancelled');
  end if;

  update public.pr2_purchases
  set status = 'cancelled'
  where id = pr2_purchase_id;
end;
$$;

create or replace function public.pr2_apply_purchase_received()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'received' and old.status is distinct from 'received' then
    perform public.pr2_apply_purchase_items_to_stock(new.id, 'Purchase marked as received');
  end if;

  return new;
end;
$$;

create or replace function public.pr2_create_inventory_count_items(pr2_inventory_count_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.pr2_inventory_count_items (
    inventory_count_id,
    material_id,
    expected_quantity,
    counted_quantity,
    quantity_difference
  )
  select
    pr2_inventory_count_id,
    id,
    current_stock,
    current_stock,
    0
  from public.pr2_materials
  where active = true
  on conflict (inventory_count_id, material_id) do nothing;
end;
$$;

create or replace function public.pr2_finalize_inventory_count(pr2_inventory_count_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.pr2_inventory_counts
  set status = 'completed'
  where id = pr2_inventory_count_id
    and status = 'draft';
end;
$$;

revoke all on function public.pr2_recalculate_material_reference_cost(uuid) from public;
revoke all on function public.pr2_apply_purchase_items_to_stock(uuid, text) from public;
revoke all on function public.pr2_reverse_purchase_stock(uuid, text) from public;
revoke all on function public.pr2_recalculate_received_purchase(uuid) from public;
revoke all on function public.pr2_receive_purchase(uuid, date) from public;
revoke all on function public.pr2_cancel_purchase(uuid) from public;
revoke all on function public.pr2_create_inventory_count_items(uuid) from public;
revoke all on function public.pr2_finalize_inventory_count(uuid) from public;

grant execute on function public.pr2_recalculate_material_reference_cost(uuid) to authenticated;
grant execute on function public.pr2_apply_purchase_items_to_stock(uuid, text) to authenticated;
grant execute on function public.pr2_reverse_purchase_stock(uuid, text) to authenticated;
grant execute on function public.pr2_recalculate_received_purchase(uuid) to authenticated;
grant execute on function public.pr2_receive_purchase(uuid, date) to authenticated;
grant execute on function public.pr2_cancel_purchase(uuid) to authenticated;
grant execute on function public.pr2_create_inventory_count_items(uuid) to authenticated;
grant execute on function public.pr2_finalize_inventory_count(uuid) to authenticated;
