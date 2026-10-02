# Tools

Double-clickable `.bat` scripts for common dev tasks. Run from anywhere — each one `cd`s to the project root itself.

- **dev.bat** — menu of launch options: full app, frontend-only, type-check, `cargo check`, dependency install, Rust build cache clean.
- **compile.bat** — compiles the frontend (`tsc` + `vite build`) and the Rust backend (`cargo build --release`) without packaging anything. Use this to confirm everything builds.
- **package.bat** — runs `pnpm tauri build` to produce a distributable installer (NSIS `.exe` and `.msi` on Windows) and opens the output folder (`src-tauri\target\release\bundle`) when done.
