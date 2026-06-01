import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | Naturalist",
  description: "Verify your Naturalist account email address.",
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
