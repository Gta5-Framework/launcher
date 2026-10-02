import { useTranslation } from "../../lib/i18n";
import { useErrorContext } from "../../lib/ErrorContext";
import { Button } from "../Button";
import { Positioned } from "../Positioned";
import styles from "./ErrorDialog.module.css";

export function ErrorDialog() {
  const t = useTranslation();
  const { error, hideError } = useErrorContext();

  if (!error) return null;

  const handleRetry = () => {
    hideError();
    error.onRetry?.();
  };

  return (
    <>
      <div className={styles.scrim} />
      <Positioned x={640} y={330} w={640} h={406} className={styles.box}>
        <div className={styles.iconCircle}>
          <div className={styles.iconBar} />
          <div className={styles.iconDot} />
        </div>

        <p className={styles.title}>{t.errorDialog.title}</p>
        <p className={styles.message}>{error.message}</p>

        <div className={styles.codeChip}>
          {t.errorDialog.codeLabel}: {error.code}
        </div>

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleRetry}>
            {t.errorDialog.retry}
          </Button>
          <Button variant="secondary" onClick={hideError}>
            {t.errorDialog.close}
          </Button>
        </div>
      </Positioned>
    </>
  );
}
