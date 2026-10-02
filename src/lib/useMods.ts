import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ModFile {
  name: string;
  sizeBytes: number;
  modifiedMs: number;
}

interface ModsListResult {
  exists: boolean;
  mods: ModFile[];
  totalSizeBytes: number;
}

export function useMods(modsPath: string | null) {
  const [result, setResult] = useState<ModsListResult>({ exists: true, mods: [], totalSizeBytes: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!modsPath) return;
    const next = await invoke<ModsListResult>("list_mods", { modsPath });
    setResult(next);
    setLoading(false);
  }, [modsPath]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const ensureFolder = useCallback(async () => {
    if (!modsPath) return;
    await invoke("ensure_mods_folder", { modsPath });
    await refresh();
  }, [modsPath, refresh]);

  const importPaths = useCallback(
    async (paths: string[], backup: boolean) => {
      if (!modsPath || paths.length === 0) return;
      await invoke("import_mod_files", { modsPath, sourcePaths: paths, backup });
      await refresh();
    },
    [modsPath, refresh],
  );

  const remove = useCallback(
    async (name: string) => {
      if (!modsPath) return;
      await invoke("remove_mod_file", { modsPath, name });
      await refresh();
    },
    [modsPath, refresh],
  );

  const exportTo = useCallback(
    async (name: string, destDir: string) => {
      if (!modsPath) return;
      await invoke("export_mod_file", { modsPath, name, destDir });
    },
    [modsPath],
  );

  return {
    exists: result.exists,
    mods: result.mods,
    totalSizeBytes: result.totalSizeBytes,
    loading,
    refresh,
    ensureFolder,
    importPaths,
    remove,
    exportTo,
  };
}
