"use client"

import { useState } from "react"
import { SuccessScreen } from "@/components/99pay/success-screen"
import { PixWithdrawal } from "@/components/99pay/pix-withdrawal"

export default function TesteSucessoPage() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPix, setShowPix] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4">
      <h1 className="text-xl font-bold mb-4">Teste das telas finais</h1>
      
      <div className="space-y-3">
        <button
          onClick={() => setShowSuccess(true)}
          className="w-full px-6 py-3 bg-[#FFE500] text-black font-bold rounded-xl active:scale-95 transition-transform"
        >
          Abrir tela "Cadastro Aprovado"
        </button>

        <button
          onClick={() => setShowPix(true)}
          className="w-full px-6 py-3 bg-[#00B89F] text-white font-bold rounded-xl active:scale-95 transition-transform"
        >
          Abrir tela "Saque via PIX"
        </button>
      </div>

      {showSuccess && (
        <SuccessScreen onStart={() => setShowSuccess(false)} />
      )}

      {showPix && (
        <PixWithdrawal 
          onClose={() => setShowPix(false)} 
          amount={857}
        />
      )}
    </div>
  )
}
