"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { ImportSource } from "@/types/import";

type FileUploadZoneProps = {
  source: ImportSource;
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  accept?: string;
};

export function FileUploadZone({
  source,
  onFileSelect,
  isProcessing,
  accept,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const acceptedTypes =
    accept ??
    (source === "airplane_manager"
      ? ".zip,application/zip"
      : ".csv,text/csv");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400",
        isProcessing && "opacity-50 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        disabled={isProcessing}
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center gap-2"
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div className="text-gray-600">
          <span className="text-blue-600 hover:text-blue-700 font-medium">
            Click to upload
          </span>{" "}
          or drag and drop
        </div>
        <p className="text-sm text-gray-500">
          {source === "airplane_manager"
            ? "ZIP file from Airplane Manager export"
            : "CSV file using our template format"}
        </p>
      </label>
    </div>
  );
}
