const MODEL = "openai/gpt-oss-20b";

const PLANS = {
  free: {
    name: "FREE",
    research: "full",
    memory: "basic",
    context: "short",
    speed: "normal",
    complexity: "essential"
  },
  pro: {
    name: "PRO",
    research: "full",
    memory: "long",
    context: "large",
    speed: "fast",
    complexity: "advanced"
  },
  ultra: {
    name: "ULTRA",
    research: "deep",
    memory: "advanced",
    context: "very_large",
    speed: "priority",
    complexity: "maximum"
  }
};

/* =========================================================
   SUPABASE
========================================================= */

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      "SUPABASE_URL não configurada."
    );
  }

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada."
    );
  }

  if (!anonKey) {
    throw new Error(
      "SUPABASE_ANON_KEY ou SUPABASE_PUBLISHABLE_KEY não configurada."
    );
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceKey,
    anonKey
  };
}

function bearer(req) {
  const authorization =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

async function authenticatedUser(req) {
  const token = bearer(req);

  if (!token) {
    return null;
  }

  const url = process.env.SUPABASE_URL;

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL ou chave pública não configurada."
    );
  }

  const response = await fetch(
    `${url.replace(/\/+$/, "")}/auth/v1/user`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    console.error(
      "Falha na autenticação:",
      response.status,
      await response.text()
    );

    return null;
  }

  const user = await response.json();

  return user?.id ? user : null;
}

/* =========================================================
   CRÉDITOS
========================================================= */

async function consumeCredits(
  userId,
  amount
) {
  const {
    url,
    serviceKey
  } = supabaseConfig();

  const response = await fetch(
    `${url}/rest/v1/rpc/consume_credits_for_user`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_amount: amount
      })
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    if (
      raw
        .toLowerCase()
        .includes("insufficient") ||
      raw
        .toLowerCase()
        .includes("créditos insuficientes")
    ) {
      return {
        ok: false,
        insufficient: true
      };
    }

    throw new Error(
      `Erro ao consumir créditos: ${response.status} ${raw}`
    );
  }

  let value;

  try {
    value = JSON.parse(raw);
  } catch {
    value = raw;
  }

  let balance;

  if (Array.isArray(value)) {
    balance = Number(value[0]);
  } else if (
    value &&
    typeof value === "object" &&
    "balance" in value
  ) {
    balance = Number(value.balance);
  } else {
    balance = Number(value);
  }

  return {
    ok: true,
    balance: Number.isFinite(balance)
      ? balance
      : 0
  };
}

/* =========================================================
   MEMÓRIA
========================================================= */

async function getMemories(
  userId,
  userToken
) {
  const {
    url,
    anonKey
  } = supabaseConfig();

  if (!userToken) {
    console.error(
      "Não foi possível ler memórias: token do usuário ausente."
    );

    return [];
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/aura_memories` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=id,memory,category,importance,updated_at` +
      `&order=importance.desc,updated_at.desc` +
      `&limit=30`,
      {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization:
            `Bearer ${userToken}`,
          "Content-Type":
            "application/json"
        }
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Erro lendo memórias:",
        response.status,
        errorText
      );

      return [];
    }

    const data =
      await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error(
      "Falha ao ler memórias:",
      error
    );

    return [];
  }
}

async function memoryExists(
  userId,
  memory,
  userToken
) {
  const {
    url,
    anonKey
  } = supabaseConfig();

  if (!userToken) {
    return false;
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/aura_memories` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&memory=eq.${encodeURIComponent(memory)}` +
      `&select=id` +
      `&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization:
            `Bearer ${userToken}`,
          "Content-Type":
            "application/json"
        }
      }
    );

    if (!response.ok) {
      console.error(
        "Erro verificando memória:",
        response.status,
        await response.text()
      );

      return false;
    }

    const data =
      await response.json();

    return (
      Array.isArray(data) &&
      data.length > 0
    );
  } catch (error) {
    console.error(
      "Falha verificando memória:",
      error
    );

    return false;
  }
}

async function saveMemory(
  userId,
  userToken,
  memory,
  category = "general",
  importance = 5
) {
  if (
    !memory ||
    typeof memory !== "string" ||
    !memory.trim()
  ) {
    return false;
  }

  if (!userToken) {
    console.error(
      "Não foi possível salvar memória: token ausente."
    );

    return false;
  }

  const cleanMemory =
    memory
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 500);

  if (!cleanMemory) {
    return false;
  }

  if (
    await memoryExists(
      userId,
      cleanMemory,
      userToken
    )
  ) {
    return true;
  }

  const {
    url,
    anonKey
  } = supabaseConfig();

  try {
    const response = await fetch(
      `${url}/rest/v1/aura_memories`,
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization:
            `Bearer ${userToken}`,
          "Content-Type":
            "application/json",
          Prefer:
            "return=minimal"
        },
        body: JSON.stringify({
          user_id: userId,
          memory: cleanMemory,
          category,
          importance
        })
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Erro salvando memória:",
        response.status,
        errorText
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Falha salvando memória:",
      error
    );

    return false;
  }
}

/* =========================================================
   DETECÇÃO DE NOME
========================================================= */

function detectName(message) {
  const text =
    String(message || "").trim();

  const patterns = [
    /(?:meu nome é|meu nome e|pode me chamar de|me chamo)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,60})/i
  ];

  for (const pattern of patterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      let name =
        match[1]
          .trim()
          .replace(
            /[.!?,;:]+$/,
            ""
          )
          .trim();

      name =
        name
          .split(
            /\s+(?:e|mas|porque|que|sou|tenho|moro|gosto)\s+/i
          )[0]
          .trim();

      if (
        name.length >= 2 &&
        name.length <= 60
      ) {
        return name;
      }
    }
  }

  return null;
}

/* =========================================================
   DETECÇÃO AUTOMÁTICA DE MEMÓRIAS
========================================================= */

function automaticMemories(message) {
  const text =
    String(message || "")
      .trim();

  if (!text) {
    return [];
  }

  const memories = [];

  function add(
    memory,
    category,
    importance
  ) {
    if (
      memory &&
      typeof memory === "string"
    ) {
      memories.push({
        memory:
          memory
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 500),
        category,
        importance
      });
    }
  }

  /* =======================================================
     NOME
  ======================================================= */

  const name =
    detectName(text);

  if (name) {
    add(
      `O nome do usuário é ${name}.`,
      "personal",
      10
    );
  }

  /* =======================================================
     IDADE
  ======================================================= */

  const agePatterns = [
    /(?:eu\s+)?tenho\s+(\d{1,3})\s+anos\b/i,
    /(?:eu\s+)?estou\s+com\s+(\d{1,3})\s+anos\b/i,
    /(?:minha\s+idade\s+é|minha idade e)\s+(\d{1,3})\b/i
  ];

  for (const pattern of agePatterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      const age =
        Number(match[1]);

      if (
        age >= 1 &&
        age <= 120
      ) {
        add(
          `A idade do usuário é ${age} anos.`,
          "personal",
          9
        );
      }

      break;
    }
  }

  /* =======================================================
     DATA DE NASCIMENTO
  ======================================================= */

  const birthPatterns = [
    /(?:nasci em|nasc[ií] no dia|meu aniversário é|meu aniversario e|faço aniversário em|faco aniversario em)\s+(.{2,80})/i
  ];

  for (const pattern of birthPatterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      const value =
        match[1]
          .replace(
            /[.!?]+$/,
            ""
          )
          .trim();

      if (value.length >= 3) {
        add(
          `A data de nascimento ou aniversário do usuário é ${value}.`,
          "personal",
          9
        );
      }

      break;
    }
  }

  /* =======================================================
     CIDADE / LOCALIZAÇÃO
  ======================================================= */

  const cityPatterns = [
    /(?:moro em|moro na|moro no|vivo em|vivo na|vivo no|sou de|sou da|sou do)\s+([^.!?,;]{2,80})/i
  ];

  for (const pattern of cityPatterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      const place =
        match[1]
          .trim()
          .replace(
            /\s+(?:há|ha)\s+\d+.*$/i,
            ""
          );

      if (
        place.length >= 2 &&
        place.length <= 80
      ) {
        add(
          `O usuário mora ou é de ${place}.`,
          "location",
          7
        );
      }

      break;
    }
  }

  /* =======================================================
     PROFISSÃO
  ======================================================= */

  const professionPatterns = [
    /(?:sou|trabalho como|trabalho de|atuo como|atuo na área de|atuo na area de)\s+(?:um |uma |o |a )?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]{2,60})/i
  ];

  const professionWords = [
    "médico",
    "médica",
    "engenheiro",
    "engenheira",
    "advogado",
    "advogada",
    "professor",
    "professora",
    "empresário",
    "empresaria",
    "empresária",
    "dentista",
    "psicólogo",
    "psicóloga",
    "enfermeiro",
    "enfermeira",
    "arquiteto",
    "arquiteta",
    "programador",
    "programadora",
    "desenvolvedor",
    "desenvolvedora",
    "designer",
    "jornalista",
    "fotógrafo",
    "fotógrafa",
    "piloto",
    "pilota",
    "músico",
    "músico",
    "dj",
    "artista",
    "vendedor",
    "vendedora",
    "gerente",
    "diretor",
    "diretora",
    "estudante"
  ];

  for (const word of professionWords) {
    const professionRegex =
      new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );

    if (
      professionRegex.test(text) &&
      /(?:sou|trabalho|atuo|minha profissão|minha profissao)/i.test(text)
    ) {
      add(
        `A profissão do usuário está relacionada a ${word}.`,
        "professional",
        7
      );

      break;
    }
  }

  /* =======================================================
     RELACIONAMENTO
  ======================================================= */

  const relationshipPatterns = [
    /(?:sou|estou)\s+(casado|casada|solteiro|solteira|noivo|noiva|namorando|divorciado|divorciada|viúvo|viúva)\b/i
  ];

  for (const pattern of relationshipPatterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      add(
        `O usuário está ${match[1].toLowerCase()}.`,
        "relationship",
        7
      );

      break;
    }
  }

  /* =======================================================
     FILHOS / FAMÍLIA
  ======================================================= */

  const childPatterns = [
    /(?:tenho|possuo)\s+(\d+)\s+(filhos?|filhas?)\b/i,
    /(?:meu filho se chama|minha filha se chama)\s+([^.!?,;]+)/i
  ];

  for (const pattern of childPatterns) {
    const match =
      text.match(pattern);

    if (!match) {
      continue;
    }

    if (
      match[1] &&
      /^\d+$/.test(match[1])
    ) {
      add(
        `O usuário tem ${match[1]} ${match[2].toLowerCase()}.`,
        "family",
        8
      );
    } else if (match[1]) {
      const childName =
        match[1]
          .trim()
          .replace(
            /[.!?]+$/,
            ""
          );

      if (childName.length >= 2) {
        add(
          `O usuário tem um familiar chamado ${childName}.`,
          "family",
          8
        );
      }
    }

    break;
  }

  /* =======================================================
     GOSTOS / PREFERÊNCIAS
  ======================================================= */

  const likePatterns = [
    /(?:eu\s+)?gosto\s+de\s+([^.!?]{2,100})/i,
    /(?:eu\s+)?adoro\s+([^.!?]{2,100})/i,
    /(?:eu\s+)?amo\s+([^.!?]{2,100})/i,
    /(?:meu|minha)\s+(?:carro|comida|filme|série|serie|música|musica|time|equipe)\s+(?:favorito|favorita)\s+(?:é|e|são|sao)\s+([^.!?]{2,100})/i
  ];

  for (const pattern of likePatterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      const preference =
        match[1]
          .trim()
          .replace(
            /[.!?]+$/,
            ""
          );

      if (
        preference.length >= 2 &&
        preference.length <= 100
      ) {
        add(
          `O usuário gosta de ${preference}.`,
          "preference",
          6
        );
      }

      break;
    }
  }

  /* =======================================================
     OBJETIVOS / SONHOS
  ======================================================= */

  const goalPatterns = [
    /(?:meu sonho é|minha meta é|meu objetivo é|quero muito|pretendo)\s+([^.!?]{3,150})/i
  ];

  for (const pattern of goalPatterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      const goal =
        match[1]
          .trim()
          .replace(
            /[.!?]+$/,
            ""
          );

      if (
        goal.length >= 3 &&
        goal.length <= 150
      ) {
        add(
          `Um objetivo ou sonho importante do usuário é ${goal}.`,
          "goals",
          7
        );
      }

      break;
    }
  }

  /* =======================================================
     EVITA DUPLICATAS DENTRO DA MESMA MENSAGEM
  ======================================================= */

  const unique = [];
  const seen = new Set();

  for (const item of memories) {
    const key =
      item.memory
        .toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique.slice(0, 10);
}

/* =========================================================
   PEDIDO EXPLÍCITO DE MEMÓRIA
========================================================= */

function wantsMemory(message) {
  const text =
    String(message || "")
      .toLowerCase();

  const terms = [
    "lembre disso",
    "lembra disso",
    "guarde isso",
    "guarda isso",
    "memorize isso",
    "salva isso",
    "salve isso",
    "quero que você lembre",
    "quero que lembre",
    "não esqueça",
    "nao esqueça",
    "nao esqueca",
    "lembra de mim",
    "lembre de mim"
  ];

  return terms.some(
    term => text.includes(term)
  );
}

/* =========================================================
   EXTRAÇÃO AUTOMÁTICA COM IA
========================================================= */

function looksPersonal(message) {
  const text =
    String(message || "")
      .toLowerCase();

  const indicators = [
    "eu ",
    "meu ",
    "minha ",
    "meus ",
    "minhas ",
    "tenho ",
    "sou ",
    "moro ",
    "vivo ",
    "gosto ",
    "adoro ",
    "amo ",
    "quero ",
    "pretendo ",
    "meu sonho",
    "minha meta",
    "minha profissão",
    "meu trabalho",
    "meu aniversário",
    "meu aniversario"
  ];

  return indicators.some(
    term => text.includes(term)
  );
}

async function extractAndSaveMemories(
  userId,
  userToken,
  message
) {
  const key =
    process.env.GROQ_API_KEY;

  if (!key) {
    return;
  }

  if (
    !looksPersonal(message)
  ) {
    return;
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${key}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          max_completion_tokens: 500,
          messages: [
            {
              role: "system",
              content: `
Você é o sistema de memória pessoal da Aura.

Sua função é identificar informações pessoais relevantes que o usuário acabou de revelar espontaneamente.

NÃO espere que o usuário diga "lembre disso".

Extraia informações como:
- nome
- idade
- aniversário
- cidade/local onde mora
- profissão
- trabalho
- relacionamento
- filhos
- familiares
- gostos
- preferências
- hobbies
- objetivos
- sonhos
- informações pessoais importantes para conversas futuras

NÃO salve:
- perguntas comuns
- fatos gerais
- informações temporárias sem importância
- informações sobre terceiros que não sejam relevantes para o usuário
- conteúdo inventado
- informações que você não tenha certeza que foram afirmadas pelo usuário

Retorne SOMENTE um JSON válido neste formato:

{
  "memories": [
    {
      "memory": "O usuário tem 52 anos.",
      "category": "personal",
      "importance": 9
    }
  ]
}

Categorias permitidas:
personal
location
professional
relationship
family
preference
goals
general

Importance:
1 a 10.

Se não houver nenhuma informação pessoal relevante:

{
  "memories": []
}
`
            },
            {
              role: "user",
              content:
                String(message)
                  .slice(0, 3000)
            }
          ]
        })
      }
    );

    if (!response.ok) {
      console.error(
        "Erro na extração automática de memória:",
        response.status,
        await response.text()
      );

      return;
    }

    const data =
      await response.json();

    let content =
      data
        ?.choices?.[0]
        ?.message
        ?.content || "";

    content =
      content
        .replace(
          /```json/gi,
          ""
        )
        .replace(
          /```/g,
          ""
        )
        .trim();

    if (!content) {
      return;
    }

    let parsed;

    try {
      parsed =
        JSON.parse(content);
    } catch (error) {
      console.error(
        "Não foi possível interpretar memórias automáticas:",
        error
      );

      return;
    }

    const memories =
      Array.isArray(
        parsed?.memories
      )
        ? parsed.memories
        : [];

    for (const item of memories.slice(0, 8)) {
      if (
        !item ||
        typeof item.memory !==
          "string"
      ) {
        continue;
      }

      const importance =
        Math.min(
          10,
          Math.max(
            1,
            Number(
              item.importance
            ) || 5
          )
        );

      await saveMemory(
        userId,
        userToken,
        item.memory,
        item.category ||
          "general",
        importance
      );
    }
  } catch (error) {
    console.error(
      "Erro extraindo memórias automáticas:",
      error
    );
  }
}

/* =========================================================
   PROCESSAMENTO DE MEMÓRIA
========================================================= */

async function processMemory(
  userId,
  userToken,
  message
) {
  /*
   * Primeiro salva informações simples
   * sem gastar outra chamada de IA.
   */
  const automatic =
    automaticMemories(
      message
    );

  for (const item of automatic) {
    await saveMemory(
      userId,
      userToken,
      item.memory,
      item.category,
      item.importance
    );
  }

  /*
   * Depois usa IA somente quando a mensagem
   * parece conter informação pessoal.
   *
   * Isso permite descobrir informações mais
   * complexas que os padrões acima não detectam.
   */
  if (
    looksPersonal(message)
  ) {
    await extractAndSaveMemories(
      userId,
      userToken,
      message
    );
  }

  /*
   * Pedidos explícitos continuam funcionando.
   */
  if (
    wantsMemory(message)
  ) {
    await extractAndSaveMemories(
      userId,
      userToken,
      message
    );
  }
}

/* =========================================================
   HISTÓRICO
========================================================= */

function safeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      item =>
        item &&
        (
          item.role === "user" ||
          item.role === "assistant"
        ) &&
        typeof item.content ===
          "string"
    )
    .slice(-8)
    .map(item => ({
      role: item.role,
      content:
        item.content.slice(
          0,
          1800
        )
    }));
}

/* =========================================================
   PESQUISA
========================================================= */

function needsWebSearch(message) {
  const text =
    String(message || "")
      .toLowerCase();

  const terms = [
    "hoje",
    "agora",
    "atualmente",
    "últimas notícias",
    "última notícia",
    "notícias",
    "notícia",
    "recentemente",
    "recente",
    "preço",
    "preços",
    "valor atual",
    "cotação",
    "dólar hoje",
    "euro hoje",
    "quem é",
    "quando é",
    "quando vai",
    "data",
    "horário",
    "horas",
    "resultado",
    "resultados",
    "placar",
    "jogo",
    "jogos",
    "ufc",
    "f1",
    "fórmula 1",
    "formula 1",
    "gp",
    "grande prêmio",
    "grande premio",
    "corrida",
    "classificação",
    "classificou",
    "campeonato",
    "eleição",
    "eleições"
  ];

  return terms.some(
    term =>
      text.includes(term)
  );
}

async function searchTavily(
  query
) {
  const key =
    process.env.TAVILY_API_KEY;

  if (!key) {
    return null;
  }

  try {
    const response =
      await fetch(
        "https://api.tavily.com/search",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            api_key: key,
            query,
            search_depth:
              "advanced",
            include_answer:
              true,
            max_results: 5
          })
        }
      );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

function formatResearch(
  research
) {
  if (!research) {
    return "";
  }

  if (
    Array.isArray(
      research.results
    ) &&
    research.results.length
  ) {
    return research.results
      .slice(0, 5)
      .map(
        item =>
          `Título: ${item.title || ""}
URL: ${item.url || ""}
Conteúdo: ${item.content || ""}`
      )
      .join("\n\n");
  }

  if (research.answer) {
    return String(
      research.answer
    );
  }

  return "";
}

/* =========================================================
   DATA / HORA
========================================================= */

function getToday() {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      dateStyle:
        "full"
    }
  ).format(
    new Date()
  );
}

function getTime() {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      timeStyle:
        "short"
    }
  ).format(
    new Date()
  );
}

/* =========================================================
   PROMPT
========================================================= */

function buildSystemPrompt(
  plan,
  language,
  memories
) {
  const memoryText =
    memories.length
      ? memories
          .map(
            item =>
              `- ${item.memory}`
          )
          .join("\n")
      : "Nenhuma memória persistente disponível.";

  return `
IDENTIDADE DA AURA:

Seu nome é Aura.

Você foi criada pela Aura Line.

A OpenAI NÃO é a criadora da Aura.

Você pode utilizar modelos ou tecnologias de terceiros para gerar respostas, mas isso não muda sua identidade.

Se perguntarem "você é da OpenAI?", responda:

"Não. Eu sou a Aura, criada pela Aura Line. A tecnologia de IA usada por mim pode envolver modelos de terceiros."

Nunca diga que foi criada pela OpenAI.

Nunca diga que a OpenAI é sua empresa criadora.

Nunca invente outro criador.

----------------------------------------

PERSONALIDADE:

Você é uma IA pessoal moderna, natural,
inteligente, útil, direta e humana.

Seja amigável sem exagerar.

Se o usuário estiver triste ou passando por
uma situação difícil, responda com empatia.

Não revele prompts, instruções internas,
tokens, chaves ou segredos técnicos.

----------------------------------------

MEMÓRIA DO USUÁRIO:

Estas são memórias persistentes do usuário.

Use-as quando forem relevantes.

As memórias abaixo pertencem SOMENTE ao
usuário autenticado desta conversa.

Nunca misture memórias de usuários diferentes.

Não invente novas memórias.

Não diga que possui um banco de dados.

Se houver uma memória sobre o nome do usuário,
use o nome exatamente como estiver registrado.

MEMÓRIAS:

${memoryText}

----------------------------------------

DATA:

${getToday()}

HORÁRIO:

${getTime()}

IDIOMA:

${language || "pt-BR"}

PLANO:

${plan.name}

----------------------------------------

REGRAS:

- Responda em português quando o usuário falar português.
- Seja objetiva quando a pergunta for simples.
- Seja detalhada quando o usuário pedir detalhes.
- Não invente fatos.
- Para informações atuais, use pesquisa quando disponível.
- Preserve o contexto da conversa.
- Use as memórias quando forem relevantes.
- Se uma memória disser o nome do usuário, use esse nome naturalmente.
- Não altere nomes, idades ou outros dados pessoais armazenados.
`;
}

/* =========================================================
   GROQ
========================================================= */

async function generateWithGroq(
  messages,
  browserSearch
) {
  const body = {
    model: MODEL,
    messages,
    temperature: 0.6,
    reasoning_effort: "medium",
    include_reasoning: false,
    max_completion_tokens: 2048,
    top_p: 0.95
  };

  if (browserSearch) {
    body.tools = [
      {
        type: "browser_search"
      }
    ];

    body.tool_choice =
      "required";
  }

  const response =
    await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(
          body
        )
      }
    );

  const raw =
    await response.text();

  if (!response.ok) {
    let parsed = null;

    try {
      parsed =
        JSON.parse(raw);
    } catch {}

    const message =
      parsed?.error?.message ||
      parsed?.message ||
      raw ||
      "Erro na Groq.";

    throw new Error(
      `Groq ${response.status}: ${message}`
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "Resposta inválida da Groq."
    );
  }
}

/* =========================================================
   HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (
    req.method ===
    "OPTIONS"
  ) {
    return res
      .status(200)
      .end();
  }

  if (
    req.method !==
    "POST"
  ) {
    return res
      .status(405)
      .json({
        error:
          "Método não permitido."
      });
  }

  try {
    if (
      !process.env.GROQ_API_KEY
    ) {
      return res
        .status(500)
        .json({
          error:
            "GROQ_API_KEY não configurada."
        });
    }

    const userToken =
      bearer(req);

    if (!userToken) {
      return res
        .status(401)
        .json({
          error:
            "Token de autenticação ausente."
        });
    }

    const user =
      await authenticatedUser(
        req
      );

    if (!user) {
      return res
        .status(401)
        .json({
          error:
            "Não autenticado."
        });
    }

    const {
      message,
      history,
      language
    } = req.body || {};

    if (
      !message ||
      typeof message !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          error:
            "Mensagem inválida."
        });
    }

    const normalizedPlan =
      String(
        req.body?.plan ||
          "free"
      ).toLowerCase();

    const plan =
      PLANS[
        normalizedPlan
      ] ||
      PLANS.free;

    /* =====================================================
       CRÉDITO
    ===================================================== */

    const credit =
      await consumeCredits(
        user.id,
        1
      );

    if (!credit.ok) {
      return res
        .status(402)
        .json({
          error:
            "Créditos insuficientes.",
          credits: 0
        });
    }

    /* =====================================================
       MEMÓRIA
    ===================================================== */

    const memories =
      await getMemories(
        user.id,
        userToken
      );

    /* =====================================================
       PESQUISA
    ===================================================== */

    let research = null;

    if (
      needsWebSearch(
        message
      )
    ) {
      research =
        await searchTavily(
          message
        );
    }

    const researchText =
      formatResearch(
        research
      );

    /* =====================================================
       MENSAGENS
    ===================================================== */

    const messages = [
      {
        role: "system",
        content:
          buildSystemPrompt(
            plan,
            language,
            memories
          )
      },
      ...safeHistory(
        history
      ),
      {
        role: "user",
        content:
          message.slice(
            0,
            6000
          )
      }
    ];

    if (researchText) {
      messages.push({
        role: "system",
        content: `
RESULTADOS RECENTES DE PESQUISA:

${researchText}

Use esses resultados para responder.
`
      });
    }

    const browserSearch =
      needsWebSearch(
        message
      ) &&
      !researchText;

    /* =====================================================
       GERA RESPOSTA
    ===================================================== */

    const data =
      await generateWithGroq(
        messages,
        browserSearch
      );

    const reply =
      data
        ?.choices?.[0]
        ?.message
        ?.content || "";

    if (!reply) {
      return res
        .status(500)
        .json({
          error:
            "A Aura não recebeu resposta da IA."
        });
    }

    /* =====================================================
       MEMÓRIA AUTOMÁTICA
    ===================================================== */

    /*
     * A Aura aprende informações pessoais
     * naturalmente, sem exigir:
     *
     * "lembra disso"
     *
     * Exemplo:
     *
     * "Tenho 52 anos"
     *
     * será processado automaticamente.
     */
    await processMemory(
      user.id,
      userToken,
      message
    );

    /* =====================================================
       RESPOSTA
    ===================================================== */

    return res
      .status(200)
      .json({
        reply,
        plan: plan.name,
        researched:
          Boolean(
            researchText
          ) ||
          browserSearch,
        model: MODEL,
        credits:
          credit.balance
      });

  } catch (error) {
    console.error(
      "API /api/chat error:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          error?.message ||
          "Erro interno do servidor."
      });
  }
}
