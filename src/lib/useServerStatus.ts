import { useEffect, useState } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import { SERVER_STATUS_URL } from "./constants";

export type ServerStatus =
  | { kind: "loading" }
  | { kind: "online"; players: number; maxPlayers: number; pingMs: number; hostname: string }
  | { kind: "offline" };

const POLL_INTERVAL_MS = 15_000;

interface DynamicJsonResponse {
  clients?: number;
  hostname?: string;
  sv_maxclients?: string;
}

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const startedAt = performance.now();
      try {
        const response = await fetch(SERVER_STATUS_URL, { method: "GET" });
        const pingMs = Math.round(performance.now() - startedAt);

        if (!response.ok) throw new Error(`status ${response.status}`);

        const body = (await response.json()) as DynamicJsonResponse;
        const players = body.clients;
        const maxPlayers = Number(body.sv_maxclients);

        if (typeof players !== "number" || !Number.isFinite(maxPlayers)) {
          throw new Error("malformed response");
        }

        if (!cancelled) {
          setStatus({
            kind: "online",
            players,
            maxPlayers,
            pingMs,
            hostname: body.hostname ?? "",
          });
        }
      } catch {
        if (!cancelled) setStatus({ kind: "offline" });
      }
    };

    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return status;
}
