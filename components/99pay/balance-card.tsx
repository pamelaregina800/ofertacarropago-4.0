"use client"

import { Eye, ChevronRight, CreditCard, Percent } from "lucide-react"

export function BalanceCard() {
  return (
    <div className="relative">
      {/* Fundo amarelo que conecta com o banner */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-[#FFD500]" />
      {/* Fundo cinza claro que conecta com o resto */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f5f5f5]" />
      
      {/* Card branco */}
      <div className="relative mx-4 bg-white rounded-3xl pt-6 pb-4 px-5 shadow-sm border border-gray-100 z-10">
        {/* Saldo Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg text-gray-800 font-semibold">Saldo na 99</span>
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Eye className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">
          Para uso exclusivo em corridas 99, 99Entrega e 99Food
        </p>
        
        {/* Saldo e Botao Depositar */}
        <div className="flex items-center justify-between mb-2">
          <button className="flex items-center gap-1 group">
            <span className="text-5xl font-bold text-black tracking-tight">0,00</span>
            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
          <button className="bg-[#FFD500] hover:bg-[#E6C200] active:scale-95 text-black font-bold px-7 py-3.5 rounded-full text-lg shadow-lg shadow-yellow-500/25 transition-all flex items-center gap-1">
            Depositar
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* CDI Link */}
        <button className="text-[#00A86B] text-sm font-bold flex items-center gap-1 mb-5 hover:underline">
          Ative 110% do CDI
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        
        {/* Divisor */}
        <div className="border-t border-gray-100" />
        
        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4">
          <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-black transition-colors group">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <span className="font-semibold">Cartões</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-black transition-colors group relative">
            <div className="w-5 h-5 bg-[#FFD500] rounded-full flex items-center justify-center">
              <Percent className="w-3 h-3 text-black" />
            </div>
            <span className="font-semibold">Desconto</span>
            <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold absolute -top-1 right-6">
              6
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-black transition-colors group">
            <span className="font-semibold">Cashback</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
