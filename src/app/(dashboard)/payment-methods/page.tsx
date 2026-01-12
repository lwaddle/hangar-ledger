import Link from "next/link";
import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PaymentMethodsPage() {
  const paymentMethods = await getPaymentMethods();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <Button asChild>
          <Link href="/payment-methods/new">New Payment Method</Link>
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No payment methods yet</p>
          <Button asChild>
            <Link href="/payment-methods/new">Create your first payment method</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((paymentMethod) => (
                <TableRow key={paymentMethod.id}>
                  <TableCell>
                    <Link
                      href={`/payment-methods/${paymentMethod.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {paymentMethod.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {paymentMethod.notes ? (
                      <span className="line-clamp-1">{paymentMethod.notes}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/payment-methods/${paymentMethod.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
