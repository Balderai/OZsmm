"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
    >
      <LogOut aria-hidden="true" size={14} />
      Cikis
    </button>
  );
}
