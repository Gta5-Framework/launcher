import { AppShell, Button, NewsList, Positioned, StatusCard, type Route } from "../../components";
import type { Dictionary } from "../../lib/i18n";
import { useTranslation } from "../../lib/i18n";
import { useSettingsContext } from "../../lib/SettingsContext";
import { useJoinServer, type JoinStage } from "../../lib/useJoinServer";
import { useServerStatus } from "../../lib/useServerStatus";
import styles from "./LauncherScreen.module.css";

const JOIN_STATUS_TEXT: Record<JoinStage, (t: Dictionary) => string> = {
  opening: (t) => t.launcher.opening,
  starting: (t) => t.launcher.launchStarting,
  connectingToRos: (t) => t.launcher.launchConnectingRos,
  running: (t) => t.launcher.launchLoading,
  loadingScreen: (t) => t.launcher.launchLoadingScreen,
};

const NEWS_ITEMS = [
  {
    title: "Update 1.0.0",
    date: "01.10.2026",
    text: "Der Launcher ist live: Mods verwalten, Server-Status prüfen und direkt starten.",
  },
  {
    title: "Neue Interiors",
    date: "28.09.2026",
    text: "Apartments und Garagen sind jetzt auf dem Server verfügbar.",
  },
  {
    title: "Wartungsarbeiten",
    date: "25.09.2026",
    text: "Der Server ist am Sonntag von 04:00 bis 05:00 Uhr nicht erreichbar.",
  },
];

export interface LauncherScreenProps {
  onNavigate: (route: Route) => void;
}

export function LauncherScreen({ onNavigate }: LauncherScreenProps) {
  const t = useTranslation();
  const { settings } = useSettingsContext();
  const { status, detail, join } = useJoinServer(settings?.fivemPath ?? null);
  const serverStatus = useServerStatus();

  const statusCardProps =
    serverStatus.kind === "online"
      ? {
          statusLabel: t.status.online,
          dotTone: "green" as const,
          stats: [
            { label: t.status.players, value: `${serverStatus.players} / ${serverStatus.maxPlayers}` },
            { label: t.status.ping, value: `${serverStatus.pingMs} ms` },
          ],
        }
      : serverStatus.kind === "offline"
        ? {
            statusLabel: t.status.offline,
            dotTone: "red" as const,
            stats: [
              { label: t.status.players, value: "–" },
              { label: t.status.ping, value: "–" },
            ],
          }
        : {
            statusLabel: t.status.connecting,
            dotTone: "muted" as const,
            stats: [
              { label: t.status.players, value: "…" },
              { label: t.status.ping, value: "…" },
            ],
          };

  return (
    <AppShell route="launcher" onNavigate={onNavigate}>
      <Positioned x={380} y={640} className={styles.eyebrow}>
        {t.launcher.eyebrow}
      </Positioned>

      <Positioned x={376} y={668} w={1006} h={117} className={styles.heroTitle}>
        {t.launcher.title}
      </Positioned>

      <Positioned x={380} y={760} className={styles.heroSubtitle}>
        {t.launcher.subtitle}
      </Positioned>

      <Positioned x={380} y={880} w={360} h={80}>
        <Button variant="primary" size="hero" onClick={join}>
          {t.launcher.play}
        </Button>
      </Positioned>

      {status && (
        <Positioned x={380} y={972} className={styles.statusGroup}>
          <span className={styles.status} data-kind={status.kind}>
            {JOIN_STATUS_TEXT[status.kind](t)}
          </span>
          {detail && <span className={styles.statusDetail}>{detail}</span>}
        </Positioned>
      )}

      <Positioned x={1400} y={120} w={460} h={200}>
        <StatusCard {...statusCardProps} />
      </Positioned>

      <Positioned x={1400} y={352} w={460}>
        <NewsList eyebrow={t.launcher.news} items={NEWS_ITEMS} />
      </Positioned>
    </AppShell>
  );
}
