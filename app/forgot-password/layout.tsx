import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Naturalist",
  description: "Request a Naturalist password reset code.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
