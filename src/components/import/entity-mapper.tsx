"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EntityMapping } from "@/types/import";

type EntityMapperProps = {
  title: string;
  items: { name: string; exists: boolean; isFuel?: boolean }[];
  existingItems: { id: string; name: string }[];
  mappings: Record<string, EntityMapping>;
  onMappingChange: (sourceName: string, mapping: EntityMapping) => void;
  showFuelOption?: boolean;
};

export function EntityMapper({
  title,
  items,
  existingItems,
  mappings,
  onMappingChange,
  showFuelOption = false,
}: EntityMapperProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  const newItems = items.filter((item) => !item.exists);
  const existingMatchedItems = items.filter((item) => item.exists);

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {newItems.length} new, {existingMatchedItems.length} matched to existing
        </p>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {items.map((item) => {
          const mapping = mappings[item.name] || {
            action: item.exists ? "map" : "create",
            newName: item.name,
          };
          const isExpanded = expandedItem === item.name;

          return (
            <div key={item.name} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  {item.exists && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Exists
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {mapping.action === "map"
                      ? mapping.targetId
                        ? `→ ${existingItems.find((e) => e.id === mapping.targetId)?.name || "Map to existing"}`
                        : "Map to existing"
                      : "Create new"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedItem(isExpanded ? null : item.name)
                    }
                  >
                    {isExpanded ? "Done" : "Edit"}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                  {/* Action selection */}
                  <div className="flex gap-2">
                    <ActionButton
                      active={mapping.action === "create"}
                      onClick={() =>
                        onMappingChange(item.name, {
                          ...mapping,
                          action: "create",
                          newName: mapping.newName || item.name,
                        })
                      }
                    >
                      Create New
                    </ActionButton>
                    {existingItems.length > 0 && (
                      <ActionButton
                        active={mapping.action === "map"}
                        onClick={() =>
                          onMappingChange(item.name, {
                            ...mapping,
                            action: "map",
                          })
                        }
                      >
                        Map to Existing
                      </ActionButton>
                    )}
                  </div>

                  {/* Create new options */}
                  {mapping.action === "create" && (
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-600">
                        Name:
                      </label>
                      <input
                        type="text"
                        value={mapping.newName || item.name}
                        onChange={(e) =>
                          onMappingChange(item.name, {
                            ...mapping,
                            newName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      {showFuelOption && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={mapping.isFuelCategory || false}
                            onChange={(e) =>
                              onMappingChange(item.name, {
                                ...mapping,
                                isFuelCategory: e.target.checked,
                              })
                            }
                          />
                          This is a fuel category (tracks gallons)
                        </label>
                      )}
                    </div>
                  )}

                  {/* Map to existing options */}
                  {mapping.action === "map" && existingItems.length > 0 && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Map to:
                      </label>
                      <select
                        value={mapping.targetId || ""}
                        onChange={(e) =>
                          onMappingChange(item.name, {
                            ...mapping,
                            targetId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">Select existing {title.toLowerCase().slice(0, -1)}...</option>
                        {existingItems.map((existing) => (
                          <option key={existing.id} value={existing.id}>
                            {existing.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
