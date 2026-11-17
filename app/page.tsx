import { HeroSection } from "@/components/99pay/hero-section"
import { SaldoSection } from "@/components/99pay/saldo-section"
import { ServicesRewardsSection } from "@/components/99pay/services-rewards-section"
import { HighlightsSection } from "@/components/99pay/highlights-section"
import { BottomNav } from "@/components/99pay/bottom-nav"
import { OnboardingPopup } from "@/components/99pay/onboarding-popup"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] w-full relative overflow-x-hidden">
      {/* Popup de onboarding obrigatorio */}
      <OnboardingPopup />
      
      {/* Conteudo scrollavel */}
      <div className="relative z-10 pb-28">
        {/* Hero: Header + Banner promocional (imagem completa) */}
        <HeroSection />
        
        {/* Saldo + Quick Actions (imagem completa) */}
        <SaldoSection />
        
        {/* Servicos + Central de Recompensas (imagem completa) */}
        <ServicesRewardsSection />
        
        {/* Destaques */}
        <HighlightsSection />
      </div>
      
      {/* Navegacao inferior (inclui moeda flutuante) */}
      <BottomNav />
    </main>
  )
}
