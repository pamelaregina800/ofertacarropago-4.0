import { NextResponse } from "next/server"
import { createPixCharge } from "@/lib/pix/duttyfy"
import { saveTransaction } from "@/lib/pix/transactions"
import {
  sendOrderToUtmify,
  defaultEmptyTracking,
  type UtmifyTrackingParameters,
} from "@/lib/utmify/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface CreateBody {
  amount?: number // centavos
  customer: {
    name: string
    document: string
    email: string
    phone: string
  }
  item?: {
    title?: string
    quantity?: number
    price?: number
  }
  utm?: string
  description?: string
  // UTMs capturadas no client (lib/utm.ts) e enviadas junto com a criacao
  // do PIX. Sao persistidas com a transacao para serem reaproveitadas pelo
  // webhook quando o pagamento for confirmado.
  tracking?: Partial<UtmifyTrackingParameters>
}

// Normaliza o tracking recebido do client garantindo todas as 7 chaves
// (utm_source, utm_campaign, utm_medium, utm_content, utm_term, src, sck)
function normalizeTracking(input?: Partial<UtmifyTrackingParameters>): UtmifyTrackingParameters {
  const empty = defaultEmptyTracking()
  if (!input || typeof input !== "object") return empty
  return {
    src: typeof input.src === "string" && input.src ? input.src : null,
    sck: typeof input.sck === "string" && input.sck ? input.sck : null,
    utm_source:
      typeof input.utm_source === "string" && input.utm_source ? input.utm_source : null,
    utm_campaign:
      typeof input.utm_campaign === "string" && input.utm_campaign ? input.utm_campaign : null,
    utm_medium:
      typeof input.utm_medium === "string" && input.utm_medium ? input.utm_medium : null,
    utm_content:
      typeof input.utm_content === "string" && input.utm_content ? input.utm_content : null,
    utm_term: typeof input.utm_term === "string" && input.utm_term ? input.utm_term : null,
  }
}

function getClientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    // Primeiro IP da lista e o do cliente real
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp
  return undefined
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody

    // Validacao basica
    if (!body?.customer?.name || !body?.customer?.document || !body?.customer?.email) {
      return NextResponse.json(
        { error: "Dados do cliente incompletos (name, document, email)" },
        { status: 400 },
      )
    }

    const amount = Math.max(1, Math.round(Number(body.amount) || 3000))
    const item = {
      title: body.item?.title || "Ativacao da conta 99Pay",
      quantity: body.item?.quantity || 1,
      price: Math.round(body.item?.price ?? amount),
    }

    const tracking = normalizeTracking(body.tracking)
    const ip = getClientIp(req)

    const charge = await createPixCharge({
      amount,
      customer: body.customer,
      item,
      utm: body.utm,
      description: body.description,
    })

    const createdAt = Date.now()

    // Persiste IMEDIATAMENTE, antes de retornar ao cliente.
    // As UTMs sao salvas junto com a transacao para serem reaproveitadas
    // pelo webhook quando o pagamento for confirmado.
    saveTransaction({
      transactionId: charge.transactionId,
      status: "PENDING",
      amount,
      pixCode: charge.pixCode,
      customer: {
        name: body.customer.name,
        document: body.customer.document.replace(/\D/g, ""),
        email: body.customer.email,
        phone: (body.customer.phone || "").replace(/\D/g, ""),
        ...(ip ? { ip } : {}),
      },
      trackingParameters: tracking,
      createdAt,
    })

    // Envia para Utmify em background (nao bloqueia a resposta).
    // Status "waiting_payment" = PIX gerado, aguardando pagamento.
    // Erros aqui nunca quebram o fluxo principal - sao apenas logados.
    sendOrderToUtmify({
      orderId: charge.transactionId,
      status: "waiting_payment",
      createdAtMs: createdAt,
      paidAtMs: null,
      amountInCents: amount,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: (body.customer.phone || "").replace(/\D/g, "") || null,
        document: body.customer.document.replace(/\D/g, "") || null,
        ip,
      },
      product: {
        id: "ativacao-99pay",
        name: item.title,
      },
      trackingParameters: tracking,
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.log("[v0] Falha background Utmify (waiting_payment):", msg)
    })

    // Nunca retorna a URL encriptada nem o payload bruto sensivel
    return NextResponse.json({
      transactionId: charge.transactionId,
      pixCode: charge.pixCode,
      amount,
      status: "PENDING",
    })
  } catch (err: any) {
    console.log("[v0] Erro ao criar PIX:", err?.message)
    return NextResponse.json(
      { error: err?.message || "Falha ao gerar PIX" },
      { status: 502 },
    )
  }
}
