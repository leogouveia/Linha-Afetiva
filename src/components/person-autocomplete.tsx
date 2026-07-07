"use client";
import { useEffect, useRef, useState } from "react";

export type PersonOption = { id: number; name: string };

const inputClass =
  "w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-violet-900 dark:bg-violet-950/30 dark:focus:border-violet-500 dark:focus:ring-violet-950";

export function PersonAutocomplete({
  people,
  value,
  onChange,
  placeholder = "Pessoa",
  className,
}: {
  people: PersonOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = value.trim().toLowerCase();
  const matches = people.filter((person) => person.name.toLowerCase().includes(query));

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative min-w-[10rem] flex-1 ${className ?? ""}`}>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && matches.length > 0}
        className={inputClass}
      />
      {open && matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-violet-100 bg-white py-1 shadow-lg dark:border-violet-900 dark:bg-[#1d1728]"
        >
          {matches.map((person) => (
            <li key={person.id} role="option" aria-selected={person.name === value}>
              <button
                type="button"
                onClick={() => select(person.name)}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-violet-950/60"
              >
                {person.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
