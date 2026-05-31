import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | Naturalist",
  description: "Manage your Naturalist account — orders, addresses, preferences, and more.",
  openGraph: {
    title: "My Account | Naturalist",
    description: "Manage your Naturalist account.",
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
