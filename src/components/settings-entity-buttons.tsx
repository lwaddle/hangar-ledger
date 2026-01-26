"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";

interface NewEntityButtonProps {
  href: string;
  label: string;
}

export function NewEntityButton({ href, label }: NewEntityButtonProps) {
  const { canEdit } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <Button asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

interface EmptyStateActionsProps {
  href: string;
  label: string;
  viewerMessage?: string;
}

export function EmptyStateActions({
  href,
  label,
  viewerMessage = "Contact an administrator to add items.",
}: EmptyStateActionsProps) {
  const { canEdit } = useRole();

  if (!canEdit) {
    return <p className="text-sm text-gray-400">{viewerMessage}</p>;
  }

  return (
    <Button asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

interface EditEntityButtonProps {
  href: string;
}

export function EditEntityButton({ href }: EditEntityButtonProps) {
  const { canEdit } = useRole();

  if (!canEdit) {
    return null;
  }

  return (
    <Button variant="outline" asChild>
      <Link href={href}>Edit</Link>
    </Button>
  );
}
