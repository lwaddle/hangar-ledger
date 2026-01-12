"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/types/database";

export type TripFormData = {
  name: string;
  start_date: string;
  end_date?: string;
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

export async function getTripsWithTotals(): Promise<TripWithTotal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, expenses(amount)")
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((trip) => ({
    ...trip,
    expenses: undefined,
    total: (trip.expenses ?? [])
      .filter((e: { amount: number } | null) => e !== null)
      .reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0),
  })) as TripWithTotal[];
}

export async function getTrip(id: string): Promise<Trip | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
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

export async function createTrip(formData: TripFormData): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
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
  const { error } = await supabase
    .from("trips")
    .update({
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  redirect(`/trips/${id}`);
}

export async function deleteTrip(id: string): Promise<void> {
  const supabase = await createClient();
  // Soft delete
  const { error } = await supabase
    .from("trips")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/trips");
  redirect("/trips");
}
