import { Dot } from "../Dot";
import styles from "./NavItem.module.css";

export interface NavItemProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function NavItem({ label, active = false, disabled = false, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      className={styles.navItem}
      data-active={active}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? "Bald verfügbar" : undefined}
    >
      <Dot tone={active ? "blue" : "muted"} size={8} />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
