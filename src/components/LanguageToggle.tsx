import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const next = lang === "en" ? "ar" : "en";
  const label = lang === "en" ? "العربية" : "English";

  return (
    <button
      onClick={() => setLang(next)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-gold/10 hover:text-gold transition-colors text-xs font-medium"
      aria-label={`Switch language to ${label}`}
      title={`Switch to ${label}`}
    >
      <Languages className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
