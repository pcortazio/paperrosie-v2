"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readNumber, readRequiredString } from "@/lib/forms/read-form";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import {
  createPr2Product,
  createPr2ProductMaterial,
  createPr2ProductVariant,
  updatePr2Product,
  updatePr2ProductVariant,
} from "@/lib/supabase/mutations/products";

function productForm(formData: FormData) {
  return {
    category_id: readNullableString(formData, "category_id"),
    default_margin_percent: readNumber(formData, "default_margin_percent"),
    default_packaging_id: readNullableString(formData, "default_packaging_id"),
    description: readNullableString(formData, "description"),
    extra_cost_fixed: readNumber(formData, "extra_cost_fixed"),
    image_url: readNullableString(formData, "image_url"),
    labor_cost_fixed: readNumber(formData, "labor_cost_fixed"),
    name: readRequiredString(formData, "name"),
  };
}

function variantForm(productId: string, formData: FormData) {
  return {
    description: readNullableString(formData, "description"),
    image_url: readNullableString(formData, "image_url"),
    labor_cost_fixed: readNullableString(formData, "labor_cost_fixed") ? readNumber(formData, "labor_cost_fixed") : null,
    margin_percent: readNullableString(formData, "margin_percent") ? readNumber(formData, "margin_percent") : null,
    name: readRequiredString(formData, "name"),
    product_id: productId,
    sku: readNullableString(formData, "sku"),
  };
}

export async function createProductAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { data, error } = await createPr2Product(client, productForm(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/products");
  redirect(`/products/${data.id}`);
}

export async function updateProductAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Product(client, id, productForm(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function setProductActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_products", id, active);
  if (error) throw new Error(error.message);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}

export async function createProductVariantAction(productId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2ProductVariant(client, variantForm(productId, formData));
  if (error) throw new Error(error.message);
  revalidatePath(`/products/${productId}`);
}

export async function updateProductVariantAction(productId: string, variantId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2ProductVariant(client, variantId, variantForm(productId, formData));
  if (error) throw new Error(error.message);
  revalidatePath(`/products/${productId}`);
}

export async function setProductVariantActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const productId = readRequiredString(formData, "product_id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_product_variants", id, active);
  if (error) throw new Error(error.message);
  revalidatePath(`/products/${productId}`);
}

export async function addProductMaterialAction(productId: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2ProductMaterial(client, {
    material_id: readRequiredString(formData, "material_id"),
    product_id: productId,
    quantity: readNumber(formData, "quantity"),
    unit_id: readRequiredString(formData, "unit_id"),
    variant_id: readNullableString(formData, "variant_id"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/products/${productId}`);
}

export async function setProductMaterialActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const productId = readRequiredString(formData, "product_id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_product_materials", id, active);
  if (error) throw new Error(error.message);
  revalidatePath(`/products/${productId}`);
}
