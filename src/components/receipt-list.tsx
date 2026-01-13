"use client";

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteReceipt, getReceiptDownloadUrl } from "@/lib/actions/receipts";
import type { Receipt } from "@/types/database";

type Props = {
  receipts: Receipt[];
  expenseId: string;
  editable?: boolean;
  onDelete?: (receiptId: string) => void;
};

export function ReceiptList({
  receipts,
  expenseId,
  editable = false,
  onDelete,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const handleDownload = async (receipt: Receipt) => {
    try {
      const url = await getReceiptDownloadUrl(receipt.id);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to get download URL:", err);
    }
  };

  const handleDelete = async (receiptId: string) => {
    setDeletingId(receiptId);
    try {
      await deleteReceipt(receiptId, expenseId);
      onDelete?.(receiptId);
    } catch (err) {
      console.error("Failed to delete receipt:", err);
    } finally {
      setDeletingId(null);
      setConfirmingDelete(null);
    }
  };

  const isImage = (filename: string | null) => {
    if (!filename) return false;
    return /\.(jpg|jpeg|png|webp)$/i.test(filename);
  };

  if (receipts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No receipts attached</p>
    );
  }

  return (
    <div className="space-y-2">
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
        >
          {isImage(receipt.original_filename) ? (
            <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{receipt.original_filename}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(receipt.uploaded_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDownload(receipt)}
              title="Open"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            {editable && (
              <>
                {confirmingDelete === receipt.id ? (
                  <div className="flex gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(receipt.id)}
                      disabled={deletingId === receipt.id}
                    >
                      {deletingId === receipt.id ? "..." : "Confirm"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingDelete(null)}
                      disabled={deletingId === receipt.id}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setConfirmingDelete(receipt.id)}
                    title="Delete"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
