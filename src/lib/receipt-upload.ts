import imageCompression from "browser-image-compression";
import {
  getReceiptUploadUrl,
  createReceiptRecord,
} from "@/lib/actions/receipts";
import type { Receipt } from "@/types/database";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  initialQuality: 0.8,
};

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file; // Don't compress PDFs
  }

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    console.log(
      `Compressed ${file.name}: ${file.size} -> ${compressed.size} bytes`
    );
    return compressed;
  } catch (err) {
    console.warn("Compression failed, using original:", err);
    return file;
  }
}

export async function uploadQueuedFile(
  expenseId: string,
  file: File
): Promise<Receipt> {
  // Step 1: Compress if image
  const processedFile = await compressImage(file);

  // Step 2: Get presigned URL
  const { uploadUrl, storagePath } = await getReceiptUploadUrl(
    expenseId,
    file.name,
    processedFile.type,
    processedFile.size
  );

  // Step 3: Upload to R2
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: processedFile,
    headers: {
      "Content-Type": processedFile.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  // Step 4: Create database record
  const receipt = await createReceiptRecord(expenseId, storagePath, file.name);

  return receipt;
}
