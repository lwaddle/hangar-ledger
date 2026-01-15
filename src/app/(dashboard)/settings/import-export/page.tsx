"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { exportExpensesToCSV, generateImportTemplate } from "@/lib/actions/export";
import { generateBackup, restoreBackup } from "@/lib/actions/backup";
import type { RestoreResult } from "@/types/backup";

export default function ImportExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setIsExporting(true);
    try {
      const csv = await exportExpensesToCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hangar-ledger-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const csv = await generateImportTemplate();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hangar-ledger-import-template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Template download failed:", error);
      alert("Template download failed. Please try again.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleCreateBackup() {
    setIsCreatingBackup(true);
    setRestoreResult(null);
    try {
      const zipBase64 = await generateBackup();
      // Convert base64 to blob and download
      const binaryString = atob(zipBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hangar-ledger-backup-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup creation failed:", error);
      alert("Backup creation failed. Please try again.");
    } finally {
      setIsCreatingBackup(false);
    }
  }

  async function handleRestoreBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreResult(null);
    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const result = await restoreBackup(base64);
      setRestoreResult(result);
    } catch (error) {
      console.error("Restore failed:", error);
      alert(`Restore failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsRestoring(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import / Export</h1>
        <p className="text-gray-500 mt-1">
          Export your data or import from CSV or Airplane Manager
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-2">Export Data</h2>
          <p className="text-gray-500 text-sm mb-4">
            Download all your expenses, trips, and related data as a CSV file.
          </p>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export to CSV"}
          </Button>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-2">Import Data</h2>
          <p className="text-gray-500 text-sm mb-4">
            Import expenses from a CSV file or Airplane Manager export.
          </p>
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href="/settings/import-export/import?source=csv_template">
                  Import from CSV
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="text-xs"
              >
                {isDownloadingTemplate
                  ? "Downloading..."
                  : "Download CSV template"}
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">or</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings/import-export/import?source=airplane_manager">
                Import from Airplane Manager
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Backup & Restore</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Backup */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium mb-2">Create Backup</h3>
            <p className="text-gray-500 text-sm mb-4">
              Download a complete backup of all your data including receipt
              scans. This ZIP file can be used to restore your data later.
            </p>
            <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
              {isCreatingBackup ? "Creating Backup..." : "Create Backup"}
            </Button>
          </div>

          {/* Restore Backup */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium mb-2">Restore from Backup</h3>
            <p className="text-gray-500 text-sm mb-4">
              Restore data from a previously created backup file. Existing data
              with matching IDs will be skipped.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleRestoreBackup}
              className="hidden"
              id="backup-file-input"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
            >
              {isRestoring ? "Restoring..." : "Select Backup File"}
            </Button>
          </div>
        </div>

        {/* Restore Result */}
        {restoreResult && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              restoreResult.success
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <h4 className="font-medium mb-2">
              {restoreResult.success
                ? "Restore Completed Successfully"
                : "Restore Completed with Issues"}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Created:</p>
                <ul className="text-gray-600">
                  <li>Aircraft: {restoreResult.created.aircraft}</li>
                  <li>Vendors: {restoreResult.created.vendors}</li>
                  <li>Categories: {restoreResult.created.categories}</li>
                  <li>Payment Methods: {restoreResult.created.paymentMethods}</li>
                  <li>Trips: {restoreResult.created.trips}</li>
                  <li>Expenses: {restoreResult.created.expenses}</li>
                  <li>Line Items: {restoreResult.created.lineItems}</li>
                  <li>Receipts: {restoreResult.created.receipts}</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Skipped (duplicates):</p>
                <ul className="text-gray-600">
                  <li>Aircraft: {restoreResult.skipped.aircraft}</li>
                  <li>Vendors: {restoreResult.skipped.vendors}</li>
                  <li>Categories: {restoreResult.skipped.categories}</li>
                  <li>Payment Methods: {restoreResult.skipped.paymentMethods}</li>
                  <li>Trips: {restoreResult.skipped.trips}</li>
                  <li>Expenses: {restoreResult.skipped.expenses}</li>
                  <li>Line Items: {restoreResult.skipped.lineItems}</li>
                  <li>Receipts: {restoreResult.skipped.receipts}</li>
                </ul>
              </div>
            </div>
            {restoreResult.errors.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-red-700">
                  Errors ({restoreResult.errors.length}):
                </p>
                <ul className="text-red-600 max-h-32 overflow-y-auto">
                  {restoreResult.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
