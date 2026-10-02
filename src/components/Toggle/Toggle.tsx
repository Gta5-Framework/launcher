import styles from "./Toggle.module.css";

export interface ToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Toggle({ checked, onChange, disabled, ...rest }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.track}
      data-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      {...rest}
    >
      <span className={styles.knob} />
    </button>
  );
}
