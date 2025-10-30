// hooks/useSessionUploader.ts
import { useCallback, useRef, useState } from "react";

export type SessionActivity = "Study" | "Rest";

export interface SessionPayload {
  userId: string;
  activity: SessionActivity;
  startTs: string;      // ISO
  durationSec: number;  // positive integer
}

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000";

export function useSessionUploader() {
  const [pending, setPending] = useState(false);
  const inflightKey = useRef<string | null>(null);

  const upload = useCallback(async (payload: SessionPayload) => {
    const key = `${payload.userId}:${payload.startTs}`;
    if (inflightKey.current === key) return;
    inflightKey.current = key;

    setPending(true);
    try {
      const res = await fetch(`${API_BASE}/api/post_focus_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
      }
    } finally {
      setPending(false);
      inflightKey.current = null;
    }
  }, []);

  return { upload, pending };
}
