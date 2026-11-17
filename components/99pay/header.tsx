"use client"

import { HelpCircle, MoreHorizontal } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-5 pt-14 pb-4 bg-[#FFD500]">
      <h1 className="text-2xl font-bold text-black tracking-tight">
        <span className="font-black">99</span>Pay
      </h1>
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors">
          <HelpCircle className="w-6 h-6 text-black" strokeWidth={1.5} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors">
          <MoreHorizontal className="w-6 h-6 text-black" strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}
