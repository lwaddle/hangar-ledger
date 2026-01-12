import { ExpenseCategoryForm } from "@/components/expense-category-form";

export default function NewExpenseCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Expense Category</h1>
      <ExpenseCategoryForm />
    </div>
  );
}
