// hooks/useSessionUploader.ts
// Responsible solely for POSTing finished sessions to the backend and guarding against duplicate uploads.
import { useCallback, useRef, useState } from "react";

export type SessionActivity = "Focus" | "Rest";

export interface SessionPayload {
  userId: string;
  activity: SessionActivity;
  startTs: string;      // ISO
  durationSec: number;  // positive integer
}

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://petly-gsxb.onrender.com";

console.log("[useSessionUploader] API_BASE:", API_BASE);

/**
 * Small helper hook that uploads a single focus/rest session and prevents accidental duplicate requests
 * (for example if fullyStopAndReset fires twice). Returns upload + pending flag.
 */
export function useSessionUploader() {
  const [pending, setPending] = useState(false);
  const inflightKey = useRef<string | null>(null);

  const upload = useCallback(async (payload: SessionPayload) => {
    const key = `${payload.userId}:${payload.startTs}`;
    if (inflightKey.current === key) return;
    inflightKey.current = key;

    console.log('[useSessionUploader] Posting session to', `${API_BASE}/api/post_focus_session`, payload);

    setPending(true);
    try {
      const res = await fetch(`${API_BASE}/api/post_focus_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => "");
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // ignore
      }
      if (!res.ok) {
        console.error('Upload failed', res.status, text);
        throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
      }
      return json?.data?.coinsAwarded ?? 0;
    } finally {
      setPending(false);
      inflightKey.current = null;
    }
  }, []);

  return { upload, pending };
}
