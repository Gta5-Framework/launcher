import { createContext, useContext, type ReactNode } from "react";
import { translations, type Dictionary, type LanguageCode } from "./translations";

interface LanguageContextValue {
  language: LanguageCode;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export interface LanguageProviderProps {
  language: LanguageCode;
  children: ReactNode;
}

export function LanguageProvider({ language, children }: LanguageProviderProps) {
  const value: LanguageContextValue = { language, t: translations[language] };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): Dictionary {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within a LanguageProvider");
  return ctx.t;
}

export function useLanguage(): LanguageCode {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx.language;
}
