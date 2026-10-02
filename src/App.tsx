import { useState } from "react";
import type { Route } from "./components";
import { ErrorProvider } from "./lib/ErrorContext";
import { LanguageProvider } from "./lib/i18n";
import { SettingsProvider, useSettingsContext } from "./lib/SettingsContext";
import { LauncherScreen } from "./screens/Launcher";
import { ModsScreen } from "./screens/Mods";
import { SettingsScreen } from "./screens/Settings";

function AppContent() {
  const [route, setRoute] = useState<Route>("launcher");
  const { settings } = useSettingsContext();
  const language = settings?.language ?? "de";

  return (
    <LanguageProvider language={language}>
      <ErrorProvider>
        {route === "mods" && <ModsScreen onNavigate={setRoute} />}
        {route === "settings" && <SettingsScreen onNavigate={setRoute} />}
        {route === "launcher" && <LauncherScreen onNavigate={setRoute} />}
      </ErrorProvider>
    </LanguageProvider>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
