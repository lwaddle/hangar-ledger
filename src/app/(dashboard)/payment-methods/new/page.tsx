import { PaymentMethodForm } from "@/components/payment-method-form";

export default function NewPaymentMethodPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Payment Method</h1>
      <PaymentMethodForm />
    </div>
  );
}
