import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story | Naturalist",
  description: "How Naturalist was born from a deep belief that what you put on your skin should be as pure as what you put in your body.",
  openGraph: {
    title: "Our Story | Naturalist",
    description: "How Naturalist was born from a deep belief in botanical purity.",
  },
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
