import Link from "next/link";
import type { AppRole } from "@/types/domain";

export function RoleGate({ role }: { role?: AppRole }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">
        {role
          ? `${role} rolu icin portal bolumu hazir. Gercek modda Supabase profile kaydi ile dogrulanacak.`
          : "Hesabiniz portal profiline bagli degil. Lutfen mali musavirinizle iletisime gecin."}
      </p>
      <div className="mt-3 flex gap-2">
        <Link href="/client" className="rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white">
          Mukellef portal
        </Link>
        <Link href="/accountant" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
          Musavir paneli
        </Link>
      </div>
    </div>
  );
}
