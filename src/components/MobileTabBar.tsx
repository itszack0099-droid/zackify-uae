import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, Package, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

const tabs = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/cart", label: "Cart", icon: ShoppingBag, badgeKey: "cart" as const },
  { to: "/track-order", label: "Orders", icon: Package },
  { to: "/account", label: "Account", icon: User },
];

export function MobileTabBar() {
  const { count } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gold/15 bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary mobile navigation"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const to =
            tab.to === "/account" && user ? "/account/profile" : tab.to;
          const active = tab.exact
            ? location.pathname === tab.to
            : location.pathname === tab.to ||
              location.pathname.startsWith(tab.to + "/") ||
              (tab.to === "/account" && location.pathname.startsWith("/account"));
          const showBadge = tab.badgeKey === "cart" && count > 0;

          return (
            <li key={tab.to} className="flex">
              <Link
                to={to}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium tracking-wide transition-colors ${
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-gradient-gold text-deep-green text-[9px] font-bold flex items-center justify-center shadow-gold">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-gold" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
