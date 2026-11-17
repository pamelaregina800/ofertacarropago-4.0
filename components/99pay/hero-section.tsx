"use client"

import Image from "next/image"

export function HeroSection() {
  return (
    <div className="relative w-full bg-[#FFD500]">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99pay_banner-izji7XcdCMkGpK46dgI4Z7iSntvDYf.png"
        alt="99Pay - Crie sua conta em 3 etapas e Ganhe 857 no seu Pix"
        width={800}
        height={500}
        className="w-full h-auto"
        priority
      />
    </div>
  )
}
