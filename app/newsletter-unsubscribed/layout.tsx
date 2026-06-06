import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed | Naturalist",
  description: "You have been successfully unsubscribed from the Naturalist newsletter.",
};

export default function UnsubscribedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
