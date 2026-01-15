"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ConflictData, ConflictResolution } from "@/types/collaboration";

type ConflictResolutionDialogProps<T extends Record<string, unknown>> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: ConflictData<T>;
  fieldLabels: Partial<Record<keyof T, string>>;
  formatValue?: (field: keyof T, value: unknown) => string;
  onResolve: (resolution: ConflictResolution, mergedData?: Partial<T>) => void;
  isResolving?: boolean;
};

export function ConflictResolutionDialog<T extends Record<string, unknown>>({
  open,
  onOpenChange,
  conflict,
  fieldLabels,
  formatValue = defaultFormatValue,
  onResolve,
  isResolving = false,
}: ConflictResolutionDialogProps<T>) {
  const [fieldChoices, setFieldChoices] = useState<Record<string, "mine" | "theirs">>(() => {
    // Default all conflict fields to "theirs" (server version)
    const initial: Record<string, "mine" | "theirs"> = {};
    for (const field of conflict.conflictFields) {
      initial[field as string] = "theirs";
    }
    return initial;
  });

  function handleFieldChoice(field: string, choice: "mine" | "theirs") {
    setFieldChoices((prev) => ({ ...prev, [field]: choice }));
  }

  function handleKeepMine() {
    onResolve("keep_mine");
  }

  function handleKeepTheirs() {
    onResolve("keep_theirs");
  }

  function handleMerge() {
    // Build merged data based on field choices
    const mergedData: Partial<T> = {};
    for (const field of conflict.conflictFields) {
      const choice = fieldChoices[field as string];
      mergedData[field] = choice === "mine"
        ? conflict.localVersion[field]
        : conflict.serverVersion[field];
    }
    onResolve("merge", mergedData);
  }

  const hasConflicts = conflict.conflictFields.length > 0;
  const updatedByName = conflict.serverUpdatedBy?.display_name || conflict.serverUpdatedBy?.email || "Another user";
  const updatedAtFormatted = new Date(conflict.serverUpdatedAt).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-600">
            Conflict Detected
          </DialogTitle>
          <DialogDescription>
            {updatedByName} made changes at {updatedAtFormatted}. Choose how to
            resolve the conflicts below.
          </DialogDescription>
        </DialogHeader>

        {/* Auto-merged fields info */}
        {(conflict.serverOnlyChanges.length > 0 || conflict.localOnlyChanges.length > 0) && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
            <p className="font-medium text-green-800">Auto-merged changes:</p>
            <ul className="mt-1 text-green-700 list-disc list-inside">
              {conflict.serverOnlyChanges.map((field) => (
                <li key={field as string}>
                  {fieldLabels[field] || (field as string)} (from server)
                </li>
              ))}
              {conflict.localOnlyChanges.map((field) => (
                <li key={field as string}>
                  {fieldLabels[field] || (field as string)} (your changes)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conflict fields */}
        {hasConflicts && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">
              The following fields were changed by both you and {updatedByName}:
            </p>

            {conflict.conflictFields.map((field) => {
              const currentChoice = fieldChoices[field as string];
              return (
                <div
                  key={field as string}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <Label className="text-sm font-medium">
                    {fieldLabels[field] || (field as string)}
                  </Label>

                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChoice(field as string, "mine")}
                      className={cn(
                        "w-full text-left p-3 rounded border transition-colors",
                        currentChoice === "mine"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-blue-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border-2",
                            currentChoice === "mine"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          )}
                        >
                          {currentChoice === "mine" && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium">Your version</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-mono bg-white p-2 rounded border ml-6">
                        {formatValue(field, conflict.localVersion[field])}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChoice(field as string, "theirs")}
                      className={cn(
                        "w-full text-left p-3 rounded border transition-colors",
                        currentChoice === "theirs"
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 bg-white hover:bg-amber-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border-2",
                            currentChoice === "theirs"
                              ? "border-amber-500 bg-amber-500"
                              : "border-gray-300"
                          )}
                        >
                          {currentChoice === "theirs" && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          Server version ({updatedByName})
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-mono bg-white p-2 rounded border ml-6">
                        {formatValue(field, conflict.serverVersion[field])}
                      </p>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleKeepTheirs}
              disabled={isResolving}
            >
              Keep Server Version
            </Button>
            <Button
              variant="outline"
              onClick={handleKeepMine}
              disabled={isResolving}
            >
              Keep My Version
            </Button>
            {hasConflicts && (
              <Button onClick={handleMerge} disabled={isResolving}>
                {isResolving ? "Saving..." : "Save Merged Changes"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultFormatValue(_field: unknown, value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
}
