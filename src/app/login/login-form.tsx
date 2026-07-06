"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const data = await response.json().catch(() => ({})); setLoading(false);
    if (!response.ok) { setError(data.error ?? "Não foi possível entrar."); return; }
    router.replace("/app"); router.refresh();
  }
  const inputClass = "mt-2 w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-violet-900 dark:bg-violet-950/30 dark:focus:border-violet-500 dark:focus:ring-violet-950";
  return <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email<input name="email" type="email" autoComplete="email" required className={inputClass} /></label><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha<input name="password" type="password" autoComplete="current-password" required className={inputClass} /></label>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-violet-700 px-4 py-3 font-medium text-white transition hover:bg-violet-800 disabled:opacity-60">{loading ? "Entrando…" : "Entrar"}</button></form>;
}
