import { getTrip } from "@/lib/actions/trips";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import {
  getFlightExpenseCategories,
  getGeneralExpenseCategories,
} from "@/lib/actions/expense-categories";
import { ExpenseForm } from "@/components/expense-form";

type Props = {
  searchParams: Promise<{ trip_id?: string }>;
};

export default async function NewExpensePage({ searchParams }: Props) {
  const { trip_id } = await searchParams;
  const [trip, vendors, paymentMethods, categories] = await Promise.all([
    trip_id ? getTrip(trip_id) : null,
    getVendors(),
    getPaymentMethods(),
    // If creating expense for a trip, show flight categories; otherwise show general categories
    trip_id ? getFlightExpenseCategories() : getGeneralExpenseCategories(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Expense</h1>
      <ExpenseForm
        vendors={vendors}
        paymentMethods={paymentMethods}
        categories={categories}
        defaultTripId={trip_id}
        tripName={trip?.name}
      />
    </div>
  );
}
