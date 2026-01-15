import type {
  ConflictData,
  AutoMergeResult,
  UpdateResult,
} from "@/types/collaboration";

/**
 * Compares two objects and returns arrays of changed fields
 */
export function detectChangedFields<T extends Record<string, unknown>>(
  base: T,
  current: T,
  fieldsToCompare: (keyof T)[]
): (keyof T)[] {
  const changedFields: (keyof T)[] = [];

  for (const field of fieldsToCompare) {
    if (!deepEqual(base[field], current[field])) {
      changedFields.push(field);
    }
  }

  return changedFields;
}

/**
 * Deep equality check for comparing field values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!bKeys.includes(key) || !deepEqual(aObj[key], bObj[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Attempts to auto-merge changes when there are no true conflicts
 * Returns the merged data if successful, or conflict info if not
 */
export function attemptAutoMerge<T extends Record<string, unknown>>(
  base: T,
  local: T,
  server: T,
  fieldsToCompare: (keyof T)[]
): AutoMergeResult<T> {
  const localChanges = detectChangedFields(base, local, fieldsToCompare);
  const serverChanges = detectChangedFields(base, server, fieldsToCompare);

  // Find true conflicts (both sides changed the same field)
  const conflictFields = localChanges.filter((field) =>
    serverChanges.includes(field)
  );

  // For conflict fields, check if they changed to the same value
  const trueConflicts = conflictFields.filter(
    (field) => !deepEqual(local[field], server[field])
  );

  if (trueConflicts.length > 0) {
    return {
      success: false,
      conflictFields: trueConflicts,
      message: `${trueConflicts.length} field(s) have conflicting changes`,
    };
  }

  // Auto-merge: start with server version, apply local-only changes
  const merged = { ...server };
  const localOnlyChanges = localChanges.filter(
    (field) => !serverChanges.includes(field)
  );

  for (const field of localOnlyChanges) {
    merged[field] = local[field];
  }

  const autoMergedFields = [
    ...localOnlyChanges,
    ...serverChanges.filter((field) => !localChanges.includes(field)),
  ];

  return {
    success: true,
    mergedData: merged,
    autoMergedFields,
    message:
      autoMergedFields.length > 0
        ? `Auto-merged ${autoMergedFields.length} field(s)`
        : "No conflicts detected",
  };
}

/**
 * Creates a conflict data object for UI display
 */
export function createConflictData<T extends Record<string, unknown>>(
  base: T,
  local: T,
  server: T,
  fieldsToCompare: (keyof T)[],
  serverUpdatedBy: { email: string; display_name: string | null } | null,
  serverUpdatedAt: string
): ConflictData<T> {
  const localChanges = detectChangedFields(base, local, fieldsToCompare);
  const serverChanges = detectChangedFields(base, server, fieldsToCompare);

  const conflictFields = localChanges.filter(
    (field) =>
      serverChanges.includes(field) && !deepEqual(local[field], server[field])
  );

  const serverOnlyChanges = serverChanges.filter(
    (field) => !localChanges.includes(field)
  );

  const localOnlyChanges = localChanges.filter(
    (field) => !serverChanges.includes(field)
  );

  return {
    localVersion: local,
    serverVersion: server,
    baseVersion: base,
    conflictFields,
    serverOnlyChanges,
    localOnlyChanges,
    serverUpdatedBy: serverUpdatedBy
      ? {
          id: "",
          email: serverUpdatedBy.email,
          display_name: serverUpdatedBy.display_name,
          role: "viewer",
          invited_by: null,
          invited_at: null,
          created_at: "",
          updated_at: "",
        }
      : null,
    serverUpdatedAt,
  };
}

/**
 * Helper to create a success result
 */
export function successResult<T>(data: T, version: number): UpdateResult<T> {
  return { success: true, data, version };
}

/**
 * Helper to create a version conflict result
 */
export function versionConflictResult<T>(
  conflict: ConflictData<T>
): UpdateResult<T> {
  return { success: false, error: "version_conflict", conflict };
}

/**
 * Helper to create a permission denied result
 */
export function permissionDeniedResult<T>(message: string): UpdateResult<T> {
  return { success: false, error: "permission_denied", message };
}

/**
 * Helper to create a not found result
 */
export function notFoundResult<T>(message: string): UpdateResult<T> {
  return { success: false, error: "not_found", message };
}

/**
 * Helper to create a validation error result
 */
export function validationErrorResult<T>(message: string): UpdateResult<T> {
  return { success: false, error: "validation", message };
}

/**
 * Helper to create an unknown error result
 */
export function unknownErrorResult<T>(message: string): UpdateResult<T> {
  return { success: false, error: "unknown", message };
}
