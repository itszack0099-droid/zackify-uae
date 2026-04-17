import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact Us — Zackify.uae" },
      { name: "description", content: "Get in touch with the Zackify.uae team. WhatsApp support available." },
    ],
  }),
});

function ContactPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="text-xs text-gold uppercase tracking-widest mb-2">Get in touch</div>
          <h1 className="font-display text-4xl md:text-5xl">Contact Us</h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            We're here to help — reach out anytime, our team responds fast.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {[
            { icon: MessageCircle, title: "WhatsApp", value: "+971 50 000 0000", href: "https://wa.me/971500000000" },
            { icon: Phone, title: "Phone", value: "+971 50 000 0000", href: "tel:+971500000000" },
            { icon: Mail, title: "Email", value: "support@zackify.uae", href: "mailto:support@zackify.uae" },
            { icon: MapPin, title: "Location", value: "Dubai, United Arab Emirates", href: "#" },
          ].map((c, i) => (
            <a
              key={c.title}
              href={c.href}
              className={`glass rounded-2xl p-6 flex items-center gap-4 hover-lift gold-border animate-fade-in-up delay-${(i + 1) * 100}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold shrink-0">
                <c.icon className="w-6 h-6 text-deep-green" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.title}</div>
                <div className="font-medium text-foreground/90">{c.value}</div>
              </div>
            </a>
          ))}
        </div>

        <div className="glass rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl mb-2">Customer Support Hours</h2>
          <p className="text-muted-foreground">Sunday – Thursday: 9:00 AM – 9:00 PM</p>
          <p className="text-muted-foreground">Friday – Saturday: 10:00 AM – 6:00 PM</p>
        </div>
      </div>
    </Layout>
  );
}
