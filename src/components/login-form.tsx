"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Email ve sifrenizle giris yapin.");
  const [pending, setPending] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("Giris kontrol ediliyor...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string; redirect_to?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Giris basarisiz.");
      }

      router.push(payload.redirect_to || "/client");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Giris basarisiz.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submitLogin} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-800 px-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        <LogIn aria-hidden="true" size={17} />
        {pending ? "Giris yapiliyor" : "Giris yap"}
      </button>
    </form>
  );
}
