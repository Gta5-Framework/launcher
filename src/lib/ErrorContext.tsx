import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface AppError {
  message: string;
  code: string;
  onRetry?: () => void;
}

interface ErrorContextValue {
  error: AppError | null;
  showError: (error: AppError) => void;
  hideError: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<AppError | null>(null);

  const showError = useCallback((next: AppError) => setError(next), []);
  const hideError = useCallback(() => setError(null), []);

  return (
    <ErrorContext.Provider value={{ error, showError, hideError }}>{children}</ErrorContext.Provider>
  );
}

export function useErrorContext(): ErrorContextValue {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useErrorContext must be used within an ErrorProvider");
  return ctx;
}
