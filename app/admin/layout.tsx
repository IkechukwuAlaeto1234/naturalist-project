import type { Metadata } from "next";
import AdminShell from "./AdminShell";

export const metadata: Metadata = {
  title: "Admin Dashboard | Naturalist",
  description: "Naturalist administrative command center.",
  openGraph: {
    title: "Admin Dashboard | Naturalist",
    description: "Naturalist administrative command center.",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
