"use client"

import Image from "next/image"

export function BottomNav() {
  return (
    <>
      {/* Botao $ flutuante separado - moeda dourada brilhante com efeito 3D */}
      <button className="fixed bottom-24 right-4 z-[200] active:scale-95 transition-transform animate-coin-3d">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2026%20de%20mar.%20de%202026%2C%2018_11_16-Photoroom-pApXSJ5H9IaHE7LLyTwuBdORnPs8ci.png"
          alt="99Pay"
          width={56}
          height={56}
          className="object-contain coin-thick"
          style={{ width: 56, height: 56 }}
        />
      </button>
      
      {/* Animacao 3D da moeda + sombra grossa simulando espessura */}
      <style jsx>{`
        @keyframes coin3d {
          0% {
            transform: scale(1) rotateY(0deg);
          }
          50% {
            transform: scale(1.05) rotateY(180deg);
          }
          100% {
            transform: scale(1) rotateY(360deg);
          }
        }
        
        .animate-coin-3d {
          animation: coin3d 8s linear infinite;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        /* Multiplas drop-shadows empilhadas simulam a espessura fisica da moeda (bem grossa) */
        .coin-thick {
          filter:
            drop-shadow(0 1px 0 #D4A017)
            drop-shadow(0 2px 0 #C89512)
            drop-shadow(0 3px 0 #B8860B)
            drop-shadow(0 4px 0 #A8760A)
            drop-shadow(0 5px 0 #986608)
            drop-shadow(0 6px 0 #885606)
            drop-shadow(0 7px 0 #784604)
            drop-shadow(0 8px 0 #683602)
            drop-shadow(0 10px 10px rgba(0, 0, 0, 0.5));
        }
      `}</style>

      <nav className="bottom-nav-selector fixed bottom-0 left-0 right-0 w-full z-50 px-3 pb-6">
        {/* Container principal com borda cinza e fundo branco */}
        <div className="bg-white rounded-full shadow-2xl border border-gray-200 flex items-center justify-between pl-4 pr-0 py-3 max-w-md mx-auto relative overflow-hidden">
          {/* Corrida */}
          <button className="flex flex-col items-center gap-1 px-2 py-1 group active:scale-95 transition-transform">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-LJmxFfVctYtWXZQDUN8iTdJsuFudHD.png"
              alt="Corrida"
              width={50}
              height={50}
              className="object-contain"
              style={{ width: 50, height: 50 }}
            />
            <span className="text-xs text-gray-700 font-semibold">Corrida</span>
          </button>
          
          {/* Food */}
          <button className="flex flex-col items-center gap-1 px-2 py-1 group active:scale-95 transition-transform">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-1BXRLtyg2UpwP8DP5OPhjEkAxMUSC9.png"
              alt="Food"
              width={50}
              height={50}
              className="object-contain"
              style={{ width: 50, height: 50 }}
            />
            <span className="text-xs text-gray-700 font-semibold">Food</span>
          </button>
          
          {/* Entrega */}
          <button className="flex flex-col items-center gap-1 px-2 py-1 group active:scale-95 transition-transform">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-LlIINqjjtJlpP4e9D0JRDG8m2ybyOL.png"
              alt="Entrega"
              width={50}
              height={50}
              className="object-contain"
              style={{ width: 50, height: 50 }}
            />
            <span className="text-xs text-gray-700 font-semibold">Entrega</span>
          </button>
          
          {/* Botao $ dentro do seletor - mais a esquerda */}
          <button className="flex items-center justify-center active:scale-95 transition-transform -ml-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RG9wT1OVc9pUy3tiGLKWqh9iJeKdZU.png"
              alt="99Pay"
              width={90}
              height={90}
              className="object-contain"
              style={{ width: 90, height: 90 }}
            />
          </button>
        </div>
        
        {/* Indicador de home (iPhone style) */}
        <div className="flex justify-center mt-2">
          <div className="w-36 h-1 bg-black rounded-full" />
        </div>
      </nav>
    </>
  )
}
