import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className="flex-1 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0"
      >
        {children}
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
