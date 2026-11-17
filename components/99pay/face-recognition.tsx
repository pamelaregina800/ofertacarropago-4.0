"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface FaceRecognitionProps {
  onComplete: () => void
  onBack: () => void
}

type ScanStatus = "intro" | "requesting" | "ready" | "scanning" | "success" | "error"

export function FaceRecognition({ onComplete, onBack }: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const [status, setStatus] = useState<ScanStatus>("intro")
  const [progress, setProgress] = useState(0)
  const [instruction, setInstruction] = useState("Toque em iniciar para começar")
  const [errorMessage, setErrorMessage] = useState("")
  const [videoReady, setVideoReady] = useState(false)

  // Cleanup: para camera e timers
  const cleanup = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current)
      scanTimerRef.current = null
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current)
      completeTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause()
      } catch {}
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [cleanup])

  // Inicia o scan simulado (progresso fluido enquanto a camera esta ligada)
  const startScan = useCallback(() => {
    if (!mountedRef.current) return
    setStatus("scanning")
    setInstruction("Mantenha a posição...")
    setProgress(0)

    let current = 0
    scanTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return
      current += 100 / 100 // 10 segundos total (100 ticks de 100ms)
      const clamped = Math.min(100, current)
      setProgress(clamped)

      if (clamped < 20) {
        setInstruction("Detectando rosto...")
      } else if (clamped < 45) {
        setInstruction("Analisando traços faciais...")
      } else if (clamped < 70) {
        setInstruction("Validando identidade...")
      } else if (clamped < 90) {
        setInstruction("Quase lá...")
      } else {
        setInstruction("Finalizando...")
      }

      if (clamped >= 100) {
        if (scanTimerRef.current) {
          clearInterval(scanTimerRef.current)
          scanTimerRef.current = null
        }
        setStatus("success")
        setInstruction("Verificação concluída!")
        completeTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return
          cleanup()
          onComplete()
        }, 1400)
      }
    }, 100)
  }, [cleanup, onComplete])

  // Handler: usuario toca em "Iniciar verificacao" (user gesture exigido por iOS)
  const handleStart = useCallback(async () => {
    setErrorMessage("")

    // Verifica suporte basico
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error")
      setErrorMessage(
        "Seu navegador não suporta acesso à câmera. Abra este site no Chrome ou Safari mais recente.",
      )
      return
    }

    // Verifica contexto seguro (HTTPS obrigatorio em mobile)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setStatus("error")
      setErrorMessage(
        "A câmera só funciona em conexões seguras (HTTPS). Abra o site publicado pela Vercel.",
      )
      return
    }

    setStatus("requesting")
    setInstruction("Solicitando acesso à câmera...")

    try {
      // iOS/Android: facingMode ideal (nunca exact para nao falhar em desktops)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      })

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        // Fallback: elemento video nao montou
        stream.getTracks().forEach((t) => t.stop())
        setStatus("error")
        setErrorMessage("Erro ao inicializar o player de vídeo. Recarregue a página.")
        return
      }

      // Configuracao essencial para iOS Safari
      video.setAttribute("autoplay", "")
      video.setAttribute("muted", "")
      video.setAttribute("playsinline", "")
      video.muted = true
      video.playsInline = true
      video.srcObject = stream

      // Espera metadata carregar antes de chamar play()
      await new Promise<void>((resolve) => {
        const onReady = () => {
          video.removeEventListener("loadedmetadata", onReady)
          resolve()
        }
        if (video.readyState >= 1) {
          resolve()
        } else {
          video.addEventListener("loadedmetadata", onReady)
        }
      })

      try {
        await video.play()
      } catch (playErr) {
        console.log("[v0] video.play() rejeitado:", playErr)
        // Em alguns iOS, play() rejeita mas o video roda mesmo assim se muted+playsinline
      }

      if (!mountedRef.current) return

      setVideoReady(true)
      setStatus("ready")
      setInstruction("Centralize seu rosto na moldura")

      // Aguarda 1.2s para o usuario se posicionar, depois inicia o scan
      completeTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        startScan()
      }, 1200)
    } catch (err) {
      const error = err as Error
      console.log("[v0] Erro getUserMedia:", error.name, error.message)

      if (!mountedRef.current) return

      const name = error.name || ""
      const msg = (error.message || "").toLowerCase()

      setStatus("error")

      if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.includes("permiss")) {
        setErrorMessage(
          "Você negou o acesso à câmera. Toque no cadeado ao lado do endereço do site, permita o uso da câmera e tente novamente.",
        )
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || msg.includes("device")) {
        setErrorMessage("Nenhuma câmera foi encontrada no seu dispositivo.")
      } else if (name === "NotReadableError" || name === "TrackStartError" || msg.includes("in use")) {
        setErrorMessage(
          "A câmera está em uso por outro aplicativo. Feche os outros apps que estão usando a câmera e tente novamente.",
        )
      } else if (name === "OverconstrainedError" || msg.includes("constraint")) {
        // Tenta de novo sem constraints rigidas
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          if (!mountedRef.current) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          streamRef.current = stream
          const video = videoRef.current
          if (video) {
            video.muted = true
            video.playsInline = true
            video.srcObject = stream
            await video.play().catch(() => {})
            setVideoReady(true)
            setStatus("ready")
            setInstruction("Centralize seu rosto na moldura")
            completeTimerRef.current = setTimeout(() => {
              if (mountedRef.current) startScan()
            }, 1200)
          }
        } catch {
          setErrorMessage("Seu dispositivo não suporta os parâmetros de câmera exigidos.")
        }
      } else {
        setErrorMessage(
          "Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.",
        )
      }
    }
  }, [startScan])

  const handleRetry = () => {
    cleanup()
    setErrorMessage("")
    setProgress(0)
    setVideoReady(false)
    setInstruction("Toque em iniciar para começar")
    setStatus("intro")
  }

  const progressColor =
    status === "success" ? "#22c55e" : status === "scanning" ? "#FFCB05" : "#e5e7eb"

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => {
            cleanup()
            onBack()
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 active:scale-90 transition-all"
          aria-label="Voltar"
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
        <h1 className="font-bold text-lg text-gray-900">Reconhecimento facial</h1>
        <div className="w-9" />
      </div>

      {status === "error" ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5V6a3 3 0 00-3-3H6a3 3 0 00-3 3v12a3 3 0 003 3h6a3 3 0 003-3v-4.5M15 12l6-3v6l-6-3z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Câmera bloqueada</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="w-full max-w-xs py-3.5 rounded-full text-base font-bold bg-gradient-to-r from-[#FFD700] to-[#FFE500] text-gray-900 active:scale-95 transition-all shadow-lg"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Titulo dinamico */}
          <div className="text-center px-6 mt-4 mb-5">
            <h2 className="text-2xl font-bold text-gray-900 text-balance">
              {status === "intro" && "Vamos verificar sua identidade"}
              {status === "requesting" && "Preparando câmera..."}
              {status === "ready" && "Centralize seu rosto na moldura"}
              {status === "scanning" && "Mantenha a posição..."}
              {status === "success" && "Verificação concluída!"}
            </h2>
            {status === "intro" && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
                Uma verificação facial rápida para proteger sua conta. Funciona melhor em um local bem
                iluminado.
              </p>
            )}
          </div>

          {/* Area principal - circulo (video sempre montado) */}
          <div className="flex-1 flex flex-col items-center px-6">
            <div className="relative w-[min(320px,80vw)] aspect-square">
              {/* Borda externa */}
              <div className="absolute inset-0 rounded-full border-[5px] border-gray-200" />

              {/* Anel de progresso */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="48.5"
                  stroke={progressColor}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 3.05} 305`}
                  className="transition-all duration-200"
                />
              </svg>

              {/* Conteudo interno - video sempre montado! */}
              <div className="absolute inset-[10px] rounded-full overflow-hidden bg-gray-900">
                {/* Video element SEMPRE no DOM, controlamos visibilidade via CSS */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  // @ts-expect-error - atributo legado necessario para iOS antigo
                  webkit-playsinline="true"
                  className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${
                    videoReady ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Placeholder quando video nao esta pronto */}
                {!videoReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
                    {status === "requesting" ? (
                      <>
                        <div className="w-12 h-12 border-4 border-gray-700 border-t-[#FFCB05] rounded-full animate-spin mb-4" />
                        <p className="text-gray-300 text-xs text-center px-6 leading-relaxed">
                          Aguarde a permissão da câmera...
                        </p>
                      </>
                    ) : (
                      <svg
                        className="w-24 h-24 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Overlay de sucesso */}
                {status === "success" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 animate-pulse">
                    <svg
                      className="w-20 h-20 text-white drop-shadow-lg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Moldura oval guia */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`rounded-[50%] border-[1.5px] transition-colors duration-300 ${
                    status === "success"
                      ? "border-green-400"
                      : status === "scanning"
                        ? "border-[#FFCB05]"
                        : "border-white/70"
                  }`}
                  style={{ width: "72%", height: "88%" }}
                />
              </div>

              {/* Linha de scan */}
              {status === "scanning" && (
                <div
                  className="absolute inset-[10px] rounded-full overflow-hidden pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, rgba(255, 203, 5, 0.35) 50%, transparent 100%)",
                    animation: "scanLine 2s ease-in-out infinite",
                  }}
                />
              )}
            </div>

            {/* Instrucao */}
            <div className="text-center mt-6">
              <p
                className={`text-base font-medium transition-colors duration-300 ${
                  status === "success"
                    ? "text-green-500"
                    : status === "scanning"
                      ? "text-gray-700"
                      : "text-gray-500"
                }`}
              >
                {instruction}
              </p>
            </div>

            {/* Barra de progresso */}
            {(status === "scanning" || status === "success") && (
              <div className="w-full max-w-xs mt-5">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFCB05] to-green-500 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-gray-400 text-xs mt-2">
                  {status === "success"
                    ? "Verificação concluída"
                    : `Analisando... ${Math.round(progress)}%`}
                </p>
              </div>
            )}

            {/* Botao de iniciar (user gesture - exigido em iOS) */}
            {status === "intro" && (
              <button
                onClick={handleStart}
                className="w-full max-w-xs mt-6 py-4 rounded-full text-base font-bold bg-gradient-to-r from-[#FFD700] to-[#FFE500] text-gray-900 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Iniciar verificação
              </button>
            )}
          </div>

          {/* Dica pre-camera */}
          {status === "intro" && (
            <div className="px-6 pb-6 pt-3">
              <div className="bg-gray-50 rounded-2xl p-3.5 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#FFB800] flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Quando o navegador pedir, toque em{" "}
                  <span className="font-bold text-gray-900">Permitir</span> para liberar sua câmera
                  frontal.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes scanLine {
          0%,
          100% {
            transform: translateY(-100%);
          }
          50% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  )
}
