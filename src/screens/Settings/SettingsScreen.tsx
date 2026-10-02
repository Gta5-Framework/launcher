import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ask, message, open } from "@tauri-apps/plugin-dialog";
import { AppShell, Button, Dropdown, Positioned, Toggle, type Route } from "../../components";
import { APP_VERSION } from "../../lib/constants";
import { useTranslation } from "../../lib/i18n";
import type { LanguageCode } from "../../lib/i18n";
import { getModsPath } from "../../lib/useSettings";
import { useSettingsContext } from "../../lib/SettingsContext";
import styles from "./SettingsScreen.module.css";

interface SettingsRowProps {
  title: string;
  description: string;
  children: ReactNode;
  divider?: boolean;
}

function SettingsRow({ title, description, children, divider = true }: SettingsRowProps) {
  return (
    <div className={styles.row} data-divider={divider}>
      <div className={styles.rowText}>
        <span className={styles.rowTitle}>{title}</span>
        <span className={styles.rowDescription}>{description}</span>
      </div>
      <div className={styles.rowControl}>{children}</div>
    </div>
  );
}

export interface SettingsScreenProps {
  onNavigate: (route: Route) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const t = useTranslation();
  const { settings, update } = useSettingsContext();

  if (!settings) {
    return <AppShell route="settings" onNavigate={onNavigate} dimmed />;
  }

  const modsPath = getModsPath(settings.fivemPath);

  const languageOptions: { value: LanguageCode; label: string }[] = [
    { value: "de", label: "Deutsch" },
    { value: "en", label: "English" },
  ];

  const handleChangeFivemPath = async () => {
    const selected = await open({ directory: true, defaultPath: settings.fivemPath });
    if (!selected || Array.isArray(selected)) return;
    update({ fivemPath: selected });
  };

  const handleOpenModsFolder = async () => {
    await invoke("ensure_mods_folder", { modsPath });
    await invoke("open_in_explorer", { path: modsPath });
  };

  const handleClearCache = async () => {
    const confirmed = await ask(t.settings.confirmClearCacheMessage, {
      title: t.settings.confirmClearCacheTitle,
      kind: "warning",
    });
    if (!confirmed) return;
    try {
      await invoke("clear_fivem_cache", { fivemPath: settings.fivemPath });
      await message(t.settings.cacheClearedMessage, { title: t.settings.cacheClearedTitle });
    } catch (err) {
      await message(String(err), { title: t.settings.confirmClearCacheTitle, kind: "error" });
    }
  };

  const handleCheckUpdates = async () => {
    await message(t.settings.upToDateMessage, { title: t.settings.upToDateTitle });
  };

  return (
    <AppShell route="settings" onNavigate={onNavigate} dimmed>
      <Positioned x={340} y={92} className={styles.title}>
        {t.settings.title}
      </Positioned>
      <Positioned x={340} y={160} className={styles.subtitle}>
        {t.settings.subtitle}
      </Positioned>

      <Positioned x={340} y={210} w={750} h={770} className={styles.card}>
        <span className={styles.eyebrow}>{t.settings.appSection}</span>

        <div className={styles.rows}>
          <SettingsRow title={t.settings.language} description={t.settings.languageDesc}>
            <Dropdown
              value={settings.language}
              options={languageOptions}
              onChange={(value) => update({ language: value as LanguageCode })}
            />
          </SettingsRow>
          <SettingsRow title={t.settings.startWithWindows} description={t.settings.startWithWindowsDesc}>
            <Toggle
              checked={settings.startWithWindows}
              onChange={(checked) => update({ startWithWindows: checked })}
            />
          </SettingsRow>
          <SettingsRow title={t.settings.minimizeOnLaunch} description={t.settings.minimizeOnLaunchDesc}>
            <Toggle
              checked={settings.minimizeOnLaunch}
              onChange={(checked) => update({ minimizeOnLaunch: checked })}
            />
          </SettingsRow>
          <SettingsRow title={t.settings.autoUpdate} description={t.settings.autoUpdateDesc}>
            <Toggle checked={settings.autoUpdate} onChange={(checked) => update({ autoUpdate: checked })} />
          </SettingsRow>
          <SettingsRow
            title={t.settings.notifications}
            description={t.settings.notificationsDesc}
            divider={false}
          >
            <Toggle
              checked={settings.notifications}
              onChange={(checked) => update({ notifications: checked })}
            />
          </SettingsRow>
        </div>

        <div className={styles.footer}>
          <span className={styles.version}>
            {t.settings.version} {APP_VERSION}
          </span>
          <Button
            variant="secondary"
            size="small"
            className={styles.footerButton}
            onClick={handleCheckUpdates}
          >
            {t.settings.checkUpdates}
          </Button>
        </div>
      </Positioned>

      <Positioned x={1130} y={210} w={750} h={770} className={styles.card}>
        <span className={styles.eyebrow}>{t.settings.fivemSection}</span>

        <div className={styles.rows}>
          <SettingsRow title={t.settings.fivemPath} description={settings.fivemPath}>
            <Button
              variant="secondary"
              size="small"
              className={styles.rowButton}
              onClick={handleChangeFivemPath}
            >
              {t.settings.change}
            </Button>
          </SettingsRow>
          <SettingsRow title={t.settings.modsFolder} description={modsPath}>
            <Button
              variant="secondary"
              size="small"
              className={styles.rowButton}
              onClick={handleOpenModsFolder}
            >
              {t.settings.open}
            </Button>
          </SettingsRow>
          <SettingsRow
            title={t.settings.autoCreateModsFolder}
            description={t.settings.autoCreateModsFolderDesc}
          >
            <Toggle
              checked={settings.autoCreateModsFolder}
              onChange={(checked) => update({ autoCreateModsFolder: checked })}
            />
          </SettingsRow>
          <SettingsRow title={t.settings.checkModsOnStart} description={t.settings.checkModsOnStartDesc}>
            <Toggle
              checked={settings.checkModsOnStart}
              onChange={(checked) => update({ checkModsOnStart: checked })}
            />
          </SettingsRow>
          <SettingsRow
            title={t.settings.backupBeforeImport}
            description={t.settings.backupBeforeImportDesc}
          >
            <Toggle
              checked={settings.backupBeforeImport}
              onChange={(checked) => update({ backupBeforeImport: checked })}
            />
          </SettingsRow>
          <SettingsRow title={t.settings.fivemCache} description={t.settings.fivemCacheDesc} divider={false}>
            <Button
              variant="danger"
              size="small"
              className={styles.rowButton}
              onClick={handleClearCache}
            >
              {t.settings.clearCache}
            </Button>
          </SettingsRow>
        </div>
      </Positioned>
    </AppShell>
  );
}
