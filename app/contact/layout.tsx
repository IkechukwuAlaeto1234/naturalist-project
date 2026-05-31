import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Naturalist",
  description: "Get in touch with the Naturalist team. We typically respond within a few hours.",
  openGraph: {
    title: "Contact Us | Naturalist",
    description: "Get in touch with the Naturalist team.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
