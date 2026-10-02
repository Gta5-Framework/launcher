import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { LanguageCode } from "./i18n";

export interface Settings {
  language: LanguageCode;
  fivemPath: string;
  startWithWindows: boolean;
  minimizeOnLaunch: boolean;
  autoUpdate: boolean;
  notifications: boolean;
  autoCreateModsFolder: boolean;
  checkModsOnStart: boolean;
  backupBeforeImport: boolean;
}

export function getModsPath(fivemPath: string): string {
  return `${fivemPath}\\FiveM.app\\mods`;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    invoke<Settings>("load_settings").then(setSettings);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      invoke("save_settings", { settings: next }).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update };
}
