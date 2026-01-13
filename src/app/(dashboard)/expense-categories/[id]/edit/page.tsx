import { notFound, redirect } from "next/navigation";
import { getExpenseCategory } from "@/lib/actions/expense-categories";
import { ExpenseCategoryForm } from "@/components/expense-category-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditExpenseCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await getExpenseCategory(id);

  if (!category) {
    notFound();
  }

  // System categories cannot be edited
  if (category.is_system) {
    redirect(`/expense-categories/${id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Expense Category</h1>
      <ExpenseCategoryForm category={category} />
    </div>
  );
}
