import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { appConfig } from "@/lib/config";

export default function LoginPage() {
  return (
    <AppShell eyebrow="Giris">
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{appConfig.appName}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Önce giriş türünü seçin, ardından hesabınızla portala giriş yapın.
          </p>
        </div>
        <LoginForm />
      </div>
    </AppShell>
  );
}
