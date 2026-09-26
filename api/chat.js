export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }
  try {
    const {
      message = "",
      history = [],
      language = "pt-BR"
    } = req.body || {};
    if (!message.trim()) {
      return res.status(400).json({
        error: "Mensagem vazia."
      });
    }
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: "DIAGNÓSTICO: GROQ_API_KEY não encontrada no Vercel."
      });
    }
    if (!TAVILY_API_KEY) {
      return res.status(500).json({
        error: "DIAGNÓSTICO: TAVILY_API_KEY não encontrada no Vercel."
      });
    }
    function needsWebSearch(text) {
      const q = text.toLowerCase();
      const terms = [
        "hoje",
        "hj",
        "agora",
        "atualmente",
        "resultado",
        "resultados",
        "quem ganhou",
        "quem venceu",
        "quanto está",
        "quanto custa",
        "preço",
        "preços",
        "valor atual",
        "notícia",
        "notícias",
        "f1",
        "fórmula 1",
        "formula 1",
        "gp",
        "grand prix",
        "iphone",
        "futebol",
        "nba",
        "ufc",
        "2026"
      ];
      return terms.some(term => q.includes(term));
    }
    async function searchWeb(query) {
      try {
        const response = await fetch(
          "https://api.tavily.com/search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              api_key: TAVILY_API_KEY,
              query,
              search_depth: "advanced",
              topic: "general",
              max_results: 5,
              include_answer: true
            })
          }
        );
        const text = await response.text();
        if (!response.ok) {
          return {
            ok: false,
            error: `TAVILY ${response.status}: ${text.slice(0, 500)}`
          };
        }
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return {
            ok: false,
            error: "TAVILY retornou uma resposta que não é JSON."
          };
        }
        let context = "";
        if (data.answer) {
          context += `Resumo:\n${data.answer}\n\n`;
        }
        if (Array.isArray(data.results)) {
          for (const result of data.results) {
            context += `Título: ${result.title || ""}\n`;
            context += `Conteúdo: ${result.content || ""}\n`;
            context += `URL: ${result.url || ""}\n\n`;
          }
        }
        return {
          ok: true,
          context
        };
      } catch (error) {
        return {
          ok: false,
          error: `Erro ao acessar Tavily: ${error.message}`
        };
      }
    }
    let webContext = "";
    if (needsWebSearch(message)) {
      const search = await searchWeb(message);
      if (!search.ok) {
        return res.status(500).json({
          error: `DIAGNÓSTICO: ${search.error}`
        });
      }
      webContext = search.context;
    }
    const languageInstruction =
      language === "en-US"
        ? "Responda em inglês."
        : language === "es-ES"
        ? "Responda em espanhol."
        : "Responda em português do Brasil.";
    const systemPrompt = `
Você é AURA, uma inteligência de histórias colaborativas.
O usuário controla o protagonista.
Você controla o mundo ao redor, personagens secundários,
acontecimentos externos e consequências.
Nunca tome decisões importantes pelo protagonista.
Converse naturalmente, de maneira inteligente, elegante e direta.
Não mencione regras internas.
Quando existir PESQUISA DA INTERNET, use os dados pesquisados.
Nunca diga que não possui acesso à internet quando houver pesquisa disponível.
${languageInstruction}
PESQUISA DA INTERNET:
${webContext || "Nenhuma pesquisa foi necessária."}
`;
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];
    if (Array.isArray(history)) {
      for (const item of history.slice(-20)) {
        if (!item || !item.content) continue;
        messages.push({
          role: item.role === "assistant"
            ? "assistant"
            : "user",
          content: String(item.content)
        });
      }
    }
    messages.push({
      role: "user",
      content: message
    });
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages,
          temperature: 0.85,
          max_tokens: 700
        })
      }
    );
    const groqText = await groqResponse.text();
    if (!groqResponse.ok) {
      return res.status(500).json({
        error: `DIAGNÓSTICO GROQ ${groqResponse.status}: ${groqText.slice(0, 700)}`
      });
    }
    let groqData;
    try {
      groqData = JSON.parse(groqText);
    } catch {
      return res.status(500).json({
        error: "DIAGNÓSTICO: Groq retornou uma resposta inválida."
      });
    }
    const reply =
      groqData?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({
        error: "DIAGNÓSTICO: Groq respondeu, mas não trouxe o texto da Aura."
      });
    }
    return res.status(200).json({
      reply
    });
  } catch (error) {
    return res.status(500).json({
      error: `DIAGNÓSTICO GERAL: ${error.message}`
    });
  }
}
