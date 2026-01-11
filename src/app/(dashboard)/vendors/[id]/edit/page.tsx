import { notFound } from "next/navigation";
import { getVendor } from "@/lib/actions/vendors";
import { VendorForm } from "@/components/vendor-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditVendorPage({ params }: Props) {
  const { id } = await params;
  const vendor = await getVendor(id);

  if (!vendor) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Vendor</h1>
      <VendorForm vendor={vendor} />
    </div>
  );
}
