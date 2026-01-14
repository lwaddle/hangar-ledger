"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useImport } from "@/lib/import/import-context";
import { executeImport, type SerializedReceiptData } from "@/lib/actions/import";
import type { ImportResult, ReceiptFileData } from "@/types/import";

export default function ImportConfirmPage() {
  const router = useRouter();
  const { state, getMetadata, reset, setSkipDuplicates } = useImport();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!state.previewData || !state.source) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No import data available</p>
        <Button asChild variant="outline">
          <Link href="/settings/import-export">Go Back</Link>
        </Button>
      </div>
    );
  }

  const { previewData, categoryMappings, vendorMappings, paymentMethodMappings, aircraftMappings } =
    state;

  // Count entities to create
  const categoriesToCreate = Object.values(categoryMappings).filter(
    (m) => m.action === "create"
  ).length;
  const vendorsToCreate = Object.values(vendorMappings).filter(
    (m) => m.action === "create"
  ).length;
  const paymentMethodsToCreate = Object.values(paymentMethodMappings).filter(
    (m) => m.action === "create"
  ).length;
  const aircraftToCreate = Object.values(aircraftMappings).filter(
    (m) => m.action === "create"
  ).length;

  // Convert Uint8Array to base64 for server transfer
  function serializeReceipts(receipts: ReceiptFileData[]): SerializedReceiptData[] {
    return receipts.map((receipt) => {
      // Convert Uint8Array to base64
      let binary = "";
      const bytes = receipt.data;
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const dataBase64 = btoa(binary);

      return {
        filename: receipt.filename,
        dataBase64,
        contentType: receipt.contentType,
      };
    });
  }

  async function handleImport() {
    setIsImporting(true);
    setImportError(null);

    try {
      // Serialize receipts for server transfer
      const serializedReceipts = state.receiptBlobs.length > 0
        ? serializeReceipts(state.receiptBlobs)
        : undefined;

      const result = await executeImport({
        source: state.source!,
        trips: previewData.trips,
        metadata: getMetadata(),
        receipts: serializedReceipts,
        skipDuplicateTripNames: state.skipDuplicates
          ? state.duplicateTrips.map((d) => d.importTripName)
          : undefined,
      });

      setImportResult(result);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Import failed"
      );
    } finally {
      setIsImporting(false);
    }
  }

  function handleFinish() {
    reset();
    router.push("/trips");
  }

  // Show success screen
  if (importResult) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Import Complete</h1>
        </div>

        <div className="bg-white rounded-lg border p-6">
          {importResult.success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              </div>
              <h2 className="text-xl font-semibold text-green-700 mb-2">
                Import Successful
              </h2>
              <p className="text-gray-500 mb-6">
                Your data has been imported successfully.
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-yellow-700 mb-2">
                Import Completed with Issues
              </h2>
              <p className="text-gray-500">
                Some records could not be imported.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {importResult.created.trips}
              </div>
              <div className="text-sm text-gray-500">Trips</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {importResult.created.expenses}
              </div>
              <div className="text-sm text-gray-500">Expenses</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {importResult.created.lineItems}
              </div>
              <div className="text-sm text-gray-500">Line Items</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {importResult.created.receipts}
              </div>
              <div className="text-sm text-gray-500">Receipts</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {importResult.created.vendors +
                  importResult.created.categories +
                  importResult.created.paymentMethods +
                  importResult.created.aircraft}
              </div>
              <div className="text-sm text-gray-500">New Entities</div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-700 mb-2">
                Errors ({importResult.errors.length})
              </h3>
              <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {importResult.errors.slice(0, 10).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {importResult.errors.length > 10 && (
                  <li className="font-medium">
                    ... and {importResult.errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={handleFinish}>View Trips</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings/import-export" className="hover:text-gray-700">
            Import / Export
          </Link>
          <span>/</span>
          <Link
            href={`/settings/import-export/import?source=${state.source}`}
            className="hover:text-gray-700"
          >
            Import
          </Link>
          <span>/</span>
          <span>Confirm</span>
        </div>
        <h1 className="text-2xl font-bold">Confirm Import</h1>
        <p className="text-gray-500 mt-1">
          Step 4 of 4: Review and start import
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= 4
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step < 4 ? (
                <svg
                  className="w-4 h-4"
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
              ) : (
                step
              )}
            </div>
            {step < 4 && <div className="w-8 h-0.5 bg-blue-600" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Ready to Import</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {aircraftToCreate}
              </div>
              <div className="text-sm text-gray-500">New Aircraft</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {previewData.trips.length}
              </div>
              <div className="text-sm text-gray-500">Trips</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {previewData.totalExpenses}
              </div>
              <div className="text-sm text-gray-500">Expenses</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {previewData.totalLineItems}
              </div>
              <div className="text-sm text-gray-500">Line Items</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {state.receiptBlobs.length}
              </div>
              <div className="text-sm text-gray-500">Receipts</div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>Will also create:</strong>
            <ul className="mt-2 space-y-1">
              {categoriesToCreate > 0 && (
                <li>{categoriesToCreate} new categories</li>
              )}
              {vendorsToCreate > 0 && <li>{vendorsToCreate} new vendors</li>}
              {paymentMethodsToCreate > 0 && (
                <li>{paymentMethodsToCreate} new payment methods</li>
              )}
            </ul>
          </div>
        </div>

        {/* Duplicate trips warning */}
        {state.duplicateTrips.length > 0 && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-orange-600 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <span className="font-medium text-orange-800">
                  {state.duplicateTrips.length} trip{state.duplicateTrips.length !== 1 ? "s" : ""} appear to already exist
                </span>
                <p className="text-sm text-orange-700 mt-1">
                  The following trips have the same name as existing trips in your account:
                </p>
                <ul className="text-sm text-orange-700 mt-2 list-disc list-inside max-h-32 overflow-y-auto">
                  {state.duplicateTrips.map((dup) => (
                    <li key={dup.existingTripId}>{dup.importTripName}</li>
                  ))}
                </ul>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                  />
                  <span className="text-sm text-orange-800">
                    Skip duplicate trips (import only new trips)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-yellow-800">
                I understand this will add data to my account
              </span>
              <p className="text-sm text-yellow-700 mt-1">
                This import cannot be easily undone. Make sure you have reviewed
                the data and mappings before proceeding.
              </p>
            </div>
          </label>
        </div>

        {importError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {importError}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button asChild variant="outline" disabled={isImporting}>
          <Link href="/settings/import-export/import/mapping">Back</Link>
        </Button>
        <Button
          onClick={handleImport}
          disabled={!isConfirmed || isImporting}
        >
          {isImporting ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Importing...
            </>
          ) : (
            "Start Import"
          )}
        </Button>
      </div>
    </div>
  );
}
