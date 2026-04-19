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
    "common.viewAll": "View all",
    "common.addToCart": "Add to Cart",
    "common.buyNow": "Buy Now",
    "common.quantity": "Quantity",
    "common.total": "Total",
    "common.subtotal": "Subtotal",
    "common.shipping": "Shipping",
    "common.free": "FREE",
    "common.deliveredIn": "Delivery in 2–4 days across the UAE",
    "common.remove": "Remove",
    "common.codAvailable": "Cash on Delivery available",

    // Home
    "home.heroBadge": "Curated for the UAE",
    "home.heroTitle1": "Premium Gear for",
    "home.heroTitle2": "Men in UAE",
    "home.heroDesc": "Fast Delivery · Cash on Delivery · Premium Quality. Discover handpicked luxury accessories for car, fitness and phone.",
    "home.shopNow": "Shop Now",
    "home.featured": "Featured Products",
    "home.categories": "Shop by Category",
    "home.shopBy": "Browse",
    "home.handpicked": "Handpicked",
    "home.promise": "The Zackify Promise",
    "home.whyChoose": "Why Choose Us",
    "home.explore": "Explore",
    "home.limitedTime": "Limited Time",
    "home.dealsDesc": "Premium gear at unbeatable prices",
    "home.support": "Support",
    "home.codShort": "100%",
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
    "cart.summary": "Order Summary",
    "cart.empty": "Your cart is empty",
    "cart.emptyDesc": "Discover our premium collection and find your next favorite.",
    "cart.checkout": "Proceed to Checkout",
    "checkout.title": "Checkout",
    "checkout.delivery": "Delivery Details",
    "checkout.payment": "Payment",
    "checkout.cod": "Cash on Delivery",
    "checkout.codDesc": "Pay in cash when your order arrives",
    "checkout.fullName": "Full Name",
    "checkout.phone": "Phone Number",
    "checkout.address": "Address",
    "checkout.addressPh": "Street, building, apt",
    "checkout.city": "City",
    "checkout.emirate": "Emirate",
    "checkout.selectEmirate": "Select…",
    "checkout.postal": "Postal Code",
    "checkout.notes": "Order notes (optional)",
    "checkout.placeOrder": "Place Order",
    "checkout.placing": "Placing Order...",
    "checkout.summary": "Your Order",
    "checkout.qty": "Qty",
    "checkout.returnNote": "3 Days Return Policy — unused & in original packaging",

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
    "track.bothRequired": "Please enter both your order number and phone.",
    "track.requestReturn": "Request Return",
    "track.currentStatus": "Current Status",
    "track.lastUpdated": "Last updated",
    "track.items": "Items",
    "track.courier": "Courier",
    "track.trackingNum": "Tracking #",
    "track.eta": "Est. Delivery",
    "track.live": "Live",
    "track.returnInProgress": "Return in progress",
    "track.returnInProgressDesc": "Our team is processing your return. We'll contact you shortly.",
    "track.returnAvailable": "Need to return this order?",
    "track.returnAvailableDesc": "Returns are accepted within 3 days of delivery. Item must be unused & in original packaging.",

    // Return request
    "ret.title": "Request a Return",
    "ret.subtitle": "Returns are accepted within 3 days of delivery. The product must be unused, in original condition, and in its original packaging.",
    "ret.orderId": "Order ID",
    "ret.orderIdPh": "ZK-XXXXXX-XXXX",
    "ret.phone": "Phone Number",
    "ret.phonePh": "Phone used at checkout",
    "ret.reason": "Reason for Return",
    "ret.chooseReason": "Choose a reason…",
    "ret.message": "Optional Message",
    "ret.messagePh": "Anything else we should know?",
    "ret.submit": "Submit Return Request",
    "ret.submitting": "Submitting…",
    "ret.success": "Return Request Submitted",
    "ret.successBody": "Your return request has been submitted successfully. Our team will review and contact you shortly.",
    "ret.expired": "Return period has expired. Returns are only accepted within 3 days of delivery.",
    "ret.notFound": "Order not found. Check your order number.",
    "ret.notDelivered": "Returns can only be requested after the order is delivered.",
    "ret.failed": "Could not submit your return request. Please try again.",
    "ret.note": "Submit one request per order. Our team will verify and reach out to you on WhatsApp or call.",
    "ret.reasonDamaged": "Damaged product",
    "ret.reasonWrong": "Wrong item received",
    "ret.reasonNotDescribed": "Not as described",
    "ret.reasonChangedMind": "Changed mind",
    "ret.reasonOther": "Other",

    // Footer
    "footer.shop": "Shop",
    "footer.help": "Help",
    "footer.tagline": "Premium gear for the modern man in the UAE. Curated luxury accessories with cash on delivery and 2–4 day shipping across all emirates.",
    "footer.subscribe": "Join",
    "footer.emailPh": "your@email.com",
    "footer.copyright": "Premium gear, delivered.",
    "footer.trust1": "Cash on Delivery",
    "footer.trust2": "3 Days Return Policy",
    "footer.trust3": "Premium Quality",
    "footer.trust4": "2–4 Day Delivery",
    "footer.contact": "Contact Us",
    "footer.whatsapp": "WhatsApp",
    "footer.admin": "Admin",
    "footer.trackOrder": "Track Order",
    "footer.requestReturn": "Request a Return",

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
    "common.remove": "إزالة",
    "common.codAvailable": "الدفع عند الاستلام متاح",

    // Home
    "home.heroBadge": "مختار خصيصاً لدولة الإمارات",
    "home.heroTitle1": "منتجات فاخرة",
    "home.heroTitle2": "للرجل في الإمارات",
    "home.heroDesc": "توصيل سريع · الدفع عند الاستلام · جودة فاخرة. اكتشف إكسسوارات فاخرة مختارة بعناية للسيارة واللياقة والهاتف.",
    "home.shopNow": "تسوق الآن",
    "home.featured": "المنتجات المميزة",
    "home.categories": "تسوق حسب الفئة",
    "home.shopBy": "تصفح",
    "home.handpicked": "مختار بعناية",
    "home.promise": "وعد زاكيفاي",
    "home.whyChoose": "لماذا تختارنا",
    "home.explore": "استكشف",
    "home.limitedTime": "لفترة محدودة",
    "home.dealsDesc": "منتجات فاخرة بأسعار لا تُقاوم",
    "home.support": "الدعم",
    "home.codShort": "١٠٠٪",
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
    "cart.summary": "ملخص الطلب",
    "cart.empty": "سلتك فارغة",
    "cart.emptyDesc": "اكتشف مجموعتنا الفاخرة وابحث عن المفضلة لديك.",
    "cart.checkout": "متابعة الدفع",
    "checkout.title": "إتمام الشراء",
    "checkout.delivery": "تفاصيل التوصيل",
    "checkout.payment": "الدفع",
    "checkout.cod": "الدفع عند الاستلام",
    "checkout.codDesc": "ادفع نقداً عند وصول طلبك",
    "checkout.fullName": "الاسم الكامل",
    "checkout.phone": "رقم الهاتف",
    "checkout.address": "العنوان",
    "checkout.addressPh": "الشارع، المبنى، الشقة",
    "checkout.city": "المدينة",
    "checkout.emirate": "الإمارة",
    "checkout.selectEmirate": "اختر…",
    "checkout.postal": "الرمز البريدي",
    "checkout.notes": "ملاحظات الطلب (اختياري)",
    "checkout.placeOrder": "تأكيد الطلب",
    "checkout.placing": "جارٍ تأكيد الطلب...",
    "checkout.summary": "طلبك",
    "checkout.qty": "الكمية",
    "checkout.returnNote": "إرجاع خلال 3 أيام — غير مستخدم وبتغليفه الأصلي",

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
    "track.bothRequired": "يرجى إدخال رقم الطلب ورقم الهاتف.",
    "track.requestReturn": "طلب إرجاع",
    "track.currentStatus": "الحالة الحالية",
    "track.lastUpdated": "آخر تحديث",
    "track.items": "المنتجات",
    "track.courier": "شركة الشحن",
    "track.trackingNum": "رقم التتبع",
    "track.eta": "موعد التسليم المتوقع",
    "track.live": "مباشر",
    "track.returnInProgress": "الإرجاع قيد المعالجة",
    "track.returnInProgressDesc": "فريقنا يعالج طلب الإرجاع. سنتواصل معك قريباً.",
    "track.returnAvailable": "هل تحتاج إلى إرجاع هذا الطلب؟",
    "track.returnAvailableDesc": "يُقبل الإرجاع خلال 3 أيام من التسليم. يجب أن يكون المنتج غير مستخدم وبتغليفه الأصلي.",

    // Return request
    "ret.title": "طلب إرجاع",
    "ret.subtitle": "يُقبل الإرجاع خلال 3 أيام من التسليم. يجب أن يكون المنتج غير مستخدم وبحالته الأصلية وبتغليفه الأصلي.",
    "ret.orderId": "رقم الطلب",
    "ret.orderIdPh": "ZK-XXXXXX-XXXX",
    "ret.phone": "رقم الهاتف",
    "ret.phonePh": "الهاتف المستخدم عند الشراء",
    "ret.reason": "سبب الإرجاع",
    "ret.chooseReason": "اختر سبباً…",
    "ret.message": "رسالة اختيارية",
    "ret.messagePh": "هل هناك شيء آخر تود إخبارنا به؟",
    "ret.submit": "إرسال طلب الإرجاع",
    "ret.submitting": "جارٍ الإرسال…",
    "ret.success": "تم إرسال طلب الإرجاع",
    "ret.successBody": "تم إرسال طلب الإرجاع بنجاح. سيقوم فريقنا بمراجعته والتواصل معك قريباً.",
    "ret.expired": "انتهت فترة الإرجاع. يُقبل الإرجاع فقط خلال 3 أيام من التسليم.",
    "ret.notFound": "لم يتم العثور على الطلب. تحقق من رقم الطلب.",
    "ret.notDelivered": "لا يمكن طلب الإرجاع إلا بعد تسليم الطلب.",
    "ret.failed": "تعذر إرسال طلب الإرجاع. يرجى المحاولة مرة أخرى.",
    "ret.note": "أرسل طلباً واحداً لكل طلبية. سيتحقق فريقنا ويتواصل معك عبر الواتساب أو الهاتف.",
    "ret.reasonDamaged": "منتج تالف",
    "ret.reasonWrong": "وصل منتج خاطئ",
    "ret.reasonNotDescribed": "غير مطابق للوصف",
    "ret.reasonChangedMind": "غيّرت رأيي",
    "ret.reasonOther": "سبب آخر",

    // Footer
    "footer.shop": "تسوق",
    "footer.help": "المساعدة",
    "footer.tagline": "منتجات فاخرة للرجل العصري في الإمارات. إكسسوارات فاخرة مختارة مع الدفع عند الاستلام والشحن خلال 2–4 أيام لجميع الإمارات.",
    "footer.subscribe": "اشترك",
    "footer.emailPh": "بريدك@الإلكتروني.com",
    "footer.copyright": "منتجات فاخرة، يتم توصيلها.",
    "footer.trust1": "الدفع عند الاستلام",
    "footer.trust2": "إرجاع خلال 3 أيام",
    "footer.trust3": "جودة فاخرة",
    "footer.trust4": "توصيل خلال 2–4 أيام",
    "footer.contact": "اتصل بنا",
    "footer.whatsapp": "واتساب",
    "footer.admin": "المسؤول",
    "footer.trackOrder": "تتبع الطلب",
    "footer.requestReturn": "طلب إرجاع",

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
