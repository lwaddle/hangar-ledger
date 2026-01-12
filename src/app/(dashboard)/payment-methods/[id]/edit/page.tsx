import { notFound } from "next/navigation";
import { getPaymentMethod } from "@/lib/actions/payment-methods";
import { PaymentMethodForm } from "@/components/payment-method-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPaymentMethodPage({ params }: Props) {
  const { id } = await params;
  const paymentMethod = await getPaymentMethod(id);

  if (!paymentMethod) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Payment Method</h1>
      <PaymentMethodForm paymentMethod={paymentMethod} />
    </div>
  );
}
