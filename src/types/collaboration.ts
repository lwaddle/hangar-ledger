import { UserProfile } from "./database";

/**
 * Represents a conflict between local changes and server state
 */
export type ConflictData<T> = {
  /** The version the user was editing */
  localVersion: T;
  /** The current version on the server */
  serverVersion: T;
  /** The original version before any edits (for 3-way merge) */
  baseVersion: T;
  /** Fields that have true conflicts (both sides changed) */
  conflictFields: (keyof T)[];
  /** Fields that only changed on server (can auto-merge) */
  serverOnlyChanges: (keyof T)[];
  /** Fields that only changed locally (can auto-merge) */
  localOnlyChanges: (keyof T)[];
  /** User who made the server changes */
  serverUpdatedBy: UserProfile | null;
  /** When the server was updated */
  serverUpdatedAt: string;
};

/**
 * Resolution strategy for a conflict
 */
export type ConflictResolution = "keep_mine" | "keep_theirs" | "merge";

/**
 * Result of an optimistic update operation
 */
export type UpdateResult<T> =
  | { success: true; data: T; version: number }
  | { success: false; error: "version_conflict"; conflict: ConflictData<T> }
  | { success: false; error: "permission_denied"; message: string }
  | { success: false; error: "not_found"; message: string }
  | { success: false; error: "validation"; message: string }
  | { success: false; error: "unknown"; message: string };

/**
 * Result of an auto-merge operation
 */
export type AutoMergeResult<T> =
  | {
      success: true;
      mergedData: T;
      autoMergedFields: (keyof T)[];
      message: string;
    }
  | {
      success: false;
      conflictFields: (keyof T)[];
      message: string;
    };

/**
 * Real-time presence data for a user viewing/editing an entity
 */
export type PresenceData = {
  userId: string;
  userEmail: string;
  displayName: string | null;
  entityType: string;
  entityId: string;
  mode: "viewing" | "editing";
  lastSeen: string;
};

/**
 * Real-time subscription event types
 */
export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

/**
 * Real-time change event
 */
export type RealtimeChangeEvent<T> = {
  eventType: RealtimeEventType;
  table: string;
  new: T | null;
  old: T | null;
  timestamp: string;
};

/**
 * Activity log entry
 */
export type ActivityLogEntry = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  action: "create" | "update" | "delete";
  entityType: string;
  entityId: string;
  entityName: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  createdAt: string;
};
