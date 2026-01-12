"use client";

import { useState } from "react";
import { deletePaymentMethod, reassignExpensesAndDeletePaymentMethod } from "@/lib/actions/payment-methods";
import { Button } from "@/components/ui/button";
import { PaymentMethodCombobox } from "@/components/payment-method-combobox";
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
import type { PaymentMethod } from "@/types/database";

type Props = {
  paymentMethodId: string;
  paymentMethodName: string;
  expenseCount: number;
  paymentMethods: PaymentMethod[];
};

export function DeletePaymentMethodButton({ paymentMethodId, paymentMethodName, expenseCount, paymentMethods }: Props) {
  const [open, setOpen] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetPaymentMethodId, setTargetPaymentMethodId] = useState("");
  const [targetPaymentMethodName, setTargetPaymentMethodName] = useState("");

  // Filter out the current payment method from reassignment options
  const availablePaymentMethods = paymentMethods.filter((pm) => pm.id !== paymentMethodId);

  async function handleDelete() {
    setLoading(true);
    try {
      await deletePaymentMethod(paymentMethodId);
      setOpen(false);
    } catch (err) {
      setLoading(false);
    }
  }

  async function handleReassignAndDelete() {
    if (!targetPaymentMethodId) return;
    setLoading(true);
    try {
      await reassignExpensesAndDeletePaymentMethod(paymentMethodId, targetPaymentMethodId);
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
        setTargetPaymentMethodId("");
        setTargetPaymentMethodName("");
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
          <AlertDialogTitle>Delete {paymentMethodName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {expenseCount > 0 ? (
              <>
                <span className="text-amber-600 font-medium">Warning:</span>{" "}
                {expenseCount} expense{expenseCount !== 1 && "s"} linked to this payment method.
                {!showReassign && " Choose how to proceed."}
              </>
            ) : (
              "This action cannot be undone."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showReassign && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Reassign expenses to:</p>
            <PaymentMethodCombobox
              paymentMethods={availablePaymentMethods}
              value={targetPaymentMethodId}
              onValueChange={(id, name) => {
                setTargetPaymentMethodId(id);
                setTargetPaymentMethodName(name);
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
                disabled={loading || !targetPaymentMethodId}
              >
                {loading ? "Reassigning..." : "Reassign & Delete"}
              </Button>
            </>
          ) : expenseCount > 0 ? (
            <>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => setShowReassign(true)}
                disabled={loading}
              >
                Reassign Expenses
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Anyway"}
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
