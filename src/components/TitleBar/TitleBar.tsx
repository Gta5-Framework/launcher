import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "../../lib/i18n";
import { Positioned } from "../Positioned";
import logo from "../../assets/icons/logo.svg";
import winClose from "../../assets/icons/win-close.svg";
import styles from "./TitleBar.module.css";

const appWindow = getCurrentWindow();

export function TitleBar() {
  const t = useTranslation();

  return (
    <div className={styles.bar} data-tauri-drag-region>
      <Positioned x={20} y={9} w={30} h={30}>
        <img src={logo} alt="" className={styles.logo} />
      </Positioned>

      <Positioned x={58} y={15}>
        <span className={styles.title}>{t.titleBar.appName}</span>
      </Positioned>

      <button
        type="button"
        className={styles.minimize}
        aria-label={t.titleBar.minimize}
        onClick={() => appWindow.minimize()}
      />

      <button
        type="button"
        className={styles.close}
        aria-label={t.titleBar.close}
        onClick={() => appWindow.close()}
      >
        <img src={winClose} alt="" className={styles.closeIcon} />
      </button>
    </div>
  );
}
