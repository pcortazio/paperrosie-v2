"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readNumber, readRequiredString } from "@/lib/forms/read-form";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import {
  createPr2Purchase,
  createPr2PurchaseItem,
  updatePr2Purchase,
  updatePr2PurchaseItem,
} from "@/lib/supabase/mutations/purchases";
import { cancelPurchase, receivePurchase, recalculateReceivedPurchase } from "@/lib/stock/purchases";

function nextPurchaseNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  return `P-${stamp}`;
}

function itemFormData(formData: FormData, purchaseId: string) {
  const quantity = readNumber(formData, "quantity");
  const subtotal = readNumber(formData, "subtotal");
  const tax = readNumber(formData, "tax");
  const shippingAllocated = readNumber(formData, "shipping_allocated");
  const totalCost = subtotal + tax + shippingAllocated;

  return {
    material_id: readRequiredString(formData, "material_id"),
    purchase_id: purchaseId,
    quantity,
    shipping_allocated: shippingAllocated,
    subtotal,
    tax,
    total_cost: totalCost,
    unit_cost: quantity > 0 ? totalCost / quantity : 0,
    unit_id: readRequiredString(formData, "unit_id"),
  };
}

export async function createPurchaseAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { data, error } = await createPr2Purchase(client, {
    notes: readNullableString(formData, "notes"),
    ordered_at: readRequiredString(formData, "ordered_at"),
    purchase_number: nextPurchaseNumber(),
    supplier_id: readRequiredString(formData, "supplier_id"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/purchases");
  redirect(`/purchases/${data.id}`);
}

export async function updatePurchaseAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Purchase(client, id, {
    notes: readNullableString(formData, "notes"),
    ordered_at: readRequiredString(formData, "ordered_at"),
    supplier_id: readRequiredString(formData, "supplier_id"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
  redirect(`/purchases/${id}`);
}

export async function addPurchaseItemAction(purchaseId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2PurchaseItem(client, itemFormData(formData, purchaseId));

  if (error) throw new Error(error.message);
  await recalculateReceivedPurchase(client, purchaseId);
  revalidatePath(`/purchases/${purchaseId}`);
  redirect(`/purchases/${purchaseId}`);
}

export async function updatePurchaseItemAction(purchaseId: string, itemId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2PurchaseItem(client, itemId, itemFormData(formData, purchaseId));

  if (error) throw new Error(error.message);
  await recalculateReceivedPurchase(client, purchaseId);
  revalidatePath(`/purchases/${purchaseId}`);
  redirect(`/purchases/${purchaseId}`);
}

export async function setPurchaseItemActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const purchaseId = readRequiredString(formData, "purchase_id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_purchase_items", id, active);

  if (error) throw new Error(error.message);
  await recalculateReceivedPurchase(client, purchaseId);
  revalidatePath(`/purchases/${purchaseId}`);
}

export async function receivePurchaseAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const receivedAt = readRequiredString(formData, "received_at");
  const client = await createAuthenticatedClient();
  const { error } = await receivePurchase(client, id, receivedAt);

  if (error) throw new Error(error.message);
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
  redirect(`/purchases/${id}`);
}

export async function cancelPurchaseAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const client = await createAuthenticatedClient();
  const { error } = await cancelPurchase(client, id);

  if (error) throw new Error(error.message);
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
}

export async function setPurchaseActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_purchases", id, active);

  if (error) throw new Error(error.message);
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
}
