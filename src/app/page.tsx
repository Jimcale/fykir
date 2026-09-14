import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SurprisesTicker } from "@/components/SurprisesTicker";
import { AvailableSurprises } from "@/components/AvailableSurprises";
import { PartnersCarousel } from "@/components/PartnersCarousel";
import { CreatePageCTA } from "@/components/CreatePageCTA";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <SurprisesTicker />
        <AvailableSurprises />
        <PartnersCarousel />
        <CreatePageCTA />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        Made with 🎁 on Fykir
      </footer>
    </div>
  );
}
