"use client"

import { SaldoSection } from "@/components/99pay/saldo-section"

export default function TesteSaldoPage() {
  const triggerAnimation = () => {
    window.dispatchEvent(new CustomEvent('showMoneyAnimation'))
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4">
      <h1 className="text-xl font-bold mb-4">Teste da Animacao do Saldo</h1>
      
      <button
        onClick={triggerAnimation}
        className="mb-6 px-6 py-3 bg-[#FFE500] text-black font-bold rounded-xl active:scale-95 transition-transform"
      >
        Disparar Animacao
      </button>
      
      <SaldoSection />
    </div>
  )
}
