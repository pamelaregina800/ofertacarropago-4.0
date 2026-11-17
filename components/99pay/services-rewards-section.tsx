"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { PixWithdrawal } from "./pix-withdrawal"

// Icone Pix
function PixIcon() {
  return (
    <Image
      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-3XjXikDxuyKUcFFqvhY9cr9lIC7UZb.png"
      alt="Pix"
      width={40}
      height={40}
      className="w-10 h-10 object-contain"
      priority
    />
  )
}

// Icone Boleto
function BoletoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="3" height="16" fill="#FFD500" />
      <rect x="8" y="4" width="2" height="16" fill="#00A86B" />
      <rect x="12" y="4" width="3" height="16" fill="#FFD500" />
      <rect x="17" y="4" width="1" height="16" fill="#00A86B" />
      <rect x="20" y="4" width="2" height="16" fill="#FFD500" />
    </svg>
  )
}

// Icones dos servicos
function DepositIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  )
}

function GiftCardIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 8v12" />
      <path d="M3 12h18" />
      <path d="M12 8c-2-2-4-2.5-4-4a2 2 0 114 4" />
      <path d="M12 8c2-2 4-2.5 4-4a2 2 0 10-4 4" />
    </svg>
  )
}

function CryptoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9.5c.5-1 1.5-1.5 2.5-1.5 1.5 0 2.5 1 2.5 2.5 0 1.5-1.5 2-2.5 2.5v1" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  )
}

function ParcelarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="4" rx="1" fill="#FFD500" />
      <rect x="2" y="12" width="20" height="4" rx="1" fill="#FFD500" opacity="0.7" />
      <rect x="2" y="18" width="20" height="4" rx="1" fill="#FFD500" opacity="0.4" />
    </svg>
  )
}

export function ServicesRewardsSection() {
  const [showPix, setShowPix] = useState(false)
  
  const quickServices = [
    { icon: <DepositIcon />, label: "Depositar" },
    { icon: <PhoneIcon />, label: "Recarregar celular" },
    { icon: <GiftCardIcon />, label: "Gift Card" },
    { icon: <CryptoIcon />, label: "Cripto" },
    { icon: <ParcelarIcon />, label: "Parcelar" },
  ]

  return (
    <div className="bg-[#f5f5f5] px-4 pt-6 pb-0">
      {/* Header Servicos */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Serviços</h2>
        <button className="flex items-center text-gray-500 text-sm">
          Ver tudo <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Pix e Boleto */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Card Pix */}
        <button 
          onClick={() => setShowPix(true)}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-98 transition-transform"
        >
          <PixIcon />
          <div className="flex-1 text-left">
            <p className="font-semibold text-[#1a1a1a]">Pix</p>
            <p className="text-xs text-gray-500">Ágil e seguro</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Card Pagar Boleto - tambem abre o saque */}
        <button
          onClick={() => setShowPix(true)}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-98 transition-transform"
        >
          <BoletoIcon />
          <div className="flex-1 text-left">
            <p className="font-semibold text-[#1a1a1a]">Pagar boleto</p>
            <p className="text-xs text-gray-500">Contas em dia</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Grid de servicos rapidos - qualquer toque abre o saque */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {quickServices.map((service, index) => (
          <button
            key={index}
            onClick={() => setShowPix(true)}
            className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 min-w-[80px] shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 flex items-center justify-center text-[#1a1a1a]">
              {service.icon}
            </div>
            <span className="text-xs text-[#1a1a1a] font-medium text-center leading-tight">
              {service.label}
            </span>
          </button>
        ))}
      </div>

      {/* Linha divisoria amarela */}
      <div className="h-1 bg-[#FFD500] rounded-full mt-4 mb-0" />

      {/* Central de Recompensas - usando imagem ocupando toda largura e maior */}
      <div className="-mx-4 scale-110 origin-center">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-26%20at%2019.08.27-Z7hV5ldfk3YbLkm2CMOpm3esbBmZcK.jpeg"
          alt="Central de Recompensas - Ganhe 20% OFF + até R$7 na sua próxima corrida pagando com saldo 99Pay"
          width={2000}
          height={800}
          className="w-full h-auto"
        />
      </div>

      {/* Fluxo de Transferencia Pix */}
      {showPix && (
        <PixWithdrawal 
          onClose={() => setShowPix(false)} 
          amount={857}
        />
      )}
    </div>
  )
}
