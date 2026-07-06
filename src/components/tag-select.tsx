"use client";
import { useEffect, useRef, useState } from "react";

export type TagOption = { id: number; name: string; color: string };

// Combobox with removable chips + filterable dropdown, replacing a flat list of
// tag checkboxes now that the tag palette has grown too large to scan at a glance.
export function TagMultiSelect({
  options,
  value,
  onChange,
  name,
  placeholder = "Tags",
}: {
  options: TagOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  name?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.filter((tag) => value.includes(tag.id));
  const available = options.filter((tag) => !value.includes(tag.id) && tag.name.toLowerCase().includes(query.toLowerCase()));

  function add(id: number) {
    onChange([...value, id]);
    setQuery("");
  }

  function remove(id: number) {
    onChange(value.filter((tagId) => tagId !== id));
  }

  return (
    <div ref={containerRef} className="relative">
      {name && value.map((id) => <input key={id} type="hidden" name={name} value={id} />)}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100 dark:border-violet-900 dark:bg-violet-950/30 dark:focus-within:border-violet-500 dark:focus-within:ring-violet-950">
        {selected.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-sm text-violet-900 dark:bg-violet-950/60 dark:text-violet-100"
          >
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <button
              type="button"
              onClick={() => remove(tag.id)}
              aria-label={`Remover ${tag.name}`}
              className="text-violet-400 transition hover:text-violet-700 dark:hover:text-violet-200"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="min-w-[6rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-slate-400"
        />
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            aria-label="Limpar tags"
            className="ml-auto text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
          >
            ×
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Fechar lista de tags" : "Abrir lista de tags"}
          className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
        >
          {open ? "▲" : "▼"}
        </button>
      </div>
      {open && available.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-violet-100 bg-white py-1 shadow-lg dark:border-violet-900 dark:bg-[#1d1728]">
          {available.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => add(tag.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-violet-950/60"
              >
                <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
