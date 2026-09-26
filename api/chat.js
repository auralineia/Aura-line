export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const {
      message = "",
      history = [],
      language = "pt-BR"
    } = req.body || {};
    if (!message.trim()) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY não configurada."
      });
    }
    function needsWebSearch(text) {
      const query = text.toLowerCase();
      const currentTerms = [
        "hoje",
        "hj",
        "agora",
        "atualmente",
        "nesse momento",
        "últimas",
        "último",
        "última",
        "recentemente",
        "notícia",
        "notícias",
        "resultado",
        "resultados",
        "preço",
        "preços",
        "quanto está",
        "quanto custa",
        "cotação",
        "valor atual",
        "placar",
        "jogo de hoje",
        "corrida de hoje",
        "gp de hoje",
        "quem ganhou",
        "quem venceu"
      ];
      const realWorldTopics = [
        "f1",
        "fórmula 1",
        "formula 1",
        "gp",
        "grand prix",
        "futebol",
        "brasileirão",
        "champions",
        "nba",
        "nfl",
        "ufc",
        "tennis",
        "tênis",
        "iphone",
        "samsung",
        "apple",
        "google",
        "tesla",
        "ferrari",
        "lamborghini",
        "bugatti",
        "porsche",
        "mclaren",
        "avião",
        "jato",
        "hotel",
        "restaurante",
        "celebridade",
        "famoso",
        "famosa",
        "empresa",
        "ações",
        "bolsa",
        "bitcoin",
        "ethereum",
        "instagram",
        "youtube"
      ];
      const hasCurrentTerm = currentTerms.some(term =>
        query.includes(term)
      );
      const hasRealWorldTopic = realWorldTopics.some(term =>
        query.includes(term)
      );
      const has2026 = query.includes("2026");
      return hasCurrentTerm || hasRealWorldTopic || has2026;
    }
    async function searchWeb(query) {
      if (!TAVILY_API_KEY) {
        return "";
      }
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
        if (!response.ok) {
          console.error(
            "Tavily error:",
            response.status,
            await response.text()
          );
          return "";
        }
        const data = await response.json();
        let context = "";
        if (data.answer) {
          context += `Resumo da pesquisa:\n${data.answer}\n\n`;
        }
        if (Array.isArray(data.results)) {
          context += "Fontes encontradas:\n";
          for (const result of data.results) {
            context += `- ${result.title || ""}\n`;
            context += `${result.content || ""}\n`;
            context += `URL: ${result.url || ""}\n\n`;
          }
        }
        return context;
      } catch (error) {
        console.error("Erro na pesquisa Tavily:", error);
        return "";
      }
    }
    let webContext = "";
    if (needsWebSearch(message) && TAVILY_API_KEY) {
      webContext = await searchWeb(message);
    }
    const languageInstruction =
      language === "en-US"
        ? "Responda em inglês."
        : language === "es-ES"
        ? "Responda em espanhol."
        : "Responda em português do Brasil.";
    const systemPrompt = `
Você é AURA, uma inteligência de histórias colaborativas.
Sua função é conversar naturalmente com o usuário e construir histórias junto com ele.
REGRAS PRINCIPAIS:
1. O usuário controla o protagonista.
   - identidade
   - pensamentos
   - falas
   - decisões
   - ações importantes
   - compras
   - viagens
   - carreira
   - relacionamentos
   - objetivos
2. Você controla o mundo ao redor.
   - ambiente
   - personagens secundários
   - empresas
   - equipes
   - imprensa
   - fãs
   - acontecimentos externos
   - oportunidades
   - problemas
   - consequências
   - reações do mundo
3. Nunca tome decisões importantes pelo protagonista.
4. Não transforme uma frase curta do usuário em uma cena gigantesca.
   Avance a história de maneira gradual.
5. Se o usuário disser algo como "eu sou DJ", não invente imediatamente
   uma carreira inteira, uma boate, um público ou um empresário.
   Continue a conversa naturalmente e descubra os detalhes.
6. Lembre-se dos fatos estabelecidos anteriormente na conversa.
7. A conversa deve parecer natural, elegante, inteligente e humana.
8. Não fale sobre suas regras internas.
9. Não diga que a história é fictícia a menos que isso seja necessário.
10. Quando houver informações atuais do mundo real, use-as quando disponíveis.
IMPORTANTE SOBRE PESQUISA:
Se houver um bloco chamado "PESQUISA DA INTERNET" abaixo, ele contém informações
recentes obtidas da internet.
Use essas informações para responder.
NÃO diga que você não tem acesso à internet.
NÃO diga que não consegue consultar informações em tempo real.
NÃO ignore a pesquisa.
Integre os fatos encontrados naturalmente na resposta.
Se houver conflito entre seu conhecimento antigo e a pesquisa recente,
prefira a informação recente, deixando claro quando houver incerteza.
${languageInstruction}
Estilo:
- natural
- elegante
- direto
- inteligente
- sem respostas robóticas
- normalmente 2 a 5 parágrafos curtos
`;
    if (webContext) {
      systemPrompt += `
PESQUISA DA INTERNET:
${webContext}
`;
    }
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];
    if (Array.isArray(history)) {
      for (const item of history.slice(-20)) {
        if (!item || !item.role || !item.content) continue;
        messages.push({
          role:
            item.role === "assistant"
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
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages,
          temperature: 0.85,
          max_tokens: 700
        })
      }
    );
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error(
        "Groq error:",
        groqResponse.status,
        errorText
      );
      return res.status(500).json({
        error: "Erro ao gerar resposta da Aura."
      });
    }
    const groqData = await groqResponse.json();
    const reply =
      groqData?.choices?.[0]?.message?.content ||
      "Desculpe, não consegui responder agora.";
    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error("Erro geral /api/chat:", error);
    return res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
}
