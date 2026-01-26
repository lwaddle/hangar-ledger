"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/types/database";

export type TripFormData = {
  name: string;
  start_date: string;
  end_date?: string;
  aircraft_id: string;
  notes?: string;
};

export async function getTrips(): Promise<Trip[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type TripWithTotal = Trip & {
  total: number;
};

export type TripWithEditor = Trip & {
  updated_by_profile: { email: string; display_name: string | null } | null;
};

export async function getTripsWithTotals(): Promise<TripWithTotal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, expenses(amount, deleted_at)")
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((trip) => ({
    ...trip,
    expenses: undefined,
    total: (trip.expenses ?? [])
      .filter((e: { amount: number; deleted_at: string | null } | null) => e !== null && e.deleted_at === null)
      .reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0),
  })) as TripWithTotal[];
}

export async function getTrip(id: string): Promise<TripWithEditor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, updated_by_profile:user_profiles!trips_updated_by_profile_fkey(email, display_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createTrip(formData: TripFormData): Promise<void> {
  const supabase = await createClient();

  // Get aircraft tail_number for denormalization
  const { data: aircraft, error: aircraftError } = await supabase
    .from("aircraft")
    .select("tail_number")
    .eq("id", formData.aircraft_id)
    .single();

  if (aircraftError) throw aircraftError;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      aircraft_id: formData.aircraft_id,
      aircraft: aircraft.tail_number,
      notes: formData.notes || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/trips");
  revalidatePath(`/trips/${data.id}`);
  redirect(`/trips/${data.id}`);
}

export async function updateTrip(
  id: string,
  formData: TripFormData
): Promise<void> {
  const supabase = await createClient();

  // Get aircraft tail_number for denormalization
  const { data: aircraft, error: aircraftError } = await supabase
    .from("aircraft")
    .select("tail_number")
    .eq("id", formData.aircraft_id)
    .single();

  if (aircraftError) throw aircraftError;

  const { error } = await supabase
    .from("trips")
    .update({
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      aircraft_id: formData.aircraft_id,
      aircraft: aircraft.tail_number,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  redirect(`/trips/${id}`);
}

export async function canUserDeleteTrip(tripId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Admins can delete any trip
  if (profile?.role === "admin") return true;

  // Operators can only delete their own unlocked trips
  if (profile?.role === "operator") {
    const { data: trip } = await supabase
      .from("trips")
      .select("created_by, is_locked")
      .eq("id", tripId)
      .single();

    return trip?.created_by === user.id && !trip?.is_locked;
  }

  return false;
}

export async function deleteTrip(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if user can delete this trip
  const canDelete = await canUserDeleteTrip(id);
  if (!canDelete) {
    throw new Error("You do not have permission to delete this trip");
  }

  // Soft delete
  const { error } = await supabase
    .from("trips")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/trips");
  redirect("/trips");
}

export async function lockTrip(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("trips")
    .update({
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by: user.id,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
}

export async function unlockTrip(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Only admins can unlock trips");
  }

  const { error } = await supabase
    .from("trips")
    .update({
      is_locked: false,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
}
