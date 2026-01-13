"use client";

import { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getReceiptUploadUrl,
  createReceiptRecord,
} from "@/lib/actions/receipts";
import type { Receipt } from "@/types/database";

type UploadingFile = {
  id: string;
  file: File;
  progress: number;
  status: "compressing" | "uploading" | "success" | "error";
  error?: string;
};

type Props = {
  expenseId: string;
  onUploadComplete?: (receipt: Receipt) => void;
  disabled?: boolean;
};

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB before compression

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  initialQuality: 0.8,
};

export function ReceiptDropzone({
  expenseId,
  onUploadComplete,
  disabled,
}: Props) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const compressImage = async (file: File): Promise<File> => {
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
  };

  const uploadFile = async (file: File) => {
    const fileId = `${Date.now()}-${file.name}`;

    setUploadingFiles((prev) => [
      ...prev,
      { id: fileId, file, progress: 0, status: "compressing" },
    ]);

    try {
      // Step 1: Compress if image
      const processedFile = await compressImage(file);

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploading", progress: 10 } : f
        )
      );

      // Step 2: Get presigned URL
      const { uploadUrl, storagePath } = await getReceiptUploadUrl(
        expenseId,
        file.name,
        processedFile.type,
        processedFile.size
      );

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 30 } : f))
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

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 80 } : f))
      );

      // Step 4: Create database record
      const receipt = await createReceiptRecord(
        expenseId,
        storagePath,
        file.name
      );

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "success", progress: 100 } : f
        )
      );

      onUploadComplete?.(receipt);

      // Remove from list after short delay
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
      }, 2000);
    } catch (err) {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejection) => {
        const errors = rejection.errors.map((e) => e.message).join(", ");
        console.error(`File rejected: ${rejection.file.name} - ${errors}`);
      });

      // Upload accepted files in parallel
      acceptedFiles.forEach((file) => {
        uploadFile(file);
      });
    },
    [expenseId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled,
    multiple: true,
  });

  const removeFailedUpload = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragActive &&
            !disabled &&
            "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm text-primary">Drop files here...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Drag & drop receipts here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP, or PDF (max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((upload) => (
            <div
              key={upload.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                upload.status === "error" &&
                  "border-destructive bg-destructive/5",
                upload.status === "success" && "border-green-500 bg-green-500/5"
              )}
            >
              {upload.file.type.startsWith("image/") ? (
                <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{upload.file.name}</p>
                {upload.status === "compressing" && (
                  <p className="text-xs text-muted-foreground">
                    Compressing...
                  </p>
                )}
                {upload.status === "uploading" && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.status === "error" && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
                {upload.status === "success" && (
                  <p className="text-xs text-green-600">Uploaded</p>
                )}
              </div>

              {upload.status === "compressing" ||
              upload.status === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : upload.status === "error" ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFailedUpload(upload.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
