"use client"

import Image from "next/image"
import { ChevronRight } from "lucide-react"

export function HighlightsSection() {
  return (
    <div className="bg-[#f5f5f5] pt-6 pb-4">
      {/* Imagem 1: Card R$857 com cupons */}
      <div className="px-4">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-26%20at%2018.57.04-5ISeSXdhT5EAYyDWVw7VcXGshI7qOt.jpeg"
          alt="R$857 - Ative sua conta da 99Pay para ganhar essa recompensa"
          width={1200}
          height={400}
          className="w-full h-auto rounded-2xl"
        />
      </div>

      {/* Imagem 2: Destaques */}
      <div className="px-4 mt-4">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-26%20at%2018.57.16-cRXCxJyqHxtc1BkcgdUnf1x1O2qUIt.jpeg"
          alt="Destaques - Pegue agora sua recompensa de R$857!"
          width={1200}
          height={350}
          className="w-full h-auto rounded-2xl"
        />
      </div>

      {/* Termos de uso */}
      <div className="flex items-center justify-center mt-4 px-4">
        <button className="flex items-center gap-1 text-gray-500 text-sm">
          Termos de uso
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
