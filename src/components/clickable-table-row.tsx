"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

type ClickableTableRowProps = {
  href: string;
  children: React.ReactNode;
};

export function ClickableTableRow({ href, children }: ClickableTableRowProps) {
  const router = useRouter();

  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => router.push(href)}
    >
      {children}
    </TableRow>
  );
}
