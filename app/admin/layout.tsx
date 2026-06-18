import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side admin verification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col fixed h-full">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-black tracking-[0.2em] text-shimmer">KAIVA</h1>
          <p className="text-xs text-muted-foreground mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-gold text-xs font-bold">
                {profile.full_name?.charAt(0)?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{profile.full_name ?? "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 mt-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
