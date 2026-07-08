import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(); if (!session) redirect("/login");
  return <div className="min-h-screen"><header className="border-b border-violet-100 bg-white/90 backdrop-blur dark:border-violet-950 dark:bg-[#1d1728]/90"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-5 py-4"><nav className="flex items-center gap-4 sm:gap-6"><Link href="/app" className="font-semibold text-violet-950 dark:text-violet-100">Linha Afetiva</Link><Link href="/app/pessoas" className="text-sm font-medium text-violet-700 hover:underline dark:text-violet-300">Pessoas</Link><Link href="/app/tags" className="text-sm font-medium text-violet-700 hover:underline dark:text-violet-300">Tags</Link><Link href="/app/estatisticas" className="text-sm font-medium text-violet-700 hover:underline dark:text-violet-300">Estatísticas</Link></nav><div className="flex items-center gap-2 sm:gap-4"><span className="hidden text-sm text-slate-500 sm:block dark:text-slate-400">{session.email}</span><ThemeToggle /><form action="/api/auth/logout" method="post"><button className="rounded-lg px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/60">Sair</button></form></div></div></header><main className="mx-auto max-w-6xl px-5 py-10">{children}</main></div>;
}
