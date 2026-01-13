"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Aircraft, Trip } from "@/types/database";

export type AircraftFormData = {
  tail_number: string;
  name?: string;
  notes?: string;
};

export async function getAircraft(): Promise<Aircraft[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aircraft")
    .select("*")
    .is("deleted_at", null)
    .order("tail_number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveAircraft(): Promise<Aircraft[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aircraft")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("tail_number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAircraftById(id: string): Promise<Aircraft | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aircraft")
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

export async function createAircraft(formData: AircraftFormData): Promise<Aircraft> {
  const supabase = await createClient();

  // Check if a soft-deleted aircraft with the same tail_number exists
  const { data: deletedAircraft } = await supabase
    .from("aircraft")
    .select("*")
    .eq("tail_number", formData.tail_number)
    .not("deleted_at", "is", null)
    .single();

  // If found, restore it instead of creating a new one
  if (deletedAircraft) {
    const { data, error } = await supabase
      .from("aircraft")
      .update({
        deleted_at: null,
        name: formData.name || deletedAircraft.name,
        notes: formData.notes || deletedAircraft.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deletedAircraft.id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/aircraft");
    return data;
  }

  // Otherwise, create a new aircraft
  const { data, error } = await supabase
    .from("aircraft")
    .insert({
      tail_number: formData.tail_number,
      name: formData.name || null,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/aircraft");
  return data;
}

export async function createAircraftAndRedirect(
  formData: AircraftFormData
): Promise<void> {
  await createAircraft(formData);
  redirect("/aircraft");
}

export async function updateAircraft(
  id: string,
  formData: AircraftFormData
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("aircraft")
    .update({
      tail_number: formData.tail_number,
      name: formData.name || null,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/aircraft");
  revalidatePath(`/aircraft/${id}`);
  redirect(`/aircraft/${id}`);
}

export async function deleteAircraft(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("aircraft")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/aircraft");
  redirect("/aircraft");
}

export async function getTripsByAircraft(aircraftId: string): Promise<Trip[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("aircraft_id", aircraftId)
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getTripCountByAircraft(aircraftId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true })
    .eq("aircraft_id", aircraftId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function reassignTripsAndDeleteAircraft(
  sourceAircraftId: string,
  targetAircraftId: string
): Promise<void> {
  const supabase = await createClient();

  // Get target aircraft tail_number
  const { data: targetAircraft, error: aircraftError } = await supabase
    .from("aircraft")
    .select("tail_number")
    .eq("id", targetAircraftId)
    .single();

  if (aircraftError) throw aircraftError;

  // Update all trips from source aircraft to target aircraft
  const { error: updateError } = await supabase
    .from("trips")
    .update({
      aircraft_id: targetAircraftId,
      aircraft: targetAircraft.tail_number,
    })
    .eq("aircraft_id", sourceAircraftId)
    .is("deleted_at", null);

  if (updateError) throw updateError;

  // Soft-delete the source aircraft
  const { error: deleteError } = await supabase
    .from("aircraft")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sourceAircraftId);

  if (deleteError) throw deleteError;

  revalidatePath("/aircraft");
  revalidatePath("/trips");
  revalidatePath(`/aircraft/${targetAircraftId}`);
  redirect("/aircraft");
}

export async function toggleAircraftActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("aircraft")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/aircraft");
  revalidatePath(`/aircraft/${id}`);
}
