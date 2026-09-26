export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Mensagem vazia"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada no Vercel"
      });
    }

    const contents = [
      ...history.map(item => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const systemPrompt = `
Você é a Aura, a inteligência artificial da Aura Line.

Sua função é criar e conduzir histórias interativas.

A pessoa pode criar qualquer tipo de história:
carreira, Fórmula 1, música, negócios, romance,
aventura, fantasia, ficção ou uma vida completamente nova.

A história deve parecer viva e contínua.

Você deve:
- lembrar dos acontecimentos anteriores;
- respeitar as escolhas da pessoa;
- criar personagens e acontecimentos;
- apresentar consequências;
- criar diálogos;
- descrever lugares e situações;
- manter continuidade;
- nunca decidir ações importantes pelo personagem do usuário;
- terminar cenas dando espaço para o usuário decidir o que fazer.

Escreva em português do Brasil.

Não diga que a história é uma simulação.

Faça a experiência parecer uma vida narrativa interativa.
`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1200
      }
    };

    const models = [
      "gemini-3.8-flash",
      "gemini-3.7-flash"
    ];

    let lastError = null;

    for (const model of models) {

      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent?key=" +
        encodeURIComponent(apiKey);

      for (let attempt = 1; attempt <= 4; attempt++) {

        try {

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

          const data = await response.json();

          if (response.ok) {

            const reply =
              data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (reply) {
              return res.status(200).json({
                reply
              });
            }

            lastError = "A IA não retornou texto.";

            break;
          }

          lastError =
            data?.error?.message ||
            "Erro ao consultar a IA.";

          console.error(
            "Gemini",
            model,
            "tentativa",
            attempt,
            response.status,
            lastError
          );

          /*
            503 = serviço temporariamente indisponível.
            429 = limite temporário.
            
            Nesses casos esperamos e tentamos novamente.
          */

          if (
            (response.status === 503 ||
             response.status === 429) &&
            attempt < 4
          ) {

            const delay =
              3000 * Math.pow(2, attempt - 1);

            await new Promise(resolve =>
              setTimeout(resolve, delay)
            );

            continue;
          }

          break;

        } catch (error) {

          lastError = error.message;

          console.error(
            "Erro de conexão:",
            error
          );

          if (attempt < 4) {

            const delay =
              3000 * Math.pow(2, attempt - 1);

            await new Promise(resolve =>
              setTimeout(resolve, delay)
            );

          }
        }
      }

      /*
        Se o 3.8 estiver temporariamente indisponível,
        tenta automaticamente o 3.7.
      */

      console.log(
        "Tentando modelo reserva:",
        model
      );
    }

    return res.status(503).json({
      error:
        "A Aura está temporariamente com alta demanda. Tente novamente em alguns segundos.",
      details: lastError
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
