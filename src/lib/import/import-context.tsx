"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type {
  ImportSource,
  ImportPreviewData,
  EntityMapping,
  AircraftMapping,
  ImportMetadata,
  ReceiptFileData,
  DuplicateTrip,
} from "@/types/import";

type ImportState = {
  source: ImportSource | null;
  file: File | null;
  csvContent: string | null;
  receiptFiles: string[];
  receiptBlobs: ReceiptFileData[];
  previewData: ImportPreviewData | null;
  categoryMappings: Record<string, EntityMapping>;
  vendorMappings: Record<string, EntityMapping>;
  paymentMethodMappings: Record<string, EntityMapping>;
  aircraftMappings: Record<string, AircraftMapping>;
  duplicateTrips: DuplicateTrip[];
  skipDuplicates: boolean;
};

type ImportContextType = {
  state: ImportState;
  setSource: (source: ImportSource) => void;
  setFile: (file: File) => void;
  setCSVContent: (csv: string, receiptFiles?: string[]) => void;
  setReceiptBlobs: (receipts: ReceiptFileData[]) => void;
  setPreviewData: (data: ImportPreviewData) => void;
  setCategoryMapping: (sourceName: string, mapping: EntityMapping) => void;
  setVendorMapping: (sourceName: string, mapping: EntityMapping) => void;
  setPaymentMethodMapping: (sourceName: string, mapping: EntityMapping) => void;
  setAircraftMapping: (tailNumber: string, mapping: AircraftMapping) => void;
  setDuplicateTrips: (duplicates: DuplicateTrip[]) => void;
  setSkipDuplicates: (skip: boolean) => void;
  getMetadata: () => ImportMetadata;
  reset: () => void;
};

const initialState: ImportState = {
  source: null,
  file: null,
  csvContent: null,
  receiptFiles: [],
  receiptBlobs: [],
  previewData: null,
  categoryMappings: {},
  vendorMappings: {},
  paymentMethodMappings: {},
  aircraftMappings: {},
  duplicateTrips: [],
  skipDuplicates: false,
};

const ImportContext = createContext<ImportContextType | null>(null);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImportState>(initialState);

  const setSource = useCallback((source: ImportSource) => {
    setState((prev) => ({ ...prev, source }));
  }, []);

  const setFile = useCallback((file: File) => {
    setState((prev) => ({ ...prev, file }));
  }, []);

  const setCSVContent = useCallback((csv: string, receiptFiles: string[] = []) => {
    setState((prev) => ({ ...prev, csvContent: csv, receiptFiles }));
  }, []);

  const setReceiptBlobs = useCallback((receipts: ReceiptFileData[]) => {
    setState((prev) => ({ ...prev, receiptBlobs: receipts }));
  }, []);

  const setPreviewData = useCallback((data: ImportPreviewData) => {
    // Initialize default mappings when preview data is set
    const categoryMappings: Record<string, EntityMapping> = {};
    const vendorMappings: Record<string, EntityMapping> = {};
    const paymentMethodMappings: Record<string, EntityMapping> = {};
    const aircraftMappings: Record<string, AircraftMapping> = {};

    for (const cat of data.uniqueCategories) {
      categoryMappings[cat.name] = {
        action: cat.exists ? "map" : "create",
        newName: cat.name,
        isFuelCategory: cat.isFuel,
      };
    }

    for (const vendor of data.uniqueVendors) {
      vendorMappings[vendor.name] = {
        action: vendor.exists ? "map" : "create",
        newName: vendor.name,
      };
    }

    for (const pm of data.uniquePaymentMethods) {
      paymentMethodMappings[pm.name] = {
        action: pm.exists ? "map" : "create",
        newName: pm.name,
      };
    }

    for (const aircraft of data.aircraft) {
      aircraftMappings[aircraft.tailNumber] = {
        action: aircraft.exists ? "map" : "create",
        tailNumber: aircraft.tailNumber,
      };
    }

    setState((prev) => ({
      ...prev,
      previewData: data,
      categoryMappings,
      vendorMappings,
      paymentMethodMappings,
      aircraftMappings,
    }));
  }, []);

  const setCategoryMapping = useCallback(
    (sourceName: string, mapping: EntityMapping) => {
      setState((prev) => ({
        ...prev,
        categoryMappings: { ...prev.categoryMappings, [sourceName]: mapping },
      }));
    },
    []
  );

  const setVendorMapping = useCallback(
    (sourceName: string, mapping: EntityMapping) => {
      setState((prev) => ({
        ...prev,
        vendorMappings: { ...prev.vendorMappings, [sourceName]: mapping },
      }));
    },
    []
  );

  const setPaymentMethodMapping = useCallback(
    (sourceName: string, mapping: EntityMapping) => {
      setState((prev) => ({
        ...prev,
        paymentMethodMappings: {
          ...prev.paymentMethodMappings,
          [sourceName]: mapping,
        },
      }));
    },
    []
  );

  const setAircraftMapping = useCallback(
    (tailNumber: string, mapping: AircraftMapping) => {
      setState((prev) => ({
        ...prev,
        aircraftMappings: { ...prev.aircraftMappings, [tailNumber]: mapping },
      }));
    },
    []
  );

  const setDuplicateTrips = useCallback((duplicates: DuplicateTrip[]) => {
    setState((prev) => ({ ...prev, duplicateTrips: duplicates }));
  }, []);

  const setSkipDuplicates = useCallback((skip: boolean) => {
    setState((prev) => ({ ...prev, skipDuplicates: skip }));
  }, []);

  const getMetadata = useCallback((): ImportMetadata => {
    return {
      categoryMappings: state.categoryMappings,
      vendorMappings: state.vendorMappings,
      paymentMethodMappings: state.paymentMethodMappings,
      aircraftMappings: state.aircraftMappings,
      parseWarnings: state.previewData?.warnings ?? [],
    };
  }, [state]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <ImportContext.Provider
      value={{
        state,
        setSource,
        setFile,
        setCSVContent,
        setReceiptBlobs,
        setPreviewData,
        setCategoryMapping,
        setVendorMapping,
        setPaymentMethodMapping,
        setAircraftMapping,
        setDuplicateTrips,
        setSkipDuplicates,
        getMetadata,
        reset,
      }}
    >
      {children}
    </ImportContext.Provider>
  );
}

export function useImport() {
  const context = useContext(ImportContext);
  if (!context) {
    throw new Error("useImport must be used within an ImportProvider");
  }
  return context;
}
