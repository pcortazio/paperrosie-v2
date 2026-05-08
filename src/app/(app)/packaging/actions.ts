"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readNumber, readRequiredString } from "@/lib/forms/read-form";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import {
  createPr2Packaging,
  createPr2PackagingMaterial,
  updatePr2Packaging,
} from "@/lib/supabase/mutations/packaging";

function packagingForm(formData: FormData) {
  return {
    description: readNullableString(formData, "description"),
    image_url: readNullableString(formData, "image_url"),
    margin_percent: readNumber(formData, "margin_percent"),
    name: readRequiredString(formData, "name"),
  };
}

export async function createPackagingAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { data, error } = await createPr2Packaging(client, packagingForm(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/packaging");
  redirect(`/packaging/${data.id}`);
}

export async function updatePackagingAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Packaging(client, id, packagingForm(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/packaging");
  revalidatePath(`/packaging/${id}`);
  redirect(`/packaging/${id}`);
}

export async function setPackagingActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_packaging", id, active);
  if (error) throw new Error(error.message);
  revalidatePath("/packaging");
  revalidatePath(`/packaging/${id}`);
}

export async function addPackagingMaterialAction(packagingId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2PackagingMaterial(client, {
    material_id: readRequiredString(formData, "material_id"),
    packaging_id: packagingId,
    quantity: readNumber(formData, "quantity"),
    unit_id: readRequiredString(formData, "unit_id"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/packaging/${packagingId}`);
}

export async function setPackagingMaterialActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const packagingId = readRequiredString(formData, "packaging_id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_packaging_materials", id, active);
  if (error) throw new Error(error.message);
  revalidatePath(`/packaging/${packagingId}`);
}
