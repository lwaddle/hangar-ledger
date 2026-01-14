import { ImportProvider } from "@/lib/import/import-context";

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ImportProvider>{children}</ImportProvider>;
}
