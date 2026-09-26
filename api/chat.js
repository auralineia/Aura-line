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

    const requestBody = {
      systemInstruction: {
        parts: [{
          text: `
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
          `
        }]
      },
      contents,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1200
      }
    };

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    let data = null;
    let lastError = null;

    // Tenta até 3 vezes caso o Gemini esteja temporariamente indisponível.
    for (let attempt = 1; attempt <= 3; attempt++) {

      try {

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        data = await response.json();

        if (response.ok) {
          break;
        }

        lastError =
          data?.error?.message ||
          "Erro ao consultar a IA";

        // 503 = serviço temporariamente indisponível.
        // Espera antes de tentar novamente.
        if (response.status === 503 && attempt < 3) {
          await new Promise(resolve =>
            setTimeout(resolve, 1500 * attempt)
          );
          continue;
        }

        return res.status(response.status).json({
          error: lastError
        });

      } catch (error) {

        lastError = error.message;

        if (attempt < 3) {
          await new Promise(resolve =>
            setTimeout(resolve, 1500 * attempt)
          );
        }

      }
    }

    if (!data) {
      return res.status(503).json({
        error: lastError ||
          "A IA está temporariamente indisponível."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({
        error: "A IA não retornou uma resposta."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
