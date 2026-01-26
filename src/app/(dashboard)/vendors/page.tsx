import { getVendors } from "@/lib/actions/vendors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { InactiveBadge } from "@/components/inactive-badge";
import {
  NewEntityButton,
  EmptyStateActions,
} from "@/components/settings-entity-buttons";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <NewEntityButton href="/vendors/new" label="New Vendor" />
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No vendors yet</p>
          <EmptyStateActions
            href="/vendors/new"
            label="Create your first vendor"
            viewerMessage="Contact an administrator to add vendors."
          />
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
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {vendor.name}
                      {!vendor.is_active && <InactiveBadge />}
                    </span>
                  </TableCell>
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
