"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAircraftAndRedirect,
  updateAircraft,
  type AircraftFormData,
} from "@/lib/actions/aircraft";
import type { Aircraft } from "@/types/database";

type Props = {
  aircraft?: Aircraft;
};

export function AircraftForm({ aircraft }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: AircraftFormData = {
      tail_number: formData.get("tail_number") as string,
      name: (formData.get("name") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (aircraft) {
        await updateAircraft(aircraft.id, data);
      } else {
        await createAircraftAndRedirect(data);
      }
    } catch (err) {
      // Rethrow redirect errors - they're not real errors
      if (err instanceof Error && err.message === "NEXT_REDIRECT") {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="tail_number">Tail Number *</Label>
        <Input
          id="tail_number"
          name="tail_number"
          defaultValue={aircraft?.tail_number}
          placeholder="e.g., N12345"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Aircraft Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={aircraft?.name ?? ""}
          placeholder="e.g., Citation X"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={aircraft?.notes ?? ""}
          placeholder="Optional notes about this aircraft"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : aircraft ? "Update Aircraft" : "Create Aircraft"}
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
