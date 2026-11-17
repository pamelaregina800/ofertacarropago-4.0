"use client"

import { useEffect, useRef, useState } from "react"

interface SuccessScreenProps {
  onStart: () => void
}

// Som de recompensa MP3 (barulho de dinheiro) - tocado APENAS no clique
// de "Concluir e Acessar Saldo", sincronizado com o redirecionamento para
// a tela do app onde o saldo cai animado.
const REWARD_SOUND_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20mp3%20barulho%20recompensa-Em3dpyYfDvitg75joXdqqzRX5LoAjL.MP3"

// Som elegante de sucesso bancario - tocado APENAS quando o popup "Conta Aprovada" aparece.
// Acorde maior em arpeggio (C5-E5-G5-C6) com timbres suaves e reverb sutil,
// estilo notificacao premium de Apple Pay / Nubank / Inter / 99Pay.
function playBankSuccessChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()

    // Master gain - som "polido" estilo banco
    const master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)

    // Reverb sintetizado (delay simples) para sensacao espacial premium
    const delay = ctx.createDelay(0.5)
    delay.delayTime.value = 0.18
    const delayGain = ctx.createGain()
    delayGain.gain.value = 0.15
    delay.connect(delayGain)
    delayGain.connect(master)

    // Acorde maior em arpeggio: C5 - E5 - G5 - C6
    const notes = [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.08 },
      { freq: 783.99, time: 0.16 },
      { freq: 1046.5, time: 0.26 },
    ]

    notes.forEach(({ freq, time }) => {
      const startAt = ctx.currentTime + time

      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.value = freq

      const oscHarm = ctx.createOscillator()
      oscHarm.type = "sine"
      oscHarm.frequency.value = freq * 2
      const harmGain = ctx.createGain()
      harmGain.gain.value = 0

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, startAt)
      gain.gain.linearRampToValueAtTime(0.3, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 1.6)

      harmGain.gain.setValueAtTime(0, startAt)
      harmGain.gain.linearRampToValueAtTime(0.07, startAt + 0.025)
      harmGain.gain.exponentialRampToValueAtTime(0.001, startAt + 1.2)

      osc.connect(gain)
      oscHarm.connect(harmGain)
      gain.connect(master)
      gain.connect(delay)
      harmGain.connect(master)

      osc.start(startAt)
      osc.stop(startAt + 1.7)
      oscHarm.start(startAt)
      oscHarm.stop(startAt + 1.3)
    })

    // Acorde final sustentado - sensacao "tudo certo"
    const finalAt = ctx.currentTime + 0.45
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, finalAt)
      g.gain.linearRampToValueAtTime(0.16 - i * 0.02, finalAt + 0.05)
      g.gain.exponentialRampToValueAtTime(0.001, finalAt + 2.2)
      osc.connect(g)
      g.connect(master)
      g.connect(delay)
      osc.start(finalAt)
      osc.stop(finalAt + 2.3)
    })

    setTimeout(() => {
      ctx.close().catch(() => {})
    }, 4000)
  } catch {
    // Sem suporte a Web Audio - segue sem som de abertura
  }
}

export function SuccessScreen({ onStart }: SuccessScreenProps) {
  const [showButton, setShowButton] = useState(false)
  const [stage, setStage] = useState<"intro" | "stamped">("intro")
  const rewardAudioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Som elegante de sucesso quando o popup "Conta Aprovada" aparece.
    // O MP3 de recompensa e disparado SEPARADAMENTE no clique em "Concluir".
    playBankSuccessChime()

    // Apos 700ms o "selo" se acomoda - inicia segunda fase da animacao
    const stampTimer = setTimeout(() => setStage("stamped"), 700)
    // Botao aparece depois que toda animacao do selo finaliza
    const buttonTimer = setTimeout(() => setShowButton(true), 1400)

    return () => {
      clearTimeout(stampTimer)
      clearTimeout(buttonTimer)
    }
  }, [])

  const handleConcluir = () => {
    // Toca o MP3 de recompensa de forma DESACOPLADA do componente.
    // Usa new Audio() global para garantir que o som CONTINUE tocando mesmo
    // depois que esse popup fechar (porque o onStart logo desmonta o componente).
    try {
      const audio = new Audio(REWARD_SOUND_URL)
      audio.volume = 0.95
      audio.preload = "auto"
      // Tenta tocar imediatamente no user gesture (clique = funciona em todos os navegadores)
      const p = audio.play()
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // Fallback caso o navegador bloqueie - tenta tocar no audio ref
          if (rewardAudioRef.current) {
            try {
              rewardAudioRef.current.currentTime = 0
              rewardAudioRef.current.volume = 0.95
              rewardAudioRef.current.play().catch(() => {})
            } catch {}
          }
        })
      }
    } catch {
      // ignora
    }

    onStart()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 animate-in fade-in duration-300"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0, 168, 89, 0.18) 0%, rgba(0, 0, 0, 0.7) 60%)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Audio do som de recompensa - mesmo som do inicio do funil */}
      <audio ref={rewardAudioRef} preload="auto" src={REWARD_SOUND_URL} />

      {/* Confete dourado caindo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => {
          const colors = ["#FFD700", "#00C96A", "#FFE500", "#00A859", "#FFFFFF"]
          const isStrip = i % 3 === 0
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-8%",
                width: isStrip ? "4px" : "8px",
                height: isStrip ? "14px" : "8px",
                borderRadius: isStrip ? "1px" : "2px",
                backgroundColor: colors[i % colors.length],
                boxShadow: `0 0 6px ${colors[i % colors.length]}`,
                animation: `confettiFall ${2.8 + Math.random() * 2}s cubic-bezier(0.4, 0.1, 0.6, 1) forwards`,
                animationDelay: `${Math.random() * 1.2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          )
        })}
      </div>

      {/* Card principal - design banking premium */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-500"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(0, 168, 89, 0.35), 0 0 0 1px rgba(0, 168, 89, 0.08)",
        }}
      >
        {/* Topo com gradiente verde elegante e raios de luz */}
        <div
          className="relative px-6 pt-10 pb-16 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #00A859 0%, #00C268 50%, #00E07A 100%)",
          }}
        >
          {/* Raios de luz girando atras do selo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[400px] h-[400px]"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(255, 255, 255, 0.15) 10deg, transparent 20deg, transparent 40deg, rgba(255, 255, 255, 0.1) 50deg, transparent 60deg, transparent 90deg, rgba(255, 255, 255, 0.18) 100deg, transparent 110deg, transparent 180deg, rgba(255, 255, 255, 0.12) 190deg, transparent 200deg, transparent 270deg, rgba(255, 255, 255, 0.15) 280deg, transparent 290deg, transparent 360deg)",
                animation: "raysSpin 8s linear infinite",
              }}
            />
          </div>

          {/* Brilho radial pulsando atras do selo */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)",
              animation: "stampGlow 2s ease-in-out infinite",
            }}
          />

          {/* Selo circular animado */}
          <div className="relative flex justify-center">
            <div
              className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center"
              style={{
                animation:
                  stage === "intro"
                    ? "stampDown 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                    : "stampPulse 2s ease-in-out infinite",
                boxShadow:
                  "0 12px 30px rgba(0, 0, 0, 0.25), 0 0 0 6px rgba(255, 255, 255, 0.2), 0 0 0 12px rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Anel decorativo dentro do selo */}
              <div
                className="absolute inset-2 rounded-full border-2 border-dashed border-green-300"
                style={{ animation: "ringSpin 12s linear infinite" }}
              />

              {/* Check animado */}
              <svg
                className="w-14 h-14 relative z-10"
                viewBox="0 0 52 52"
                fill="none"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0, 168, 89, 0.3))" }}
              >
                <circle cx="26" cy="26" r="24" fill="#00A859" />
                <path
                  d="M14 26 L23 35 L38 18"
                  stroke="white"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 40,
                    strokeDashoffset: 40,
                    animation: "drawCheck 0.7s ease-out 0.5s forwards",
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Badge CONTA APROVADA - destaque premium estilo banco */}
          <div
            className="relative flex flex-col items-center mt-5 animate-in fade-in zoom-in-95 duration-500"
            style={{ animationDelay: "0.7s", animationFillMode: "both" }}
          >
            {/* Glow atras do badge */}
            <div
              className="absolute inset-0 blur-xl opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(255, 255, 255, 0.5) 0%, transparent 70%)",
              }}
            />

            {/* Badge principal - mais robusto e imponente */}
            <div
              className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full border-2"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
                borderColor: "rgba(255, 255, 255, 0.9)",
                boxShadow:
                  "0 6px 16px rgba(0, 0, 0, 0.15), 0 0 0 4px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                animation: "badgeGlow 2.5s ease-in-out infinite",
              }}
            >
              {/* Selo verificado */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L14.5 4.5L18 4L18.5 7.5L21 9L19 12L21 15L18.5 16.5L18 20L14.5 19.5L12 22L9.5 19.5L6 20L5.5 16.5L3 15L5 12L3 9L5.5 7.5L6 4L9.5 4.5L12 2Z"
                  fill="#00A859"
                  stroke="#008A48"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span
                className="text-[13px] font-extrabold tracking-[0.18em] uppercase"
                style={{
                  background:
                    "linear-gradient(135deg, #00A859 0%, #008A48 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Conta Aprovada
              </span>

              {/* Estrelinha decorativa */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFD700">
                <path d="M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z" />
              </svg>
            </div>

            {/* Microtexto de reforco */}
            <p
              className="relative text-[10px] font-semibold text-white/90 mt-2 tracking-wider uppercase"
              style={{ textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)" }}
            >
              Verificada e ativa
            </p>
          </div>
        </div>

        {/* Corpo do card com curva superior */}
        <div
          className="relative px-6 pt-6 pb-6 -mt-8 bg-white"
          style={{ borderTopLeftRadius: "28px", borderTopRightRadius: "28px" }}
        >
          {/* Titulo */}
          <div
            className="text-center mb-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.8s", animationFillMode: "both" }}
          >
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
              Parabens! Tudo certo
            </h1>
            <p className="text-gray-500 text-[13px] mt-1 leading-relaxed">
              Sua conta foi verificada com sucesso e ja esta liberada para uso.
            </p>
          </div>

          {/* Card de recompensa premium */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 mb-5 animate-in fade-in zoom-in-95 duration-500"
            style={{
              animationDelay: "0.95s",
              animationFillMode: "both",
              background:
                "linear-gradient(135deg, #0F1419 0%, #1A2332 100%)",
              boxShadow:
                "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Brilho deslizante no card */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(110deg, transparent 35%, rgba(255, 215, 0, 0.15) 50%, transparent 65%)",
                animation: "cardShine 3s linear infinite",
              }}
            />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFD700">
                    <path d="M12 2l2.09 6.26L20 9l-5 4.87L16.18 20 12 16.77 7.82 20 9 13.87 4 9l5.91-.74L12 2z" />
                  </svg>
                  <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">
                    Recompensa Liberada
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[13px] font-medium text-gray-400">R$</span>
                  <span
                    className="text-[32px] font-bold leading-none"
                    style={{
                      background:
                        "linear-gradient(135deg, #FFD700 0%, #FFE580 50%, #FFD700 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    857
                  </span>
                  <span className="text-[18px] font-semibold text-yellow-200 leading-none">
                    ,00
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">disponivel para saque</p>
              </div>

              {/* Icone de cofre */}
              <div
                className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)",
                  border: "1px solid rgba(255, 215, 0, 0.25)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Lista de beneficios */}
          <div
            className="space-y-2.5 mb-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "1.1s", animationFillMode: "both" }}
          >
            {[
              { label: "Conta verificada e ativa" },
              { label: "Saldo liberado para saque imediato" },
              { label: "PIX disponivel 24h por dia" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 text-[13px] font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Botao Concluir */}
          {showButton && (
            <button
              onClick={handleConcluir}
              className="relative w-full py-4 rounded-2xl text-[15px] font-bold text-white overflow-hidden active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{
                background:
                  "linear-gradient(135deg, #00A859 0%, #00C268 100%)",
                boxShadow:
                  "0 8px 20px rgba(0, 168, 89, 0.4), 0 2px 4px rgba(0, 168, 89, 0.2)",
              }}
            >
              {/* Shimmer no botao */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.3) 50%, transparent 65%)",
                  animation: "btnShine 2.2s linear infinite",
                }}
              />
              <span className="relative tracking-wide">Concluir e Acessar Saldo</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes stampDown {
          0% {
            transform: scale(2.5) rotate(-12deg);
            opacity: 0;
          }
          60% {
            transform: scale(0.85) rotate(2deg);
            opacity: 1;
          }
          80% {
            transform: scale(1.05) rotate(-1deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes stampPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        @keyframes stampGlow {
          0%,
          100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        @keyframes raysSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes ringSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes cardShine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes btnShine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes badgeGlow {
          0%,
          100% {
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15),
              0 0 0 4px rgba(255, 255, 255, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
          }
          50% {
            box-shadow: 0 10px 24px rgba(0, 168, 89, 0.3),
              0 0 0 6px rgba(255, 255, 255, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
          }
        }
      `}</style>
    </div>
  )
}
