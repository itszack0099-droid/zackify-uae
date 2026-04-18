import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X, Phone, Heart, User, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useI18n, type StringKey } from "@/lib/i18n";
import { EmailSignupButton } from "@/components/EmailSignupButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { WHATSAPP_URL } from "@/lib/contact";

const NAV: { to: string; key: StringKey }[] = [
  { to: "/", key: "nav.home" },
  { to: "/category/car-accessories", key: "nav.car" },
  { to: "/category/gym-fitness", key: "nav.gym" },
  { to: "/category/phone-accessories", key: "nav.phone" },
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
        <a href={WHATSAPP_URL} target="_blank" rel="noopener" className="flex items-center gap-1.5 hover:text-gold transition-colors">
          <Phone className="w-3 h-3" /> {t("header.whatsapp")}
        </a>
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
              key={item.to}
              to={item.to}
              className="relative px-3 py-2 text-sm font-medium text-foreground/80 hover:text-gold transition-colors"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageToggle />
          <EmailSignupButton />
          <button
            onClick={() => setShowSearch((s) => !s)}
            className="p-2 rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener"
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
            aria-label="WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </a>
          <Link
            to="/wishlist"
            className="relative p-2 rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
            aria-label={t("common.wishlist")}
          >
            <Heart className="w-5 h-5" />
            {user && wishlistIds.size > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gold text-deep-green text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
                {wishlistIds.size}
              </span>
            )}
          </Link>
          <Link
            to="/account"
            className="p-2 rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
            aria-label={t("common.account")}
          >
            <User className="w-5 h-5" />
          </Link>
          <Link
            to="/cart"
            className="relative p-2 rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
            aria-label={t("common.cart")}
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-gold text-deep-green text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden p-2 rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
            aria-label={t("common.menu")}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                key={item.to}
                to={item.to}
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
