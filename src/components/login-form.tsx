"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogIn, UserRound } from "lucide-react";
import type { AppRole } from "@/types/domain";

export function LoginForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Email ve şifrenizle giriş yapın.");
  const [pending, setPending] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("Giris kontrol ediliyor...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });
      const payload = (await response.json()) as { error?: string; redirect_to?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Giris basarisiz.");
      }

      router.push(payload.redirect_to || (selectedRole === "accountant" ? "/accountant" : "/client"));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Giris basarisiz.");
    } finally {
      setPending(false);
    }
  }

  if (!selectedRole) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setSelectedRole("client")}
          className="flex min-h-16 w-full items-center gap-3 rounded-md border border-slate-200 px-3 text-left hover:border-cyan-700 hover:bg-cyan-50"
        >
          <span className="grid size-10 place-items-center rounded-md bg-cyan-50 text-cyan-800">
            <UserRound aria-hidden="true" size={20} />
          </span>
          <span>
            <span className="block text-sm font-semibold">Mükellef girişi</span>
            <span className="mt-1 block text-xs text-slate-500">Evrak yükleme ve tahakkuk takibi.</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole("accountant")}
          className="flex min-h-16 w-full items-center gap-3 rounded-md border border-slate-200 px-3 text-left hover:border-cyan-700 hover:bg-cyan-50"
        >
          <span className="grid size-10 place-items-center rounded-md bg-cyan-50 text-cyan-800">
            <Building2 aria-hidden="true" size={20} />
          </span>
          <span>
            <span className="block text-sm font-semibold">Müşavir girişi</span>
            <span className="mt-1 block text-xs text-slate-500">Mükellef ve evrak yönetimi.</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submitLogin} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 rounded-md bg-slate-100 px-3 py-2">
        <span className="text-sm font-semibold text-slate-800">
          {selectedRole === "accountant" ? "Müşavir girişi" : "Mükellef girişi"}
        </span>
        <button type="button" onClick={() => setSelectedRole(null)} className="text-xs font-semibold text-cyan-800">
          Değiştir
        </button>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-600">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          autoComplete="email"
          className="min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-700"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-600">Sifre</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-cyan-700"
        />
      </label>
      <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>
      <button
        type="submit"
        disabled={pending || !selectedRole}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-800 px-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        <LogIn aria-hidden="true" size={17} />
        {pending ? "Giriş yapılıyor" : "Giriş yap"}
      </button>
    </form>
  );
}
