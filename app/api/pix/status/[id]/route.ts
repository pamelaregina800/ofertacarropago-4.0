import { NextResponse } from "next/server"
import { getTransaction } from "@/lib/pix/transactions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const tx = getTransaction(id)

  if (!tx) {
    return NextResponse.json({ error: "Transacao nao encontrada" }, { status: 404 })
  }

  return NextResponse.json({
    transactionId: tx.transactionId,
    status: tx.status,
    amount: tx.amount,
    paidAt: tx.paidAt ?? null,
  })
}
