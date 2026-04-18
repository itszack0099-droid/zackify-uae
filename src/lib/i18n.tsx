import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const STRINGS = {
  en: {
    "nav.home": "Home",
    "nav.car": "Car Accessories",
    "nav.gym": "Gym & Fitness",
    "nav.phone": "Phone Accessories",
    "nav.deals": "Hot Deals",
    "nav.track": "Track Order",
    "nav.contact": "Contact",
    "header.tagline": "Premium gear for men in UAE — Cash on Delivery",
    "header.whatsapp": "WhatsApp Support",
    "header.search": "Search premium gear...",
    "common.account": "Account",
    "common.wishlist": "Wishlist",
    "common.cart": "Cart",
    "common.menu": "Menu",
    "common.language": "Language",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.car": "إكسسوارات السيارات",
    "nav.gym": "الرياضة واللياقة",
    "nav.phone": "إكسسوارات الهاتف",
    "nav.deals": "العروض الساخنة",
    "nav.track": "تتبع الطلب",
    "nav.contact": "اتصل بنا",
    "header.tagline": "منتجات فاخرة للرجال في الإمارات — الدفع عند الاستلام",
    "header.whatsapp": "دعم واتساب",
    "header.search": "ابحث عن منتجات فاخرة...",
    "common.account": "الحساب",
    "common.wishlist": "المفضلة",
    "common.cart": "السلة",
    "common.menu": "القائمة",
    "common.language": "اللغة",
  },
} as const;

export type StringKey = keyof typeof STRINGS["en"];

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem("zackify-lang") as Lang | null;
    return stored === "ar" ? "ar" : "en";
  });

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("zackify-lang", l);
  };

  const t = (key: StringKey) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
