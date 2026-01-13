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

export async function getActiveVendors(): Promise<Vendor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
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

  // Check if a soft-deleted vendor with the same name exists
  const { data: deletedVendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("name", formData.name)
    .not("deleted_at", "is", null)
    .single();

  // If found, restore it instead of creating a new one
  if (deletedVendor) {
    const { data, error } = await supabase
      .from("vendors")
      .update({
        deleted_at: null,
        notes: formData.notes || deletedVendor.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deletedVendor.id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/vendors");
    return data;
  }

  // Otherwise, create a new vendor
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

export async function getExpenseCountByVendor(vendorId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function reassignExpensesAndDeleteVendor(
  sourceVendorId: string,
  targetVendorId: string
): Promise<void> {
  const supabase = await createClient();

  // Get target vendor name
  const { data: targetVendor, error: vendorError } = await supabase
    .from("vendors")
    .select("name")
    .eq("id", targetVendorId)
    .single();

  if (vendorError) throw vendorError;

  // Update all expenses from source vendor to target vendor
  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      vendor_id: targetVendorId,
      vendor: targetVendor.name,
    })
    .eq("vendor_id", sourceVendorId)
    .is("deleted_at", null);

  if (updateError) throw updateError;

  // Soft-delete the source vendor
  const { error: deleteError } = await supabase
    .from("vendors")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sourceVendorId);

  if (deleteError) throw deleteError;

  revalidatePath("/vendors");
  revalidatePath("/expenses");
  revalidatePath(`/vendors/${targetVendorId}`);
  redirect("/vendors");
}

export async function toggleVendorActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("vendors")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
}
