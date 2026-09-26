export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia" });
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
          text: `Você é Aura, a IA da Aura Line.

Crie histórias interativas contínuas em português do Brasil.

Lembre dos acontecimentos, personagens, escolhas e consequências.
Nunca decida ações importantes pelo personagem do usuário.
Mantenha a história realista e envolvente.
Responda de forma DIRETA, sem textos enormes.
Normalmente use 2 a 5 parágrafos curtos e termine dando espaço para o usuário decidir.

O usuário pode criar qualquer tipo de história: carreira, F1, música, negócios, romance, aventura, fantasia ou vida cotidiana.

Não diga que a história é uma simulação.`
        }]
      },
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 700
      }
    };

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini:", response.status, data);

      return res.status(503).json({
        error: "A Aura está temporariamente indisponível. Tente novamente."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({
        error: "A IA não retornou uma resposta."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
