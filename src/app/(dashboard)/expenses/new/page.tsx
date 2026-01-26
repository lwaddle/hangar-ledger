import { getTrips } from "@/lib/actions/trips";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
import { ExpenseForm } from "@/components/expense-form";

type Props = {
  searchParams: Promise<{ trip_id?: string }>;
};

export default async function NewExpensePage({ searchParams }: Props) {
  const { trip_id } = await searchParams;
  const [vendors, paymentMethods, categories, trips] = await Promise.all([
    getVendors(),
    getPaymentMethods(),
    getExpenseCategories(),
    getTrips(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Expense</h1>
      <ExpenseForm
        trips={trips}
        vendors={vendors}
        paymentMethods={paymentMethods}
        categories={categories}
        defaultTripId={trip_id}
      />
    </div>
  );
}
