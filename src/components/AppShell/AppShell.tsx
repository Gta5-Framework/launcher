import type { ReactNode } from "react";
import heroBackground from "../../assets/images/hero-background.png";
import { APP_VERSION } from "../../lib/constants";
import { useTranslation } from "../../lib/i18n";
import { ErrorDialog } from "../ErrorDialog";
import { Positioned } from "../Positioned";
import { ScaleStage } from "../ScaleStage";
import { Sidebar, type SidebarNavEntry } from "../Sidebar";
import { TitleBar } from "../TitleBar";
import styles from "./AppShell.module.css";

export type Route = "launcher" | "mods" | "settings";

export interface AppShellProps {
  route: Route;
  onNavigate: (route: Route) => void;
  dimmed?: boolean;
  children?: ReactNode;
}

export function AppShell({ route, onNavigate, dimmed = false, children }: AppShellProps) {
  const t = useTranslation();

  const navRoutes: Array<{ label: string; route: Route }> = [
    { label: t.nav.home, route: "launcher" },
    { label: t.nav.mods, route: "mods" },
    { label: t.nav.settings, route: "settings" },
  ];
  const navItems: SidebarNavEntry[] = navRoutes.map(({ label, route: itemRoute }) => ({
    label,
    active: itemRoute === route,
    onClick: () => onNavigate(itemRoute),
  }));

  return (
    <ScaleStage>
      <img src={heroBackground} alt="" className={styles.background} />
      <div className={styles.overlay} />
      {dimmed && <div className={styles.pageOverlay} />}
      <div className={styles.sidebarDivider} />

      <Positioned x={0} y={0} w={1920} h={48}>
        <TitleBar />
      </Positioned>

      <Positioned x={0} y={48} w={300} h={1032}>
        <Sidebar navItems={navItems} versionLabel={`Version ${APP_VERSION}`} />
      </Positioned>

      {children}

      <ErrorDialog />
    </ScaleStage>
  );
}
