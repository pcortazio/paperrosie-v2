"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readNumber, readRequiredString } from "@/lib/forms/read-form";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import {
  cancelPr2InventoryCount,
  createPr2InventoryCount,
  createPr2InventoryCountItems,
  updatePr2InventoryCountItem,
} from "@/lib/supabase/mutations/inventory";
import { finalizeInventoryCount } from "@/lib/stock/inventory";

export async function createInventoryCountAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { data, error } = await createPr2InventoryCount(client, {
    counted_at: readRequiredString(formData, "counted_at"),
    notes: readNullableString(formData, "notes"),
  });

  if (error) throw new Error(error.message);

  const { error: itemsError } = await createPr2InventoryCountItems(client, data.id);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/inventory");
  redirect(`/inventory/${data.id}`);
}

export async function updateInventoryCountItemAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const inventoryCountId = readRequiredString(formData, "inventory_count_id");
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2InventoryCountItem(client, id, readNumber(formData, "counted_quantity"));

  if (error) throw new Error(error.message);
  revalidatePath(`/inventory/${inventoryCountId}`);
}

export async function finalizeInventoryCountAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const client = await createAuthenticatedClient();
  const { error } = await finalizeInventoryCount(client, id);

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
}

export async function cancelInventoryCountAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const client = await createAuthenticatedClient();
  const { error } = await cancelPr2InventoryCount(client, id);

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
}
