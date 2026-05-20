import type { Metadata } from "next";
import { AdminGuard } from "@/app/components/admin/AdminGuard";
import { AdminShell } from "@/app/components/admin/AdminShell";
import { useMemo } from "react";
export const metadata: Metadata = {
  title: { default: "Admin Panel | NexMart", template: "%s · Admin | NexMart" },
  description: "NexMart administration dashboard",
  robots: "noindex,nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
