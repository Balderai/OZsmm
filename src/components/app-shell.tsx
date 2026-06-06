import Link from "next/link";
import { Building2, Lock } from "lucide-react";
import { appConfig } from "@/lib/config";

export function AppShell({
  children,
  eyebrow,
  activeRole,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  activeRole?: "accountant" | "client";
}) {
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-cyan-800 text-white">
              <Building2 aria-hidden="true" size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-cyan-900">{appConfig.firmName}</span>
              <span className="block truncate text-xs text-slate-500">{eyebrow || appConfig.appName}</span>
            </span>
          </Link>
          <nav aria-label="Portal rolleri" className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 p-1">
            <Link
              href="/client"
              className={`rounded px-3 py-2 text-xs font-medium ${
                activeRole === "client" ? "bg-cyan-800 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Mukellef
            </Link>
            <Link
              href="/accountant"
              className={`rounded px-3 py-2 text-xs font-medium ${
                activeRole === "accountant" ? "bg-cyan-800 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Musavir
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-6">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pb-6 text-xs text-slate-500">
        <Lock aria-hidden="true" size={14} />
        Ozel evraklar icin private storage ve RLS hazirligi.
      </footer>
    </div>
  );
}
