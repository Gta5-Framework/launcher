# GTA5 Framework Launcher

Native desktop launcher for the GTA5 Framework FiveM server. Opens
`cfx.re/join/pggrgm7` through the OS default handler.

Built with Tauri 2, React, TypeScript and Vite. UI is a 1:1 implementation
of the GTA5--Framework Figma design system (dark glass panels, Montserrat
type ramp, blue primary action).

## Project layout

```
src/                      React frontend
  assets/                 fonts + icons exported from Figma
  components/             reusable, self-contained UI components
    <Component>/
      <Component>.tsx
      <Component>.module.css
      index.ts
  lib/                     app constants + hooks (non-UI logic)
  screens/Launcher/         the single app screen, composed from components
  styles/                  design tokens, font-face, global resets

src-tauri/                 Rust shell (window, native OS integration)
  capabilities/            Tauri v2 permission grants
  rust-toolchain.toml      pinned toolchain for reproducible builds
```

## Development

```sh
pnpm install
pnpm tauri dev
```

## Production build

```sh
pnpm tauri build
```

Produces an MSI and an NSIS installer in `src-tauri/target/release/bundle/`.
The WebView2 bootstrapper is embedded in the installer (`embedBootstrapper`),
so the app installs and renders consistently across machines regardless of
what's already on the system.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
