"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPaymentMethodAndRedirect,
  updatePaymentMethod,
  type PaymentMethodFormData,
} from "@/lib/actions/payment-methods";
import type { PaymentMethod } from "@/types/database";

type Props = {
  paymentMethod?: PaymentMethod;
};

export function PaymentMethodForm({ paymentMethod }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: PaymentMethodFormData = {
      name: formData.get("name") as string,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (paymentMethod) {
        await updatePaymentMethod(paymentMethod.id, data);
      } else {
        await createPaymentMethodAndRedirect(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Payment Method Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={paymentMethod?.name}
          placeholder="e.g., Company Card"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={paymentMethod?.notes ?? ""}
          placeholder="Optional notes about this payment method"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : paymentMethod ? "Update Payment Method" : "Create Payment Method"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
