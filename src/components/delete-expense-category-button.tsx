"use client";

import { useState } from "react";
import {
  deleteExpenseCategory,
  reassignLineItemsAndDeleteExpenseCategory,
} from "@/lib/actions/expense-categories";
import { Button } from "@/components/ui/button";
import { ExpenseCategoryCombobox } from "@/components/expense-category-combobox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { ExpenseCategory } from "@/types/database";

type Props = {
  categoryId: string;
  categoryName: string;
  lineItemCount: number;
  categories: ExpenseCategory[];
};

export function DeleteExpenseCategoryButton({
  categoryId,
  categoryName,
  lineItemCount,
  categories,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState("");

  // Filter out the current category from reassignment options
  const availableCategories = categories.filter((c) => c.id !== categoryId);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteExpenseCategory(categoryId);
      setOpen(false);
    } catch (err) {
      setLoading(false);
    }
  }

  async function handleReassignAndDelete() {
    if (!targetCategoryId) return;
    setLoading(true);
    try {
      await reassignLineItemsAndDeleteExpenseCategory(
        categoryId,
        targetCategoryId
      );
      setOpen(false);
    } catch (err) {
      setLoading(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!loading) {
      setOpen(isOpen);
      if (!isOpen) {
        // Reset state when closing
        setShowReassign(false);
        setTargetCategoryId("");
      }
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {categoryName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {lineItemCount > 0 ? (
              <>
                <span className="text-amber-600 font-medium">Warning:</span>{" "}
                {lineItemCount} expense line item
                {lineItemCount !== 1 && "s"} linked to this category.
                {!showReassign && " Choose how to proceed."}
              </>
            ) : (
              "This action cannot be undone."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showReassign && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Reassign line items to:</p>
            <ExpenseCategoryCombobox
              categories={availableCategories}
              value={targetCategoryId}
              onValueChange={(id) => {
                setTargetCategoryId(id);
              }}
              disabled={loading}
            />
          </div>
        )}

        <AlertDialogFooter>
          {showReassign ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowReassign(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReassignAndDelete}
                disabled={loading || !targetCategoryId}
              >
                {loading ? "Reassigning..." : "Reassign & Delete"}
              </Button>
            </>
          ) : lineItemCount > 0 ? (
            <>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => setShowReassign(true)}
                disabled={loading}
              >
                Reassign & Delete
              </Button>
            </>
          ) : (
            <>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
