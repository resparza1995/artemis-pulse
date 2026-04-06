import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../i18n/react";
import { Input } from "./input";

type FilterableComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function FilterableCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  autoFocus,
}: FilterableComboboxProps) {
  const { messages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) {
      return options.slice(0, 100);
    }

    return options
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 100);
  }, [options, value]);

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
      <Input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="pr-10"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      {isOpen ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-full overflow-hidden rounded-[1.1rem] border border-[color:var(--border)] bg-[color:var(--surface-panel)] shadow-[var(--shadow-overlay)] backdrop-blur">
          <div className="app-scroll-y max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item);
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full rounded-[0.9rem] px-3 py-2.5 text-left text-sm transition",
                    item === value
                      ? "bg-[var(--primary-soft)] text-foreground"
                      : "text-muted-foreground hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground",
                  ].join(" ")}
                >
                  {item}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {messages.common.noMatches}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
