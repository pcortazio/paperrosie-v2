-- Paper Rosie V2 explicit order completion flow.
-- All objects intentionally use the pr2_ prefix.

create or replace function public.pr2_apply_order_completed()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Orders are completed through pr2_complete_order() so stock can be checked first.
  return new;
end;
$$;

create or replace function public.pr2_complete_order(pr2_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  pr2_order_status public.pr2_order_status;
  pr2_required record;
  pr2_previous_quantity numeric(12, 3);
  pr2_new_quantity numeric(12, 3);
  pr2_missing text;
begin
  select status
  into pr2_order_status
  from public.pr2_orders
  where id = pr2_order_id
  for update;

  if pr2_order_status is null then
    raise exception 'Order not found.';
  end if;

  if pr2_order_status = 'cancelled' then
    raise exception 'Cancelled orders cannot be completed.';
  end if;

  if pr2_order_status = 'completed' then
    return;
  end if;

  select string_agg(m.name || ' missing ' || (required.required_quantity - m.current_stock)::text, ', ')
  into pr2_missing
  from (
    select material_id, sum(required_quantity)::numeric(12, 3) as required_quantity
    from (
      select
        pm.material_id,
        sum(pm.quantity * oi.quantity)::numeric(12, 3) as required_quantity
      from public.pr2_order_items oi
      join public.pr2_product_materials pm
        on pm.product_id = oi.product_id
       and pm.active = true
       and (pm.variant_id is null or pm.variant_id = oi.variant_id)
      where oi.order_id = pr2_order_id
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
      where oi.order_id = pr2_order_id
        and oi.active = true
        and oi.packaging_id is not null
      group by pkm.material_id
    ) raw_required
    group by material_id
  ) required
  join public.pr2_materials m on m.id = required.material_id
  where m.current_stock < required.required_quantity;

  if pr2_missing is not null then
    raise exception 'Insufficient stock: %', pr2_missing;
  end if;

  for pr2_required in
    select material_id, sum(required_quantity)::numeric(12, 3) as required_quantity
    from (
      select
        pm.material_id,
        sum(pm.quantity * oi.quantity)::numeric(12, 3) as required_quantity
      from public.pr2_order_items oi
      join public.pr2_product_materials pm
        on pm.product_id = oi.product_id
       and pm.active = true
       and (pm.variant_id is null or pm.variant_id = oi.variant_id)
      where oi.order_id = pr2_order_id
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
      where oi.order_id = pr2_order_id
        and oi.active = true
        and oi.packaging_id is not null
      group by pkm.material_id
    ) raw_required
    group by material_id
  loop
    select current_stock
    into pr2_previous_quantity
    from public.pr2_materials
    where id = pr2_required.material_id
    for update;

    pr2_new_quantity := pr2_previous_quantity - pr2_required.required_quantity;

    update public.pr2_materials
    set current_stock = pr2_new_quantity
    where id = pr2_required.material_id;

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
      pr2_required.material_id,
      'order_completed',
      -pr2_required.required_quantity,
      pr2_previous_quantity,
      pr2_new_quantity,
      'order',
      pr2_order_id,
      'Order completed'
    );
  end loop;

  update public.pr2_orders
  set status = 'completed'
  where id = pr2_order_id;
end;
$$;

revoke all on function public.pr2_complete_order(uuid) from public;
grant execute on function public.pr2_complete_order(uuid) to authenticated;
