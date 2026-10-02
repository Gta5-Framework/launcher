import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { ask, message, open } from "@tauri-apps/plugin-dialog";
import { AppShell, Button, Dot, Positioned, type Route } from "../../components";
import { formatBytes, formatDate } from "../../lib/format";
import { useLanguage, useTranslation } from "../../lib/i18n";
import { getModsPath } from "../../lib/useSettings";
import { useSettingsContext } from "../../lib/SettingsContext";
import { useMods } from "../../lib/useMods";
import styles from "./ModsScreen.module.css";

export interface ModsScreenProps {
  onNavigate: (route: Route) => void;
}

export function ModsScreen({ onNavigate }: ModsScreenProps) {
  const t = useTranslation();
  const language = useLanguage();
  const { settings } = useSettingsContext();
  const modsPath = settings ? getModsPath(settings.fivemPath) : null;
  const { exists, mods, totalSizeBytes, loading, ensureFolder, importPaths, remove, exportTo } =
    useMods(modsPath);
  const [isDragging, setIsDragging] = useState(false);
  const backupBeforeImport = settings?.backupBeforeImport ?? true;

  useEffect(() => {
    if (!loading && !exists && settings?.autoCreateModsFolder) {
      ensureFolder();
    }
  }, [loading, exists, settings?.autoCreateModsFolder, ensureFolder]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setIsDragging(true);
          return;
        }
        setIsDragging(false);
        if (event.payload.type === "drop") {
          const rpfPaths = event.payload.paths.filter((p) => p.toLowerCase().endsWith(".rpf"));
          if (rpfPaths.length > 0) {
            importPaths(rpfPaths, backupBeforeImport).catch((err) =>
              message(t.mods.importFailed(String(err)), { kind: "error" }),
            );
          }
        }
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => unlisten?.();
  }, [importPaths, backupBeforeImport, t]);

  const handleImportClick = async () => {
    const selected = await open({ multiple: true, filters: [{ name: "RPF", extensions: ["rpf"] }] });
    const paths = Array.isArray(selected) ? selected : selected ? [selected] : [];
    if (paths.length === 0) return;
    try {
      await importPaths(paths, backupBeforeImport);
    } catch (err) {
      await message(t.mods.importFailed(String(err)), { kind: "error" });
    }
  };

  const handleOpenFolder = async () => {
    if (!modsPath) return;
    await ensureFolder();
    await invoke("open_in_explorer", { path: modsPath });
  };

  const handleRemove = async (name: string) => {
    const confirmed = await ask(t.mods.confirmRemoveMessage(name), {
      title: t.mods.confirmRemoveTitle,
      kind: "warning",
    });
    if (!confirmed) return;
    try {
      await remove(name);
    } catch (err) {
      await message(t.mods.removeFailed(String(err)), { kind: "error" });
    }
  };

  const handleExport = async (name: string) => {
    const destDir = await open({ directory: true });
    if (!destDir || Array.isArray(destDir)) return;
    try {
      await exportTo(name, destDir);
    } catch (err) {
      await message(t.mods.exportFailed(String(err)), { kind: "error" });
    }
  };

  const handleCreateFolder = () => {
    ensureFolder();
  };

  const showMissingFolderPrompt = !loading && !exists && !settings?.autoCreateModsFolder;

  return (
    <AppShell route="mods" onNavigate={onNavigate} dimmed>
      <Positioned x={340} y={92} className={styles.title}>
        {t.mods.title}
      </Positioned>
      <Positioned x={340} y={160} className={styles.path}>
        {modsPath ?? ""}
      </Positioned>

      <Positioned x={1420} y={96} w={220} h={56}>
        <Button variant="secondary" onClick={handleOpenFolder}>
          {t.mods.openFolder}
        </Button>
      </Positioned>
      <Positioned x={1660} y={96} w={220} h={56}>
        <Button variant="primary" onClick={handleImportClick}>
          {t.mods.import}
        </Button>
      </Positioned>

      <Positioned x={340} y={200} w={1540} h={56} className={styles.statStrip}>
        <div className={styles.statStripLeft}>
          <Dot tone="green" size={8} />
          <span className={styles.statPrimary}>{t.mods.installedCount(mods.length)}</span>
          <span className={styles.statSecondary}>
            {t.mods.totalSize(formatBytes(totalSizeBytes, language))}
          </span>
        </div>
        <span className={styles.statHint}>{t.mods.folderHint}</span>
      </Positioned>

      <Positioned x={340} y={272} w={1540} h={736} className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.columnHeader}>{t.mods.colName}</span>
          <span className={styles.columnHeader}>{t.mods.colSize}</span>
          <span className={styles.columnHeader}>{t.mods.colModified}</span>
          <span className={styles.columnHeader}>{t.mods.colAction}</span>
        </div>

        <div className={styles.rowsContainer}>
          {loading && <div className={styles.placeholder}>{t.mods.loading}</div>}

          {showMissingFolderPrompt && (
            <div className={styles.placeholder}>
              <span>{t.mods.folderMissingTitle}</span>
              <Button variant="secondary" size="small" onClick={handleCreateFolder}>
                {t.mods.folderMissingAction}
              </Button>
            </div>
          )}

          {!loading && (exists || settings?.autoCreateModsFolder) && mods.length === 0 && (
            <div className={styles.placeholder}>
              <span>{t.mods.empty}</span>
            </div>
          )}

          {!loading &&
            mods.map((mod) => (
              <div key={mod.name} className={styles.row}>
                <div className={styles.nameCell}>
                  <span className={styles.modIcon}>RPF</span>
                  <span className={styles.modName}>{mod.name}</span>
                </div>
                <span className={styles.modMeta}>{formatBytes(mod.sizeBytes, language)}</span>
                <span className={styles.modMeta}>{formatDate(mod.modifiedMs, language)}</span>
                <div className={styles.actionCell}>
                  <Button
                    variant="secondary"
                    size="small"
                    className={styles.rowButton}
                    onClick={() => handleExport(mod.name)}
                  >
                    {t.mods.export}
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    className={styles.rowButtonSmall}
                    onClick={() => handleRemove(mod.name)}
                  >
                    {t.mods.remove}
                  </Button>
                </div>
              </div>
            ))}
        </div>

        <div
          className={styles.dropZone}
          data-dragging={isDragging}
          role="button"
          tabIndex={0}
          onClick={handleImportClick}
        >
          {t.mods.dropHint}
        </div>
      </Positioned>
    </AppShell>
  );
}
