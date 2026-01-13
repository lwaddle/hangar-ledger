import { notFound } from "next/navigation";
import { getExpense } from "@/lib/actions/expenses";
import { getReceiptsByExpense } from "@/lib/actions/receipts";
import { getVendors } from "@/lib/actions/vendors";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { getExpenseCategories } from "@/lib/actions/expense-categories";
import { ExpenseForm } from "@/components/expense-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params;
  const expense = await getExpense(id);

  if (!expense) {
    notFound();
  }

  const [vendors, paymentMethods, categories, receipts] = await Promise.all([
    getVendors(),
    getPaymentMethods(),
    getExpenseCategories(),
    getReceiptsByExpense(id),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Expense</h1>
      <ExpenseForm
        expense={expense}
        vendors={vendors}
        paymentMethods={paymentMethods}
        categories={categories}
        initialReceipts={receipts}
      />
    </div>
  );
}
