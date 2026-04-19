import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const STRINGS = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.car": "Car Accessories",
    "nav.gym": "Gym & Fitness",
    "nav.phone": "Phone Accessories",
    "nav.deals": "Hot Deals",
    "nav.track": "Track Order",
    "nav.contact": "Contact",
    "nav.return": "Request Return",

    // Header
    "header.tagline": "Premium gear for men in UAE — Cash on Delivery",
    "header.whatsapp": "WhatsApp Support",
    "header.search": "Search premium gear...",

    // Common
    "common.account": "Account",
    "common.wishlist": "Wishlist",
    "common.cart": "Cart",
    "common.menu": "Menu",
    "common.language": "Language",
    "common.continueShopping": "Continue Shopping",
    "common.loading": "Loading…",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.search": "Search",
    "common.viewAll": "View All",
    "common.addToCart": "Add to Cart",
    "common.buyNow": "Buy Now",
    "common.quantity": "Quantity",
    "common.total": "Total",
    "common.subtotal": "Subtotal",
    "common.shipping": "Shipping",
    "common.free": "FREE",
    "common.deliveredIn": "Delivery in 2–4 days across the UAE",

    // Home
    "home.heroBadge": "Luxury for the Modern Man",
    "home.shopNow": "Shop Now",
    "home.featured": "Featured Products",
    "home.categories": "Shop by Category",
    "home.whyChoose": "Why Choose Us",
    "home.cod": "Cash on Delivery",
    "home.codDesc": "Pay in cash when you receive your order",
    "home.fastDelivery": "Fast Delivery",
    "home.fastDeliveryDesc": "2–4 days across all UAE emirates",
    "home.premiumQuality": "Premium Quality",
    "home.premiumQualityDesc": "Hand-picked luxury products only",
    "home.returnsTitle": "3 Days Return Policy",
    "home.returnsDesc": "Return within 3 days of delivery, unused & in original packaging",

    // Cart / Checkout
    "cart.title": "Your Cart",
    "cart.empty": "Your cart is empty",
    "cart.emptyDesc": "Discover premium gear handpicked for you.",
    "cart.checkout": "Proceed to Checkout",
    "checkout.title": "Checkout",
    "checkout.delivery": "Delivery Details",
    "checkout.payment": "Payment",
    "checkout.cod": "Cash on Delivery",
    "checkout.codDesc": "Pay in cash when your order arrives",
    "checkout.fullName": "Full Name",
    "checkout.phone": "Phone Number",
    "checkout.address": "Address",
    "checkout.city": "City",
    "checkout.emirate": "Emirate",
    "checkout.postal": "Postal Code",
    "checkout.notes": "Order notes (optional)",
    "checkout.placeOrder": "Place Order",
    "checkout.placing": "Placing Order...",
    "checkout.summary": "Your Order",

    // Order success
    "success.title": "Order Placed Successfully",
    "success.body": "Your order will be delivered within 2–4 days across the UAE.",
    "success.orderNumber": "Order Number",
    "success.save": "Save this number to track your order",
    "success.trackOrder": "Track Order",
    "success.payNote": "Pay in cash when the order arrives. Our team will call you to confirm.",

    // Track order
    "track.title": "Track Your Order",
    "track.subtitle": "Enter your order number and phone to see live status",
    "track.orderNumber": "Order number e.g. ZK-XXXXXX-XXXX",
    "track.phone": "Phone number used at checkout",
    "track.button": "Track Order",
    "track.tracking": "Tracking...",
    "track.notFound": "Order not found. Check your number and try again.",
    "track.phoneMismatch": "Phone number doesn't match this order.",
    "track.requestReturn": "Request Return",
    "track.currentStatus": "Current Status",
    "track.lastUpdated": "Last updated",
    "track.items": "Items",
    "track.courier": "Courier",
    "track.trackingNum": "Tracking #",
    "track.eta": "Est. Delivery",

    // Return request
    "ret.title": "Request a Return",
    "ret.subtitle": "Returns are accepted within 3 days of delivery. The product must be unused, in original condition, and in its original packaging.",
    "ret.orderId": "Order ID",
    "ret.phone": "Phone Number",
    "ret.reason": "Reason for Return",
    "ret.message": "Optional Message",
    "ret.submit": "Submit Return Request",
    "ret.submitting": "Submitting…",
    "ret.success": "Return Request Submitted",
    "ret.successBody": "Your return request has been submitted successfully. Our team will review and contact you shortly.",
    "ret.expired": "Return period has expired. Returns are only accepted within 3 days of delivery.",

    // Footer
    "footer.shop": "Shop",
    "footer.help": "Help",
    "footer.tagline": "Premium gear for the modern man in the UAE. Curated luxury accessories with cash on delivery and 2–4 day shipping across all emirates.",
    "footer.subscribe": "Join",
    "footer.copyright": "Premium gear, delivered.",

    // Order statuses
    "status.pending": "Pending",
    "status.confirmed": "Confirmed",
    "status.processing": "Processing",
    "status.shipped": "Shipped",
    "status.out_for_delivery": "Out for Delivery",
    "status.delivered": "Delivered",
    "status.cancelled": "Cancelled",
    "status.return_requested": "Return Requested",
    "status.return_approved": "Return Approved",
    "status.returned": "Returned",
  },
  ar: {
    // Nav
    "nav.home": "الرئيسية",
    "nav.car": "إكسسوارات السيارات",
    "nav.gym": "الرياضة واللياقة",
    "nav.phone": "إكسسوارات الهاتف",
    "nav.deals": "العروض الساخنة",
    "nav.track": "تتبع الطلب",
    "nav.contact": "اتصل بنا",
    "nav.return": "طلب إرجاع",

    // Header
    "header.tagline": "منتجات فاخرة للرجال في الإمارات — الدفع عند الاستلام",
    "header.whatsapp": "دعم واتساب",
    "header.search": "ابحث عن منتجات فاخرة...",

    // Common
    "common.account": "الحساب",
    "common.wishlist": "المفضلة",
    "common.cart": "السلة",
    "common.menu": "القائمة",
    "common.language": "اللغة",
    "common.continueShopping": "متابعة التسوق",
    "common.loading": "جارٍ التحميل…",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.submit": "إرسال",
    "common.search": "بحث",
    "common.viewAll": "عرض الكل",
    "common.addToCart": "أضف إلى السلة",
    "common.buyNow": "اشترِ الآن",
    "common.quantity": "الكمية",
    "common.total": "الإجمالي",
    "common.subtotal": "المجموع الفرعي",
    "common.shipping": "الشحن",
    "common.free": "مجاني",
    "common.deliveredIn": "التوصيل خلال 2–4 أيام في جميع أنحاء الإمارات",

    // Home
    "home.heroBadge": "فخامة للرجل العصري",
    "home.shopNow": "تسوق الآن",
    "home.featured": "المنتجات المميزة",
    "home.categories": "تسوق حسب الفئة",
    "home.whyChoose": "لماذا تختارنا",
    "home.cod": "الدفع عند الاستلام",
    "home.codDesc": "ادفع نقداً عند استلام طلبك",
    "home.fastDelivery": "توصيل سريع",
    "home.fastDeliveryDesc": "2–4 أيام في جميع إمارات الدولة",
    "home.premiumQuality": "جودة فاخرة",
    "home.premiumQualityDesc": "منتجات فاخرة مختارة بعناية فقط",
    "home.returnsTitle": "إرجاع خلال 3 أيام",
    "home.returnsDesc": "أعد المنتج خلال 3 أيام من التسليم، غير مستخدم وبتغليفه الأصلي",

    // Cart / Checkout
    "cart.title": "سلتك",
    "cart.empty": "سلتك فارغة",
    "cart.emptyDesc": "اكتشف منتجات فاخرة مختارة لك.",
    "cart.checkout": "متابعة الدفع",
    "checkout.title": "إتمام الشراء",
    "checkout.delivery": "تفاصيل التوصيل",
    "checkout.payment": "الدفع",
    "checkout.cod": "الدفع عند الاستلام",
    "checkout.codDesc": "ادفع نقداً عند وصول طلبك",
    "checkout.fullName": "الاسم الكامل",
    "checkout.phone": "رقم الهاتف",
    "checkout.address": "العنوان",
    "checkout.city": "المدينة",
    "checkout.emirate": "الإمارة",
    "checkout.postal": "الرمز البريدي",
    "checkout.notes": "ملاحظات الطلب (اختياري)",
    "checkout.placeOrder": "تأكيد الطلب",
    "checkout.placing": "جارٍ تأكيد الطلب...",
    "checkout.summary": "طلبك",

    // Order success
    "success.title": "تم تأكيد طلبك بنجاح",
    "success.body": "سيتم توصيل طلبك خلال 2–4 أيام في جميع أنحاء الإمارات.",
    "success.orderNumber": "رقم الطلب",
    "success.save": "احفظ هذا الرقم لتتبع طلبك",
    "success.trackOrder": "تتبع الطلب",
    "success.payNote": "ادفع نقداً عند وصول الطلب. سيتصل بك فريقنا للتأكيد.",

    // Track order
    "track.title": "تتبع طلبك",
    "track.subtitle": "أدخل رقم طلبك وهاتفك لمعرفة الحالة المباشرة",
    "track.orderNumber": "رقم الطلب مثال ZK-XXXXXX-XXXX",
    "track.phone": "رقم الهاتف المستخدم عند الشراء",
    "track.button": "تتبع الطلب",
    "track.tracking": "جارٍ التتبع...",
    "track.notFound": "لم يتم العثور على الطلب. تحقق من الرقم وحاول مرة أخرى.",
    "track.phoneMismatch": "رقم الهاتف لا يطابق هذا الطلب.",
    "track.requestReturn": "طلب إرجاع",
    "track.currentStatus": "الحالة الحالية",
    "track.lastUpdated": "آخر تحديث",
    "track.items": "المنتجات",
    "track.courier": "شركة الشحن",
    "track.trackingNum": "رقم التتبع",
    "track.eta": "موعد التسليم المتوقع",

    // Return request
    "ret.title": "طلب إرجاع",
    "ret.subtitle": "يُقبل الإرجاع خلال 3 أيام من التسليم. يجب أن يكون المنتج غير مستخدم وبحالته الأصلية وبتغليفه الأصلي.",
    "ret.orderId": "رقم الطلب",
    "ret.phone": "رقم الهاتف",
    "ret.reason": "سبب الإرجاع",
    "ret.message": "رسالة اختيارية",
    "ret.submit": "إرسال طلب الإرجاع",
    "ret.submitting": "جارٍ الإرسال…",
    "ret.success": "تم إرسال طلب الإرجاع",
    "ret.successBody": "تم إرسال طلب الإرجاع بنجاح. سيقوم فريقنا بمراجعته والتواصل معك قريباً.",
    "ret.expired": "انتهت فترة الإرجاع. يُقبل الإرجاع فقط خلال 3 أيام من التسليم.",

    // Footer
    "footer.shop": "تسوق",
    "footer.help": "المساعدة",
    "footer.tagline": "منتجات فاخرة للرجل العصري في الإمارات. إكسسوارات فاخرة مختارة مع الدفع عند الاستلام والشحن خلال 2–4 أيام لجميع الإمارات.",
    "footer.subscribe": "اشترك",
    "footer.copyright": "منتجات فاخرة، يتم توصيلها.",

    // Order statuses
    "status.pending": "قيد الانتظار",
    "status.confirmed": "تم التأكيد",
    "status.processing": "قيد التجهيز",
    "status.shipped": "تم الشحن",
    "status.out_for_delivery": "في الطريق",
    "status.delivered": "تم التسليم",
    "status.cancelled": "ملغي",
    "status.return_requested": "طلب إرجاع",
    "status.return_approved": "تمت الموافقة على الإرجاع",
    "status.returned": "تم الإرجاع",
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

  const t = (key: StringKey) => (STRINGS[lang] as Record<string, string>)[key] ?? STRINGS.en[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
