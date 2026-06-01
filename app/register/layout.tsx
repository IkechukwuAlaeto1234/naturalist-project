import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Naturalist",
  description: "Create your Naturalist account and activate your botanical skincare profile.",
  openGraph: {
    title: "Sign Up | Naturalist",
    description: "Create your Naturalist account.",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
