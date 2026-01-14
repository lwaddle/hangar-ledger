"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImport } from "@/lib/import/import-context";
import {
  parseAirplaneManagerCSV,
  transformAirplaneManagerData,
} from "@/lib/import/parsers/airplane-manager";
import {
  parseHangarLedgerCSV,
  transformHangarLedgerData,
} from "@/lib/import/parsers/hangar-ledger";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { getAircraft } from "@/lib/actions/aircraft";
import { getTrips } from "@/lib/actions/trips";
import type { ImportPreviewData, ValidationError, DuplicateTrip } from "@/types/import";

export default function ImportPreviewPage() {
  const router = useRouter();
  const { state, setPreviewData, setDuplicateTrips } = useImport();

  const [isLoading, setIsLoading] = useState(true);
  const [parseErrors, setParseErrors] = useState<ValidationError[]>([]);
  const [parseWarnings, setParseWarnings] = useState<ValidationError[]>([]);
  const [previewData, setLocalPreviewData] = useState<ImportPreviewData | null>(null);

  useEffect(() => {
    async function processData() {
      if (!state.csvContent || !state.source) {
        router.push("/settings/import-export");
        return;
      }

      try {
        // Fetch existing entities to check for matches
        const [categories, vendors, paymentMethods, aircraft, existingTrips] = await Promise.all([
          getExpenseCategories(),
          getVendors(),
          getPaymentMethods(),
          getAircraft(),
          getTrips(),
        ]);

        let preview: ImportPreviewData;

        if (state.source === "airplane_manager") {
          const { rows, errors, warnings } = parseAirplaneManagerCSV(state.csvContent);
          setParseErrors(errors);
          setParseWarnings(warnings);

          if (errors.length > 0) {
            setIsLoading(false);
            return;
          }

          preview = transformAirplaneManagerData(
            rows,
            categories.map((c) => ({ name: c.name, is_fuel_category: c.is_fuel_category })),
            vendors.map((v) => ({ name: v.name })),
            paymentMethods.map((p) => ({ name: p.name })),
            aircraft.map((a) => ({ tail_number: a.tail_number }))
          );
        } else {
          const { rows, errors, warnings } = parseHangarLedgerCSV(state.csvContent);
          setParseErrors(errors);
          setParseWarnings(warnings);

          if (errors.length > 0) {
            setIsLoading(false);
            return;
          }

          preview = transformHangarLedgerData(
            rows,
            categories.map((c) => ({ name: c.name, is_fuel_category: c.is_fuel_category })),
            vendors.map((v) => ({ name: v.name })),
            paymentMethods.map((p) => ({ name: p.name })),
            aircraft.map((a) => ({ tail_number: a.tail_number }))
          );
        }

        // Check for duplicate trips by matching name
        const duplicates: DuplicateTrip[] = [];
        for (const importTrip of preview.trips) {
          const existingMatch = existingTrips.find(
            (existing) => existing.name.toLowerCase() === importTrip.name.toLowerCase()
          );
          if (existingMatch) {
            duplicates.push({
              importTripName: importTrip.name,
              existingTripId: existingMatch.id,
              existingTripName: existingMatch.name,
              startDate: existingMatch.start_date,
            });
          }
        }
        setDuplicateTrips(duplicates);

        setLocalPreviewData(preview);
        setPreviewData(preview);
      } catch (error) {
        console.error("Failed to process data:", error);
        setParseErrors([
          {
            row: 0,
            field: "csv",
            value: "",
            message: error instanceof Error ? error.message : "Failed to process data",
            severity: "error",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    processData();
  }, [state.csvContent, state.source, router, setPreviewData, setDuplicateTrips]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-gray-500 mt-4">Analyzing your data...</p>
      </div>
    );
  }

  const hasBlockingErrors = parseErrors.some((e) => e.severity === "error");

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
          <span>Preview</span>
        </div>
        <h1 className="text-2xl font-bold">Preview Import Data</h1>
        <p className="text-gray-500 mt-1">Step 2 of 4: Review what will be imported</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step < 2 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < 4 && <div className={`w-8 h-0.5 ${step < 2 ? "bg-blue-600" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Errors */}
      {parseErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-700 mb-2">
            Errors Found ({parseErrors.length})
          </h3>
          <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
            {parseErrors.slice(0, 10).map((error, i) => (
              <li key={i}>
                Row {error.row}: {error.message}
                {error.field !== "csv" && ` (${error.field}: "${error.value}")`}
              </li>
            ))}
            {parseErrors.length > 10 && (
              <li className="font-medium">
                ... and {parseErrors.length - 10} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {parseWarnings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-700 mb-2">
            Warnings ({parseWarnings.length})
          </h3>
          <ul className="text-sm text-yellow-600 space-y-1 max-h-40 overflow-y-auto">
            {parseWarnings.slice(0, 5).map((warning, i) => (
              <li key={i}>
                Row {warning.row}: {warning.message}
              </li>
            ))}
            {parseWarnings.length > 5 && (
              <li className="font-medium">
                ... and {parseWarnings.length - 5} more warnings
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Summary */}
      {previewData && (
        <>
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Import Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {previewData.aircraft.length}
                </div>
                <div className="text-sm text-gray-500">Aircraft</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {previewData.trips.length}
                </div>
                <div className="text-sm text-gray-500">Trips</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {previewData.totalExpenses}
                </div>
                <div className="text-sm text-gray-500">Expenses</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {previewData.totalLineItems}
                </div>
                <div className="text-sm text-gray-500">Line Items</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Categories:</span>
                <span className="font-medium">
                  {previewData.uniqueCategories.filter((c) => !c.exists).length} new,{" "}
                  {previewData.uniqueCategories.filter((c) => c.exists).length} existing
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Vendors:</span>
                <span className="font-medium">
                  {previewData.uniqueVendors.filter((v) => !v.exists).length} new,{" "}
                  {previewData.uniqueVendors.filter((v) => v.exists).length} existing
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Payment Methods:</span>
                <span className="font-medium">
                  {previewData.uniquePaymentMethods.filter((p) => !p.exists).length} new,{" "}
                  {previewData.uniquePaymentMethods.filter((p) => p.exists).length} existing
                </span>
              </div>
            </div>

            {previewData.warnings.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <ul className="text-sm text-yellow-700 space-y-1">
                  {previewData.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-lg border overflow-hidden mb-6">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Sample Data (first 10 rows)</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.trips
                    .flatMap((trip) =>
                      trip.expenses.flatMap((expense) =>
                        expense.lineItems.map((item, itemIndex) => ({
                          date: expense.date,
                          tripName: trip.name,
                          vendor: expense.vendorName,
                          category: item.category,
                          amount: item.amount,
                          key: `${expense.sourceExpenseId}-${itemIndex}`,
                        }))
                      )
                    )
                    .slice(0, 10)
                    .map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.tripName}</TableCell>
                        <TableCell>{row.vendor}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell className="text-right">
                          ${row.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button asChild variant="outline">
          <Link href={`/settings/import-export/import?source=${state.source}`}>
            Back
          </Link>
        </Button>
        <Button
          onClick={() => router.push("/settings/import-export/import/mapping")}
          disabled={hasBlockingErrors || !previewData}
        >
          Continue to Mapping
        </Button>
      </div>
    </div>
  );
}
