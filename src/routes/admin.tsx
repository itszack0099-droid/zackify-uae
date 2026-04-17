import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { LayoutDashboard, ShoppingBag, Package, Tag, LogOut, Menu, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) checkAdmin(s.user.id);
      else setIsAdmin(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) checkAdmin(s.user.id);
      else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  // Loading
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  // Show login route content directly without layout
  if (!session || !isAdmin) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 glass-strong border-r border-gold/20 transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-gold/15 flex items-center justify-between">
          <Link to="/" className="font-display font-bold">
            <span className="text-gradient-gold">Zackify</span>
            <span className="text-xs text-muted-foreground ml-1">admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {[
            { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
            { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
            { to: "/admin/products", label: "Products", icon: Package },
            { to: "/admin/categories", label: "Categories", icon: Tag },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "bg-gold/15 text-gold border-gold/40" }}
              activeOptions={{ exact: l.exact }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border border-transparent hover:bg-gold/5 hover:text-gold transition-colors"
              onClick={() => setOpen(false)}
            >
              <l.icon className="w-4 h-4" /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gold/15">
          <div className="text-xs text-muted-foreground mb-2 truncate px-1">{session.user.email}</div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-gold/20 hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden glass-strong border-b border-gold/15 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setOpen(true)} className="p-1.5"><Menu className="w-5 h-5" /></button>
          <div className="font-display font-bold text-gradient-gold">Zackify Admin</div>
          <div className="w-7" />
        </header>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
