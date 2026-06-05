import React from "react";
import { verifyLookupToken } from "@/lib/lookup-token";
import LookupClient from "./lookup-client";

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    status?: string;
  }>;
}

export default async function LookupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = params.ref;
  const status = params.status;

  if (status === "not_found") {
    return <LookupClient status="not_found" />;
  }

  if (!ref) {
    return <LookupClient status="invalid" />;
  }

  const payload = await verifyLookupToken(ref);
  if (!payload) {
    return <LookupClient status="expired" />;
  }

  const user = {
    name: payload.name,
    maskedEmail: payload.maskedEmail,
    initials: (payload as any).initials || payload.name.slice(0, 2).toUpperCase(),
  };

  return <LookupClient user={user} refToken={ref} />;
}
