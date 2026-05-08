"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readRequiredString } from "@/lib/forms/read-form";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import { createPr2Supplier, updatePr2Supplier } from "@/lib/supabase/mutations/suppliers";

function supplierFormData(formData: FormData) {
  return {
    name: readRequiredString(formData, "name"),
    notes: readNullableString(formData, "notes"),
    website: readNullableString(formData, "website"),
  };
}

export async function createSupplierAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2Supplier(client, supplierFormData(formData));

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplierAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Supplier(client, id, supplierFormData(formData));

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function setSupplierActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_suppliers", id, active);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}/edit`);
}
