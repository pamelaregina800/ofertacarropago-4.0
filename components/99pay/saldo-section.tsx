"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { PixWithdrawal } from "./pix-withdrawal"

export function SaldoSection() {
  const [showAnimation, setShowAnimation] = useState(false)
  const [currentValue, setCurrentValue] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [valuePermanent, setValuePermanent] = useState(false)
  const [showPixWithdrawal, setShowPixWithdrawal] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [showWithdrawCTA, setShowWithdrawCTA] = useState(false)
  const ctaRef = useRef<HTMLDivElement>(null)
  const targetValue = 857

  // Escuta o evento de mostrar animacao
  useEffect(() => {
    const handleShowAnimation = () => {
      setShowAnimation(true)
      setCurrentValue(0)
      setAnimationComplete(false)
      setShowFlash(false)

      // SEM som sintetizado aqui - o unico som que toca durante a animacao e
      // o MP3 de recompensa disparado no clique em "Concluir e Acessar Saldo"
      // dentro do SuccessScreen, que continua tocando enquanto a animacao roda.

      // Animacao de contagem com easing ease-out (mais rapida no inicio, suave no fim)
      const duration = 4500
      const startTime = performance.now()

      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / duration)
        // easeOutCubic: 1 - (1 - t)^3
        const eased = 1 - Math.pow(1 - t, 3)
        const value = Math.floor(eased * targetValue)
        setCurrentValue(value)

        if (t < 1) {
          requestAnimationFrame(tick)
        } else {
          setCurrentValue(targetValue)
          setAnimationComplete(true)
          setValuePermanent(true)
          setShowFlash(true)
          // Remove flash apos o brilho passar
          setTimeout(() => setShowFlash(false), 800)
          // Remove overlay mas mantem o valor visivel
          setTimeout(() => {
            setShowAnimation(false)
            // Mostra o CTA chamativo "Clique aqui e faca seu saque"
            setShowWithdrawCTA(true)
            // Aguarda 8 segundos para a pessoa visualizar e clicar no CTA
            // antes de abrir automaticamente o popup "Deseja sacar agora?"
            setTimeout(() => {
              setShowWithdrawCTA(false)
              setShowPixWithdrawal(true)
            }, 8000)
          }, 800)
        }
      }
      requestAnimationFrame(tick)
    }

    window.addEventListener("showMoneyAnimation", handleShowAnimation)
    return () => window.removeEventListener("showMoneyAnimation", handleShowAnimation)
  }, [])

  // Faz scroll suave ate o CTA quando ele aparece (centraliza na viewport)
  useEffect(() => {
    if (showWithdrawCTA && ctaRef.current) {
      setTimeout(() => {
        ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 200)
    }
  }, [showWithdrawCTA])

  // Gera particulas com trajetorias variadas - mistura premium de notas, moedas e brilhos
  const particles = useRef(
    Array.from({ length: 60 }).map((_, i) => {
      const r = Math.random()
      // 50% notas de R$ (mais notas pra dar sensacao "rica"), 30% moedas, 20% brilhos
      const type = r < 0.5 ? "note" : r < 0.8 ? "coin" : "spark"
      return {
        id: i,
        left: Math.random() * 100,
        type,
        size: 0.7 + Math.random() * 0.7, // 0.7 - 1.4
        delay: Math.random() * 2.5,
        duration: 2.2 + Math.random() * 1.6,
        drift: -60 + Math.random() * 120, // -60px a +60px deriva horizontal
        rotation: (Math.random() - 0.5) * 900, // ate ±450 graus
        // Variacao de tom (notas tem variacoes verde/dourado)
        variant: Math.floor(Math.random() * 3),
      }
    }),
  ).current

  return (
    <div className="relative w-full -mt-12">
      {/* Imagem original do saldo */}
      <div className="relative">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-03-26%20at%2019.20.48-FkbRAK8YiVfb5FiREnxzikZTBN30hq.jpeg"
          alt="Saldo na 99 - Para uso exclusivo em corridas 99, 99Entrega e 99Food"
          width={800}
          height={600}
          className="w-full h-auto"
          priority
        />

        {/* Overlay clicavel cobrindo a faixa "Area Pix | Transferencias | Escanear QR Code"
            que aparece na parte inferior da imagem do saldo. Toque em qualquer parte
            dessa faixa abre o popup de saque PIX. */}
        {valuePermanent && (
          <button
            type="button"
            aria-label="Abrir saque via Pix"
            onClick={() => setShowPixWithdrawal(true)}
            className="absolute cursor-pointer active:bg-black/5 transition-colors"
            style={{
              top: "62%",
              left: "0%",
              width: "100%",
              height: "32%",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          />
        )}

        {/* Overlay permanente do valor */}
        {valuePermanent && (
          <div
            className="absolute bg-white flex items-center"
            style={{ top: "29%", left: "9%", width: "50%", height: "14%" }}
          >
            <span className="text-2xl font-bold text-gray-900">
              {targetValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-gray-400 text-lg ml-1">&gt;</span>
          </div>
        )}
      </div>

      {/* Overlay de animacao do dinheiro */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Glow dourado radial crescente */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 35%, rgba(255, 229, 0, 0.35) 0%, rgba(255, 229, 0, 0) 55%)",
              animation: "goldGlowPulse 2s ease-in-out infinite",
            }}
          />

          {/* Fundo branco sobre o valor original + numero animado */}
          <div
            className="absolute bg-white flex items-center"
            style={{ top: "29%", left: "9%", width: "50%", height: "14%" }}
          >
            <span
              className="text-2xl font-bold transition-all duration-300"
              style={{
                color: animationComplete ? "#111827" : "#16a34a",
                textShadow: animationComplete
                  ? "none"
                  : "0 0 14px rgba(34, 197, 94, 0.55), 0 0 4px rgba(34, 197, 94, 0.35)",
                transform: showFlash ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s",
              }}
            >
              {currentValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-gray-400 text-lg ml-1">&gt;</span>
          </div>

          {/* Particulas de notas/moedas/estrelas caindo */}
          {!animationComplete && (
            <div className="absolute inset-0">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute"
                  style={{
                    left: `${p.left}%`,
                    top: "-10%",
                    // @ts-expect-error - custom properties
                    "--drift": `${p.drift}px`,
                    "--rotation": `${p.rotation}deg`,
                    "--scale": p.size,
                    animation: `moneyFall ${p.duration}s cubic-bezier(0.32, 0, 0.67, 0.74) forwards`,
                    animationDelay: `${p.delay}s`,
                    transform: `scale(${p.size})`,
                    willChange: "transform, opacity",
                  }}
                >
                  {p.type === "note" ? (
                    // Nota de Real elegante - 3 variantes de design banking premium
                    <div
                      className="relative w-12 h-7 rounded-md flex items-center justify-center text-[11px] font-black overflow-hidden"
                      style={{
                        background:
                          p.variant === 0
                            ? "linear-gradient(135deg, #00A859 0%, #008A48 60%, #006B38 100%)"
                            : p.variant === 1
                              ? "linear-gradient(135deg, #00C268 0%, #00A859 60%, #008A48 100%)"
                              : "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)",
                        color: "#FFF7CC",
                        border: "0.5px solid rgba(255, 215, 0, 0.55)",
                        boxShadow:
                          "0 4px 10px rgba(0, 168, 89, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {/* Padrao de marca d'agua decorativa */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background:
                            "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.3) 2px, rgba(255, 255, 255, 0.3) 3px)",
                        }}
                      />
                      <span className="relative">R$</span>
                    </div>
                  ) : p.type === "coin" ? (
                    // Moeda dourada premium com brilho
                    <div
                      className="relative w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 25%, #FFF1A8 0%, #FFD700 35%, #FFB800 70%, #B8860B 100%)",
                        color: "#5C3A05",
                        border: "1px solid rgba(184, 134, 11, 0.7)",
                        boxShadow:
                          "0 4px 10px rgba(255, 184, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.55), inset 0 -1px 2px rgba(0, 0, 0, 0.2)",
                        textShadow: "0 1px 0 rgba(255, 255, 255, 0.4)",
                      }}
                    >
                      <span className="relative" style={{ fontSize: "11px" }}>
                        $
                      </span>
                      {/* Brilho superior */}
                      <span
                        className="absolute top-0.5 left-1 w-1.5 h-1 rounded-full"
                        style={{
                          background: "rgba(255, 255, 255, 0.7)",
                          filter: "blur(1px)",
                        }}
                      />
                    </div>
                  ) : (
                    // Brilho/estrela cintilante dourada
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#FFE066"
                      style={{
                        filter:
                          "drop-shadow(0 0 6px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.6))",
                      }}
                    >
                      <path d="M12 2l1.5 7.5L21 11l-7.5 1.5L12 20l-1.5-7.5L3 11l7.5-1.5L12 2z" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Brilho/flash no momento da conclusao */}
          {showFlash && (
            <div
              className="absolute"
              style={{
                top: "29%",
                left: "9%",
                width: "50%",
                height: "14%",
                background:
                  "linear-gradient(110deg, transparent 30%, rgba(255, 229, 0, 0.85) 50%, transparent 70%)",
                animation: "flashShine 0.8s ease-out forwards",
                mixBlendMode: "screen",
              }}
            />
          )}

          {/* Badge de sucesso */}
          {animationComplete && (
            <div
              className="absolute animate-in fade-in slide-in-from-right-4 duration-500"
              style={{ top: "35%", right: "5%" }}
            >
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg shadow-green-500/40">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saldo atualizado!
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA premium estilo banking app - aparece logo abaixo do saldo */}
      {showWithdrawCTA && (
        <div
          ref={ctaRef}
          className="mx-4 mt-5 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Card branco premium com sombra suave - estilo Nubank/Itau */}
          <div
            className="relative overflow-hidden rounded-2xl bg-white"
            style={{
              boxShadow:
                "0 4px 14px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(0, 168, 89, 0.12)",
            }}
          >
            {/* Faixa verde superior decorativa */}
            <div
              className="h-1 w-full"
              style={{
                background: "linear-gradient(90deg, #00A859 0%, #00C96A 50%, #00A859 100%)",
              }}
            />

            <div className="px-4 pt-4 pb-4">
              {/* Linha 1: badge de status + valor */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 mb-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                      Disponivel para saque
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] font-semibold text-gray-400">R$</span>
                    <span className="text-[22px] font-bold text-gray-900 leading-none">857</span>
                    <span className="text-[14px] font-semibold text-gray-500 leading-none">,00</span>
                  </div>
                </div>

                {/* Logo 99 - canto direito */}
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden"
                  style={{
                    boxShadow:
                      "0 2px 8px rgba(255, 193, 7, 0.35), 0 0 0 2px rgba(255, 255, 255, 0.9)",
                  }}
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99logo-X8zF9doqCYCRY7g7I3axJdpdHBeMVK.png"
                    alt="99"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Botao principal premium */}
              <button
                onClick={() => {
                  setShowWithdrawCTA(false)
                  setShowPixWithdrawal(true)
                }}
                className="relative w-full overflow-hidden rounded-xl active:scale-[0.98] transition-transform"
                style={{
                  background: "linear-gradient(135deg, #00A859 0%, #00C268 100%)",
                  boxShadow: "0 4px 12px rgba(0, 168, 89, 0.35)",
                }}
              >
                {/* Shimmer sutil */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.25) 50%, transparent 60%)",
                    animation: "ctaShine 3s linear infinite",
                  }}
                />

                <div className="relative flex items-center justify-center gap-2 px-5 py-3.5">
                  <span className="text-white font-semibold text-[15px] tracking-tight">
                    Sacar agora via Pix
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: "ctaArrow 1.2s ease-in-out infinite" }}
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Microinfo abaixo do botao */}
              <div className="flex items-center justify-center gap-3 mt-2.5 text-[10px] text-gray-500 font-medium">
                <div className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Cai em segundos</span>
                </div>
                <div className="w-px h-3 bg-gray-300" />
                <div className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>100% seguro</span>
                </div>
                <div className="w-px h-3 bg-gray-300" />
                <div className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  <span>Sem taxas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Indicador apontando para card Pix abaixo */}
          <div
            className="flex flex-col items-start mt-3"
            style={{ paddingLeft: "8%" }}
          >
            <span className="text-[10px] font-bold text-[#00A859] uppercase tracking-wider mb-0.5">
              Ou toque em Pix abaixo
            </span>
            <svg
              width="26"
              height="18"
              viewBox="0 0 28 20"
              fill="none"
              style={{ animation: "ctaArrowDown 1.2s ease-in-out infinite" }}
            >
              <path
                d="M14 18 L3 6 L9 6 L9 2 L19 2 L19 6 L25 6 Z"
                fill="#00A859"
                stroke="#008A48"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Popup de saque via PIX */}
      {showPixWithdrawal && (
        <PixWithdrawal onClose={() => setShowPixWithdrawal(false)} amount={targetValue} />
      )}

      <style jsx>{`
        @keyframes moneyFall {
          0% {
            transform: translate3d(0, -20px, 0) rotate(0deg) scale(var(--scale, 1));
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift, 0px), 120vh, 0)
              rotate(var(--rotation, 360deg)) scale(calc(var(--scale, 1) * 0.75));
            opacity: 0;
          }
        }

        @keyframes flashShine {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes goldGlowPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes ctaShine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes ctaPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 200, 100, 0.55);
          }
          70% {
            box-shadow: 0 0 0 14px rgba(0, 200, 100, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 200, 100, 0);
          }
        }

        @keyframes ctaArrow {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }

        @keyframes ctaArrowDown {
          0%,
          100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(6px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
