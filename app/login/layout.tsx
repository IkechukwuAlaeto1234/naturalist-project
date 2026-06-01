import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Naturalist",
  description: "Sign in to your Naturalist account.",
  openGraph: {
    title: "Sign In | Naturalist",
    description: "Sign in to your Naturalist account.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
