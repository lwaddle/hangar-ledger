"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { AircraftCombobox } from "@/components/aircraft-combobox";
import { createTrip, updateTrip, type TripFormData } from "@/lib/actions/trips";
import type { Trip, Aircraft } from "@/types/database";

type Props = {
  trip?: Trip;
  aircraft: Aircraft[];
};

function parseLocalDate(dateString: string | undefined | null): Date | undefined {
  if (!dateString) return undefined;
  return parse(dateString, "yyyy-MM-dd", new Date());
}

export function TripForm({ trip, aircraft }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aircraftId, setAircraftId] = useState(trip?.aircraft_id ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    parseLocalDate(trip?.start_date)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    parseLocalDate(trip?.end_date)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!aircraftId) {
      setError("Please select an aircraft");
      return;
    }

    if (!startDate) {
      setError("Please select a start date");
      return;
    }

    if (endDate && startDate > endDate) {
      setError("Start date cannot be after end date");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: TripFormData = {
      name: formData.get("name") as string,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      aircraft_id: aircraftId,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (trip) {
        await updateTrip(trip.id, data);
      } else {
        await createTrip(data);
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
        <Label htmlFor="name">Trip Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={trip?.name}
          placeholder="e.g., KLAS to KJFK"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Aircraft *</Label>
        <AircraftCombobox
          aircraft={aircraft}
          value={aircraftId}
          onValueChange={(id) => setAircraftId(id)}
          includeInactiveId={trip?.aircraft_id}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date"
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="Select end date"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={trip?.notes ?? ""}
          placeholder="Optional notes about this trip"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : trip ? "Update Trip" : "Create Trip"}
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
