"use client"

import { ChevronRight } from "lucide-react"

export function PromoBanner() {
  return (
    <div className="px-4 pb-0 bg-[#FFD500]">
      <div className="relative bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0d0d0d] rounded-3xl p-5 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform">
        {/* Particulas douradas de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 left-28 w-1 h-1 bg-yellow-400/60 rounded-full animate-pulse" />
          <div className="absolute top-14 left-40 w-0.5 h-0.5 bg-yellow-300/40 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="absolute top-20 left-32 w-1 h-1 bg-yellow-400/50 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
          <div className="absolute bottom-14 left-36 w-0.5 h-0.5 bg-yellow-300/30 rounded-full animate-pulse" style={{ animationDelay: "0.6s" }} />
          <div className="absolute bottom-10 right-24 w-1 h-1 bg-yellow-400/40 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
          <div className="absolute top-24 right-32 w-0.5 h-0.5 bg-yellow-300/50 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
          {/* Gradiente dourado sutil na parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-yellow-600/10 to-transparent" />
        </div>
        
        <div className="flex gap-4 relative z-10">
          {/* Icone do presente */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Laco do presente */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex">
                    <div className="w-4 h-4 bg-[#FFD500] rounded-full -mr-1 shadow-sm" />
                    <div className="w-4 h-4 bg-[#FFD500] rounded-full -ml-1 shadow-sm" />
                  </div>
                  {/* Caixa do presente */}
                  <div className="w-12 h-11 bg-[#FFD500] rounded-xl mt-2 flex items-center justify-center shadow-lg relative overflow-hidden">
                    <span className="text-2xl font-black text-black z-10">$</span>
                    {/* Fita vertical */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-[#E6B800]/50" />
                    {/* Fita horizontal */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-2 bg-[#E6B800]/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteudo */}
          <div className="flex-1">
            <p className="text-white text-sm mb-0.5">Crie sua conta em 3 etapas e</p>
            <p className="text-[#FFD500] font-bold text-xl leading-tight mb-2">
              Ganhe 857 no seu Pix
            </p>
            <p className="text-gray-400 text-xs leading-snug mb-1">
              Aproveite agora essa recompensa de <span className="text-white font-medium">857 Reais</span>
            </p>
            <p className="text-gray-400 text-xs leading-snug mb-1">
              para novos usuários da 99Pay.
            </p>
            <p className="text-[#FFD500] text-xs italic">
              Resgate agora por tempo limitado!
            </p>
          </div>
        </div>
        
        {/* Botao Ganhe agora */}
        <div className="mt-4 relative">
          {/* Linha de brilho */}
          <div className="absolute -top-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
          
          <button className="w-full bg-gradient-to-r from-[#FFD500] to-[#FFDF00] hover:from-[#E6C200] hover:to-[#FFD500] text-black font-bold py-3.5 rounded-full text-base shadow-lg shadow-yellow-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden">
            {/* Brilho do botao */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <span className="relative z-10">Ganhe agora</span>
            <ChevronRight className="w-5 h-5 relative z-10" />
          </button>
        </div>
        
        {/* CSS para animacao de shimmer */}
        <style jsx>{`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
