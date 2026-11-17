import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware limpo - funil 99Pay.
 *
 * Sem bloqueios. Sem deteccao de user-agent. Sem geo-fence.
 * Sem anti-clone. Sem redirect para /clock. Sem nada.
 *
 * Deixa toda requisicao passar direto para a pagina destino.
 * Funciona em desktop, mobile, tablet, qualquer navegador,
 * qualquer pais, qualquer horario.
 *
 * UTMs continuam sendo capturadas normalmente pelo script da
 * UTMify carregado no layout.tsx (CDN oficial) - nao precisa
 * de middleware para isso.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  // Nao executa em assets estaticos nem em rotas de API.
  // Importante: /api/pix/* precisa passar livre para os webhooks
  // de pagamento funcionarem sem interferencia.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|_pc\\.js).*)",
  ],
}
