-- Paper Rosie V2 seed data.
-- All inserted records target pr2_ tables only.

insert into public.pr2_units (id, name, abbreviation) values
  ('00000000-0000-4000-8000-000000000001', 'sheets', 'sheets'),
  ('00000000-0000-4000-8000-000000000002', 'grams', 'g'),
  ('00000000-0000-4000-8000-000000000003', 'centimeters', 'cm'),
  ('00000000-0000-4000-8000-000000000004', 'square centimeters', 'cm²'),
  ('00000000-0000-4000-8000-000000000005', 'square meters', 'm²'),
  ('00000000-0000-4000-8000-000000000006', 'unit', 'unit')
on conflict (id) do nothing;

insert into public.pr2_material_categories (id, name) values
  ('00000000-0000-4000-8000-000000000101', 'Paper'),
  ('00000000-0000-4000-8000-000000000102', 'Adhesives'),
  ('00000000-0000-4000-8000-000000000103', 'Finishing'),
  ('00000000-0000-4000-8000-000000000104', 'Vinyl')
on conflict (id) do nothing;

insert into public.pr2_product_categories (id, name) values
  ('00000000-0000-4000-8000-000000000201', 'Stationery'),
  ('00000000-0000-4000-8000-000000000202', 'Planning')
on conflict (id) do nothing;

insert into public.pr2_suppliers (id, name, website, notes) values
  ('00000000-0000-4000-8000-000000000301', 'Paper Supply Co.', 'https://example.com/paper', 'Sample paper supplier'),
  ('00000000-0000-4000-8000-000000000302', 'Craft Materials Canada', 'https://example.com/craft', 'Sample craft supplier'),
  ('00000000-0000-4000-8000-000000000303', 'Vinyl Studio Supply', 'https://example.com/vinyl', 'Sample vinyl supplier')
on conflict (id) do nothing;

insert into public.pr2_customers (id, name, email, notes) values
  ('00000000-0000-4000-8000-000000000401', 'Sample Customer', 'sample.customer@example.com', 'Seed customer for quote and order examples')
on conflict (id) do nothing;

insert into public.pr2_settings (id, key, value) values
  ('00000000-0000-4000-8000-000000000501', 'pricing_defaults', '{"etsy_fee_percent": 25, "etsy_fee_fixed": 0.25, "default_margin_percent": 35}'::jsonb),
  ('00000000-0000-4000-8000-000000000502', 'pdf_language_strings', '{"en": {}, "pt": {}}'::jsonb)
on conflict (id) do nothing;

insert into public.pr2_materials (
  id,
  name,
  category_id,
  unit_id,
  current_stock,
  minimum_stock,
  reference_cost_per_unit,
  preferred_supplier_id
) values
  ('00000000-0000-4000-8000-000000000601', 'paper', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 120, 50, 0.35, '00000000-0000-4000-8000-000000000301'),
  ('00000000-0000-4000-8000-000000000602', 'lamination', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000005', 8, 5, 1.85, '00000000-0000-4000-8000-000000000302'),
  ('00000000-0000-4000-8000-000000000603', 'glue', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000002', 450, 200, 0.04, '00000000-0000-4000-8000-000000000302'),
  ('00000000-0000-4000-8000-000000000604', 'vinyl', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000005', 3, 6, 4.20, '00000000-0000-4000-8000-000000000303'),
  ('00000000-0000-4000-8000-000000000605', 'HTV', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000005', 4, 4, 5.10, '00000000-0000-4000-8000-000000000303'),
  ('00000000-0000-4000-8000-000000000606', 'tape', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000006', 12, 8, 1.25, '00000000-0000-4000-8000-000000000302')
on conflict (id) do nothing;

insert into public.pr2_packaging (id, name, description, margin_percent) values
  ('00000000-0000-4000-8000-000000000701', 'kraft box', 'Simple kraft shipping box', 15),
  ('00000000-0000-4000-8000-000000000702', 'premium wrapping', 'Premium tissue and finishing wrap', 20)
on conflict (id) do nothing;

insert into public.pr2_packaging_materials (id, packaging_id, material_id, quantity, unit_id) values
  ('00000000-0000-4000-8000-000000000711', '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000606', 0.25, '00000000-0000-4000-8000-000000000006'),
  ('00000000-0000-4000-8000-000000000712', '00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000601', 2, '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000713', '00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000606', 0.15, '00000000-0000-4000-8000-000000000006')
on conflict (id) do nothing;

insert into public.pr2_products (
  id,
  name,
  category_id,
  description,
  default_margin_percent,
  default_packaging_id,
  labor_cost_fixed,
  extra_cost_fixed
) values
  ('00000000-0000-4000-8000-000000000801', 'notebook', '00000000-0000-4000-8000-000000000201', 'Sample handmade notebook', 35, '00000000-0000-4000-8000-000000000701', 6.00, 1.00),
  ('00000000-0000-4000-8000-000000000802', 'planner', '00000000-0000-4000-8000-000000000202', 'Sample handmade planner', 40, '00000000-0000-4000-8000-000000000702', 9.00, 1.50)
on conflict (id) do nothing;

insert into public.pr2_product_variants (id, product_id, name, sku, description) values
  ('00000000-0000-4000-8000-000000000811', '00000000-0000-4000-8000-000000000801', 'classic', 'NB-CLASSIC', 'Classic notebook finish'),
  ('00000000-0000-4000-8000-000000000812', '00000000-0000-4000-8000-000000000802', 'weekly', 'PL-WEEKLY', 'Weekly planner layout')
on conflict (id) do nothing;

insert into public.pr2_product_materials (id, product_id, variant_id, material_id, quantity, unit_id) values
  ('00000000-0000-4000-8000-000000000821', '00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000811', '00000000-0000-4000-8000-000000000601', 24, '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000822', '00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000811', '00000000-0000-4000-8000-000000000603', 10, '00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000823', '00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000812', '00000000-0000-4000-8000-000000000601', 36, '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000824', '00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000812', '00000000-0000-4000-8000-000000000602', 0.25, '00000000-0000-4000-8000-000000000005')
on conflict (id) do nothing;

insert into public.pr2_purchases (id, purchase_number, supplier_id, ordered_at, received_at, status, notes) values
  ('00000000-0000-4000-8000-000000000901', 'P-PR2-0001', '00000000-0000-4000-8000-000000000301', current_date - 10, current_date - 5, 'received', 'Sample received purchase')
on conflict (id) do nothing;

insert into public.pr2_purchase_items (
  id,
  purchase_id,
  material_id,
  quantity,
  unit_id,
  subtotal,
  tax,
  shipping_allocated,
  total_cost,
  unit_cost
) values
  ('00000000-0000-4000-8000-000000000911', '00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000601', 100, '00000000-0000-4000-8000-000000000001', 30.00, 3.90, 1.10, 35.00, 0.35)
on conflict (id) do nothing;

insert into public.pr2_quotes (
  id,
  quote_number,
  customer_id,
  status,
  subtotal,
  discount,
  total,
  language_preference,
  notes
) values
  ('00000000-0000-4000-8000-000000001001', 'Q-PR2-0001', '00000000-0000-4000-8000-000000000401', 'draft', 28.00, 0.00, 28.00, 'en', 'Sample quote')
on conflict (id) do nothing;

insert into public.pr2_quote_items (
  id,
  quote_id,
  product_id,
  variant_id,
  packaging_id,
  quantity,
  unit_price,
  total_price,
  pricing_snapshot
) values
  (
    '00000000-0000-4000-8000-000000001011',
    '00000000-0000-4000-8000-000000001001',
    '00000000-0000-4000-8000-000000000801',
    '00000000-0000-4000-8000-000000000811',
    '00000000-0000-4000-8000-000000000701',
    1,
    28.00,
    28.00,
    '{"material_cost": 8.80, "labor_cost": 6.00, "extra_cost": 1.00, "suggested_price": 28.00}'::jsonb
  )
on conflict (id) do nothing;

insert into public.pr2_orders (
  id,
  order_number,
  quote_id,
  customer_id,
  status,
  subtotal,
  discount,
  total,
  notes
) values
  ('00000000-0000-4000-8000-000000001101', 'O-PR2-0001', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000401', 'pending', 28.00, 0.00, 28.00, 'Sample order from seed quote')
on conflict (id) do nothing;

insert into public.pr2_order_items (
  id,
  order_id,
  quote_item_id,
  product_id,
  variant_id,
  packaging_id,
  quantity,
  unit_price,
  total_price,
  pricing_snapshot
) values
  (
    '00000000-0000-4000-8000-000000001111',
    '00000000-0000-4000-8000-000000001101',
    '00000000-0000-4000-8000-000000001011',
    '00000000-0000-4000-8000-000000000801',
    '00000000-0000-4000-8000-000000000811',
    '00000000-0000-4000-8000-000000000701',
    1,
    28.00,
    28.00,
    '{"material_cost": 8.80, "labor_cost": 6.00, "extra_cost": 1.00, "suggested_price": 28.00}'::jsonb
  )
on conflict (id) do nothing;
