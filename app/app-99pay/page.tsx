"use client"

import { useState } from "react"
import { HeroSection } from "@/components/99pay/hero-section"
import { SaldoSection } from "@/components/99pay/saldo-section"
import { ServicesRewardsSection } from "@/components/99pay/services-rewards-section"
import { HighlightsSection } from "@/components/99pay/highlights-section"
import { BottomNav } from "@/components/99pay/bottom-nav"
import { SuccessScreen } from "@/components/99pay/success-screen"

/**
 * Rota de teste: tela principal do 99Pay com botao para abrir o popup
 * "Cadastro Aprovado" e testar o som ao clicar em Concluir.
 *
 * Acesse em: /app-99pay
 */
export default function App99PayPage() {
  const [showSuccess, setShowSuccess] = useState(false)

  // Quando clicar em Concluir no popup -> dispara animacao do saldo + som
  const handleConcluir = () => {
    setShowSuccess(false)
    // scroll instantaneo pro topo para ver o saldo caindo
    if (typeof window !== "undefined") {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })
      } catch {
        window.scrollTo(0, 0)
      }
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("showMoneyAnimation"))
    }, 300)
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] w-full relative overflow-x-hidden">
      {/* Botao de teste - abre o popup "Cadastro Aprovado" para testar o som */}
      <button
        onClick={() => setShowSuccess(true)}
        className="fixed top-3 right-3 z-[300] bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold active:scale-95 transition-transform"
      >
        Testar Concluir
      </button>

      {/* Conteudo scrollavel - SEM o OnboardingPopup */}
      <div className="relative z-10 pb-28">
        <HeroSection />
        <SaldoSection />
        <ServicesRewardsSection />
        <HighlightsSection />
      </div>

      {/* Navegacao inferior (inclui moeda flutuante) */}
      <BottomNav />

      {/* Popup "Cadastro Aprovado" para testar o som ao clicar Concluir */}
      {showSuccess && <SuccessScreen onStart={handleConcluir} />}
    </main>
  )
}
