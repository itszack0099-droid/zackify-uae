import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Heart,
  LogOut,
  Package,
  MapPin,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: AccountPage,
});

const SignupSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  display_name: z.string().trim().min(2, "Name is too short").max(80),
});
const SigninSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password required").max(72),
});

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const hasChildRoute = location.pathname !== "/account";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && redirect) {
      navigate({ to: redirect, replace: true });
    }
  }, [loading, user, redirect, navigate]);

  if (hasChildRoute) return <Outlet />;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="h-64 rounded-2xl animate-shimmer-bg" />
        </div>
      </Layout>
    );
  }

  // Already logged in → mini account dashboard
  if (user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-16">
          <div className="glass rounded-3xl p-8 gold-border text-center animate-fade-in-up">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-gold flex items-center justify-center text-deep-green font-display font-bold text-2xl shadow-gold mb-4">
              {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
            <h1 className="font-display text-2xl mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">{user.email}</p>

            <div className="space-y-2">
              <Link
                to="/account/profile"
                search={{ redirect: undefined }}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform"
              >
                <Settings className="w-4 h-4" /> My Profile
              </Link>
              <Link
                to="/account/orders"
                search={{ redirect: undefined }}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full glass border border-gold/30 hover:border-gold transition-colors"
              >
                <Package className="w-4 h-4" /> My Orders
              </Link>
              <Link
                to="/account/addresses"
                search={{ redirect: undefined }}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full glass border border-gold/30 hover:border-gold transition-colors"
              >
                <MapPin className="w-4 h-4" /> Address Book
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full glass border border-gold/30 hover:border-gold transition-colors"
              >
                <Heart className="w-4 h-4" /> My Wishlist
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  toast.success("Signed out");
                  navigate({ to: "/" });
                }}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full glass border border-gold/20 hover:border-gold transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      const parsed = SignupSchema.safeParse({ email, password, display_name: displayName });
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
      setBusy(true);
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
          data: { display_name: parsed.data.display_name },
        },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Account created! Check your email to confirm.");
      setMode("signin");
    } else {
      const parsed = SigninSchema.safeParse({ email, password });
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back!");
      navigate({ to: redirect ?? "/", replace: true });
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="glass rounded-3xl p-8 gold-border shadow-luxury animate-fade-in-up">
          <div className="text-center mb-7">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-gold flex items-center justify-center font-display font-bold text-deep-green text-2xl shadow-gold mb-4">
              Z
            </div>
            <h1 className="font-display text-2xl">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "signin"
                ? "Access your wishlist & order history"
                : "Save items, track orders, get exclusive offers"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field icon={UserIcon} label="Full Name">
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inp}
                  placeholder="Ahmed Al Maktoum"
                />
              </Field>
            )}
            <Field icon={Mail} label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inp}
                placeholder="you@example.com"
              />
            </Field>
            <Field icon={Lock} label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inp}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <button
              disabled={busy}
              className="w-full px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gold/15" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">or</span></div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: `${window.location.origin}/account${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
              });
              if (result.redirected) return;
              setBusy(false);
              if (result.error) {
                toast.error(result.error.message || "Apple sign-in failed");
                return;
              }
              toast.success("Welcome!");
              navigate({ to: redirect ?? "/", replace: true });
            }}
            className="w-full px-6 py-3 rounded-full bg-black text-white font-semibold flex items-center justify-center gap-2 hover:bg-black/90 transition-colors disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.43 2.22-1.21 3.04-.84.88-2.2 1.55-3.34 1.46-.13-1.1.4-2.27 1.17-3.06.84-.86 2.27-1.5 3.38-1.44zM20.5 17.36c-.55 1.27-.81 1.83-1.52 2.95-.99 1.55-2.39 3.49-4.13 3.5-1.55.02-1.95-1-4.05-.99-2.1.01-2.54 1.01-4.09.99-1.74-.01-3.07-1.76-4.06-3.32C-.13 16.4-.43 11.4 1.49 8.79c1.36-1.85 3.51-2.94 5.53-2.94 2.06 0 3.36 1.12 5.06 1.12 1.65 0 2.66-1.13 5.04-1.13 1.81 0 3.73.99 5.09 2.69-4.47 2.45-3.74 8.84-1.71 8.83z"/>
            </svg>
            Sign in with Apple
          </button>

          <button
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            className="block w-full text-center text-xs text-muted-foreground mt-5 hover:text-gold"
          >
            {mode === "signin"
              ? "New to Zackify? Create an account →"
              : "Already have an account? Sign in →"}
          </button>
        </div>
      </div>
    </Layout>
  );
}

const inp =
  "w-full bg-card border border-gold/20 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";
function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        {children}
      </div>
    </label>
  );
}
