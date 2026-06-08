import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're Back In | Naturalist",
  description: "You have been successfully re-subscribed to the Naturalist newsletter.",
};

export default function ResubscribedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
