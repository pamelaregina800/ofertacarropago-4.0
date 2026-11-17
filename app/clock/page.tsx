import { redirect } from "next/navigation"

/**
 * Antigo gate de verificacao (SecureCheck).
 * Removido: redireciona imediatamente para a home para que
 * qualquer link antigo nao prenda o visitante.
 */
export default function ClockVerificationPage() {
  redirect("/")
}
