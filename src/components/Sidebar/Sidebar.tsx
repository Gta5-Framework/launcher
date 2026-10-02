import { NavItem } from "../NavItem";
import { SocialLinks } from "../SocialLinks";
import { Positioned } from "../Positioned";
import styles from "./Sidebar.module.css";

export interface SidebarNavEntry {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface SidebarProps {
  navItems: SidebarNavEntry[];
  versionLabel: string;
}

const NAV_START_Y = 72;
const NAV_STEP_Y = 64; // 56px item height + 8px gap
const NAV_X = 20;
const NAV_WIDTH = 260;

export function Sidebar({ navItems, versionLabel }: SidebarProps) {
  return (
    <div className={styles.sidebar}>
      {navItems.map((item, index) => (
        <Positioned key={item.label} x={NAV_X} y={NAV_START_Y + index * NAV_STEP_Y} w={NAV_WIDTH} h={56}>
          <NavItem
            label={item.label}
            active={item.active}
            disabled={item.disabled}
            onClick={item.onClick}
          />
        </Positioned>
      ))}

      <SocialLinks />

      <Positioned x={24} y={982}>
        <span className={styles.version}>{versionLabel}</span>
      </Positioned>
    </div>
  );
}
