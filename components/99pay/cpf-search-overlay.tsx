"use client"

import { useEffect, useState } from "react"

interface CpfSearchOverlayProps {
  visible: boolean
}

const STEPS = [
  { label: "Validando CPF", icon: "shield" },
  { label: "Consultando Receita Federal", icon: "search" },
  { label: "Carregando dados pessoais", icon: "user" },
]

export function CpfSearchOverlay({ visible }: CpfSearchOverlayProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)

  // Avanca etapas em cascata enquanto o overlay esta visivel
  useEffect(() => {
    if (!visible) {
      setActiveStep(0)
      setProgress(0)
      return
    }

    // Animacao total de 5s - etapas distribuidas igualmente
    const stepTimers = [
      setTimeout(() => setActiveStep(1), 1600),
      setTimeout(() => setActiveStep(2), 3200),
    ]

    // Barra de progresso suave de 0 a 97% ao longo de 4.9s
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(97, (elapsed / 4900) * 97)
      setProgress(pct)
    }, 40)

    return () => {
      stepTimers.forEach(clearTimeout)
      clearInterval(interval)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6 animate-in fade-in duration-300"
      style={{
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      role="status"
      aria-live="polite"
      aria-label="Buscando informações"
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400"
        style={{
          boxShadow:
            "0 24px 60px rgba(15, 23, 42, 0.35), 0 8px 20px rgba(15, 23, 42, 0.15)",
        }}
      >
        {/* Faixa amarela superior com gradiente sutil */}
        <div
          className="relative h-1.5 w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #FFE500 0%, #FFB800 50%, #FFE500 100%)",
          }}
        >
          <div
            className="absolute inset-y-0 -left-1/3 w-1/3 opacity-60"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
              animation: "cpfShimmer 1.8s linear infinite",
            }}
          />
        </div>

        <div className="px-6 pt-7 pb-6">
          {/* Icone central animado - lupa com radar pulsante */}
          <div className="flex justify-center mb-5">
            <div className="relative w-20 h-20">
              {/* Aneis pulsantes (radar) */}
              <span
                className="absolute inset-0 rounded-full border-2 border-[#FFE500]"
                style={{ animation: "cpfPing 1.8s ease-out infinite" }}
              />
              <span
                className="absolute inset-0 rounded-full border-2 border-[#FFE500]"
                style={{
                  animation: "cpfPing 1.8s ease-out infinite",
                  animationDelay: "0.6s",
                }}
              />
              <span
                className="absolute inset-0 rounded-full border-2 border-[#FFE500]"
                style={{
                  animation: "cpfPing 1.8s ease-out infinite",
                  animationDelay: "1.2s",
                }}
              />

              {/* Circulo central com gradiente amarelo */}
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #FFEC4D 0%, #FFE500 50%, #FFB800 100%)",
                  boxShadow:
                    "0 8px 20px rgba(255, 184, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                }}
              >
                {/* Lupa com pulsacao */}
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: "cpfPulse 1.4s ease-in-out infinite" }}
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <line x1="21" y1="21" x2="15.5" y2="15.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Titulo principal */}
          <h2 className="text-center text-[17px] font-bold text-gray-900 leading-tight">
            Buscando suas informações
          </h2>
          <p className="text-center text-[12.5px] text-gray-500 mt-1 mb-5 leading-snug">
            Estamos validando seus dados com segurança
          </p>

          {/* Lista de etapas */}
          <div className="space-y-2.5 mb-5">
            {STEPS.map((step, idx) => {
              const isActive = idx === activeStep
              const isDone = idx < activeStep
              return (
                <div
                  key={step.label}
                  className="flex items-center gap-3 transition-all duration-300"
                  style={{
                    opacity: idx > activeStep ? 0.35 : 1,
                  }}
                >
                  {/* Indicador de status */}
                  <div className="relative w-6 h-6 flex-shrink-0">
                    {isDone ? (
                      // Check verde concluido
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300"
                        style={{
                          background:
                            "linear-gradient(135deg, #00C268 0%, #00A859 100%)",
                          boxShadow: "0 2px 6px rgba(0, 168, 89, 0.35)",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      // Spinner amarelo em andamento
                      <div className="w-6 h-6 rounded-full border-[2.5px] border-[#FFE500] border-t-transparent animate-spin" />
                    ) : (
                      // Circulo cinza pendente
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                    )}
                  </div>

                  {/* Label da etapa */}
                  <span
                    className={`text-[13px] font-medium transition-colors duration-300 ${
                      isDone
                        ? "text-gray-900"
                        : isActive
                          ? "text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {step.label}
                    {isActive && (
                      <span className="inline-flex ml-0.5">
                        <span
                          className="w-1 text-gray-900"
                          style={{ animation: "cpfDot 1.4s steps(1) infinite" }}
                        >
                          .
                        </span>
                        <span
                          className="w-1 text-gray-900"
                          style={{
                            animation: "cpfDot 1.4s steps(1) infinite",
                            animationDelay: "0.2s",
                          }}
                        >
                          .
                        </span>
                        <span
                          className="w-1 text-gray-900"
                          style={{
                            animation: "cpfDot 1.4s steps(1) infinite",
                            animationDelay: "0.4s",
                          }}
                        >
                          .
                        </span>
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Barra de progresso */}
          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #FFE500 0%, #FFB800 100%)",
                boxShadow: "0 0 8px rgba(255, 184, 0, 0.45)",
              }}
            />
            {/* Brilho deslizante na barra */}
            <div
              className="absolute inset-y-0 -left-8 w-8 opacity-70"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)",
                animation: "cpfBarShine 1.4s linear infinite",
              }}
            />
          </div>

          {/* Selo de seguranca */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="#00A859"
              stroke="#008A48"
              strokeWidth="1"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Conexão protegida com SSL</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes cpfPing {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes cpfPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.12);
          }
        }
        @keyframes cpfShimmer {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(500%);
          }
        }
        @keyframes cpfBarShine {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(2400%);
          }
        }
        @keyframes cpfDot {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
