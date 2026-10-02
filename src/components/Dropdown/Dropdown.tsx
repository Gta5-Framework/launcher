import { useEffect, useRef, useState } from "react";
import chevronDown from "../../assets/icons/chevron-down.svg";
import check from "../../assets/icons/check.svg";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange?: (value: string) => void;
  "aria-label"?: string;
}

export function Dropdown({ value, options, onChange, ...rest }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        data-open={open}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        {...rest}
      >
        <span className={styles.value}>{selected?.label ?? ""}</span>
        <img src={chevronDown} alt="" className={styles.chevron} data-open={open} />
      </button>

      {open && (
        <ul className={styles.menu} role="listbox">
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              data-selected={option.value === value}
              className={styles.option}
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <img src={check} alt="" className={styles.check} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
