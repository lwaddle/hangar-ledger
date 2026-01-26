"use client";

import { FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QueuedFile } from "@/types/database";

type Props = {
  files: QueuedFile[];
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export function QueuedReceiptList({ files, onRemove, disabled }: Props) {
  if (files.length === 0) {
    return null;
  }

  const isImage = (file: File) => file.type.startsWith("image/");

  const handleRemove = (file: QueuedFile) => {
    URL.revokeObjectURL(file.previewUrl);
    onRemove(file.id);
  };

  return (
    <div className="space-y-2">
      {files.map((queuedFile) => (
        <div
          key={queuedFile.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
        >
          {isImage(queuedFile.file) ? (
            <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{queuedFile.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(queuedFile.file.size / 1024).toFixed(1)} KB - Ready to upload
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRemove(queuedFile)}
            disabled={disabled}
            title="Remove"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
