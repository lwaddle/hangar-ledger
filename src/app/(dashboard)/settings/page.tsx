import Link from "next/link";
import { DangerZone } from "@/components/danger-zone";
import { getCurrentUser } from "@/lib/actions/users";

type SettingsItem = {
  href: string;
  label: string;
  description: string;
  enabled: boolean;
  adminOnly?: boolean;
};

const settingsItems: SettingsItem[] = [
  {
    href: "/settings/users",
    label: "User Management",
    description: "Manage users and their permissions",
    enabled: true,
    adminOnly: true,
  },
  {
    href: "/aircraft",
    label: "Aircraft",
    description: "Manage aircraft in your fleet",
    enabled: true,
  },
  {
    href: "/vendors",
    label: "Vendors",
    description: "Manage vendors for your expenses",
    enabled: true,
  },
  {
    href: "/payment-methods",
    label: "Payment Methods",
    description: "Manage payment methods for your expenses",
    enabled: true,
  },
  {
    href: "/expense-categories",
    label: "Expense Categories",
    description: "Manage categories for organizing expenses",
    enabled: true,
  },
  {
    href: "/settings/import-export",
    label: "Import/Export",
    description: "Import or export your data",
    enabled: true,
  },
];

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  // Filter items based on user role
  const visibleItems = settingsItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleItems.map((item) =>
          item.enabled ? (
            <Link
              key={item.href}
              href={item.href}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {item.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </Link>
          ) : (
            <div
              key={item.href}
              className="block p-6 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-500">
                  {item.label}
                </h2>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{item.description}</p>
            </div>
          )
        )}
      </div>

      {isAdmin && <DangerZone />}
    </div>
  );
}
