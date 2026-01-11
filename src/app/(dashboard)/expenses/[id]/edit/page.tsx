import { notFound } from "next/navigation";
import { getExpense } from "@/lib/actions/expenses";
import { getTrips } from "@/lib/actions/trips";
import { getVendors } from "@/lib/actions/vendors";
import { ExpenseForm } from "@/components/expense-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params;
  const [expense, trips, vendors] = await Promise.all([
    getExpense(id),
    getTrips(),
    getVendors(),
  ]);

  if (!expense) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Expense</h1>
      <ExpenseForm expense={expense} trips={trips} vendors={vendors} />
    </div>
  );
}
