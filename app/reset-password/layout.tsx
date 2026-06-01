import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm Password Reset | Naturalist",
  description: "Set a new password for your Naturalist account.",
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
