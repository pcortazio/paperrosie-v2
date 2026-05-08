"use server";

import { revalidatePath } from "next/cache";

import { readNumber, readRequiredString } from "@/lib/forms/read-form";
import {
  createPr2MaterialCategory,
  createPr2ProductCategory,
  createPr2Unit,
  updatePr2MaterialCategory,
  updatePr2ProductCategory,
  updatePr2Unit,
} from "@/lib/supabase/mutations/lookups";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import { upsertPr2Setting } from "@/lib/supabase/mutations/settings";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import type { Pr2TableWithActiveState } from "@/lib/supabase/mutations/active-state";

export async function createUnitAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2Unit(client, {
    abbreviation: readRequiredString(formData, "abbreviation"),
    name: readRequiredString(formData, "name"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateUnitAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Unit(client, readRequiredString(formData, "id"), {
    abbreviation: readRequiredString(formData, "abbreviation"),
    name: readRequiredString(formData, "name"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function createMaterialCategoryAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2MaterialCategory(client, {
    name: readRequiredString(formData, "name"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateMaterialCategoryAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2MaterialCategory(client, readRequiredString(formData, "id"), {
    name: readRequiredString(formData, "name"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function createProductCategoryAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2ProductCategory(client, {
    name: readRequiredString(formData, "name"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateProductCategoryAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2ProductCategory(client, readRequiredString(formData, "id"), {
    name: readRequiredString(formData, "name"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function setLookupActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const table = readRequiredString(formData, "table") as Pr2TableWithActiveState;
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, table, id, active);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updatePricingDefaultsAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await upsertPr2Setting(client, "pricing_defaults", {
    default_packaging_margin_percent: readNumber(formData, "default_packaging_margin_percent"),
    default_product_margin_percent: readNumber(formData, "default_product_margin_percent"),
    platform_fee_fixed: readNumber(formData, "platform_fee_fixed"),
    platform_fee_percent: readNumber(formData, "platform_fee_percent"),
    rounding_increment: readNumber(formData, "rounding_increment"),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
