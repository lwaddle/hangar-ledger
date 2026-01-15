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
import { Check, User, Server, GitMerge } from "lucide-react";

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
  // Resolution strategy: which overall approach to take
  const [strategy, setStrategy] = useState<ConflictResolution>("keep_theirs");

  // Field-level choices for merge mode
  const [fieldChoices, setFieldChoices] = useState<Record<string, "mine" | "theirs">>(() => {
    const initial: Record<string, "mine" | "theirs"> = {};
    for (const field of conflict.conflictFields) {
      initial[field as string] = "theirs";
    }
    return initial;
  });

  function handleFieldChoice(field: string, choice: "mine" | "theirs") {
    setFieldChoices((prev) => ({ ...prev, [field]: choice }));
  }

  function handleConfirm() {
    if (strategy === "keep_mine") {
      onResolve("keep_mine");
    } else if (strategy === "keep_theirs") {
      onResolve("keep_theirs");
    } else {
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
  }

  const hasConflicts = conflict.conflictFields.length > 0;
  const updatedByName = conflict.serverUpdatedBy?.display_name || conflict.serverUpdatedBy?.email || "Another user";
  const updatedAtFormatted = new Date(conflict.serverUpdatedAt).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-amber-600">
            Conflict Detected
          </DialogTitle>
          <DialogDescription>
            {updatedByName} made changes at {updatedAtFormatted}. Choose how to resolve this conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Strategy Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose a resolution:</Label>
            <div className="grid gap-3">
              {/* Keep Mine */}
              <button
                type="button"
                onClick={() => setStrategy("keep_mine")}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  strategy === "keep_mine"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2",
                    strategy === "keep_mine"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}>
                    {strategy === "keep_mine" && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Keep my changes</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Overwrite the server with your version. The other user's changes will be lost.
                    </p>
                  </div>
                </div>
              </button>

              {/* Keep Theirs */}
              <button
                type="button"
                onClick={() => setStrategy("keep_theirs")}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  strategy === "keep_theirs"
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2",
                    strategy === "keep_theirs"
                      ? "border-amber-500 bg-amber-500"
                      : "border-gray-300"
                  )}>
                    {strategy === "keep_theirs" && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">Keep server version</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Discard your changes and reload with {updatedByName}'s version.
                    </p>
                  </div>
                </div>
              </button>

              {/* Merge - only show if there are field-level conflicts */}
              {hasConflicts && (
                <button
                  type="button"
                  onClick={() => setStrategy("merge")}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                    strategy === "merge"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2",
                      strategy === "merge"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    )}>
                      {strategy === "merge" && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <GitMerge className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Merge changes</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Review each conflicting field and choose which value to keep.
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Field-by-field merge UI - only show when merge is selected */}
          {strategy === "merge" && hasConflicts && (
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-sm font-medium">
                Choose the value for each conflicting field:
              </Label>

              {conflict.conflictFields.map((field) => {
                const currentChoice = fieldChoices[field as string];
                return (
                  <div
                    key={field as string}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <Label className="text-sm font-medium text-gray-700">
                      {fieldLabels[field] || (field as string)}
                    </Label>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleFieldChoice(field as string, "mine")}
                        className={cn(
                          "text-left p-3 rounded-lg border-2 transition-all",
                          currentChoice === "mine"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-blue-200"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                            currentChoice === "mine"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          )}>
                            {currentChoice === "mine" && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-blue-600">Your version</span>
                        </div>
                        <p className="text-sm font-mono bg-white p-2 rounded border wrap-break-word">
                          {formatValue(field, conflict.localVersion[field])}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFieldChoice(field as string, "theirs")}
                        className={cn(
                          "text-left p-3 rounded-lg border-2 transition-all",
                          currentChoice === "theirs"
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 bg-white hover:border-amber-200"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                            currentChoice === "theirs"
                              ? "border-amber-500 bg-amber-500"
                              : "border-gray-300"
                          )}>
                            {currentChoice === "theirs" && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-amber-600">Server version</span>
                        </div>
                        <p className="text-sm font-mono bg-white p-2 rounded border wrap-break-word">
                          {formatValue(field, conflict.serverVersion[field])}
                        </p>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Auto-merged info - show at bottom if there were non-conflicting changes */}
          {(conflict.serverOnlyChanges.length > 0 || conflict.localOnlyChanges.length > 0) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-medium text-green-800">Non-conflicting changes (will be preserved):</p>
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
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isResolving}>
            {isResolving ? "Saving..." : "Confirm"}
          </Button>
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
