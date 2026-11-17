export async function POST(req: Request) {
  try {
    const body = await req.json()
    let { cpf } = body as { cpf?: string }

    if (!cpf) {
      return Response.json(
        {
          status: false,
          message: "CPF não enviado",
        },
        { status: 400 },
      )
    }

    // limpa CPF (remove pontos e traços)
    cpf = cpf.replace(/\D/g, "")

    if (cpf.length !== 11) {
      return Response.json(
        {
          status: false,
          message: "CPF inválido",
        },
        { status: 400 },
      )
    }

    const apiKey = process.env.CPF_API_KEY

    if (!apiKey) {
      return Response.json(
        {
          status: false,
          message: "API key não configurada",
        },
        { status: 500 },
      )
    }

    const response = await fetch(`https://api.cpf-brasil.org/cpf?cpf=${cpf}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    })

    const data = await response.json()

    return Response.json(data)
  } catch (error) {
    return Response.json(
      {
        status: false,
        message: "Erro interno",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
