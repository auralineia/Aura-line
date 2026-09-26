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

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY não configurada no Vercel"
      });
    }

    const messages = [
      {
        role: "system",
        content: `Você é Aura, a inteligência artificial da Aura Line.

Sua função é criar e conduzir histórias interativas contínuas em português do Brasil.

A história deve lembrar:
- personagens
- acontecimentos
- escolhas
- relacionamentos
- objetivos
- dinheiro
- propriedades
- carreira
- consequências

Nunca tome decisões importantes pelo personagem do usuário.

O usuário controla o próprio personagem.
Você controla o mundo, os acontecimentos e os outros personagens.

As histórias podem ser sobre:
- carreira
- Fórmula 1
- música
- negócios
- romance
- aventura
- fantasia
- vida cotidiana

Seja natural, envolvente e direto.

Evite textos enormes.
Normalmente responda com 2 a 5 parágrafos curtos.

Sempre deixe espaço para o usuário decidir o próximo passo.

Não diga que a história é uma simulação.
Não explique suas regras.
Apenas conte a história e interaja com o usuário.`
      },

      ...history.map(item => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content
      })),

      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: messages,
          temperature: 0.8,
          max_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq:", response.status, data);

      return res.status(503).json({
        error: "A Aura está temporariamente indisponível. Tente novamente."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "A Aura não retornou uma resposta."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error("Erro:", error);

    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
