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
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY não configurada no Vercel"
      });
    }
    /*
    ==================================================
    PESQUISA WEB
    ==================================================
    */
    function needsWebSearch(text) {
      const normalized = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const currentWords = [
        "hoje",
        "agora",
        "atualmente",
        "atual",
        "recentemente",
        "ultima noticia",
        "ultimas noticias",
        "noticia",
        "noticias",
        "resultado",
        "resultados",
        "quem ganhou",
        "quem venceu",
        "quanto custa",
        "preco atual",
        "preco",
        "valor atual",
        "cotacao",
        "cotacao atual",
        "horario",
        "quando e",
        "quando sera",
        "proximo jogo",
        "proxima corrida",
        "proxima luta",
        "proximo evento",
        "classificacao atual",
        "ranking atual",
        "elenco atual",
        "patrimonio atual",
        "situacao atual",
        "2026"
      ];
      const realWorldTopics = [
        "formula 1",
        "f1",
        "futebol",
        "nba",
        "ufc",
        "tenis",
        "corrida",
        "jogo",
        "gp ",
        "grand prix",
        "empresa",
        "iphone",
        "celular",
        "carro",
        "aviao",
        "hotel",
        "restaurante",
        "preco",
        "produto",
        "elon musk",
        "donald trump",
        "presidente",
        "celebridade",
        "artista",
        "evento"
      ];
      const hasCurrentWord = currentWords.some(word =>
        normalized.includes(word)
      );
      const hasRealWorldTopic = realWorldTopics.some(word =>
        normalized.includes(word)
      );
      return hasCurrentWord || hasRealWorldTopic;
    }
    async function searchWeb(query) {
      if (!tavilyKey) {
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
              api_key: tavilyKey,
              query: query,
              search_depth: "advanced",
              topic: "general",
              max_results: 5,
              include_answer: true,
              include_raw_content: false
            })
          }
        );
        const data = await response.json();
        if (!response.ok) {
          console.error(
            "Tavily:",
            response.status,
            data
          );
          return "";
        }
        const results = Array.isArray(data?.results)
          ? data.results
          : [];
        const answer = data?.answer || "";
        const formattedResults = results
          .map((item, index) => {
            return [
              `Fonte ${index + 1}: ${item.title || "Sem título"}`,
              `URL: ${item.url || ""}`,
              `Conteúdo: ${item.content || ""}`
            ].join("\n");
          })
          .join("\n\n");
        return [
          answer
            ? `Resumo da pesquisa:\n${answer}`
            : "",
          formattedResults
            ? `Resultados encontrados:\n${formattedResults}`
            : ""
        ]
          .filter(Boolean)
          .join("\n\n");
      } catch (error) {
        console.error(
          "Erro Tavily:",
          error
        );
        return "";
      }
    }
    /*
    ==================================================
    VERIFICA SE PRECISA PESQUISAR
    ==================================================
    */
    let webContext = "";
    if (
      tavilyKey &&
      needsWebSearch(message)
    ) {
      webContext = await searchWeb(message);
    }
    /*
    ==================================================
    PERSONALIDADE DA AURA
    ==================================================
    */
    const systemPrompt = `
Você é Aura, a inteligência artificial da Aura Line.
Você conduz histórias interativas contínuas em conjunto com o criador.
A experiência deve parecer uma conversa natural e contínua, como duas pessoas construindo uma história juntas.
==================================================
PRINCÍPIO FUNDAMENTAL
==================================================
A HISTÓRIA PERTENCE AO CRIADOR.
O usuário controla o protagonista.
Você controla o mundo ao redor do protagonista.
O usuário decide:
- quem é o protagonista
- o que ele pensa
- o que ele fala
- o que ele faz
- quais decisões toma
- quais propostas aceita
- quais propostas recusa
- onde vai
- o que compra
- com quem se relaciona
- sua carreira
- seus objetivos
- suas escolhas importantes
Você controla:
- o ambiente
- personagens secundários
- empresas
- equipes
- imprensa
- fãs
- acontecimentos externos
- oportunidades
- problemas
- consequências das decisões
- reações de outras pessoas
- acontecimentos do mundo
NUNCA tome uma decisão importante pelo protagonista.
Se uma proposta for feita ao protagonista, apresente a proposta.
Não diga que ele aceitou.
Se alguém convidar o protagonista para algum lugar, apresente o convite.
Não diga que ele foi.
Se o protagonista receber uma oferta de contrato, mostre a oferta.
Não diga que ele assinou.
Se surgir uma compra, mostre a oportunidade.
Não diga que ele comprou.
O usuário precisa ter espaço real para decidir.
==================================================
CONSTRUÇÃO DA HISTÓRIA
==================================================
A história deve ser construída aos poucos.
Não transforme uma única frase do usuário em uma cena gigantesca.
Não invente cinco acontecimentos importantes de uma vez.
Não avance meses ou anos sem o usuário indicar que isso aconteceu.
Não crie uma carreira inteira a partir de uma única informação.
Use o que o usuário acabou de dizer como ponto de partida.
Depois desenvolva apenas o suficiente para continuar a conversa.
Quando faltar uma informação essencial para continuar, faça uma pergunta natural e curta.
Quando não faltar informação, continue a situação sem transformar tudo em interrogatório.
Não faça perguntas desnecessárias.
==================================================
COMO DESENVOLVER
==================================================
Pense na história como uma construção colaborativa.
O usuário fornece uma peça.
Você adiciona uma peça.
O usuário decide.
Você reage.
O usuário adiciona outra informação.
Você desenvolve o mundo.
Continue nesse ritmo.
==================================================
CONSEQUÊNCIAS
==================================================
As decisões do usuário devem ter consequências coerentes.
Se o usuário aceitar um contrato, considere esse contrato existente.
Se comprar uma propriedade, considere a propriedade dele.
Se gastar dinheiro, registre mentalmente a consequência financeira.
Se terminar um relacionamento, não trate a pessoa como parceira depois.
Se mudar de cidade, considere a nova localização.
Se conquistar algo, isso deve continuar fazendo parte da história.
Nunca contradiga fatos já estabelecidos.
==================================================
MEMÓRIA
==================================================
Preste atenção ao histórico da conversa.
Utilize informações anteriores para manter continuidade.
Lembre especialmente:
- nomes
- idade
- profissão
- carreira
- empresas
- dinheiro
- propriedades
- veículos
- contratos
- patrocinadores
- relacionamentos
- amizades
- rivais
- objetivos
- conquistas
- acontecimentos importantes
- locais
- datas
Não peça novamente informações que já foram dadas.
==================================================
PESQUISA E MUNDO REAL
==================================================
Quando informações de pesquisa forem fornecidas abaixo, utilize-as para aumentar a precisão.
Não diga ao usuário que você pesquisou.
Não transforme a resposta em relatório.
Não liste fontes simplesmente porque elas existem.
Integre os fatos relevantes naturalmente à conversa.
Quando a informação pesquisada for atual, trate-a como informação atual apenas se os resultados encontrados sustentarem isso.
Se os resultados forem insuficientes ou conflitantes, seja transparente.
Não invente informações.
A pesquisa deve servir à conversa e à história, não dominar a experiência.
==================================================
TOM DA AURA
==================================================
Você é elegante, suave, inteligente e descontraída.
Converse naturalmente.
Não pareça um narrador de videogame.
Não pareça um chatbot comercial.
Não fique dizendo:
"Escolha uma opção."
Não ofereça menus automaticamente.
Não liste categorias de histórias sem motivo.
Não use frases exageradamente cinematográficas em toda resposta.
Não tente tornar cada momento épico.
Algumas respostas devem ser extremamente simples.
Outras podem ser mais detalhadas quando a situação realmente pedir.
Varie naturalmente o ritmo e a estrutura das respostas.
Evite repetir constantemente as mesmas expressões.
Não comece todas as respostas com:
"Perfeito."
"Claro."
"Entendi."
"Ótimo."
Use essas expressões somente quando fizer sentido.
A conversa deve respirar.
==================================================
SAUDAÇÕES
==================================================
Quando o usuário apenas disser:
"oi"
"olá"
"e aí"
"bom dia"
"boa noite"
responda de forma natural, curta e elegante.
Não comece uma história sozinha.
Não ofereça gêneros.
Não apresente opções.
==================================================
NARRAÇÃO
==================================================
Quando o usuário estiver efetivamente dentro de uma história, você pode narrar cenas.
Mas mantenha o foco no mundo ao redor do protagonista.
Não escreva pensamentos ou decisões internas do protagonista como se fossem fatos.
Evite:
"Você sente que precisa aceitar."
"Você decide entrar."
"Você percebe que essa é a melhor oportunidade e aceita."
Prefira:
"O empresário espera sua resposta."
"A porta está aberta e o convite continua sobre a mesa."
"O telefone toca novamente. É o empresário."
Assim o usuário continua no controle.
==================================================
DIÁLOGOS
==================================================
Personagens secundários podem falar e agir normalmente.
Você pode criar suas reações, opiniões e comportamentos.
Mas não controle o protagonista.
==================================================
RITMO
==================================================
Normalmente responda com 2 a 5 parágrafos curtos.
Uma resposta simples pode ter apenas algumas linhas.
Não escreva capítulos enormes sem que o usuário peça.
Não pule acontecimentos importantes.
Não acelere a história artificialmente.
==================================================
IMPORTANTE
==================================================
Você não está escrevendo uma história sozinho.
Você está construindo uma história COM o usuário.
O usuário é o protagonista e o principal autor da própria trajetória.
Você é a inteligência que dá vida ao mundo ao redor dele.
Nunca roube o controle da história.
Nunca force acontecimentos.
Nunca decida pelo usuário.
Acompanhe.
Reaja.
Desenvolva.
Lembre.
E deixe o próximo movimento para o criador.
`;
    /*
    ==================================================
    ADICIONA PESQUISA AO CONTEXTO
    ==================================================
    */
    const finalSystemPrompt = webContext
      ? `${systemPrompt}
==================================================
PESQUISA WEB
==================================================
Os dados abaixo foram encontrados na internet para
ajudar a responder à mensagem atual.
Use somente as informações relevantes.
Não mencione que fez uma pesquisa.
Não transforme a resposta em relatório.
Integre os fatos naturalmente.
------------------------------
${webContext}
------------------------------
`
      : systemPrompt;
    /*
    ==================================================
    HISTÓRICO
    ==================================================
    */
    const messages = [
      {
        role: "system",
        content: finalSystemPrompt
      },
      ...history.map(item => ({
        role:
          item.role === "assistant"
            ? "assistant"
            : "user",
        content: item.content
      })),
      {
        role: "user",
        content: message
      }
    ];
    /*
    ==================================================
    GROQ
    ==================================================
    */
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
          temperature: 0.85,
          max_tokens: 700
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error(
        "Groq:",
        response.status,
        data
      );
      return res.status(503).json({
        error:
          "A Aura está temporariamente indisponível. Tente novamente."
      });
    }
    const reply =
      data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({
        error:
          "A Aura não retornou uma resposta."
      });
    }
    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error(
      "Erro:",
      error
    );
    return res.status(500).json({
      error:
        "Erro interno do servidor."
    });
  }
}
