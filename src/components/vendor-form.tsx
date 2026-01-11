"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createVendorAndRedirect,
  updateVendor,
  type VendorFormData,
} from "@/lib/actions/vendors";
import type { Vendor } from "@/types/database";

type Props = {
  vendor?: Vendor;
};

export function VendorForm({ vendor }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: VendorFormData = {
      name: formData.get("name") as string,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (vendor) {
        await updateVendor(vendor.id, data);
      } else {
        await createVendorAndRedirect(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Vendor Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={vendor?.name}
          placeholder="e.g., Atlantic Aviation"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={vendor?.notes ?? ""}
          placeholder="Optional notes about this vendor"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : vendor ? "Update Vendor" : "Create Vendor"}
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
