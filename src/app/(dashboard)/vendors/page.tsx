import Link from "next/link";
import { getVendors } from "@/lib/actions/vendors";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Button asChild>
          <Link href="/vendors/new">New Vendor</Link>
        </Button>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No vendors yet</p>
          <Button asChild>
            <Link href="/vendors/new">Create your first vendor</Link>
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
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {vendor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {vendor.notes ? (
                      <span className="line-clamp-1">{vendor.notes}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/vendors/${vendor.id}/edit`}>Edit</Link>
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
