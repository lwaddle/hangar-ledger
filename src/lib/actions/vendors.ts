"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Vendor } from "@/types/database";

export type VendorFormData = {
  name: string;
  notes?: string;
};

export async function getVendors(): Promise<Vendor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getVendor(id: string): Promise<Vendor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createVendor(formData: VendorFormData): Promise<Vendor> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      name: formData.name,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/vendors");
  return data;
}

export async function createVendorAndRedirect(
  formData: VendorFormData
): Promise<void> {
  await createVendor(formData);
  redirect("/vendors");
}

export async function updateVendor(
  id: string,
  formData: VendorFormData
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      name: formData.name,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  redirect(`/vendors/${id}`);
}

export async function deleteVendor(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function getExpensesByVendor(vendorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("vendor_id", vendorId)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
