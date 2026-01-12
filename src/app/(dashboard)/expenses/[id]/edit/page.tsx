import { notFound } from "next/navigation";
import { getExpense } from "@/lib/actions/expenses";
import { getTrips } from "@/lib/actions/trips";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { ExpenseForm } from "@/components/expense-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params;
  const [expense, trips, vendors, paymentMethods] = await Promise.all([
    getExpense(id),
    getTrips(),
    getVendors(),
    getPaymentMethods(),
  ]);

  if (!expense) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Expense</h1>
      <ExpenseForm expense={expense} trips={trips} vendors={vendors} paymentMethods={paymentMethods} />
    </div>
  );
}
