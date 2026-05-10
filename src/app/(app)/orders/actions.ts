"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readNumber, readRequiredString } from "@/lib/forms/read-form";
import { calculateOrderSubtotal } from "@/lib/orders/totals";
import { buildQuoteItemPricingSnapshot } from "@/lib/quotes/pricing-snapshot";
import { parsePricingDefaults } from "@/lib/pricing/settings";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import {
  completePr2Order,
  createPr2Order,
  createPr2OrderItem,
  updatePr2Order,
  updatePr2OrderTotals,
} from "@/lib/supabase/mutations/orders";
import { getPr2Packaging } from "@/lib/supabase/queries/packaging";
import { getPr2Product } from "@/lib/supabase/queries/products";
import { getPr2Order, getPr2OrderForQuote } from "@/lib/supabase/queries/orders";
import { getPr2Quote } from "@/lib/supabase/queries/quotes";
import { getPr2Setting } from "@/lib/supabase/queries/settings";
import type { Pr2Material, Pr2Packaging, Pr2PackagingMaterial, Pr2Product, Pr2ProductMaterial, Pr2ProductVariant } from "@/types/database";

function nextOrderNumber() {
  return `O-${Date.now().toString(36).toUpperCase()}`;
}

async function refreshOrderTotals(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, orderId: string) {
  const { data: order, error } = await getPr2Order(client, orderId);
  if (error || !order) throw new Error(error?.message ?? "Order not found");
  const orderRow = order as unknown as { discount: number; items: Array<{ active: boolean; total_price: number }> };
  const subtotal = calculateOrderSubtotal(orderRow.items ?? []);
  const { error: totalsError } = await updatePr2OrderTotals(client, orderId, subtotal, orderRow.discount);
  if (totalsError) throw new Error(totalsError.message);
}

export async function createOrderAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { data, error } = await createPr2Order(client, {
    customer_id: readRequiredString(formData, "customer_id"),
    discount: readNumber(formData, "discount"),
    notes: readNullableString(formData, "notes"),
    order_number: nextOrderNumber(),
    status: readRequiredString(formData, "status") as "pending" | "in_progress" | "cancelled",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/orders");
  redirect(`/orders/${data.id}`);
}

export async function updateOrderAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Order(client, id, {
    customer_id: readRequiredString(formData, "customer_id"),
    discount: readNumber(formData, "discount"),
    notes: readNullableString(formData, "notes"),
    status: readRequiredString(formData, "status") as "pending" | "in_progress" | "completed" | "cancelled",
  });
  if (error) throw new Error(error.message);
  await refreshOrderTotals(client, id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
}

export async function addOrderItemAction(orderId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const productId = readRequiredString(formData, "product_id");
  const variantId = readNullableString(formData, "variant_id");
  const requestedPackagingId = readNullableString(formData, "packaging_id");
  const quantity = readNumber(formData, "quantity");
  const override = readNullableString(formData, "unit_price_override") ? readNumber(formData, "unit_price_override") : null;
  const [{ data: product }, { data: setting }] = await Promise.all([
    getPr2Product(client, productId),
    getPr2Setting(client, "pricing_defaults"),
  ]);
  if (!product) throw new Error("Product not found");
  const productRow = product as unknown as Pr2Product & {
    materials: Array<Pr2ProductMaterial & { material: Pr2Material | null }>;
    variants: Pr2ProductVariant[];
  };
  const variant = productRow.variants.find((item) => item.id === variantId) ?? null;
  const packagingId = requestedPackagingId ?? productRow.default_packaging_id;
  const { data: packagingData } = packagingId ? await getPr2Packaging(client, packagingId) : { data: null };
  const packaging = packagingData as unknown as
    | (Pr2Packaging & { materials: Array<Pr2PackagingMaterial & { material: Pr2Material | null }> })
    | null;
  const pricing = buildQuoteItemPricingSnapshot({
    defaults: parsePricingDefaults(setting?.value),
    packaging,
    product: productRow,
    quantity,
    unitPriceOverride: override,
    variant,
  });
  const { error } = await createPr2OrderItem(client, {
    order_id: orderId,
    packaging_id: packaging?.id ?? null,
    pricing_snapshot: pricing.snapshot,
    product_id: productRow.id,
    quantity,
    total_price: pricing.totalPrice,
    unit_price: pricing.unitPrice,
    variant_id: variant?.id ?? null,
  });
  if (error) throw new Error(error.message);
  await refreshOrderTotals(client, orderId);
  revalidatePath(`/orders/${orderId}`);
}

export async function createOrderFromQuoteAction(formData: FormData) {
  const quoteId = readRequiredString(formData, "quote_id");
  const client = await createAuthenticatedClient();
  const [{ data: existing }, { data: quote, error }] = await Promise.all([
    getPr2OrderForQuote(client, quoteId),
    getPr2Quote(client, quoteId),
  ]);
  if (existing) redirect(`/orders/${existing.id}`);
  if (error || !quote) throw new Error(error?.message ?? "Quote not found");
  if (quote.status !== "approved") throw new Error("Only approved quotes can become orders.");

  const quoteRow = quote as unknown as { customer_id: string; discount: number; subtotal: number; total: number; notes: string | null; items: Array<{ active: boolean; packaging_id: string | null; pricing_snapshot: never; product_id: string; quantity: number; total_price: number; unit_price: number; variant_id: string | null }> };
  const { data: order, error: orderError } = await createPr2Order(client, {
    customer_id: quoteRow.customer_id,
    discount: quoteRow.discount,
    notes: quoteRow.notes,
    order_number: nextOrderNumber(),
    quote_id: quoteId,
    status: "pending",
    subtotal: quoteRow.subtotal,
    total: quoteRow.total,
  });
  if (orderError) throw new Error(orderError.message);

  for (const item of quoteRow.items.filter((entry) => entry.active)) {
    const { error: itemError } = await createPr2OrderItem(client, {
      order_id: order.id,
      packaging_id: item.packaging_id,
      pricing_snapshot: item.pricing_snapshot,
      product_id: item.product_id,
      quantity: item.quantity,
      total_price: item.total_price,
      unit_price: item.unit_price,
      variant_id: item.variant_id,
    });
    if (itemError) throw new Error(itemError.message);
  }

  revalidatePath("/orders");
  revalidatePath(`/quotes/${quoteId}`);
  redirect(`/orders/${order.id}`);
}

export async function completeOrderAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const client = await createAuthenticatedClient();
  const { error } = await completePr2Order(client, id);
  if (error) throw new Error(error.message);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

export async function setOrderActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_orders", id, active);
  if (error) throw new Error(error.message);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

export async function setOrderItemActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const orderId = readRequiredString(formData, "order_id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_order_items", id, active);
  if (error) throw new Error(error.message);
  await refreshOrderTotals(client, orderId);
  revalidatePath(`/orders/${orderId}`);
}
