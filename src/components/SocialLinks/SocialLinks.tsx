import { openUrl } from "@tauri-apps/plugin-opener";
import github from "../../assets/icons/github.svg";
import tiktok from "../../assets/icons/tiktok.svg";
import discord from "../../assets/icons/discord.svg";
import { DISCORD_URL, GITHUB_URL } from "../../lib/constants";
import { Positioned } from "../Positioned";
import styles from "./SocialLinks.module.css";

// Icon positions/sizes are derived 1:1 from the Figma frame's inset
// percentages (relative to the 1920x1080 canvas), converted to the
// Sidebar's local coordinate space (sidebar starts at canvas y=48).
const ICONS = [
  { src: discord, alt: "Discord", x: 177, y: 979, w: 28, h: 21.34, href: DISCORD_URL },
  { src: tiktok, alt: "TikTok", x: 219, y: 979, w: 19.11, h: 22, href: null },
  { src: github, alt: "GitHub", x: 252, y: 978, w: 24, h: 24, href: GITHUB_URL },
];

export function SocialLinks() {
  return (
    <>
      {ICONS.map((icon) =>
        icon.href ? (
          <Positioned key={icon.alt} x={icon.x} y={icon.y} w={icon.w} h={icon.h}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={icon.alt}
              onClick={() => openUrl(icon.href)}
            >
              <img src={icon.src} alt="" className={styles.icon} />
            </button>
          </Positioned>
        ) : (
          <Positioned key={icon.alt} x={icon.x} y={icon.y} w={icon.w} h={icon.h}>
            <img src={icon.src} alt={icon.alt} className={styles.icon} />
          </Positioned>
        ),
      )}
    </>
  );
}
