"use client";

import { useEffect, useState } from "react";
import type { HealthResponse } from "@afrikcompute/shared";

export function Status() {
  const [state, setState] = useState<string>("checking...");

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    fetch(`${api}/health`)
      .then((r) => r.json() as Promise<HealthResponse>)
      .then((h) => setState(`API ${h.status}, Supabase ${h.supabase}`))
      .catch(() => setState("API unreachable"));
  }, []);

  return <p>{state}</p>;
}
