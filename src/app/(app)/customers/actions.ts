"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readNullableString, readRequiredString } from "@/lib/forms/read-form";
import { createAuthenticatedClient } from "@/lib/supabase/auth";
import { setPr2ActiveState } from "@/lib/supabase/mutations/active-state";
import { createPr2Customer, updatePr2Customer } from "@/lib/supabase/mutations/customers";

function customerForm(formData: FormData) {
  return {
    company: readNullableString(formData, "company"),
    email: readNullableString(formData, "email"),
    name: readRequiredString(formData, "name"),
    notes: readNullableString(formData, "notes"),
    phone: readNullableString(formData, "phone"),
  };
}

export async function createCustomerAction(formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await createPr2Customer(client, customerForm(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomerAction(id: string, formData: FormData) {
  const client = await createAuthenticatedClient();
  const { error } = await updatePr2Customer(client, id, customerForm(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
  redirect("/customers");
}

export async function setCustomerActiveStateAction(formData: FormData) {
  const id = readRequiredString(formData, "id");
  const active = readRequiredString(formData, "active") === "true";
  const client = await createAuthenticatedClient();
  const { error } = await setPr2ActiveState(client, "pr2_customers", id, active);
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
}
