import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type WishlistContextType = {
  ids: Set<string>;
  loading: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string, productName?: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
    setIds(new Set((data ?? []).map((r) => r.product_id as string)));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (productId: string, productName?: string) => {
    if (!user) {
      toast.error("Please sign in to save items", {
        description: "Create a free account to build your wishlist",
        action: { label: "Sign in", onClick: () => { window.location.href = "/account?redirect=" + encodeURIComponent(window.location.pathname); } },
      });
      return;
    }
    if (ids.has(productId)) {
      const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
      if (error) return toast.error("Could not remove from wishlist");
      setIds((s) => { const n = new Set(s); n.delete(productId); return n; });
      toast.success("Removed from wishlist");
    } else {
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      if (error) return toast.error("Could not save to wishlist");
      setIds((s) => new Set(s).add(productId));
      toast.success("Saved to wishlist", { description: productName });
    }
  };

  return (
    <WishlistContext.Provider value={{ ids, loading, has: (id) => ids.has(id), toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be inside WishlistProvider");
  return ctx;
}
