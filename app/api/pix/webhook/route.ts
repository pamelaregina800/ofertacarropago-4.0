import { NextResponse } from "next/server"
import { getTransaction, saveTransaction, updateTransaction } from "@/lib/pix/transactions"
import type { PixStatus, PixTransaction } from "@/lib/pix/transactions"
import {
  sendOrderToUtmify,
  defaultEmptyTracking,
  type UtmifyStatus,
} from "@/lib/utmify/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Mapeia o status interno (Duttyfy) para o status aceito pela API Utmify
function toUtmifyStatus(status: PixStatus): UtmifyStatus | null {
  switch (status) {
    case "PENDING":
      return "waiting_payment"
    case "COMPLETED":
      return "paid"
    case "REFUSED":
      return "refused"
    case "REFUNDED":
      return "refunded"
    case "CHARGEBACK":
      return "chargedback"
    default:
      return null
  }
}

// Envia atualizacao de status para a Utmify usando os dados persistidos
// na transacao. As UTMs salvas no momento da criacao sao reaproveitadas,
// garantindo que o trackeamento nao se perca.
async function notifyUtmify(tx: PixTransaction, newStatus: PixStatus) {
  const utmifyStatus = toUtmifyStatus(newStatus)
  if (!utmifyStatus) return

  await sendOrderToUtmify({
    orderId: tx.transactionId,
    status: utmifyStatus,
    createdAtMs: tx.createdAt,
    paidAtMs: tx.paidAt || (newStatus === "COMPLETED" ? Date.now() : null),
    refundedAtMs:
      newStatus === "REFUNDED" || newStatus === "CHARGEBACK" ? Date.now() : null,
    amountInCents: tx.amount,
    customer: {
      name: tx.customer.name,
      email: tx.customer.email,
      phone: tx.customer.phone || null,
      document: tx.customer.document || null,
      ip: tx.customer.ip,
    },
    product: {
      id: "ativacao-99pay",
      name: "Ativacao da conta 99Pay",
    },
    trackingParameters: tx.trackingParameters || defaultEmptyTracking(),
  })
}

// Webhook da Duttyfy
// - Fonte de verdade: sempre o webhook (polling eh fallback)
// - items vem como OBJETO (nao array)
// - Em COMPLETED pode NAO vir transactionId; usar _id.$oid como fallback
// - Idempotencia: processar COMPLETED apenas uma vez por transactionId
// - Responder 2xx rapido (< 5s) para evitar retries
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any

    const transactionId: string | undefined =
      body?.transactionId || body?._id?.$oid || body?._id
    const status: PixStatus = (body?.status || "UNKNOWN") as PixStatus

    if (!transactionId) {
      console.log("[v0] Webhook sem transactionId:", body)
      // Responder 2xx mesmo assim para nao gerar retries do gateway
      return NextResponse.json({ ok: true, ignored: true })
    }

    const existing = getTransaction(transactionId)

    if (!existing) {
      // Nao conhecemos essa transacao - pode ser de outro ambiente.
      // Ainda assim, criamos um registro basico para idempotencia.
      const now = Date.now()
      const newTx: PixTransaction = {
        transactionId,
        status,
        amount: Number(body?.amount) || 0,
        pixCode: body?.pixCode || "",
        customer: {
          name: body?.customer?.name || "",
          document: String(body?.customer?.document || "").replace(/\D/g, ""),
          email: body?.customer?.email || "",
          phone: String(body?.customer?.phone || "").replace(/\D/g, ""),
        },
        createdAt: now,
        ...(status === "COMPLETED" ? { paidAt: now } : {}),
      }
      saveTransaction(newTx)

      // Notifica Utmify em background (sem UTMs - nao foram capturadas
      // porque a transacao veio direto do webhook sem passar pela /create)
      notifyUtmify(newTx, status).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.log("[v0] Falha background Utmify (webhook novo):", msg)
      })

      return NextResponse.json({ ok: true, created: true })
    }

    // Idempotencia: se ja estava COMPLETED, nao reprocessa
    if (existing.status === "COMPLETED" && status === "COMPLETED") {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    const paidAt = status === "COMPLETED" ? Date.now() : undefined
    updateTransaction(transactionId, {
      status,
      ...(paidAt ? { paidAt } : {}),
    })

    // Atualiza a Utmify com o novo status (paid/refused/refunded/chargedback).
    // Reaproveita as UTMs ja salvas na criacao do PIX.
    const updatedTx: PixTransaction = {
      ...existing,
      status,
      ...(paidAt ? { paidAt } : {}),
    }
    notifyUtmify(updatedTx, status).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.log("[v0] Falha background Utmify (update):", msg)
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.log("[v0] Erro no webhook PIX:", err?.message)
    // Ainda retorna 200 para evitar que o gateway faca retry eterno
    return NextResponse.json({ ok: false, error: err?.message })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "duttyfy-webhook" })
}
