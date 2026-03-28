import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="app-control flex h-11 w-full items-center justify-between px-4 text-sm text-foreground"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
      >
        <span>{value || placeholder || "Seleccione"}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-full overflow-hidden rounded-[1.1rem] border border-[color:var(--border)] bg-[color:var(--surface-panel)] shadow-[var(--shadow-overlay)] backdrop-blur">
          <div className="app-scroll-y max-h-60 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={[
                  "w-full rounded-[0.9rem] px-4 py-2.5 text-left text-sm transition",
                  option === value
                    ? "bg-[var(--primary-soft)] text-foreground"
                    : "text-muted-foreground hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
