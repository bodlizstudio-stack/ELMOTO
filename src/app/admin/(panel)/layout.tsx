import Link from "next/link";
import { Logo } from "@/components/logo";
import { logout } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";

const links = [
  ["/admin", "Pregled"],
  ["/admin/motorji", "Motorji"],
  ["/admin/najem", "Najem"],
  ["/admin/povprasevanja", "Povpraševanja"],
  ["/admin/vsebina", "Vsebina"],
  ["/admin/uvoz", "Uvoz"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh bg-ink text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" aria-label="EL-MOTO administracija" className="inline-flex items-center">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="max-w-40 truncate text-muted">{user.email}</span>
            <form action={logout}>
              <button className="underline">Odjava</button>
            </form>
            <Link className="underline" href="/">
              Na stran
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-3" aria-label="Administracija">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 border border-white/15 px-3 py-2 text-sm">
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
