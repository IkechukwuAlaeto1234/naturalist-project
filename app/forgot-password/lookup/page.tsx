import React from "react";
import { verifyLookupToken } from "@/lib/lookup-token";
import LookupClient from "./lookup-client";

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    status?: string;
    callbackUrl?: string;
  }>;
}

export default async function LookupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = params.ref;
  const status = params.status;
  const callbackUrl = params.callbackUrl;

  if (status === "not_found") {
    return <LookupClient status="not_found" callbackUrl={callbackUrl} />;
  }

  if (!ref) {
    return <LookupClient status="invalid" callbackUrl={callbackUrl} />;
  }

  const payload = await verifyLookupToken(ref);
  if (!payload) {
    return <LookupClient status="expired" callbackUrl={callbackUrl} />;
  }

  const user = {
    name: payload.name,
    maskedEmail: payload.maskedEmail,
    initials: (payload as any).initials || payload.name.slice(0, 2).toUpperCase(),
  };

  return <LookupClient user={user} refToken={ref} callbackUrl={callbackUrl} />;
}
