"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  readNullableString,
  readNumber,
  readRequiredString,
} from "@/lib/forms/read-form";
import { createPr2Material, updatePr2Material } from "@/lib/supabase/mutations/materials";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import { createAuthenticatedClient } from "@/lib/supabase/auth";

function materialFormData(formData: FormData) {
  return {
    category_id: readNullableString(formData, "category_id"),
    current_stock: readNumber(formData, "current_stock"),
    minimum_stock: readNumber(formData, "minimum_stock"),
    name: readRequiredString(formData, "name"),
    notes: readNullableString(formData, "notes"),
    preferred_supplier_id: readNullableString(formData, "preferred_supplier_id"),
    reference_cost_per_unit: readNumber(formData, "reference_cost_per_unit"),
    unit_id: readRequiredString(formData, "unit_id"),
  };
}

export async function createMaterialAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2Material(client, materialFormData(formData));

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/materials");
  redirect("/materials");
}

export async function updateMaterialAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Material(client, id, materialFormData(formData));

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/materials");
  revalidatePath(`/materials/${id}`);
  redirect(`/materials/${id}`);
}

export async function setMaterialActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_materials", id, active);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/materials");
  revalidatePath(`/materials/${id}`);
}
