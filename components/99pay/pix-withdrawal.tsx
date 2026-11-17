"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { DepositScreen } from "./deposit-screen"

interface PixWithdrawalProps {
  onClose: () => void
  amount?: number
}

type PixStep = "confirm" | "select-bank" | "key-type" | "enter-key" | "transfer" | "payment" | "generating-receipt" | "receipt" | "sending" | "error" | "pending" | "deposit" | "processing" | "success"
type PixKeyType = "cpf" | "email" | "phone" | "random"

const banks = [
  { id: "picpay", name: "PicPay", fullName: "PICPAY INSTITUIÇÃO DE PAGAMENTO S.A.", color: "#11C76F", logo: "P" },
  { id: "nubank", name: "Nubank", fullName: "NU PAGAMENTOS S.A. - INSTITUIÇÃO DE PAGAMENTO", color: "#8A05BE", logo: "N" },
  { id: "itau", name: "Itau", fullName: "ITAÚ UNIBANCO S.A.", color: "#EC7000", logo: "I" },
  { id: "bradesco", name: "Bradesco", fullName: "BANCO BRADESCO S.A.", color: "#CC092F", logo: "B" },
  { id: "santander", name: "Santander", fullName: "BANCO SANTANDER (BRASIL) S.A.", color: "#EC0000", logo: "S" },
  { id: "bb", name: "Banco do Brasil", fullName: "BANCO DO BRASIL S.A.", color: "#FFEF00", logo: "BB", textColor: "#003DA5" },
  { id: "caixa", name: "Caixa", fullName: "CAIXA ECONÔMICA FEDERAL", color: "#0070AF", logo: "C" },
  { id: "inter", name: "Banco Inter", fullName: "BANCO INTER S.A.", color: "#FF7A00", logo: "I" },
  { id: "c6", name: "C6 Bank", fullName: "BANCO C6 S.A.", color: "#000000", logo: "C6" },
  { id: "mercadopago", name: "Mercado Pago", fullName: "MERCADO PAGO INSTITUIÇÃO DE PAGAMENTO LTDA.", color: "#009EE3", logo: "MP" },
]

const keyTypes = [
  { id: "cpf" as PixKeyType, label: "CPF", placeholder: "000.000.000-00", icon: "📄" },
  { id: "email" as PixKeyType, label: "E-mail", placeholder: "seu@email.com", icon: "✉️" },
  { id: "phone" as PixKeyType, label: "Celular", placeholder: "(00) 00000-0000", icon: "📱" },
  { id: "random" as PixKeyType, label: "Chave aleatoria", placeholder: "00000000-0000-0000-0000-000000000000", icon: "🔑" },
]

export function PixWithdrawal({ onClose, amount = 857 }: PixWithdrawalProps) {
  const [step, setStep] = useState<PixStep>("confirm")
  const [selectedBank, setSelectedBank] = useState<typeof banks[0] | null>(null)
  const [selectedKeyType, setSelectedKeyType] = useState<PixKeyType | null>(null)
  const [pixKey, setPixKey] = useState("")
  const [searchBank, setSearchBank] = useState("")
  const [transferAmount, setTransferAmount] = useState("") // Em centavos
  const [userName, setUserName] = useState("USUÁRIO 99PAY")
  const [userCpf, setUserCpf] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [transactionIdE2E, setTransactionIdE2E] = useState("")
  const [transactionDate, setTransactionDate] = useState("")
  const [sendingProgress, setSendingProgress] = useState(0)
  const [generatingProgress, setGeneratingProgress] = useState(0)

  useEffect(() => {
    // Busca o nome em todas as possiveis chaves do localStorage
    const nome = localStorage.getItem('user_nome') 
      || localStorage.getItem('nome') 
      || localStorage.getItem('userName')
      || localStorage.getItem('nomeCompleto')
    const cpf = localStorage.getItem('user_cpf')
      || localStorage.getItem('cpf')
      || localStorage.getItem('userCpf')
    if (nome && nome.trim()) setUserName(nome.toUpperCase().trim())
    if (cpf) setUserCpf(cpf)
  }, [])

  // Adiciona classe no body para esconder o bottom-nav (Corrida/Food/Entrega)
  // enquanto mantem apenas a moedinha $ visivel
  useEffect(() => {
    document.body.classList.add('pix-flow-open')
    return () => {
      document.body.classList.remove('pix-flow-open')
    }
  }, [])

  const filteredBanks = banks.filter(b => 
    b.name.toLowerCase().includes(searchBank.toLowerCase())
  )

  // Calcula iniciais do nome
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean)
    if (parts.length === 0) return "99"
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  // Mascara CPF
  const maskCpf = (cpf: string) => {
    const numeros = cpf.replace(/\D/g, '')
    if (numeros.length !== 11) return "***.***.***-**"
    return `***.${numeros.substring(3, 6)}.${numeros.substring(6, 9)}-**`
  }

  // Formata valor em centavos para R$ X,XX
  const formatCurrency = (cents: string) => {
    const num = parseInt(cents || "0", 10)
    const reais = Math.floor(num / 100)
    const centavos = num % 100
    return `${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`
  }

  const handleConfirmWithdraw = () => {
    setStep("select-bank")
  }

  const handleBankSelect = (bank: typeof banks[0]) => {
    setSelectedBank(bank)
    setStep("key-type")
  }

  const handleKeyTypeSelect = (type: PixKeyType) => {
    setSelectedKeyType(type)
    setStep("enter-key")
  }

  const handleKeySubmit = () => {
    if (pixKey.trim()) {
      // Pre-preenche o valor com o saldo total (857,00 = 85700 centavos)
      setTransferAmount((amount * 100).toString())
      setStep("transfer")
    }
  }

  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      setTransferAmount(prev => prev.slice(0, -1))
    } else {
      setTransferAmount(prev => {
        const newValue = prev + key
        // Limita ao saldo maximo disponível (amount em centavos)
        const maxCentavos = amount * 100
        if (parseInt(newValue, 10) > maxCentavos) return prev
        if (newValue.length > 8) return prev
        return newValue
      })
    }
  }

  const handleTransferContinue = () => {
    const valor = parseInt(transferAmount || "0", 10)
    if (valor > 0) {
      setStep("payment")
    }
  }

  const handlePaymentConfirm = () => {
    // Gera IDs da transação
    const randomId = Math.floor(Math.random() * 9000000000 + 1000000000).toString()
    const randomE2E = `E${Math.floor(Math.random() * 90000000 + 10000000)}${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 14).toUpperCase()}`
    
    // Data formatada
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear()).slice(-2)
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    setTransactionId(randomId)
    setTransactionIdE2E(randomE2E)
    setTransactionDate(`${day}/${month}/${year} ${hours}:${minutes}:${seconds}`)
    
    // Mostra loading de gerando comprovante (15 segundos para animacao completa)
    setStep("generating-receipt")
    setGeneratingProgress(0)

    // Progresso de 15 segundos: 150 ticks de 100ms (100/150 por tick)
    let progress = 0
    const interval = setInterval(() => {
      progress += 100 / 150
      const clamped = Math.min(progress, 100)
      setGeneratingProgress(clamped)
      if (clamped >= 100) {
        clearInterval(interval)
        setTimeout(() => setStep("receipt"), 300)
      }
    }, 100)
  }

  const handleConfirmTransfer = () => {
    setStep("sending")
    setSendingProgress(0)
    
    // Progresso de 15 segundos (150 incrementos de 100ms)
    let progress = 0
    const interval = setInterval(() => {
      progress += 100 / 150
      setSendingProgress(Math.min(progress, 100))
      
      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setStep("error")
        }, 500)
      }
    }, 100)
  }

  const formatKey = (value: string, type: PixKeyType | null) => {
    if (!type) return value
    if (type === "cpf") {
      return value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2").slice(0, 14)
    }
    if (type === "phone") {
      return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15)
    }
    return value
  }

  return (
    <div className="fixed inset-0 bg-white z-[150] flex flex-col animate-in slide-in-from-right duration-300">
      {/* ETAPA: Confirmação inicial */}
      {step === "confirm" && (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#FFFBEB] via-white to-white overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-base text-gray-900">Sacar via PIX</h1>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex flex-col px-5 pt-3">
            {/* Icone PIX central com brilho */}
            <div className="flex justify-center mb-3 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-[#00B89F]/20 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
              </div>
              <div className="relative w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-100">
                <Image
                  src="/images/pix-logo.png"
                  alt="PIX"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Titulo */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1 leading-tight">
              Deseja sacar agora?
            </h2>
            <p className="text-gray-500 text-center text-xs mb-4 px-4 leading-snug">
              Transfira seu saldo via PIX para qualquer banco em segundos e sem taxas
            </p>

            {/* Card de saldo - super destaque */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFE500] via-[#FFD500] to-[#FFB800] rounded-2xl blur-md opacity-60" />
              <div className="relative bg-gradient-to-br from-[#FFE500] to-[#FFC700] rounded-2xl p-4 shadow-2xl shadow-yellow-300/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-3.5 h-3.5 text-[#FFB800]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">Saldo disponível</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/40 backdrop-blur px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-900">ATIVO</span>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-lg font-bold text-gray-900">R$</span>
                  <span className="text-4xl font-bold text-gray-900 leading-none">
                    {Math.floor(amount).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    ,{((amount % 1) * 100).toFixed(0).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-900/10">
                  <svg className="w-3.5 h-3.5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-[11px] text-gray-800 font-semibold">Liberado para saque imediato</span>
                </div>
              </div>
            </div>

            {/* Beneficios */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2.5 bg-white border border-gray-100 p-2.5 rounded-xl shadow-sm">
                <div className="w-9 h-9 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] text-gray-900 leading-tight">Transferência instantânea</p>
                  <p className="text-[11px] text-gray-500 leading-tight">Seu dinheiro cai na conta em segundos</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white border border-gray-100 p-2.5 rounded-xl shadow-sm">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] text-gray-900 leading-tight">100% seguro e protegido</p>
                  <p className="text-[11px] text-gray-500 leading-tight">Transação criptografada pelo BACEN</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white border border-gray-100 p-2.5 rounded-xl shadow-sm">
                <div className="w-9 h-9 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#FFB800]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] text-gray-900 leading-tight">Sem taxas ou descontos</p>
                  <p className="text-[11px] text-gray-500 leading-tight">Você recebe o valor completo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer com botoes */}
          <div className="px-4 pt-2 pb-3 space-y-1.5 bg-white border-t border-gray-100">
            <button
              onClick={handleConfirmWithdraw}
              className="w-full py-3.5 rounded-2xl text-base font-bold bg-gradient-to-r from-[#00B89F] to-[#00A890] text-white active:scale-[0.98] transition-all shadow-xl shadow-teal-200 flex items-center justify-center gap-2 animate-pulse-cta-green animate-button-shine"
            >
              <Image src="/images/pix-logo.png" alt="PIX" width={20} height={20} className="brightness-0 invert" />
              Sacar R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-semibold text-gray-500 active:text-gray-700 transition-colors"
            >
              Sacar mais tarde
            </button>
          </div>
        </div>
      )}

      {/* ETAPA: Selecionar banco */}
      {step === "select-bank" && (
        <>
          <div className="flex items-center gap-3 p-4 border-b">
            <button onClick={() => setStep("confirm")} className="text-2xl text-gray-800">
              &lt;
            </button>
            <h1 className="font-bold text-lg">Escolha o banco</h1>
          </div>

          <div className="px-4 py-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar banco..."
                value={searchBank}
                onChange={(e) => setSearchBank(e.target.value)}
                className="w-full py-3 px-4 pl-11 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFE500]"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <p className="text-xs text-gray-500 font-semibold mb-3 mt-2">BANCOS POPULARES</p>
            <div className="space-y-2">
              {filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleBankSelect(bank)}
                  className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#FFE500] active:scale-98 transition-all"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{ 
                      backgroundColor: bank.color, 
                      color: bank.textColor || "#ffffff" 
                    }}
                  >
                    {bank.logo}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                    <p className="text-xs text-gray-500">Transferência via PIX</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ETAPA: Tipo de chave PIX */}
      {step === "key-type" && selectedBank && (
        <>
          <div className="flex items-center gap-3 p-4 border-b">
            <button onClick={() => setStep("select-bank")} className="text-2xl text-gray-800">
              &lt;
            </button>
            <h1 className="font-bold text-lg">Tipo de chave PIX</h1>
          </div>

          <div className="px-4 py-4">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor || "#ffffff" }}
              >
                {selectedBank.logo}
              </div>
              <div>
                <p className="text-xs text-gray-500">Enviando para</p>
                <p className="font-semibold text-gray-900">{selectedBank.name}</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">Selecione o tipo da chave PIX do destinatário:</p>

            <div className="space-y-2">
              {keyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleKeyTypeSelect(type.id)}
                  className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#FFE500] active:scale-98 transition-all"
                >
                  <div className="w-12 h-12 bg-[#FFF8E1] rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    {type.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{type.label}</h3>
                    <p className="text-xs text-gray-500">{type.placeholder}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ETAPA: Digitar chave */}
      {step === "enter-key" && selectedKeyType && selectedBank && (
        <>
          <div className="flex items-center gap-3 p-4 border-b">
            <button onClick={() => setStep("key-type")} className="text-2xl text-gray-800">
              &lt;
            </button>
            <h1 className="font-bold text-lg">Digite a chave PIX</h1>
          </div>

          <div className="flex-1 px-4 py-4">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor || "#ffffff" }}
              >
                {selectedBank.logo}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Enviando para {selectedBank.name}</p>
                <p className="font-semibold text-gray-900">{keyTypes.find(k => k.id === selectedKeyType)?.label}</p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chave PIX ({keyTypes.find(k => k.id === selectedKeyType)?.label})
            </label>
            <input
              type={selectedKeyType === "email" ? "email" : "text"}
              value={pixKey}
              onChange={(e) => setPixKey(formatKey(e.target.value, selectedKeyType))}
              placeholder={keyTypes.find(k => k.id === selectedKeyType)?.placeholder}
              className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFE500] focus:border-transparent text-lg"
              autoFocus
            />

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-900">
                Digite a chave PIX cadastrada na conta de destino. Confira bem antes de continuar.
              </p>
            </div>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleKeySubmit}
              disabled={!pixKey.trim()}
              className={`w-full py-4 rounded-xl text-base font-bold bg-[#FFE500] text-gray-900 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 transition-all shadow-lg ${
                pixKey.trim() ? "animate-pulse-cta animate-button-shine" : ""
              }`}
            >
              Continuar
            </button>
          </div>
        </>
      )}

      {/* ETAPA: Transferência PIX (estilo 99Pay) */}
      {step === "transfer" && selectedBank && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-center relative px-4 pt-4 pb-2">
            <button 
              onClick={() => setStep("enter-key")} 
              className="absolute left-4 text-2xl text-gray-800"
            >
              &lt;
            </button>
            <h1 className="font-bold text-base text-gray-900">Transferência Pix</h1>
          </div>

          {/* Conteudo scrollavel */}
          <div className="flex-1 overflow-y-auto px-4 pt-4">
            {/* Info do destinatário */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-700 font-bold text-base">{getInitials(userName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">
                  {userName}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 leading-snug">
                  {maskCpf(userCpf)}, {selectedBank?.fullName || "99PAY IP S.A."}
                </p>
              </div>
            </div>

            {/* Campo de valor (apenas exibicao, sem edicao) */}
            <div className="border-2 border-[#FFE500] bg-gradient-to-br from-yellow-50/60 to-white rounded-2xl p-5 mb-3 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Valor a transferir
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-700">R$</span>
                <span className="text-5xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(transferAmount)}
                </span>
              </div>
            </div>

            {/* Saldo disponível */}
            <div className="flex items-center gap-2 mb-6 px-1">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600">
                Saldo disponível: <span className="font-bold text-gray-900">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </span>
            </div>

            {/* Card de opções */}
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4">
                <span className="font-semibold text-gray-900 text-sm">Horário de transferência</span>
                <div className="flex items-center gap-1 text-gray-600">
                  <span className="text-sm">Agora</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="h-px bg-gray-200 mx-4" />
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">Transferências recorrentes</span>
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                    <span className="text-gray-400 text-[9px]">?</span>
                  </div>
                </div>
                <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>
          </div>

          {/* Botao Continuar - grande e destacado */}
          <div className="px-4 py-5 bg-[#f5f5f5]">
            <button
              onClick={handleTransferContinue}
              disabled={!transferAmount || parseInt(transferAmount, 10) === 0}
              className={`w-full py-5 rounded-2xl text-xl font-bold bg-[#FFE500] text-gray-900 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                transferAmount && parseInt(transferAmount, 10) > 0 ? "animate-pulse-cta animate-button-shine" : ""
              }`}
            >
              Continuar
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ETAPA: Confirmação de Pagamento */}
      {step === "payment" && (
        <div className="fixed inset-0 bg-[#f5f5f5] z-[150] flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-[#f5f5f5] pt-4 pb-6 relative">
            <button 
              onClick={() => setStep("transfer")} 
              className="absolute left-4 top-4 text-2xl text-gray-800"
            >
              &lt;
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-700 font-normal mt-2">Transferência Pix</p>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-lg font-bold text-gray-900">R$</span>
                <span className="text-4xl font-bold text-gray-900">
                  {formatCurrency(transferAmount)}
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-3 px-6">
                {userName.length > 30 ? userName.substring(0, 30) + "..." : userName}
              </p>
              <p className="text-xs text-gray-500 mt-1 px-6">
                {selectedBank?.fullName || "99PAY IP S.A."}
              </p>
            </div>
          </div>

          {/* Conteudo */}
          <div className="flex-1 px-4 overflow-y-auto">
            {/* Card Saldo */}
            <div className="bg-white rounded-2xl p-4 mb-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#FFE500] flex items-center justify-center">
                <Image
                  src="/images/99pay-icon.png"
                  alt="99Pay"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">Saldo</h3>
                <p className="text-gray-500 text-sm">
                  Saldo: R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#FFE500] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Card Adicionar cartao parcelamento */}
            <div className="bg-white rounded-2xl p-4 mb-3 relative">
              <div className="absolute -top-0 right-4 bg-[#FFF8D6] px-2 py-0.5 rounded-b-lg">
                <span className="text-[10px] font-semibold text-gray-800">Ganhe até 100%</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="2" y="6" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <line x1="18" y1="15" x2="18" y2="19" />
                    <line x1="16" y1="17" x2="20" y2="17" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 flex-1">Adicionar cartao para parcelamento</h3>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              {/* Bandeiras */}
              <div className="flex items-center gap-2 mb-3 ml-12">
                <div className="bg-gray-100 rounded px-2 py-1">
                  <span className="text-[11px] font-bold text-blue-900 italic">VISA</span>
                </div>
                <div className="bg-gray-100 rounded px-2 py-1 flex items-center gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 -ml-1" />
                </div>
                <div className="bg-gray-100 rounded px-2 py-1 flex items-center gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-[10px] font-bold text-gray-700">elo</span>
                </div>
              </div>

              {/* Tags verdes */}
              <div className="flex items-center gap-2 ml-12 flex-wrap">
                <div className="bg-green-50 border border-green-100 rounded-md px-2 py-1 flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C11.01 2.51 10.03 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-green-700">Ganhe até R$628,00</span>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-md px-2 py-1 flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C11.01 2.51 10.03 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-green-700">Ate 12x parcelas</span>
                </div>
              </div>
            </div>

            {/* Botao Adicionar cartao credito/debito */}
            <button className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
              <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-bold text-gray-900">Adicionar cartao credito ou debito</span>
            </button>
          </div>

          {/* Banner Prêmio */}
          <div className="bg-[#E8F5E9] py-3 px-4 flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C11.01 2.51 10.03 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
            </svg>
            <span className="text-sm font-semibold text-green-800">Prêmio até R$99,00</span>
          </div>

          {/* Footer com botao Pagar */}
          <div className="bg-white px-4 py-4 flex items-center gap-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-900 text-lg">
                R${formatCurrency(transferAmount)}
              </span>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </div>
            <button
              onClick={handlePaymentConfirm}
              className="flex-1 py-4 rounded-2xl text-base font-bold bg-[#FFE500] text-gray-900 active:scale-95 transition-all animate-pulse-cta animate-button-shine"
            >
              Concluir transferência
            </button>
          </div>
        </div>
      )}

      {/* ETAPA: Gerando comprovante - estilo banco profissional */}
      {step === "generating-receipt" && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col animate-in fade-in duration-400 overflow-hidden">
          {/* Faixa decorativa superior amarela */}
          <div className="absolute top-0 inset-x-0 h-[220px] bg-gradient-to-b from-[#FFF9D6] via-[#FFFCEC] to-white pointer-events-none" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFE500]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-0 w-48 h-48 bg-[#FFB800]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header do app - estilo banco */}
          <div className="relative z-10 pt-5 px-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFE500] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-gray-900 font-black text-sm">99</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium leading-none">99Pay</p>
                <p className="text-xs font-bold text-gray-900 leading-tight">Transferência PIX</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-700 tracking-wide">AO VIVO</span>
            </div>
          </div>

          {/* Conteudo principal scrollavel */}
          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2">
            {/* Loader circular profissional */}
            <div className="flex flex-col items-center mb-3">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Anel de fundo */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#F3F4F6"
                    strokeWidth="5"
                  />
                </svg>

                {/* Anel animado com gradiente conic */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0deg, transparent 180deg, #FFE500 270deg, #FFB800 360deg)",
                    mask: "radial-gradient(circle, transparent 50px, black 52px, black 61px, transparent 63px)",
                    WebkitMask: "radial-gradient(circle, transparent 50px, black 52px, black 61px, transparent 63px)",
                    animation: "conic-rotate 1.6s linear infinite",
                  }}
                />

                {/* Pontos pulsantes ao redor */}
                <div className="absolute inset-0" style={{ animation: "conic-rotate 3s linear infinite" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#FFE500] rounded-full shadow-md shadow-yellow-300" />
                </div>

                {/* Centro - Logo PIX 3D com spinner de carregamento */}
                <div className="relative w-[72px] h-[72px] bg-white rounded-full shadow-[0_10px_40px_-8px_rgba(255,213,0,0.5)] flex items-center justify-center border border-gray-100">
                  {/* Spinner circular girando ao redor do logo */}
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 72 72"
                    style={{ animation: "conic-rotate 1.2s linear infinite" }}
                  >
                    <circle
                      cx="36"
                      cy="36"
                      r="33"
                      fill="none"
                      stroke="#FFE500"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="45 165"
                    />
                  </svg>
                  {/* Segundo spinner mais rapido em direcao contraria para dar profundidade */}
                  <svg
                    className="absolute inset-0 w-full h-full rotate-90"
                    viewBox="0 0 72 72"
                    style={{ animation: "conic-rotate-reverse 1.8s linear infinite" }}
                  >
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="none"
                      stroke="#FFB800"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray="23 165"
                      opacity="0.6"
                    />
                  </svg>
                  <Image
                    src="/images/pix-3d-logo.png"
                    alt="PIX"
                    width={52}
                    height={52}
                    className="w-12 h-12 object-contain relative z-10"
                    style={{ animation: "document-float 3s ease-in-out infinite" }}
                  />
                </div>
              </div>

              {/* Titulo e subtitulo */}
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mt-3 mb-0.5">
                Gerando comprovante
              </h2>
              <p className="text-[11px] text-gray-500 text-center max-w-[260px] leading-snug">
                Compondo seu comprovante oficial com assinatura digital do Banco Central
              </p>
            </div>

            {/* Card de detalhes da transação - estilo banco */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden mb-2"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.2s" }}
            >
              {/* Valor da transferência */}
              <div className="bg-gradient-to-br from-gray-50 to-white px-3 py-2 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Valor da transferência
                </p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">
                  R$ {formatCurrency(transferAmount)}
                </p>
              </div>

              {/* Origem e destino */}
              <div className="px-3 py-2 space-y-1.5">
                {/* DE */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#FFE500] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-gray-900 font-black text-[10px]">{getInitials(userName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">De</p>
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">{userName}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">99Pay {userCpf ? `- ${maskCpf(userCpf)}` : ""}</p>
                  </div>
                </div>

                {/* Linha de conexao com seta animada */}
                <div className="flex items-center gap-2.5 pl-1">
                  <div className="w-0.5 h-4 bg-gradient-to-b from-[#FFE500] to-[#FFB800] relative overflow-hidden rounded-full">
                    <div
                      className="absolute inset-x-0 h-2 bg-white/60 rounded-full"
                      style={{ animation: "transfer-flow 1.4s ease-in-out infinite" }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[#FFB800] uppercase tracking-wider">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 2l3 6 5-4-1 7 6 1-4 5 4 6-7-1-1 6-5-5-6 2 2-7-6-3 5-4-3-6 7 0z" />
                    </svg>
                    Enviando...
                  </div>
                </div>

                {/* PARA */}
                <div className="flex items-center gap-2.5">
                  {selectedBank ? (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: selectedBank.color }}
                    >
                      <span
                        className="font-black text-[10px]"
                        style={{ color: selectedBank.textColor || "#ffffff" }}
                      >
                        {selectedBank.logo}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">Para</p>
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                      {selectedBank?.name || "Banco destinatário"}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate leading-tight">
                      {pixKey || "Chave PIX"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper profissional */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] p-3 mb-2"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.4s" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">Status do processamento</p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-[#FFE500] rounded-full" style={{ animation: "dot-bounce 1.4s ease-in-out infinite" }} />
                  <div className="w-1 h-1 bg-[#FFE500] rounded-full" style={{ animation: "dot-bounce 1.4s ease-in-out infinite", animationDelay: "0.15s" }} />
                  <div className="w-1 h-1 bg-[#FFE500] rounded-full" style={{ animation: "dot-bounce 1.4s ease-in-out infinite", animationDelay: "0.3s" }} />
                </div>
              </div>

              <div className="space-y-0">
                {/* Etapa 1 - Concluida */}
                <div className="flex items-start gap-2.5 pb-1.5 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="w-0.5 flex-1 bg-green-500 mt-0.5" style={{ minHeight: "10px" }} />
                  </div>
                  <div className="flex-1 pt-0 pb-1.5">
                    <p className="text-xs font-bold text-gray-900 leading-tight">Autenticação verificada</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Identidade confirmada via biometria</p>
                  </div>
                  <span className="text-[10px] text-green-600 font-bold pt-0.5">100%</span>
                </div>

                {/* Etapa 2 - Concluida */}
                <div className="flex items-start gap-2.5 pb-1.5 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-green-500 to-[#FFE500] mt-0.5" style={{ minHeight: "10px" }} />
                  </div>
                  <div className="flex-1 pt-0 pb-1.5">
                    <p className="text-xs font-bold text-gray-900 leading-tight">Chave PIX validada</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Destinatário verificado no DICT</p>
                  </div>
                  <span className="text-[10px] text-green-600 font-bold pt-0.5">100%</span>
                </div>

                {/* Etapa 3 - Gerando comprovante (ativa ate 70%) */}
                <div className="flex items-start gap-2.5 pb-1.5 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {generatingProgress >= 70 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="relative w-6 h-6 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                        <svg className="w-3 h-3 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 rounded-full border-2 border-[#FFE500]/40" style={{ animation: "pulse-ring 2s ease-out infinite" }} />
                      </div>
                    )}
                    <div className={`w-0.5 flex-1 mt-0.5 ${generatingProgress >= 70 ? "bg-green-500" : "bg-gray-200"}`} style={{ minHeight: "10px" }} />
                  </div>
                  <div className="flex-1 pt-0 pb-1.5">
                    <p className="text-xs font-bold text-gray-900 leading-tight">Gerando comprovante oficial</p>
                    <p className="text-[10px] text-gray-600 leading-tight">Compondo documento com ID único</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-0.5 ${generatingProgress >= 70 ? "text-green-600" : "text-[#FFB800]"}`}>
                    {generatingProgress >= 70 ? "100%" : `${Math.round(Math.min(100, (generatingProgress / 70) * 100))}%`}
                  </span>
                </div>

                {/* Etapa 4 - Registro BACEN (ativa apos 70%) */}
                <div className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {generatingProgress >= 100 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : generatingProgress >= 70 ? (
                      <div className="relative w-6 h-6 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                        <svg className="w-3 h-3 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-0">
                    <p className={`text-xs font-bold leading-tight ${generatingProgress >= 70 ? "text-gray-900" : "text-gray-500"}`}>Registro no BACEN</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Protocolo SPI - Sistema de Pagamentos Instantâneos</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-0.5 ${generatingProgress >= 100 ? "text-green-600" : generatingProgress >= 70 ? "text-[#FFB800]" : "text-gray-400"}`}>
                    {generatingProgress >= 100 ? "100%" : generatingProgress >= 70 ? `${Math.round(((generatingProgress - 70) / 30) * 100)}%` : "Aguardando"}
                  </span>
                </div>
              </div>
            </div>

            {/* Selos de segurança - estilo certificação bancaria */}
            <div className="grid grid-cols-3 gap-1.5"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.6s" }}
            >
              <div className="bg-white rounded-lg border border-gray-200 p-1.5 flex flex-col items-center justify-center text-center">
                <svg className="w-4 h-4 text-green-600 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" />
                </svg>
                <p className="text-[9px] font-bold text-gray-700 leading-tight">Certificado</p>
                <p className="text-[8px] text-gray-500 leading-tight">BACEN</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-1.5 flex flex-col items-center justify-center text-center">
                <svg className="w-4 h-4 text-gray-700 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-[9px] font-bold text-gray-700 leading-tight">Criptografia</p>
                <p className="text-[8px] text-gray-500 leading-tight">256-bit SSL</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-1.5 flex flex-col items-center justify-center text-center">
                <svg className="w-4 h-4 text-[#FFB800] mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <p className="text-[9px] font-bold text-gray-700 leading-tight">PIX Oficial</p>
                <p className="text-[8px] text-gray-500 leading-tight">Banco Central</p>
              </div>
            </div>
          </div>

          {/* Footer fixo - barra de progresso com porcentagem real */}
          <div className="relative z-10 border-t border-gray-100 bg-white px-4 pt-3 pb-4">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden relative mb-2">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFE500] to-[#FFB800] rounded-full transition-all duration-100"
                style={{ width: `${generatingProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span className="text-[10px] text-gray-600 font-medium">Transação criptografada</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono tracking-wide font-semibold">{Math.round(generatingProgress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA: Comprovante de transferência */}
      {step === "receipt" && (
        <div className="fixed inset-0 bg-[#f5f5f5] z-[150] flex flex-col animate-in fade-in duration-300 overflow-y-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <button 
              onClick={() => setStep("payment")} 
              className="text-2xl text-gray-800"
            >
              &lt;
            </button>
            <button className="text-gray-800">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 12m4-4v12" />
              </svg>
            </button>
          </div>

          {/* Titulo e valor */}
          <div className="px-4 pb-6 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Comprovante de transferência</h1>
              <p className="text-4xl font-bold text-[#00D4A0]">R${formatCurrency(transferAmount)}</p>
            </div>
            {/* Logo PIX 3D ao lado direito - maior */}
            <Image
              src="/images/pix-3d-logo.png"
              alt="PIX"
              width={160}
              height={160}
              className="w-32 h-32 object-contain flex-shrink-0 drop-shadow-xl -mt-3 -mr-2"
            />
          </div>

          {/* Card de detalhes */}
          <div className="mx-4 bg-white rounded-2xl p-5 mb-3">
            <h3 className="font-bold text-gray-900 text-base mb-4">Detalhes da transação</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Transferir para</span>
                <span className="font-bold text-gray-900 text-sm text-right max-w-[60%]">
                  {userName}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Data de pagamento</span>
                <span className="font-bold text-gray-900 text-sm">{transactionDate}</span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">ID da transação 99Pay</span>
                <span className="font-bold text-gray-900 text-sm">{transactionId}</span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">ID da transação</span>
                <span className="font-bold text-gray-900 text-sm text-right max-w-[60%] break-all">
                  {transactionIdE2E}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Valor da conta</span>
                <span className="font-bold text-gray-900 text-sm">R${formatCurrency(transferAmount)}</span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Observação</span>
                <span className="font-bold text-gray-900 text-sm">-</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-5" />

            <h3 className="font-bold text-gray-900 text-base mb-4">Detalhes do remetente</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Instituição</span>
                <span className="font-bold text-gray-900 text-sm">99PAY IP S.A.</span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Nome</span>
                <span className="font-bold text-gray-900 text-sm text-right max-w-[60%]">
                  {userName}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">CPF</span>
                <span className="font-bold text-gray-900 text-sm">{maskCpf(userCpf)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-5" />

            <h3 className="font-bold text-gray-900 text-base mb-4">Detalhes do destinatário</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Instituição</span>
                <span className="font-bold text-gray-900 text-sm text-right max-w-[60%]">
                  {selectedBank?.fullName || "PICPAY INSTITUIÇÃO DE PAGAMENTO S.A."}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Nome</span>
                <span className="font-bold text-gray-900 text-sm text-right max-w-[60%]">
                  {userName}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 text-sm">Chave Pix</span>
                <span className="font-bold text-gray-900 text-sm text-right max-w-[60%] break-all">
                  {pixKey}
                </span>
              </div>
            </div>
          </div>

          {/* Aviso importante: confira os dados */}
          <div className="mx-4 mb-3 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-900 text-sm mb-1 leading-tight">
                  Confira seus dados antes de finalizar
                </p>
                <p className="text-amber-800 text-xs leading-relaxed">
                  A <span className="font-bold">99Pay</span> irá verificar se suas informações estão corretas. Revise o <span className="font-bold">nome</span>, a <span className="font-bold">chave PIX</span> e o <span className="font-bold">valor</span> antes de confirmar para evitar qualquer tipo de erro na sua transferência.
                </p>
              </div>
            </div>
          </div>

          {/* Botao confirmar */}
          <div className="p-4 bg-[#f5f5f5] mt-auto sticky bottom-0">
            <button
              onClick={handleConfirmTransfer}
              className="w-full py-4 rounded-2xl text-lg font-bold bg-[#FFE500] text-gray-900 active:scale-95 transition-all shadow-md animate-pulse-cta animate-button-shine"
            >
              Confirmar transferência
            </button>
          </div>
        </div>
      )}

      {/* ETAPA: Enviando transferência PIX (15s) - mesmo design profissional de banco */}
      {step === "sending" && (
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
                <p className="text-xs font-bold text-gray-900 leading-tight">Transferência PIX</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-700 tracking-wide">AO VIVO</span>
            </div>
          </div>

          {/* Conteudo principal */}
          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2">
            {/* Loader circular com % real */}
            <div className="flex flex-col items-center mb-3">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Anel de fundo */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64" cy="64" r="56"
                    fill="none" stroke="#F3F4F6" strokeWidth="5"
                  />
                  {/* Progresso real */}
                  <circle
                    cx="64" cy="64" r="56"
                    fill="none" stroke="url(#sendingGradient)" strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${sendingProgress * 3.52} 352`}
                    className="transition-all duration-100 drop-shadow-[0_0_8px_rgba(255,229,0,0.5)]"
                  />
                  <defs>
                    <linearGradient id="sendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFE500" />
                      <stop offset="100%" stopColor="#FFB800" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Ponto pulsante no inicio do progresso */}
                <div
                  className="absolute inset-0"
                  style={{ transform: `rotate(${sendingProgress * 3.6}deg)` }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FFE500] rounded-full shadow-md shadow-yellow-400 animate-pulse" />
                </div>

                {/* Centro - Logo PIX 3D com spinners duplos */}
                <div className="relative w-[72px] h-[72px] bg-white rounded-full shadow-[0_10px_40px_-8px_rgba(255,213,0,0.5)] flex items-center justify-center border border-gray-100">
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 72 72"
                    style={{ animation: "conic-rotate 1.2s linear infinite" }}
                  >
                    <circle
                      cx="36" cy="36" r="33"
                      fill="none" stroke="#FFE500" strokeWidth="2.5"
                      strokeLinecap="round" strokeDasharray="45 165"
                    />
                  </svg>
                  <svg
                    className="absolute inset-0 w-full h-full rotate-90"
                    viewBox="0 0 72 72"
                    style={{ animation: "conic-rotate-reverse 1.8s linear infinite" }}
                  >
                    <circle
                      cx="36" cy="36" r="30"
                      fill="none" stroke="#FFB800" strokeWidth="1.5"
                      strokeLinecap="round" strokeDasharray="23 165" opacity="0.6"
                    />
                  </svg>
                  <Image
                    src="/images/pix-3d-logo.png"
                    alt="PIX"
                    width={52}
                    height={52}
                    className="w-12 h-12 object-contain relative z-10"
                    style={{ animation: "document-float 3s ease-in-out infinite" }}
                  />
                </div>
              </div>

              {/* Titulo dinamico */}
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mt-3 mb-0.5 text-center">
                {sendingProgress < 20 && "Conectando..."}
                {sendingProgress >= 20 && sendingProgress < 45 && "Validando dados"}
                {sendingProgress >= 45 && sendingProgress < 70 && "Processando PIX"}
                {sendingProgress >= 70 && sendingProgress < 95 && "Quase lá!"}
                {sendingProgress >= 95 && "Finalizando..."}
              </h2>
              <p className="text-[11px] text-gray-500 text-center max-w-[260px] leading-snug">
                {sendingProgress < 20 && "Estabelecendo conexão segura com o Banco Central"}
                {sendingProgress >= 20 && sendingProgress < 45 && "Verificando chave PIX do destinatário"}
                {sendingProgress >= 45 && sendingProgress < 70 && `Enviando R$ ${formatCurrency(transferAmount)} para ${selectedBank?.name || "destinatário"}`}
                {sendingProgress >= 70 && sendingProgress < 95 && "Confirmando transferência no sistema"}
                {sendingProgress >= 95 && "Concluindo operação"}
              </p>
            </div>

            {/* Card de detalhes da transação */}
            <div
              className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden mb-2"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.2s" }}
            >
              {/* Valor */}
              <div className="bg-gradient-to-br from-gray-50 to-white px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                    Valor da transferência
                  </p>
                  <p className="text-xl font-bold text-gray-900 tracking-tight">
                    R$ {formatCurrency(transferAmount)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#FFE500]/20 border border-[#FFE500]/40 px-1.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-gray-800 tracking-wide">EM ANDAMENTO</span>
                </div>
              </div>

              {/* Origem e destino */}
              <div className="px-3 py-2 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#FFE500] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-gray-900 font-black text-[10px]">{getInitials(userName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">De</p>
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">{userName}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">99Pay {userCpf ? `- ${maskCpf(userCpf)}` : ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pl-1">
                  <div className="w-0.5 h-4 bg-gradient-to-b from-[#FFE500] to-[#FFB800] relative overflow-hidden rounded-full">
                    <div
                      className="absolute inset-x-0 h-2 bg-white/60 rounded-full"
                      style={{ animation: "transfer-flow 1.4s ease-in-out infinite" }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[#FFB800] uppercase tracking-wider">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 2l3 6 5-4-1 7 6 1-4 5 4 6-7-1-1 6-5-5-6 2 2-7-6-3 5-4-3-6 7 0z" />
                    </svg>
                    Enviando...
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {selectedBank ? (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: selectedBank.color }}
                    >
                      <span
                        className="font-black text-[10px]"
                        style={{ color: selectedBank.textColor || "#ffffff" }}
                      >
                        {selectedBank.logo}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">Para</p>
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                      {selectedBank?.name || "Banco destinatário"}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate leading-tight">
                      {pixKey || "Chave PIX"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper com progresso real */}
            <div
              className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] p-3 mb-2"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.4s" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">Status do envio</p>
                <span className="text-[11px] font-bold text-[#FFB800]">{Math.round(sendingProgress)}%</span>
              </div>

              <div className="space-y-0">
                {/* Etapa 1 - Conectando */}
                <div className="flex items-start gap-2.5 pb-1.5 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {sendingProgress >= 20 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="relative w-6 h-6 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                        <svg className="w-3 h-3 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-0.5 flex-1 mt-0.5 ${sendingProgress >= 20 ? "bg-green-500" : "bg-gray-200"}`} style={{ minHeight: "10px" }} />
                  </div>
                  <div className="flex-1 pt-0 pb-1.5">
                    <p className="text-xs font-bold text-gray-900 leading-tight">Conexão segura</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Canal criptografado com BACEN</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-0.5 ${sendingProgress >= 20 ? "text-green-600" : "text-[#FFB800]"}`}>
                    {sendingProgress >= 20 ? "100%" : "..."}
                  </span>
                </div>

                {/* Etapa 2 - Validando */}
                <div className="flex items-start gap-2.5 pb-1.5 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {sendingProgress >= 45 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : sendingProgress >= 20 ? (
                      <div className="relative w-6 h-6 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                        <svg className="w-3 h-3 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      </div>
                    )}
                    <div className={`w-0.5 flex-1 mt-0.5 ${sendingProgress >= 45 ? "bg-green-500" : "bg-gray-200"}`} style={{ minHeight: "10px" }} />
                  </div>
                  <div className="flex-1 pt-0 pb-1.5">
                    <p className={`text-xs font-bold leading-tight ${sendingProgress >= 20 ? "text-gray-900" : "text-gray-500"}`}>Validação de dados</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Chave PIX verificada no DICT</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-0.5 ${sendingProgress >= 45 ? "text-green-600" : sendingProgress >= 20 ? "text-[#FFB800]" : "text-gray-400"}`}>
                    {sendingProgress >= 45 ? "100%" : sendingProgress >= 20 ? "..." : "Aguardando"}
                  </span>
                </div>

                {/* Etapa 3 - Processando */}
                <div className="flex items-start gap-2.5 pb-1.5 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {sendingProgress >= 70 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : sendingProgress >= 45 ? (
                      <div className="relative w-6 h-6 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                        <svg className="w-3 h-3 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      </div>
                    )}
                    <div className={`w-0.5 flex-1 mt-0.5 ${sendingProgress >= 70 ? "bg-green-500" : "bg-gray-200"}`} style={{ minHeight: "10px" }} />
                  </div>
                  <div className="flex-1 pt-0 pb-1.5">
                    <p className={`text-xs font-bold leading-tight ${sendingProgress >= 45 ? "text-gray-900" : "text-gray-500"}`}>Processando PIX</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Enviando valor ao banco destinatário</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-0.5 ${sendingProgress >= 70 ? "text-green-600" : sendingProgress >= 45 ? "text-[#FFB800]" : "text-gray-400"}`}>
                    {sendingProgress >= 70 ? "100%" : sendingProgress >= 45 ? "..." : "Aguardando"}
                  </span>
                </div>

                {/* Etapa 4 - Finalizando */}
                <div className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {sendingProgress >= 95 ? (
                      <div className="relative w-6 h-6 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                        <svg className="w-3 h-3 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 border-2 border-gray-200 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-0">
                    <p className={`text-xs font-bold leading-tight ${sendingProgress >= 70 ? "text-gray-900" : "text-gray-500"}`}>Finalizando transferência</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Registrando comprovante oficial</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-0.5 ${sendingProgress >= 95 ? "text-[#FFB800]" : "text-gray-400"}`}>
                    {sendingProgress >= 95 ? "..." : "Aguardando"}
                  </span>
                </div>
              </div>
            </div>

            {/* Selos de segurança */}
            <div
              className="grid grid-cols-3 gap-1.5"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.6s" }}
            >
              <div className="bg-white rounded-lg border border-gray-200 p-1.5 flex flex-col items-center justify-center text-center">
                <svg className="w-4 h-4 text-green-600 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" />
                </svg>
                <p className="text-[9px] font-bold text-gray-700 leading-tight">Certificado</p>
                <p className="text-[8px] text-gray-500 leading-tight">BACEN</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-1.5 flex flex-col items-center justify-center text-center">
                <svg className="w-4 h-4 text-gray-700 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-[9px] font-bold text-gray-700 leading-tight">Criptografia</p>
                <p className="text-[8px] text-gray-500 leading-tight">256-bit SSL</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-1.5 flex flex-col items-center justify-center text-center">
                <svg className="w-4 h-4 text-[#FFB800] mb-0.5" fill="currentColor" viewBox="0 0 24 24">
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
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFE500] to-[#FFB800] rounded-full transition-all duration-100"
                style={{ width: `${sendingProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span className="text-[10px] text-gray-600 font-medium">Transação criptografada</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono tracking-wide">{Math.round(sendingProgress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA: Erro na transferência - aparece apos sending finalizar */}
      {step === "error" && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col animate-in fade-in duration-400 overflow-hidden">
          {/* Faixa decorativa superior em tom de alerta */}
          <div className="absolute top-0 inset-x-0 h-[220px] bg-gradient-to-b from-red-50 via-orange-50/60 to-white pointer-events-none" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-red-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-0 w-48 h-48 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header do app */}
          <div className="relative z-10 pt-5 px-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFE500] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-gray-900 font-black text-sm">99</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium leading-none">99Pay</p>
                <p className="text-xs font-bold text-gray-900 leading-tight">Transferência PIX</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold text-red-700 tracking-wide">ATENÇÃO</span>
            </div>
          </div>

          {/* Conteudo principal */}
          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2">
            {/* Icone de erro animado */}
            <div className="flex flex-col items-center mb-3">
              <div className="relative w-28 h-28 flex items-center justify-center mb-1">
                {/* Aneis pulsantes */}
                <div
                  className="absolute w-28 h-28 rounded-full border border-red-300/60"
                  style={{ animation: "pulse-ring 2.5s ease-out infinite" }}
                />
                <div
                  className="absolute w-20 h-20 rounded-full border-2 border-red-300/50"
                  style={{ animation: "pulse-ring 2.5s ease-out infinite", animationDelay: "0.8s" }}
                />

                {/* Circulo central com X */}
                <div className="relative w-[72px] h-[72px] bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-[0_10px_40px_-8px_rgba(239,68,68,0.6)] flex items-center justify-center border-4 border-white">
                  <svg
                    className="w-9 h-9 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    style={{ animation: "document-float 2.5s ease-in-out infinite" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1 mb-1 text-center leading-tight">
                Aconteceu um erro
              </h2>
              <p className="text-sm text-gray-700 text-center max-w-[320px] leading-snug font-medium">
                Não foi possível finalizar sua transferência neste momento
              </p>
            </div>

            {/* Card com detalhes do erro */}
            <div
              className="bg-white rounded-2xl border-2 border-red-200 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.15)] overflow-hidden mb-3"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.2s" }}
            >
              <div className="bg-gradient-to-br from-red-50 to-white px-4 py-3 border-b border-red-100 flex items-start gap-2.5">
                <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-gray-900 leading-tight mb-1">
                    Transferência não concluída
                  </p>
                  <p className="text-xs text-gray-700 leading-snug">
                    Detectamos uma pendência na sua conta que impediu a finalização. Verifique agora para resolver e liberar sua transferência.
                  </p>
                </div>
              </div>

              {/* Código do erro */}
              <div className="px-4 py-2.5 flex items-center justify-between bg-gray-50/60">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Código do erro</p>
                  <p className="text-sm font-mono font-extrabold text-gray-900">ERR_PIX_PEND_0047</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Valor</p>
                  <p className="text-sm font-extrabold text-gray-900">R$ {formatCurrency(transferAmount)}</p>
                </div>
              </div>
            </div>

            {/* Card informativo */}
            <div
              className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 mb-2"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.4s" }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-amber-950 leading-tight mb-0.5">
                    O que aconteceu?
                  </p>
                  <p className="text-xs text-amber-900 leading-snug font-medium">
                    Sua conta precisa de uma verificação adicional para liberar transferências acima do limite atual. Clique no botão abaixo para verificar e liberar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer com botao de acao */}
          <div className="relative z-10 border-t border-gray-100 bg-white px-4 pt-2 pb-3">
            <button
              onClick={() => setStep("pending")}
              className="w-full py-3.5 rounded-2xl text-base font-extrabold bg-[#FFE500] text-gray-900 active:scale-95 transition-all shadow-md animate-pulse-cta animate-button-shine flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verificar agora
            </button>
            <p className="text-center text-[10px] text-gray-600 mt-1.5 font-medium">
              Resolva em poucos minutos para receber o valor
            </p>
          </div>
        </div>
      )}

      {/* ETAPA: Transferência pendente */}
      {step === "pending" && (
        <div className="fixed inset-0 bg-gradient-to-b from-[#FFF8E1] via-[#f5f5f5] to-[#f5f5f5] z-[150] flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-800 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1.5 rounded-full border border-orange-200">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wide">Pendente</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col px-5 pb-4">
            {/* Icone de alerta animado */}
            <div className="flex justify-center mt-3 mb-3 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-orange-300/40 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              </div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-xl shadow-orange-300/50">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Titulo e subtitulo com texto explicativo inicial */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2 leading-tight">
              Transferência Pendente
            </h1>

            <p className="text-gray-700 text-center text-sm mb-4 leading-snug px-1">
              Sua transferência de <span className="font-bold text-gray-900">R$ {formatCurrency(transferAmount)}</span> ficou pendente. Para liberar o valor, é necessário <span className="font-bold text-gray-900">ativar sua conta 99Pay</span> com um depósito único, que será <span className="font-bold text-gray-900">reembolsado junto com a transferência</span>.
            </p>

            {/* Card destaque - Depósito de ativação com SOMA CLARA */}
            <div className="relative mb-3">
              {/* Fundo com gradiente */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFE500] via-[#FFD500] to-[#FFB800] rounded-2xl blur-sm opacity-50" />
              <div className="relative bg-gradient-to-br from-[#FFE500] to-[#FFC700] rounded-2xl p-3.5 shadow-2xl shadow-yellow-300/40">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-[#FFB800]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide leading-tight">Ativação obrigatória</p>
                    <p className="text-xs font-bold text-gray-900 leading-tight">Conta 99Pay</p>
                  </div>
                </div>

                {/* CALCULO EXPLICITO - Transferência + Depósito = Total */}
                <div className="bg-white/95 backdrop-blur rounded-xl p-3 mb-2 shadow-lg">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Você receberá na sua conta</p>
                  
                  <div className="flex items-stretch gap-1.5 mb-2">
                    {/* Transferência */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <p className="text-[9px] font-semibold text-gray-500 uppercase mb-0.5 leading-tight">Transferência</p>
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        R$ {formatCurrency(transferAmount)}
                      </p>
                    </div>
                    {/* Sinal + */}
                    <div className="flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-400">+</span>
                    </div>
                    {/* Depósito */}
                    <div className="flex-1 bg-[#FFE500]/30 rounded-lg p-2 border border-[#FFB800]/40">
                      <p className="text-[9px] font-semibold text-gray-700 uppercase mb-0.5 leading-tight">Depósito</p>
                      <p className="text-sm font-bold text-gray-900 leading-tight">R$ 30,00</p>
                    </div>
                  </div>

                  {/* Resultado */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-bold text-white">Total liberado</span>
                      </div>
                      <span className="text-lg font-bold text-white">
                        R$ {(parseInt(transferAmount || "0", 10) / 100 + 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aviso de pagamento PIX */}
                <div className="flex items-center justify-center gap-1.5 bg-white/40 backdrop-blur rounded-lg py-1.5 px-2.5">
                  <svg className="w-3.5 h-3.5 text-gray-800 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="text-[10px] font-bold text-gray-900 text-center leading-tight">Depositar R$ 30,00 via PIX para ativar sua conta 99Pay</span>
                </div>
              </div>
            </div>

            {/* Como funciona - passos visuais */}
            <div className="bg-white rounded-2xl p-3.5 mb-3 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-2.5 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#FFB800]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                Como funciona
              </h3>

              <div className="space-y-2">
                {/* Passo 1 */}
                <div className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-[#FFE500] flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-xs font-bold text-gray-900">1</span>
                    </div>
                    <div className="w-0.5 flex-1 bg-gray-200 mt-0.5" />
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="font-bold text-gray-900 text-xs mb-0.5 leading-tight">Realize o depósito</p>
                    <p className="text-gray-600 text-[11px] leading-snug">
                      Depositar R$ 30,00 via PIX para ativação da conta
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-[#FFE500] flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-xs font-bold text-gray-900">2</span>
                    </div>
                    <div className="w-0.5 flex-1 bg-gray-200 mt-0.5" />
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="font-bold text-gray-900 text-xs mb-0.5 leading-tight">Conta ativada</p>
                    <p className="text-gray-600 text-[11px] leading-snug">
                      Sua conta 99Pay é liberada instantaneamente
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-xs mb-0.5 leading-tight">Receba o valor completo</p>
                    <p className="text-gray-600 text-[11px] leading-snug">
                      <span className="font-bold">R$ {(parseInt(transferAmount || "0", 10) / 100 + 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> (transferência + reembolso) na sua conta {selectedBank?.name || "PicPay"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de segurança */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 mb-3 flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-green-900 text-[11px] mb-0.5 leading-tight">100% Seguro e Garantido</p>
                <p className="text-green-800 text-[10px] leading-snug">
                  Depósito reembolsado automaticamente junto com a transferência. Protegido pelo Banco Central.
                </p>
              </div>
            </div>

            {/* Botao principal - Realizar depósito */}
            <button
              onClick={() => setStep("deposit")}
              className="w-full py-3.5 rounded-2xl text-base font-bold bg-gradient-to-r from-[#FFE500] to-[#FFC700] text-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-yellow-300/50 mb-1 flex items-center justify-center gap-2 animate-pulse-cta animate-button-shine"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Realizar depósito de R$ 30,00
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-gray-500 font-semibold text-xs active:text-gray-700 transition-colors"
            >
              Cancelar transferência
            </button>
          </div>
        </div>
      )}

      {/* ETAPA: Depósito PIX com QR Code */}
      {step === "deposit" && (
        <DepositScreen 
          userName={userName}
          userCpf={userCpf}
          transferAmount={transferAmount}
          onBack={() => setStep("pending")}
        />
      )}

      {/* ETAPA: Processando */}
      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-24 h-24 border-4 border-gray-200 border-t-[#00B89F] rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processando...</h2>
          <p className="text-gray-500 text-center">Estamos enviando seu PIX</p>
        </div>
      )}

      {/* ETAPA: Sucesso */}
      {step === "success" && selectedBank && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 animate-in fade-in zoom-in duration-500">
            <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PIX enviado!</h2>
            <p className="text-gray-500 text-center mb-6">
              Transferência realizada com sucesso para {selectedBank.name}
            </p>

            <div className="w-full bg-gradient-to-br from-[#FFE500] to-[#FFB800] rounded-2xl p-5 mb-4">
              <p className="text-gray-800 text-sm mb-1">Valor enviado</p>
              <div className="text-3xl font-bold text-gray-900">
                R$ {formatCurrency(transferAmount)}
              </div>
            </div>

            <div className="w-full bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Destino</span>
                <span className="font-semibold text-gray-900">{selectedBank.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Horário</span>
                <span className="font-semibold text-gray-900">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ID transação</span>
                <span className="font-mono text-xs text-gray-900">
                  E{Math.random().toString(36).substring(2, 15).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl text-base font-bold bg-[#FFE500] text-gray-900 active:scale-95 transition-all shadow-lg"
            >
              Concluir
            </button>
          </div>
        </>
      )}
    </div>
  )
}
