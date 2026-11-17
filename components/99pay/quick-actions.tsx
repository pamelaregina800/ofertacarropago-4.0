"use client"

function PixIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-700">
      {/* Icone do Pix estilizado */}
      <path d="M16 4L8 12L16 20L24 12L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8 20L16 28L24 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function TransferIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-700">
      {/* Caixa com seta */}
      <rect x="4" y="8" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 15H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Seta para baixo com cifrao */}
      <rect x="18" y="10" width="10" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M21 18L23 20L25 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function QRIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-700">
      {/* QR Code estilizado */}
      <rect x="4" y="4" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="18" y="4" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="4" y="18" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
      {/* Quadrado inferior direito - scanner style */}
      <path d="M18 18H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 22H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 18V22H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 28H24V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 26V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function QuickActions() {
  return (
    <div className="bg-white">
      <div className="flex items-stretch justify-around py-5 px-4">
        <button className="flex flex-col items-center gap-3 flex-1 group">
          <div className="w-14 h-14 flex items-center justify-center rounded-xl group-hover:bg-gray-50 group-active:bg-gray-100 transition-colors">
            <PixIcon />
          </div>
          <span className="text-sm text-gray-800 font-semibold">Área Pix</span>
        </button>
        
        <div className="w-px bg-gray-200 my-3" />
        
        <button className="flex flex-col items-center gap-3 flex-1 group relative">
          <div className="w-14 h-14 flex items-center justify-center rounded-xl group-hover:bg-gray-50 group-active:bg-gray-100 transition-colors">
            <TransferIcon />
          </div>
          <span className="text-sm text-gray-800 font-semibold">Transferências</span>
          {/* Linha amarela indicadora */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#FFD500] rounded-full" />
        </button>
        
        <div className="w-px bg-gray-200 my-3" />
        
        <button className="flex flex-col items-center gap-3 flex-1 group">
          <div className="w-14 h-14 flex items-center justify-center rounded-xl group-hover:bg-gray-50 group-active:bg-gray-100 transition-colors">
            <QRIcon />
          </div>
          <span className="text-sm text-gray-800 font-semibold text-center leading-tight">Escanear QR Code</span>
        </button>
      </div>
      {/* Divisor sutil que separa do proximo secao */}
      <div className="h-px bg-gray-100" />
    </div>
  )
}
