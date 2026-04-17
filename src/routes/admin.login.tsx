import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        toast.error("Your account is not an admin. Contact the store owner.");
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. Ask the store owner to grant you admin access.");
      setMode("signin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-radial-gold)" }} />
      <div className="w-full max-w-md glass rounded-3xl p-8 gold-border animate-fade-in-up shadow-luxury">
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-gold flex items-center justify-center font-display font-bold text-deep-green text-2xl shadow-gold mb-4">Z</div>
          <h1 className="font-display text-2xl">Zackify Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">{mode === "signin" ? "Sign in to manage your store" : "Create an admin account"}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border border-gold/20 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Password</span>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPw ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-gold/20 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          <button disabled={loading} className="w-full px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-60">
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="block w-full text-center text-xs text-muted-foreground mt-5 hover:text-gold"
        >
          {mode === "signin" ? "Need an admin account? Create one →" : "Already have an account? Sign in →"}
        </button>
      </div>
    </div>
  );
}
