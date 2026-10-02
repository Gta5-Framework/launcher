import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { SERVER_HOST } from "./constants";
import { useErrorContext } from "./ErrorContext";
import { useTranslation } from "./i18n";

export type JoinStage = "opening" | "starting" | "connectingToRos" | "running" | "loadingScreen";

export type JoinStatus = { kind: JoinStage } | null;

const LAUNCH_STATUS_EVENT = "fivem-launch-status";
const LAUNCH_DETAIL_EVENT = "fivem-launch-detail";

export function useJoinServer(fivemPath: string | null) {
  const t = useTranslation();
  const { showError } = useErrorContext();
  const [status, setStatus] = useState<JoinStatus>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const unlistenRefs = useRef<Array<() => void>>([]);
  const lastDetailRef = useRef<string | null>(null);

  const stopListening = useCallback(() => {
    unlistenRefs.current.forEach((fn) => fn());
    unlistenRefs.current = [];
  }, []);

  useEffect(() => stopListening, [stopListening]);

  const join = useCallback(async () => {
    if (!fivemPath) return;

    stopListening();
    setStatus({ kind: "opening" });
    setDetail(null);
    lastDetailRef.current = null;

    const unlistenStatus = await listen<
      JoinStage | "inServer" | "timedOut" | "failed"
    >(LAUNCH_STATUS_EVENT, (event) => {
      const kind = event.payload;

      if (kind === "inServer") {
        stopListening();
        setStatus(null);
        setDetail(null);
        return;
      }
      if (kind === "timedOut" || kind === "failed") {
        stopListening();
        setStatus(null);
        setDetail(null);
        showError({
          message: lastDetailRef.current ?? t.errorDialog[kind === "failed" ? "launchFailedGeneric" : "launchTimedOutGeneric"],
          code: kind === "failed" ? "ERR_LAUNCH_FAILED" : "ERR_LAUNCH_TIMEOUT",
          onRetry: join,
        });
        return;
      }

      setStatus({ kind });
    });
    const unlistenDetail = await listen<string>(LAUNCH_DETAIL_EVENT, (event) => {
      lastDetailRef.current = event.payload;
      setDetail(event.payload);
    });
    unlistenRefs.current = [unlistenStatus, unlistenDetail];

    try {
      await invoke("launch_fivem", { fivemPath, connectTarget: SERVER_HOST });
    } catch (err) {
      setStatus(null);
      setDetail(null);
      stopListening();
      showError({
        message: String(err) || t.errorDialog.launchErrorGeneric,
        code: "ERR_LAUNCH_EXCEPTION",
        onRetry: join,
      });
    }
  }, [fivemPath, stopListening, showError, t]);

  return { status, detail, join };
}
