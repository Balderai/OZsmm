import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/role-gate";
import { appConfig } from "@/lib/config";

export default function LoginPage() {
  return (
    <AppShell eyebrow="Giris">
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{appConfig.appName}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Mock mode&apos;da rol secerek akisi test edebilirsiniz. Supabase modunda email/sifre veya magic link buraya baglanacak.
          </p>
        </div>
        <RoleGate />
      </div>
    </AppShell>
  );
}
