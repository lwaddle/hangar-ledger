"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportExpensesToCSV, generateImportTemplate } from "@/lib/actions/export";

export default function ImportExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

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
    </div>
  );
}
