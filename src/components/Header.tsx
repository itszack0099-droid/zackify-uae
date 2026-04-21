import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X, Heart, User, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useI18n, type StringKey } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

const NAV: { to: string; key: StringKey; params?: Record<string, string> }[] = [
  { to: "/", key: "nav.home" },
  { to: "/category/$slug", key: "nav.car", params: { slug: "car-accessories" } },
  { to: "/category/$slug", key: "nav.gym", params: { slug: "gym-fitness" } },
  { to: "/category/$slug", key: "nav.phone", params: { slug: "phone-accessories" } },
  { to: "/hot-deals", key: "nav.deals" },
  { to: "/track-order", key: "nav.track" },
  { to: "/contact", key: "nav.contact" },
];

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-strong shadow-luxury" : "bg-transparent"
      }`}
    >
      {/* Top bar */}
      <div className="hidden md:flex items-center justify-between px-6 py-1.5 text-xs text-muted-foreground border-b border-gold/10">
        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-gold" /> {t("header.tagline")}</span>
        <span className="flex items-center gap-1.5 text-gold/80">{t("home.cod")} · {t("home.fastDelivery")}</span>
      </div>

      <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center font-display font-bold text-deep-green text-xl shadow-gold group-hover:scale-110 transition-transform">
            Z
          </div>
          <div className="font-display font-bold text-xl md:text-2xl">
            <span className="text-gradient-gold">Zackify</span>
            <span className="text-foreground/80">.uae</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={`${item.to}-${item.params?.slug ?? ""}`}
              to={item.to as never}
              params={item.params as never}
              className="relative px-3 py-2 text-sm font-medium text-foreground/80 hover:text-gold transition-colors"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Actions — bigger tap targets */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <LanguageToggle />
          <button
            onClick={() => setShowSearch((s) => !s)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full hover:bg-gold/10 hover:text-gold transition-colors flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-6 h-6" />
          </button>
          <Link
            to="/wishlist"
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full hover:bg-gold/10 hover:text-gold transition-colors flex items-center justify-center"
            aria-label={t("common.wishlist")}
          >
            <Heart className="w-6 h-6" />
            {user && wishlistIds.size > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-gold text-deep-green text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
                {wishlistIds.size}
              </span>
            )}
          </Link>
          <Link
            to="/account"
            search={{}}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full hover:bg-gold/10 hover:text-gold transition-colors flex items-center justify-center"
            aria-label={t("common.account")}
          >
            <User className="w-6 h-6" />
          </Link>
          <Link
            to="/cart"
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full hover:bg-gold/10 hover:text-gold transition-colors flex items-center justify-center"
            aria-label={t("common.cart")}
          >
            <ShoppingBag className="w-6 h-6" />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-gradient-gold text-deep-green text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden w-11 h-11 rounded-full hover:bg-gold/10 hover:text-gold transition-colors flex items-center justify-center"
            aria-label={t("common.menu")}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="border-t border-gold/15 px-4 md:px-8 py-3 animate-fade-in">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (search.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(search.trim())}`;
              }
            }}
            className="max-w-2xl mx-auto relative"
          >
            <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("header.search")}
              className="w-full bg-card/50 border border-gold/20 rounded-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
            />
          </form>
        </div>
      )}

      {/* Mobile nav */}
      {open && (
        <div className="lg:hidden glass-strong border-t border-gold/15 animate-fade-in">
          <nav className="flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={`m-${item.to}-${item.params?.slug ?? ""}`}
                to={item.to as never}
                params={item.params as never}
                className="px-6 py-3 text-sm font-medium border-l-2 rtl:border-l-0 rtl:border-r-2 border-transparent hover:border-gold hover:bg-gold/5 hover:text-gold transition-all"
                activeProps={{ className: "text-gold border-gold bg-gold/5" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
