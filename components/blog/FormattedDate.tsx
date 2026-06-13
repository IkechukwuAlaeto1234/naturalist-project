"use client";

import { useEffect, useState } from "react";

interface FormattedDateProps {
  date: string | Date;
  type?: "datetime" | "date" | "time";
}

export default function FormattedDate({ date, type = "datetime" }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const d = new Date(date);
  const timezoneOptions = mounted ? {} : { timeZone: "UTC" };

  if (type === "date") {
    const dateFormatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...timezoneOptions,
    });
    return <>{dateFormatted}</>;
  }

  if (type === "time") {
    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...timezoneOptions,
    });
    return <>{timeFormatted}</>;
  }

  // datetime format
  const dateFormatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...timezoneOptions,
  });
  
  const timeFormatted = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...timezoneOptions,
  });

  return <>{`${dateFormatted}, ${timeFormatted}`}</>;
}
