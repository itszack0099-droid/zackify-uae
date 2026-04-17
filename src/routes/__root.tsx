import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zackify.uae — Premium Gear for Men in UAE" },
      {
        name: "description",
        content:
          "Premium car accessories, gym gear and phone accessories for men in the UAE. Cash on Delivery. 2–4 day delivery across all emirates.",
      },
      { name: "author", content: "Zackify.uae" },
      { name: "theme-color", content: "#0B3D2E" },
      { property: "og:title", content: "Zackify.uae — Premium Gear for Men in UAE" },
      { property: "og:description", content: "Zackify.uae is a premium e-commerce website for masculine UAE style." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Zackify.uae — Premium Gear for Men in UAE" },
      { name: "description", content: "Zackify.uae is a premium e-commerce website for masculine UAE style." },
      { name: "twitter:description", content: "Zackify.uae is a premium e-commerce website for masculine UAE style." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <CartProvider>
      <Outlet />
      <Toaster />
    </CartProvider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-7xl text-gradient-gold">404</h1>
        <p className="mt-4 text-foreground/70">This page doesn't exist.</p>
        <a href="/" className="mt-6 inline-block px-6 py-2.5 rounded-full bg-gradient-gold text-deep-green font-semibold">
          Go Home
        </a>
      </div>
    </div>
  );
}
