"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  deleteObject,
  generateStoragePath,
} from "@/lib/r2/client";
import type { Receipt } from "@/types/database";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type PresignedUrlResponse = {
  uploadUrl: string;
  storagePath: string;
};

export async function getReceiptUploadUrl(
  expenseId: string,
  filename: string,
  contentType: string,
  fileSize: number
): Promise<PresignedUrlResponse> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error(
      `File type ${contentType} not allowed. Allowed: JPG, PNG, WebP, PDF`
    );
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 10MB limit");
  }

  const storagePath = generateStoragePath(expenseId, filename);
  const uploadUrl = await getUploadPresignedUrl(storagePath, contentType);

  return { uploadUrl, storagePath };
}

export async function createReceiptRecord(
  expenseId: string,
  storagePath: string,
  originalFilename: string
): Promise<Receipt> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("receipts")
    .insert({
      expense_id: expenseId,
      storage_path: storagePath,
      original_filename: originalFilename,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/expenses/${expenseId}`);
  return data;
}

export async function getReceiptsByExpense(
  expenseId: string
): Promise<Receipt[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("expense_id", expenseId)
    .order("uploaded_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getReceiptDownloadUrl(receiptId: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipts")
    .select("storage_path")
    .eq("id", receiptId)
    .single();

  if (error) throw error;

  return getDownloadPresignedUrl(data.storage_path);
}

export async function deleteReceipt(
  receiptId: string,
  expenseId: string
): Promise<void> {
  const supabase = await createClient();

  // Get receipt to find storage path
  const { data: receipt, error: fetchError } = await supabase
    .from("receipts")
    .select("storage_path")
    .eq("id", receiptId)
    .single();

  if (fetchError) throw fetchError;

  // Delete from R2
  await deleteObject(receipt.storage_path);

  // Delete from database
  const { error: deleteError } = await supabase
    .from("receipts")
    .delete()
    .eq("id", receiptId);

  if (deleteError) throw deleteError;

  revalidatePath(`/expenses/${expenseId}`);
}
