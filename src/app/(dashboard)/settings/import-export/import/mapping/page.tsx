"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EntityMapper } from "@/components/import/entity-mapper";
import { useImport } from "@/lib/import/import-context";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { getAircraft } from "@/lib/actions/aircraft";
import type { Aircraft, ExpenseCategory, PaymentMethod, Vendor } from "@/types/database";

export default function ImportMappingPage() {
  const router = useRouter();
  const {
    state,
    setCategoryMapping,
    setVendorMapping,
    setPaymentMethodMapping,
    setAircraftMapping,
  } = useImport();

  const [isLoading, setIsLoading] = useState(true);
  const [existingCategories, setExistingCategories] = useState<ExpenseCategory[]>([]);
  const [existingVendors, setExistingVendors] = useState<Vendor[]>([]);
  const [existingPaymentMethods, setExistingPaymentMethods] = useState<PaymentMethod[]>([]);
  const [existingAircraft, setExistingAircraft] = useState<Aircraft[]>([]);

  useEffect(() => {
    async function loadExistingEntities() {
      if (!state.previewData) {
        router.push("/settings/import-export");
        return;
      }

      try {
        const [categories, vendors, paymentMethods, aircraft] = await Promise.all([
          getExpenseCategories(),
          getVendors(),
          getPaymentMethods(),
          getAircraft(),
        ]);

        setExistingCategories(categories);
        setExistingVendors(vendors);
        setExistingPaymentMethods(paymentMethods);
        setExistingAircraft(aircraft);
      } catch (error) {
        console.error("Failed to load existing entities:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadExistingEntities();
  }, [state.previewData, router]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  if (!state.previewData) {
    return null;
  }

  const { previewData } = state;

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
          <span>Mapping</span>
        </div>
        <h1 className="text-2xl font-bold">Map Categories & Vendors</h1>
        <p className="text-gray-500 mt-1">
          Step 3 of 4: Choose how to handle new items
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= 3
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step < 3 ? (
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
            {step < 4 && (
              <div
                className={`w-8 h-0.5 ${step < 3 ? "bg-blue-600" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Aircraft Mapping */}
        {previewData.aircraft.length > 0 && (
          <EntityMapper
            title="Aircraft"
            items={previewData.aircraft.map((a) => ({
              name: a.tailNumber,
              exists: a.exists,
            }))}
            existingItems={existingAircraft.map((a) => ({
              id: a.id,
              name: a.tail_number,
            }))}
            mappings={Object.fromEntries(
              Object.entries(state.aircraftMappings).map(([k, v]) => [
                k,
                { action: v.action, targetId: v.targetId, newName: v.tailNumber },
              ])
            )}
            onMappingChange={(tailNumber, mapping) =>
              setAircraftMapping(tailNumber, {
                action: mapping.action as "map" | "create",
                tailNumber,
                targetId: mapping.targetId,
              })
            }
          />
        )}

        {/* Category Mapping */}
        {previewData.uniqueCategories.length > 0 && (
          <EntityMapper
            title="Categories"
            items={previewData.uniqueCategories}
            existingItems={existingCategories.map((c) => ({
              id: c.id,
              name: c.name,
            }))}
            mappings={state.categoryMappings}
            onMappingChange={setCategoryMapping}
            showFuelOption
          />
        )}

        {/* Vendor Mapping */}
        {previewData.uniqueVendors.length > 0 && (
          <EntityMapper
            title="Vendors"
            items={previewData.uniqueVendors}
            existingItems={existingVendors.map((v) => ({
              id: v.id,
              name: v.name,
            }))}
            mappings={state.vendorMappings}
            onMappingChange={setVendorMapping}
          />
        )}

        {/* Payment Method Mapping */}
        {previewData.uniquePaymentMethods.length > 0 && (
          <EntityMapper
            title="Payment Methods"
            items={previewData.uniquePaymentMethods}
            existingItems={existingPaymentMethods.map((p) => ({
              id: p.id,
              name: p.name,
            }))}
            mappings={state.paymentMethodMappings}
            onMappingChange={setPaymentMethodMapping}
          />
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button asChild variant="outline">
          <Link href="/settings/import-export/import/preview">Back</Link>
        </Button>
        <Button
          onClick={() => router.push("/settings/import-export/import/confirm")}
        >
          Continue to Confirm
        </Button>
      </div>
    </div>
  );
}
