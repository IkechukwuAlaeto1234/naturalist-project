"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ActivityRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account/profile?tab=activity-log");
  }, [router]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif font-medium">Redirecting to activity log...</p>
    </div>
  );
}
