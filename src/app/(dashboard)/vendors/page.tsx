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
import { ClickableTableRow } from "@/components/clickable-table-row";

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <ClickableTableRow key={vendor.id} href={`/vendors/${vendor.id}`}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell className="text-gray-500">
                    {vendor.notes ? (
                      <span className="line-clamp-1">{vendor.notes}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
