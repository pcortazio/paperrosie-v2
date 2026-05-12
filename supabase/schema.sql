-- ═══════════════════════════════════════════════════════════════
--  PAPER ROSIE STUDIO — Database Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Extension for UUID generation
create extension if not exists "uuid-ossp";

-- ── TABLES ──────────────────────────────────────────────────────

create table pr_suppliers (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  type         text,
  channel      text check (channel in ('online', 'fisico')),
  website      text,
  email        text,
  phone        text,
  city         text,
  province     text,
  notes        text,
  active       boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table pr_materials (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  cat          text,
  supplier_ids jsonb not null default '[]',
  price        numeric,
  qty          numeric,
  unit         text,
  unit_cost    numeric,
  notes        text,
  active       boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table pr_packaging (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  type         text,
  dims         text,
  cost         numeric,
  supplier_id  uuid references pr_suppliers(id) on delete set null,
  color        text,
  notes        text,
  updated_at   timestamptz not null default now()
);

create table pr_clients (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  email        text,
  channel      text,
  city         text,
  notes        text,
  active       boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table pr_products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  cat          text,
  price        numeric,
  profit       numeric,
  total_cost   numeric,
  margin       numeric,
  mins         integer,
  hourly       numeric,
  pack         numeric,
  ship         numeric,
  other        numeric,
  listing      numeric,
  trans        numeric,
  payment      numeric,
  notes        text,
  steps        text,
  ingredients  jsonb not null default '[]',
  active       boolean not null default true,
  saved_at     timestamptz,
  updated_at   timestamptz not null default now()
);

create table pr_purchases (
  id             uuid primary key default uuid_generate_v4(),
  date           date,
  supplier_id    uuid references pr_suppliers(id) on delete set null,
  items          jsonb not null default '[]',
  shipping       numeric not null default 0,
  total          numeric,
  cat            text,
  payment_method text,
  status         text not null default 'planejada'
                   check (status in ('planejada', 'feita', 'recebida')),
  notes          text,
  updated_at     timestamptz not null default now()
);

create table pr_inventory_adjustments (
  id         uuid primary key default uuid_generate_v4(),
  date       date,
  mode       text,
  reason     text,
  notes      text,
  items      jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table pr_orders (
  id            uuid primary key default uuid_generate_v4(),
  date          date,
  due_date      date,
  client_id     uuid references pr_clients(id) on delete set null,
  client_name   text,
  origin        text,
  status        text not null default 'novo'
                  check (status in ('novo','producao','pronto','enviado','entregue','cancelado')),
  items         jsonb not null default '[]',
  shipping_type text,
  ship_date     date,
  tracking      text,
  total         numeric,
  notes         text,
  updated_at    timestamptz not null default now()
);

create table pr_quotes (
  id          uuid primary key default uuid_generate_v4(),
  date        date,
  expiry      date,
  client_id   uuid references pr_clients(id) on delete set null,
  client_name text,
  items       jsonb not null default '[]',
  discount    numeric not null default 0,
  total       numeric,
  message     text,
  status      text not null default 'orcamento'
                check (status in ('orcamento','aprovado','recusado','expirado')),
  updated_at  timestamptz not null default now()
);

create table pr_settings (
  id         text primary key default 'main',
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ── TRIGGERS: auto-update updated_at ────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'pr_suppliers','pr_materials','pr_packaging','pr_clients',
    'pr_products','pr_purchases','pr_inventory_adjustments',
    'pr_orders','pr_quotes','pr_settings'
  ] loop
    execute format(
      'create trigger trg_%s_updated_at
       before update on %s
       for each row execute function set_updated_at()',
      replace(t, '.', '_'), t
    );
  end loop;
end;
$$;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────

alter table pr_suppliers            enable row level security;
alter table pr_materials            enable row level security;
alter table pr_packaging            enable row level security;
alter table pr_clients              enable row level security;
alter table pr_products             enable row level security;
alter table pr_purchases            enable row level security;
alter table pr_inventory_adjustments enable row level security;
alter table pr_orders               enable row level security;
alter table pr_quotes               enable row level security;
alter table pr_settings             enable row level security;

-- All authenticated users share full access (no per-user isolation needed)
do $$
declare
  t text;
begin
  foreach t in array array[
    'pr_suppliers','pr_materials','pr_packaging','pr_clients',
    'pr_products','pr_purchases','pr_inventory_adjustments',
    'pr_orders','pr_quotes','pr_settings'
  ] loop
    execute format(
      'create policy "authenticated_full_access" on %s
       for all to authenticated
       using (true) with check (true)',
      t
    );
  end loop;
end;
$$;

-- ── DEFAULT SETTINGS ROW ─────────────────────────────────────────

insert into pr_settings (id, data) values (
  'main',
  '{
    "hourly": 25,
    "pack": 2,
    "margin": 30,
    "quote_validity_days": 30,
    "listing": 0.20,
    "trans": 6.5,
    "payment": 3,
    "dropdowns": {
      "material_cats": ["Papel","Tecido","Fio","Tinta","Cola","Metal","Plástico","Outro"],
      "supplier_types": ["Atacado","Varejo","Importado","Artesanal","Outro"],
      "product_cats": ["Caderno","Agenda","Bloco","Acessório","Kit","Outro"],
      "client_channels": ["Etsy","Instagram","Whatsapp","Indicação","Loja","Outro"],
      "payment_methods": ["Pix","Cartão","Boleto","Dinheiro","Transferência"]
    }
  }'
) on conflict (id) do nothing;
