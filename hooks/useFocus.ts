// hooks/useSessionUploader.ts
// Responsible solely for POSTing finished sessions to the backend and guarding against duplicate uploads.
import { useCallback, useRef, useState } from "react";
import { getApiBaseUrl } from "@/utils/api";

export type SessionActivity = string; // Can be any tag label like "Focus", "Work", "Study", "Rest", etc.

export interface SessionPayload {
  userId: string;
  activity: SessionActivity;
  tagId?: string | null;
  startTs: string;      // ISO
  endTs: string;        // ISO
  durationSec: number;  // positive integer
  tz?: string;          // IANA timezone, e.g. "Europe/London"
}

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

    setPending(true);
    try {
      const API_BASE = getApiBaseUrl();
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
      return {
        coinsAwarded: json?.data?.coinsAwarded ?? 0,
        xpAwarded: json?.data?.xpAwarded ?? 0,
      };
    } finally {
      setPending(false);
      inflightKey.current = null;
    }
  }, []);

  return { upload, pending };
}
