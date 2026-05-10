"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readNumber, readRequiredString } from "@/lib/forms/read-form";
import { buildQuoteItemPricingSnapshot } from "@/lib/quotes/pricing-snapshot";
import { calculateQuoteSubtotal } from "@/lib/quotes/totals";
import { parsePricingDefaults } from "@/lib/pricing/settings";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import {
  createPr2Quote,
  createPr2QuoteItem,
  updatePr2Quote,
  updatePr2QuoteTotals,
} from "@/lib/supabase/mutations/quotes";
import { getPr2Packaging } from "@/lib/supabase/queries/packaging";
import { getPr2Product } from "@/lib/supabase/queries/products";
import { getPr2Quote } from "@/lib/supabase/queries/quotes";
import { getPr2Setting } from "@/lib/supabase/queries/settings";
import type { Pr2Material, Pr2Packaging, Pr2PackagingMaterial, Pr2Product, Pr2ProductMaterial, Pr2ProductVariant } from "@/types/database";

function nextQuoteNumber() {
  return `Q-${Date.now().toString(36).toUpperCase()}`;
}

async function refreshQuoteTotals(client: Awaited<ReturnType<typeof createAuthenticatedClient>>, quoteId: string) {
  const { data: quote, error } = await getPr2Quote(client, quoteId);
  if (error || !quote) throw new Error(error?.message ?? "Quote not found");
  const quoteRow = quote as unknown as { discount: number; items: Array<{ active: boolean; total_price: number }> };
  const subtotal = calculateQuoteSubtotal(quoteRow.items ?? []);
  const { error: totalsError } = await updatePr2QuoteTotals(client, quoteId, subtotal, quoteRow.discount);
  if (totalsError) throw new Error(totalsError.message);
}

export async function createQuoteAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { data, error } = await createPr2Quote(client, {
    customer_id: readRequiredString(formData, "customer_id"),
    discount: readNumber(formData, "discount"),
    language_preference: readRequiredString(formData, "language_preference"),
    notes: readNullableString(formData, "notes"),
    quote_number: nextQuoteNumber(),
    status: readRequiredString(formData, "status") as "draft" | "approved" | "cancelled",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/quotes");
  redirect(`/quotes/${data.id}`);
}

export async function updateQuoteAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Quote(client, id, {
    customer_id: readRequiredString(formData, "customer_id"),
    discount: readNumber(formData, "discount"),
    language_preference: readRequiredString(formData, "language_preference"),
    notes: readNullableString(formData, "notes"),
    status: readRequiredString(formData, "status") as "draft" | "approved" | "cancelled",
  });
  if (error) throw new Error(error.message);
  await refreshQuoteTotals(client, id);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

export async function addQuoteItemAction(quoteId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const productId = readRequiredString(formData, "product_id");
  const variantId = readNullableString(formData, "variant_id");
  const requestedPackagingId = readNullableString(formData, "packaging_id");
  const quantity = readNumber(formData, "quantity");
  const override = readNullableString(formData, "unit_price_override")
    ? readNumber(formData, "unit_price_override")
    : null;
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
  const { error } = await createPr2QuoteItem(client, {
    packaging_id: packaging?.id ?? null,
    pricing_snapshot: pricing.snapshot,
    product_id: productRow.id,
    quantity,
    quote_id: quoteId,
    total_price: pricing.totalPrice,
    unit_price: pricing.unitPrice,
    variant_id: variant?.id ?? null,
  });
  if (error) throw new Error(error.message);
  await refreshQuoteTotals(client, quoteId);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function setQuoteActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_quotes", id, active);
  if (error) throw new Error(error.message);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function setQuoteItemActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const quoteId = readRequiredString(formData, "quote_id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_quote_items", id, active);
  if (error) throw new Error(error.message);
  await refreshQuoteTotals(client, quoteId);
  revalidatePath(`/quotes/${quoteId}`);
}
