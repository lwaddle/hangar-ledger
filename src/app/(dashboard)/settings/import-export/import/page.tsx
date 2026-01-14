"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "@/components/import/file-upload-zone";
import { useImport } from "@/lib/import/import-context";
import {
  extractCSVFromZip,
  extractReceiptFilesFromZip,
} from "@/lib/import/parsers/airplane-manager";
import type { ImportSource } from "@/types/import";

export default function ImportUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setSource, setFile, setCSVContent, setReceiptBlobs } = useImport();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    receiptCount?: number;
  } | null>(null);

  // Get source from URL params
  const sourceParam = searchParams.get("source") as ImportSource | null;

  useEffect(() => {
    if (sourceParam && (sourceParam === "csv_template" || sourceParam === "airplane_manager")) {
      setSource(sourceParam);
    }
  }, [sourceParam, setSource]);

  const source = state.source ?? sourceParam;

  async function handleFileSelect(file: File) {
    setIsProcessing(true);
    setError(null);
    setFileInfo(null);

    try {
      setFile(file);

      if (source === "airplane_manager") {
        // Extract CSV from ZIP
        const { csv, receiptFiles } = await extractCSVFromZip(file);
        setCSVContent(csv, receiptFiles);

        // Extract receipt file blobs for later upload
        const receiptData = await extractReceiptFilesFromZip(file);
        setReceiptBlobs(receiptData);

        setFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
          receiptCount: receiptFiles.length,
        });
      } else {
        // Read CSV directly
        const text = await file.text();
        setCSVContent(text);
        setFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleContinue() {
    router.push("/settings/import-export/import/preview");
  }

  if (!source) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Invalid import source</p>
        <Button asChild variant="outline">
          <Link href="/settings/import-export">Go Back</Link>
        </Button>
      </div>
    );
  }

  const sourceLabel =
    source === "airplane_manager" ? "Airplane Manager" : "CSV Template";

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link
            href="/settings/import-export"
            className="hover:text-gray-700"
          >
            Import / Export
          </Link>
          <span>/</span>
          <span>Import</span>
        </div>
        <h1 className="text-2xl font-bold">Import from {sourceLabel}</h1>
        <p className="text-gray-500 mt-1">Step 1 of 4: Upload your file</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step}
            </div>
            {step < 4 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-6">
        <FileUploadZone
          source={source}
          onFileSelect={handleFileSelect}
          isProcessing={isProcessing}
        />

        {isProcessing && (
          <div className="mt-4 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
            Processing file...
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {fileInfo && !error && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">File loaded successfully</span>
            </div>
            <div className="mt-2 text-sm text-green-600">
              <p>
                <strong>{fileInfo.name}</strong> ({fileInfo.size})
              </p>
              {fileInfo.receiptCount !== undefined && (
                <p>{fileInfo.receiptCount} receipt files found</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button asChild variant="outline">
          <Link href="/settings/import-export">Cancel</Link>
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!state.csvContent || isProcessing}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
