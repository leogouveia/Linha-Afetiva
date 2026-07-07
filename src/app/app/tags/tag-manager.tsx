"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { tagColors, tagScopeLabels, tagScopes, type TagScope } from "@/lib/validation/tag";

export type TagRow = { id: number; name: string; label: string | null; scope: string; color: string; uses: number };

const inputClass =
  "w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-violet-900 dark:bg-violet-950/30 dark:focus:border-violet-500 dark:focus:ring-violet-950";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

const scopeBadgeClass: Record<TagScope, string> = {
  relationship: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  event: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  both: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
};

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tagColors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Cor ${color}`}
          aria-pressed={value === color}
          className={`size-8 rounded-full transition ${value === color ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-[#17121f]" : "hover:scale-110"}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function ScopeSelect({ value, onChange }: { value: TagScope; onChange: (scope: TagScope) => void }) {
  return (
    <label className={labelClass}>
      Escopo
      <select value={value} onChange={(event) => onChange(event.target.value as TagScope)} className={`mt-2 ${inputClass}`}>
        {tagScopes.map((scope) => (
          <option key={scope} value={scope}>
            {tagScopeLabels[scope]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TagManager({ tags }: { tags: TagRow[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newScope, setNewScope] = useState<TagScope>("both");
  const [newColor, setNewColor] = useState<string>(tagColors[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editScope, setEditScope] = useState<TagScope>("both");
  const [editColor, setEditColor] = useState("");

  async function request(path: string, init: RequestInit) {
    setError("");
    setBusy(true);
    const response = await fetch(path, init);
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível concluir a ação.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, label: newLabel, scope: newScope, color: newColor }),
    });
    if (ok) {
      setNewName("");
      setNewLabel("");
      setNewScope("both");
      setNewColor(tagColors[0]);
    }
  }

  function startEdit(tag: TagRow) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditLabel(tag.label ?? "");
    setEditScope(tag.scope as TagScope);
    setEditColor(tag.color);
    setError("");
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId === null) return;
    const ok = await request(`/api/tags/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, label: editLabel, scope: editScope, color: editColor }),
    });
    if (ok) setEditingId(null);
  }

  async function remove(tag: TagRow) {
    const warning = tag.uses > 0 ? ` Ela está associada a ${tag.uses} ${tag.uses === 1 ? "registro" : "registros"}.` : "";
    if (!window.confirm(`Excluir a tag "${tag.name}"?${warning}`)) return;
    await request(`/api/tags/${tag.id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="space-y-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
        <label className={labelClass}>
          Nova tag
          <input value={newName} onChange={(event) => setNewName(event.target.value)} required maxLength={50} placeholder="Nome da tag" className={`mt-2 ${inputClass}`} />
        </label>
        <label className={labelClass}>
          Nome de exibição
          <input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} maxLength={80} placeholder="Opcional — usa o nome acima se vazio" className={`mt-2 ${inputClass}`} />
        </label>
        <ScopeSelect value={newScope} onChange={setNewScope} />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <button disabled={busy} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-800 disabled:opacity-60">
          Adicionar
        </button>
      </form>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
      {tags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-violet-200 p-10 text-center text-slate-500 dark:border-violet-900 dark:text-slate-400">
          Nenhuma tag criada ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {tags.map((tag) => (
            <li key={tag.id} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
              {editingId === tag.id ? (
                <form onSubmit={saveEdit} className="space-y-4">
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={50} className={inputClass} />
                  <input value={editLabel} onChange={(event) => setEditLabel(event.target.value)} maxLength={80} placeholder="Nome de exibição (opcional)" className={inputClass} />
                  <ScopeSelect value={editScope} onChange={setEditScope} />
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <div className="flex gap-3">
                    <button disabled={busy} className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-800 disabled:opacity-60">
                      Salvar
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-violet-50 dark:text-slate-400 dark:hover:bg-violet-950/60">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="size-4 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="font-medium text-violet-950 dark:text-violet-100">{tag.label || tag.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${scopeBadgeClass[tag.scope as TagScope] ?? scopeBadgeClass.both}`}>
                      {tagScopeLabels[tag.scope as TagScope] ?? tag.scope}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {tag.uses} {tag.uses === 1 ? "registro" : "registros"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(tag)} className="rounded-lg px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/60">
                      Editar
                    </button>
                    <button type="button" onClick={() => remove(tag)} disabled={busy} className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-950/40">
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
