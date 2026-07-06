import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/app");
  return <main className="relative flex min-h-screen items-center justify-center px-5 py-12"><div className="absolute right-4 top-4"><ThemeToggle /></div><section className="w-full max-w-md rounded-3xl border border-violet-100 bg-white p-8 shadow-[0_20px_60px_rgba(109,40,217,0.09)] dark:border-violet-950 dark:bg-[#1d1728] dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"><div className="mb-8"><span className="text-sm font-medium text-violet-600 dark:text-violet-400">Seu espaço privado</span><h1 className="mt-2 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">Linha Afetiva</h1><p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">Um lugar discreto para olhar sua história com calma e carinho.</p></div><LoginForm /></section></main>;
}
