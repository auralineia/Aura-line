/* DNA — app: chats (DNA e TEMPESTA), agentes, conta, planos.
   Contrato com o servidor mantido: POST /api/chat { action | message, history, language, mode } com Bearer token.
   Chaves de armazenamento mantidas (rimak.*) para não derrubar sessões e históricos existentes. */
(function () {
  "use strict";
  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
    });
  }
  function lsGet(k, f) { try { var v = localStorage.getItem(k); return v == null ? f : v; } catch (e) { return f; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  var I18N = window.DNAi18n || null;
  function T(pt, vars) { return I18N ? I18N.t(pt, vars) : (vars ? String(pt).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? m : vars[k]; }) : pt); }

  var STORE = "rimak.cloud.session";
  var state = { session: null, user: null, name: "", mode: "rimak", history: [], busy: false, credits: null, plan: "free", pendingMode: null, failed: null, pushed: false, img: false, imgCost: 3, imgLoaded: false };
  var COARSE = false;
  try { COARSE = matchMedia("(pointer:coarse)").matches; } catch (e) {}

  if (lsGet("rimak.motion", "on") === "off") d.documentElement.setAttribute("data-motion", "off");

  /* ---------- ícones ---------- */
  var ICON = {
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 2.5l1.9 6.2 6.1 1.8-6.1 1.8L12 18.5l-1.9-6.2L4 10.5l6.1-1.8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9.5l6 6 6-6"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h0a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.7M12 16.8v.1"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.2A1.8 1.8 0 0 0 8.8 21h6.4a1.8 1.8 0 0 0 1.8-1.8L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></svg>',
    pulse: '<svg viewBox="0 0 24 24"><path d="M3 12h4l2.5-6 4 12 2.5-6H21"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.7"/><path d="M4 17l4.6-4.4a1.6 1.6 0 0 1 2.2 0L15 16.5l1.6-1.5a1.6 1.6 0 0 1 2.2 0L20.5 17"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></svg>'
  };
  var MARK = '<div class="dnaMark foil" role="img" aria-label="DNA"><i></i><i></i><i></i></div>';

  /* ---------- markdown seguro (escapa tudo antes) ---------- */
  function md(src) {
    var blocks = [], s = String(src == null ? "" : src).replace(/\r\n?/g, "\n");
    function stash(html) { blocks.push(html); return "\u0000" + (blocks.length - 1) + "\u0000"; }
    s = s.replace(/```[\w+#.-]*\n([\s\S]*?)(?:```|$)/g, function (_, code) {
      return "\n" + stash("<pre><code>" + esc(code.replace(/\n+$/, "")) + "</code></pre>") + "\n";
    });
    function inline(t) {
      var codes = [];
      t = esc(t);
      t = t.replace(/`([^`\n]+)`/g, function (_, c) { codes.push("<code>" + c + "</code>"); return "\u0001" + (codes.length - 1) + "\u0001"; });
      t = t.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
      t = t.replace(/__([^_\n]+?)__/g, "<strong>$1</strong>");
      t = t.replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?!\w)/g, "$1<em>$2</em>");
      t = t.replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");
      t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, function (_, txt, url) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + txt + "</a>";
      });
      return t.replace(/\u0001(\d+)\u0001/g, function (_, i) { return codes[+i]; });
    }
    function cells(r) { return r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); }); }
    var LIST = /^\s*([-*•]|\d+[.)])\s+/;
    var BLOCKSTART = /^\s*(#{1,4}\s|>|[-*•]\s|\d+[.)]\s|\u0000\d+\u0000\s*$|(?:-{3,}|\*{3,}|_{3,})\s*$)/;
    var SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
    var lines = s.split("\n"), out = [], i = 0, m;
    while (i < lines.length) {
      var ln = lines[i];
      if (/^\s*$/.test(ln)) { i++; continue; }
      if ((m = ln.match(/^\s*\u0000(\d+)\u0000\s*$/))) { out.push(blocks[+m[1]]); i++; continue; }
      if ((m = ln.match(/^\s*(#{1,4})\s+(.*)$/))) { var tag = m[1].length <= 2 ? "h3" : "h4"; out.push("<" + tag + ">" + inline(m[2]) + "</" + tag + ">"); i++; continue; }
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(ln)) { out.push("<hr>"); i++; continue; }
      if (/^\s*>/.test(ln)) {
        var q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
        out.push("<blockquote>" + inline(q.join("\n")).replace(/\n/g, "<br>") + "</blockquote>"); continue;
      }
      if (ln.indexOf("|") >= 0 && i + 1 < lines.length && lines[i + 1].indexOf("|") >= 0 && lines[i + 1].indexOf("-") >= 0 && SEP.test(lines[i + 1])) {
        var head = cells(ln), rows = [];
        i += 2;
        while (i < lines.length && lines[i].indexOf("|") >= 0 && !/^\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        out.push("<table><thead><tr>" + head.map(function (h) { return "<th>" + inline(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>");
        continue;
      }
      if (LIST.test(ln)) {
        var ordered = /^\s*\d/.test(ln), items = [];
        while (i < lines.length && LIST.test(lines[i])) { items.push(lines[i].replace(LIST, "")); i++; }
        var lt = ordered ? "ol" : "ul";
        out.push("<" + lt + ">" + items.map(function (t) { return "<li>" + inline(t) + "</li>"; }).join("") + "</" + lt + ">");
        continue;
      }
      var p = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !(p.length && BLOCKSTART.test(lines[i]))) { p.push(lines[i]); i++; }
      out.push("<p>" + inline(p.join("\n")).replace(/\n/g, "<br>") + "</p>");
    }
    return out.join("");
  }

  /* ---------- conteúdo dos chats ---------- */
  var AGENTS = {
    research: { name: "RESEARCH", sub: "Pesquisa profunda", h: "O que vamos investigar?", lead: "Pesquisa a fundo: panorama, comparações e conclusões claras.", ph: "Descreva o que precisa pesquisar…",
      sugs: [["Resumir um tema a fundo", "Panorama completo, com pontos de vista.", "Faça uma pesquisa aprofundada sobre um tema que vou te passar. Traga panorama, pontos de vista e conclusões."],
        ["Comparar opções", "Prós, contras e uma recomendação.", "Quero comparar algumas opções. Pergunte o que for preciso e me dê prós, contras e uma recomendação."],
        ["Entender um assunto novo", "Do básico ao avançado.", "Quero entender um assunto novo do zero. Monte um caminho do básico ao avançado."]] },
    code: { name: "CODE", sub: "Desenvolvimento e programação", h: "O que vamos construir?", lead: "Código claro, revisado e explicado, do protótipo ao detalhe.", ph: "Descreva o que precisa programar…",
      sugs: [["Criar uma funcionalidade", "Do pedido ao código funcionando.", "Quero criar uma funcionalidade. Faça perguntas para entender o que preciso e depois escreva o código."],
        ["Encontrar um erro", "Cole o código e a mensagem de erro.", "Vou colar um código e a mensagem de erro. Me ajude a encontrar a causa e corrigir."],
        ["Entender um código", "Explicação simples, linha a linha.", "Vou colar um código. Explique o que ele faz de forma simples."]] },
    writer: { name: "WRITER", sub: "Conteúdo e escrita", h: "O que vamos escrever?", lead: "Textos claros, no tom certo, prontos para usar.", ph: "Descreva o que precisa escrever…",
      sugs: [["Escrever do zero", "Artigos, e-mails, propostas, posts.", "Quero escrever um texto do zero. Faça perguntas rápidas sobre objetivo, público e tom."],
        ["Revisar e melhorar", "Cole um texto e deixe mais claro.", "Vou colar um texto. Revise, melhore a clareza e explique o que mudou."],
        ["Ajustar o tom", "Mais formal, mais leve, mais direto.", "Vou colar um texto. Reescreva em um tom que vou te indicar."]] },
    designer: { name: "DESIGNER", sub: "Design e criação", h: "O que vamos criar?", lead: "Ideias visuais com critério: identidade, telas e composição.", ph: "Descreva o que precisa criar…",
      sugs: [["Definir uma identidade", "Cores, tipografia e estilo.", "Me ajude a definir uma identidade visual: cores, tipografia e estilo, com justificativa."],
        ["Ideias para uma tela", "Estrutura e hierarquia de uma página.", "Quero ideias para a estrutura de uma tela ou página. Faça perguntas e proponha uma hierarquia."],
        ["Melhorar um layout", "Críticas objetivas e sugestões.", "Vou descrever um layout. Aponte o que melhorar em hierarquia, espaçamento e legibilidade."]] },
    analyst: { name: "ANALYST", sub: "Dados e insights", h: "O que vamos analisar?", lead: "Números interpretados, padrões encontrados, decisões embasadas.", ph: "Descreva o que precisa analisar…",
      sugs: [["Interpretar números", "O que os dados estão dizendo.", "Vou te passar alguns números. Me ajude a interpretar e tirar conclusões."],
        ["Montar um plano de análise", "Perguntas, métricas e método.", "Quero analisar um problema com dados. Monte um plano com perguntas, métricas e método."],
        ["Encontrar padrões", "Tendências, exceções e causas.", "Vou descrever um conjunto de dados. Aponte padrões, exceções e possíveis causas."]] },
    marketing: { name: "MARKETING", sub: "Estratégia e marca", h: "O que vamos planejar?", lead: "Posicionamento, mensagem e campanhas com objetivo claro.", ph: "Descreva o que precisa planejar…",
      sugs: [["Posicionar um produto", "Para quem, por que e como falar.", "Me ajude a posicionar um produto: público, proposta de valor e mensagem principal."],
        ["Plano de conteúdo", "Calendário e temas por objetivo.", "Monte um plano de conteúdo para um negócio. Pergunte o que precisar sobre público e objetivo."],
        ["Ideias de campanha", "Conceitos criativos com métrica.", "Quero ideias de campanha para um lançamento, com conceito e como medir resultado."]] }
  };
  var DNA_SUGS = [
    ["Transformar uma ideia em plano", "Objetivos, etapas e prazos em minutos.", "Me ajude a organizar minhas ideias e transformar uma delas em um plano."],
    ["Aprender algo novo", "Explicações simples, com exemplos.", "Explique um assunto complexo de um jeito simples, com exemplos."],
    ["Escrever com clareza", "Textos, e-mails e propostas bem estruturados.", "Me ajude a escrever um texto claro e bem estruturado."],
    ["Resolver um problema", "As perguntas certas, passo a passo.", "Quero resolver um problema. Faça perguntas para entender e me orientar."]
  ];
  var TEMP_SUGS = [
    ["Entender uma conversa", "Cole uma mensagem e veja o que ela pode significar.", "Vou te mostrar uma conversa ou mensagem. Me ajude a entender o tom, a intenção por trás dela e como responder."],
    ["Preparar uma conversa difícil", "Ensaie o que dizer e como dizer.", "Preciso ter uma conversa difícil com alguém. Me ajude a pensar no que dizer e em como dizer com cuidado."],
    ["Pensar numa decisão", "Organize o que pesa de cada lado.", "Estou diante de uma decisão importante. Faça perguntas para me ajudar a organizar o que pesa de cada lado."],
    ["Desabafar sem pressa", "Um espaço para falar do que você sente.", "Quero desabafar sobre uma situação. Pode me ouvir com calma e me ajudar a organizar o que estou sentindo?"]
  ];

  /* ---------- marcas dos agentes (dna-marks.js) ---------- */
  function agentMark(id, cls) { return window.DNAMarks ? window.DNAMarks.agent(id, cls) : ""; }
  function meta(mode) {
    mode = mode || state.mode;
    if (mode === "tempesta") return { theme: "tempesta", name: "TEMPESTA", sub: "Entende. Sente. Adapta.", ph: "Conte o que está pensando…", foot: "A TEMPESTA não substitui acompanhamento profissional.",
      eyebrow: "TEMPESTA · Interação humana", h: "Vamos conversar com calma.", lead: "Um espaço para pensar em voz alta, entender pessoas e conversas e encontrar as palavras certas.", sugs: TEMP_SUGS };
    if (mode.indexOf("agent:") === 0 && AGENTS[mode.slice(6)]) {
      var a = AGENTS[mode.slice(6)];
      return { theme: "dna", kind: "agent", agent: mode.slice(6), name: a.name, sub: a.sub, ph: a.ph, foot: "Os agentes podem errar. Confira informações importantes.", eyebrow: "Agente · " + a.name, h: a.h, lead: a.lead, sugs: a.sugs };
    }
    if (mode === "nevera") return { theme: "dna", kind: "agent", agent: "nevera", name: "NEVERA", sub: "Execução e automação", ph: "Descreva o que quer automatizar…", foot: "Confira sempre o resultado antes de usar.",
      eyebrow: "NEVERA · Execução", h: "O que vamos colocar em prática?", lead: "Do plano à realidade: execução e automação.", sugs: DNA_SUGS };
    return { theme: "dna", name: "DNA", sub: "Maestra do ecossistema", ph: "Pergunte, planeje, crie…", foot: "A DNA pode errar. Confira informações importantes.",
      eyebrow: "DNA · Maestra do ecossistema", h: "O que vamos construir hoje?", lead: "Entenda, planeje, crie e coordene. Diga o que você quer alcançar e eu organizo o caminho.", sugs: DNA_SUGS };
  }

  /* ---------- DOM base ---------- */
  var ov = d.createElement("div");
  ov.id = "rkOverlay";
  ov.innerHTML = '<div id="rkPanel" role="dialog" aria-modal="true"><button class="rkClose" id="rkClose" type="button" aria-label="Fechar">×</button><div id="rkPanelContent"></div></div>';
  d.body.appendChild(ov);

  var chat = d.createElement("div");
  chat.id = "rkChat";
  chat.className = "dn-chat";
  chat.setAttribute("role", "dialog");
  chat.setAttribute("aria-modal", "true");
  chat.setAttribute("aria-label", "Conversa");
  chat.setAttribute("data-mode", "dna");
  chat.innerHTML =
    '<div class="dn-bg"></div><div class="dn-grain"></div><div class="dn-flash" id="rkFlash"></div>' +
    '<header class="dn-head"><div class="dn-id"><div class="dn-mark" id="rkChatMark"></div><div class="dn-idtext"><strong id="rkChatTitle">DNA</strong><span id="rkChatSub"></span></div></div>' +
    '<div class="dn-act">' +
    '<button class="dn-credit" id="rkCredit" type="button" hidden aria-label="Créditos">' + ICON.spark + '<span id="rkCreditN">—</span></button>' +
    '<button class="dn-ico" id="rkChatSettings" type="button" aria-label="Minha conta">' + ICON.user + '</button>' +
    '<button class="dn-ico" id="rkChatClose" type="button" aria-label="Fechar conversa">' + ICON.close + '</button></div></header>' +
    '<main class="dn-scroll" id="rkChatBody" aria-live="polite"><div class="dn-col" id="rkCol"></div></main>' +
    '<button class="dn-down" id="rkDown" type="button" aria-label="Ir para o fim">' + ICON.down + '</button>' +
    '<form class="dn-composer" id="rkComposer" autocomplete="off"><div class="dn-box"><textarea id="rkChatInput" rows="1" enterkeyhint="send" aria-label="Mensagem"></textarea>' +
    '<button class="dn-imgbtn" id="rkImgBtn" type="button" hidden aria-pressed="false" aria-label="Gerar imagem">' + ICON.img + '<span data-notr></span></button>' +
    '<button class="dn-send" id="rkSend" type="submit" aria-label="Enviar">' + ICON.send + '</button></div><p class="dn-foot" id="rkFoot"></p></form>';
  d.body.appendChild(chat);

  var menu = d.createElement("div");
  menu.id = "rkMenu";
  function mi(id, ic, label, tail, attr) { return '<button class="rkMenuItem" ' + (attr || "") + ' data-menu="' + id + '" type="button"><i class="ic">' + ICON[ic] + '</i><span class="lb">' + label + '</span><em>' + tail + '</em></button>'; }
  menu.innerHTML = '<aside id="rkMenuPanel" role="dialog" aria-modal="true" aria-label="Menu"><div id="rkMenuTop">' + MARK + '<button class="rkClose" id="rkMenuClose" type="button" aria-label="Fechar menu">×</button></div>' +
    '<div id="rkMenuAccount"></div>' +
    '<div class="rkMenuGroup">Sua conta</div>' +
    mi("auth", "user", "Fazer login", "→", 'id="rkMenuAuth"') + mi("plans", "spark", "Planos e créditos", "→") + mi("settings", "gear", "Configurações", "→") +
    '<div class="rkMenuGroup">Conversas</div>' +
    mi("continue-rimak", "chat", "Conversa com a DNA", "→") + mi("continue-tempesta", "pulse", "Conversa com a TEMPESTA", "→") +
    mi("new-rimak", "plus", "Novo chat com a DNA", "+") + mi("new-tempesta", "plus", "Novo chat com a TEMPESTA", "+") +
    '<div class="rkMenuGroup">Idioma</div><div class="seg" id="rkMenuLang" role="group" aria-label="Idioma"></div>' +
    '<div class="rkMenuGroup">Ajuda</div>' + mi("support", "help", "Suporte", "→") +
    '<div class="rkMenuFoot">Seu espaço de inteligência.</div></aside>';
  d.body.appendChild(menu);

  var flashEl = $("#rkFlash"), scroller = $("#rkChatBody"), ta = $("#rkChatInput"), sendBtn = $("#rkSend"), imgBtn = $("#rkImgBtn");
  function col() { return $("#rkCol"); }

  /* ---------- utilidades de UI ---------- */
  function toast(message) {
    var x = d.createElement("div");
    x.className = "dn-toast"; x.textContent = T(message);
    d.body.appendChild(x);
    setTimeout(function () { x.remove(); }, 2400);
  }
  function nameOf(u) {
    if (!u) return "";
    var md_ = u.user_metadata || {}, n = md_.full_name || md_.name || md_.display_name || "";
    if (!n && u.email) n = String(u.email).split("@")[0].split(/[._\-+0-9]/)[0];
    n = String(n).trim().split(/\s+/)[0];
    if (n.length < 2) return "";
    return n.charAt(0).toUpperCase() + n.slice(1);
  }
  function setUser(u) {
    state.user = u || null;
    state.name = nameOf(state.user);
    greet(); updateAuthUI();
  }
  function greet() {
    var g = d.getElementById("greet");
    if (!g) return;
    var hr = new Date().getHours(), pt = hr < 5 ? "Boa madrugada" : hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite";
    g.textContent = state.user
      ? (state.name ? T("{g}, {n}.", { g: T(pt), n: state.name }) : T("{g}.", { g: T(pt) }))
      : T("{g}. Bem-vindo à DNA.", { g: T(pt) });
  }
  function updateAuthUI() {
    var logged = !!state.user;
    var cr = $("#rkCredit");
    cr.hidden = !logged;
    $("#rkCreditN").textContent = state.credits == null ? "—" : String(state.credits);
    cr.setAttribute("aria-label", state.credits == null ? T("Créditos") : state.credits + " " + T("créditos"));
    var auth = $("#rkMenuAuth .lb");
    if (auth) setTxt(auth, logged ? "Minha conta" : "Fazer login");
  }
  function setTxt(el, pt) { el.textContent = pt; if (I18N) I18N.apply(el); }
  function lang() { return I18N ? I18N.lang() : lsGet("rimak.language", "pt-BR"); }

  /* ---------- sessão / rede ---------- */
  function read() { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; } }
  function save() {
    if (state.session) lsSet(STORE, JSON.stringify({ access_token: state.session.access_token, refresh_token: state.session.refresh_token, user: state.user, expires_at: state.session.expires_at, expires_in: state.session.expires_in, token_type: state.session.token_type }));
    else lsDel(STORE);
  }
  async function auth(action, payload) {
    var r;
    try {
      r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ action: action }, payload || {})) });
    } catch (e) { throw new Error("Falha de conexão com a DNA. Verifique a internet e tente novamente."); }
    var raw = await r.text(), data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (e) {}
    if (!r.ok) {
      var detail = data.error || data.message || data.msg || data.error_description;
      throw new Error(detail ? String(detail) : "O servidor da DNA retornou HTTP " + r.status + " (" + r.statusText + ").");
    }
    if (!raw || !Object.keys(data).length) throw new Error("A DNA recebeu uma resposta vazia ou inválida do servidor.");
    return data;
  }
  async function refresh() {
    if (!state.session || !state.session.refresh_token) return false;
    try {
      var data = await auth("auth_refresh", { refresh_token: state.session.refresh_token });
      if (!data.session) return false;
      state.session = data.session; setUser(data.user || state.user); save();
      return true;
    } catch (e) { return false; }
  }
  // chamada autenticada; renova a sessão uma vez se o token expirou
  async function api(body, retried) {
    var r = await fetch("/api/chat", { method: "POST", headers: { Authorization: "Bearer " + state.session.access_token, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 401 && !retried && await refresh()) return api(body, true);
    return r;
  }
  async function account() {
    if (!state.user || !state.session) return;
    try {
      var r = await api({ action: "account" }), data = await r.json();
      if (r.ok) { state.plan = data.plan || "free"; state.credits = Number(data.credits || 0); updateAuthUI(); }
    } catch (e) {}
  }
  async function boot() {
    var s = read();
    if (!s || !s.access_token) { greet(); updateAuthUI(); return; }
    state.session = s; setUser(s.user || null);
    try {
      var r = await fetch("/api/chat", { method: "POST", headers: { Authorization: "Bearer " + s.access_token, "Content-Type": "application/json" }, body: JSON.stringify({ action: "auth_user" }) });
      if (r.ok) { var data = await r.json(); setUser(data.user || state.user); save(); await account(); return; }
    } catch (e) {}
    if (await refresh()) await account();
    else { state.session = null; setUser(null); save(); }
  }

  /* ---------- painéis ---------- */
  function panel(html) { var pc = $("#rkPanelContent"); pc.innerHTML = html; if (I18N) I18N.apply(pc); ov.classList.add("open"); }
  function closePanel() { ov.classList.remove("open"); }

  function login() {
    state.pendingMode = state.pendingMode || null;
    panel('<h3>Entrar na DNA</h3><p>Entre para conversar, usar créditos e acessar seu plano.</p>' +
      '<form id="rkLoginForm"><input class="rkInput" id="rkEmail" type="email" autocomplete="email" inputmode="email" placeholder="Seu e-mail" required>' +
      '<input class="rkInput" id="rkPass" type="password" autocomplete="current-password" placeholder="Sua senha" required>' +
      '<div class="rkRow"><button class="rkBtn primary" type="submit">Entrar</button><button class="rkBtn" type="button" id="rkSignup">Criar conta</button></div><div class="rkMuted" id="rkAuthMsg"></div></form>');
    $("#rkLoginForm").onsubmit = async function (e) {
      e.preventDefault();
      $("#rkAuthMsg").textContent = T("Entrando…");
      try {
        var data = await auth("auth_login", { email: $("#rkEmail").value.trim().toLowerCase(), password: $("#rkPass").value });
        if (!data.session) throw new Error("Confirme seu e-mail antes de entrar.");
        state.session = data.session; setUser(data.user); save(); await account();
        var next = state.pendingMode; state.pendingMode = null;
        closePanel(); toast("Login realizado.");
        if (next) openChat(next);
      } catch (x) { $("#rkAuthMsg").textContent = T(x.message || "Erro ao entrar."); }
    };
    $("#rkSignup").onclick = signup;
  }
  function signup() {
    panel('<h3>Criar conta</h3><p>Crie sua conta DNA para salvar seu acesso e usar o ecossistema.</p>' +
      '<form id="rkSignupForm"><input class="rkInput" id="rkEmail" type="email" autocomplete="email" inputmode="email" placeholder="Seu e-mail" required>' +
      '<input class="rkInput" id="rkPass" type="password" autocomplete="new-password" minlength="6" placeholder="Senha (mínimo 6 caracteres)" required>' +
      '<div class="rkRow"><button class="rkBtn primary" type="submit">Criar conta</button><button class="rkBtn" type="button" id="rkBackLogin">Já tenho conta</button></div><div class="rkMuted" id="rkAuthMsg"></div></form>');
    $("#rkSignupForm").onsubmit = async function (e) {
      e.preventDefault();
      $("#rkAuthMsg").textContent = T("Criando…");
      try {
        var data = await auth("auth_signup", { email: $("#rkEmail").value.trim().toLowerCase(), password: $("#rkPass").value });
        if (data.session) { state.session = data.session; setUser(data.user); save(); await account(); closePanel(); toast("Conta criada."); }
        else $("#rkAuthMsg").textContent = T("Conta criada. Confirme o e-mail para entrar.");
      } catch (x) { $("#rkAuthMsg").textContent = T(x.message || "Erro ao criar conta."); }
    };
    $("#rkBackLogin").onclick = login;
  }
  function accountPanel() {
    if (!state.user) { login(); return; }
    panel('<h3>' + esc(state.name ? T("Olá, {n}.", { n: state.name }) : T("Sua conta")) + '</h3><p>' + esc(state.user.email || "") + '</p>' +
      '<div class="rkGrid"><div class="rkCard stat"><span>Plano</span><strong>' + esc(String(state.plan).toUpperCase()) + '</strong></div>' +
      '<div class="rkCard stat"><span>Créditos</span><strong>' + (state.credits == null ? "—" : state.credits) + '</strong></div></div>' +
      '<div class="rkRow"><button class="rkBtn" id="rkSettings" type="button">Configurações</button><button class="rkBtn" id="rkPlans" type="button">Planos e créditos</button><button class="rkBtn" id="rkLogout" type="button">Sair</button></div>');
    $("#rkSettings").onclick = settings; $("#rkPlans").onclick = plans; $("#rkLogout").onclick = logout;
  }
  function wipeChats() {
    var n = 0;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf("rimak.chat.") === 0) { localStorage.removeItem(k); n++; } }); } catch (e) {}
    state.history = []; state.failed = null;
    if (chat.classList.contains("open")) renderChat();
    return n;
  }
  function settings() {
    var logged = !!state.user, plan = String(state.plan || "free").toUpperCase();
    panel('<div class="pnHead">' + MARK + '<span class="pnKick">Configurações</span></div>' +
      '<h3>Ajuste a DNA do seu jeito.</h3><p>Idioma, movimento e dados deste dispositivo.</p>' +
      '<div class="stSec"><div class="stLabel"><i>' + ICON.globe + '</i>Idioma</div><div class="seg lg" id="rkLangSeg" role="group" aria-label="Idioma"></div>' +
      '<p class="stHint">Muda o site, os chats e o idioma das respostas.</p></div>' +
      '<div class="stSec"><div class="stLabel"><i>' + ICON.pulse + '</i>Experiência</div><div class="stList">' +
      '<label class="stRow"><span class="stTx"><b>Animações</b><small>Desliga movimentos e efeitos. Poupa bateria.</small></span><input class="tgl" type="checkbox" id="rkMotion"></label></div></div>' +
      '<div class="stSec"><div class="stLabel"><i>' + ICON.user + '</i>Conta</div><div class="stList">' +
      (logged ? '<div class="stRow"><span class="stTx"><b>Plano</b><small data-notr>' + esc(state.user.email || "") + '</small></span><span class="rkTag" data-notr>' + esc(plan) + '</span></div>' +
        '<div class="stRow"><span class="stTx"><b>Créditos</b><small>Saldo atual do dia</small></span><strong class="stVal" data-notr>' + (state.credits == null ? "—" : state.credits) + '</strong></div>' +
        '<div class="stRow"><span class="stTx"><b>Conexão</b><small id="rkOmniStatus" data-notr>' + esc(T("Verificando…")) + '</small></span><span class="stDot" id="rkDot"></span></div>'
        : '<div class="stRow"><span class="stTx"><b>Você não está conectado</b><small>Entre para usar créditos e salvar seu plano.</small></span><button class="rkBtn" type="button" id="rkStLogin">Entrar</button></div>') +
      '</div></div>' +
      '<div class="stSec"><div class="stLabel"><i>' + ICON.trash + '</i>Dados</div><div class="stList">' +
      '<div class="stRow"><span class="stTx"><b>Conversas neste dispositivo</b><small>Apaga o histórico de todos os modos. Não afeta sua conta.</small></span><button class="rkBtn danger" type="button" id="rkWipe">Apagar</button></div></div></div>' +
      '<div class="rkRow"><button class="rkBtn" id="rkSettingsBack" type="button">' + (logged ? "Voltar à conta" : "Fechar") + '</button></div>' +
      '<div class="pnFoot">DNA · Mais que uma IA. Um ecossistema.</div>');
    langSeg("#rkLangSeg", function () { toast(T("Idioma salvo.")); });
    $("#rkMotion").checked = lsGet("rimak.motion", "on") !== "off";
    $("#rkMotion").onchange = function (e) {
      lsSet("rimak.motion", e.target.checked ? "on" : "off");
      if (e.target.checked) d.documentElement.removeAttribute("data-motion"); else d.documentElement.setAttribute("data-motion", "off");
    };
    var li = $("#rkStLogin"); if (li) li.onclick = login;
    var w = $("#rkWipe"), armed = 0;
    w.onclick = function () {
      if (!armed) { armed = 1; w.textContent = T("Confirmar"); w.classList.add("armed"); setTimeout(function () { armed = 0; w.textContent = T("Apagar"); w.classList.remove("armed"); }, 3500); return; }
      wipeChats(); armed = 0; w.textContent = T("Apagar"); w.classList.remove("armed"); toast(T("Conversas apagadas deste dispositivo."));
    };
    $("#rkSettingsBack").onclick = logged ? accountPanel : closePanel;
    status();
  }
  async function status() {
    if (!state.session) return;
    var el = $("#rkOmniStatus"), dot = $("#rkDot");
    function set(t, ok) { if (el) el.textContent = T(t); if (dot) dot.setAttribute("data-ok", ok ? "1" : "0"); }
    try {
      var r = await api({ action: "omniroute_status" }), data = await r.json();
      set(data.ok ? "Serviço online" : data.configured ? "Serviço temporariamente indisponível" : "Serviço em configuração", !!data.ok);
    } catch (e) { set("Não foi possível verificar agora", false); }
  }
  function plans() {
    var cur = state.user ? String(state.plan || "free").toLowerCase() : "";
    var WHO = { free: "Para conhecer e usar de vez em quando.", pro: "Para quem usa todos os dias: 2,5× o saldo do FREE, cerca de R$ 0,40 por dia.", ultra: "Para uso intenso e profissional: 7,5× o saldo do FREE, cerca de R$ 1,00 por dia e o menor custo por crédito." };
    var FEAT = { free: ["Pesquisa na web", "Memória básica", "Respostas de tamanho padrão"], pro: ["Pesquisa na web", "Memória de longo prazo", "Respostas e conversas mais longas"], ultra: ["Pesquisa profunda na web", "Memória avançada", "Respostas longas e contexto máximo"] };
    function card(id, label, credits, price) {
      var on = cur === id;
      return '<div class="rkPlan' + (on ? " on" : "") + '"><div><b>' + label + '</b><span>' + credits + '</span><span style="display:block;margin-top:6px;font-size:12.5px;opacity:.75;line-height:1.4">' + WHO[id] + '</span><ul class="rkFeat">' + FEAT[id].map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ul></div>' +
        (price ? '<div class="rkPrice"><strong>' + price + '</strong><small>/mês</small></div>' : '<div class="rkPrice"><span class="rkTag">' + (on ? "Seu plano" : "Grátis") + '</span></div>') +
        (price ? (on ? '<span class="rkTag" style="justify-self:start">Seu plano</span>' : '<button class="rkBtn primary" type="button" data-plan="' + id + '">Assinar ' + label + '</button>') : "") + '</div>';
    }
    panel('<h3>Planos DNA</h3><p data-notr>' + esc(T("Créditos são o saldo que você usa ao conversar: cada mensagem consome 1 crédito e cada imagem consome {n}. O saldo diário volta todo dia. Escolha o tamanho que cabe no seu uso.", { n: state.imgCost })) + '</p><div class="rkPlans">' +
      card("free", "FREE", "20 créditos por dia", "") + card("pro", "PRO", "50 créditos por dia", "R$ 11,99") + card("ultra", "ULTRA", "150 créditos por dia", "R$ 29,99") + '</div>' +
      (state.user ? '<div class="rkCard" style="margin-top:12px"><span>Seu saldo</span><b style="margin:2px 0 0">' + (state.credits == null ? "—" : state.credits + " " + T("créditos")) + '</b></div>' : ""));
    $$("[data-plan]").forEach(function (b) { b.onclick = function () { checkout(b.dataset.plan); }; });
  }
  async function checkout(plan) {
    if (!state.user) { login(); return; }
    try {
      var r = await fetch("/api/checkout", { method: "POST", headers: { Authorization: "Bearer " + state.session.access_token, "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan }) });
      var data = await r.json();
      if (!r.ok || !data.checkout_url) throw new Error(data.error || "Checkout indisponível.");
      location.href = data.checkout_url;
    } catch (e) { toast(e.message || "Erro ao abrir checkout."); }
  }
  function logout() {
    state.session = null; state.credits = null; state.plan = "free"; setUser(null); save(); closePanel(); toast("Você saiu da conta.");
    if (chat.classList.contains("open")) { setHeader(); renderChat(); }
  }
  function agents() {
    var h = '<h3>Agentes</h3><p>Escolha uma inteligência especializada. Cada conversa abre separadamente.</p><div class="rkGrid ag">';
    Object.keys(AGENTS).forEach(function (id) {
      var a = AGENTS[id] || { name: "NEVERA", sub: "Execução e automação" };
      h += '<button class="rkCard agc" type="button" data-agent="' + id + '">' + agentMark(id) + '<b>' + a.name + '</b><span>' + esc(a.sub) + '</span></button>';
    });
    panel(h + "</div>");
    $$(".rkCard.agc").forEach(function (b) { b.onclick = function () { closePanel(); openChat("agent:" + b.dataset.agent); }; });
  }
  function support() {
    if (!state.user || !state.session) {
      panel('<h3>Suporte</h3><p>Entre na sua conta para abrir um chamado. A equipe da DNA responde pelo e-mail da conta.</p><div class="rkRow"><button class="rkBtn primary" id="rkSupLogin" type="button">Entrar</button><button class="rkBtn" id="rkSupClose" type="button">Fechar</button></div>');
      $("#rkSupLogin").onclick = login; $("#rkSupClose").onclick = closePanel;
      return;
    }
    panel('<h3>Suporte</h3><p>Conta, créditos, pagamento ou algo que não funcionou? Conte o que houve e a equipe da DNA responde pelo e-mail da sua conta.</p>' +
      '<form id="rkSupForm"><input class="rkInput" id="rkSupSub" type="text" maxlength="120" placeholder="Assunto" required>' +
      '<textarea class="rkInput rkArea" id="rkSupMsg" rows="5" maxlength="4000" placeholder="Descreva o que aconteceu" required></textarea>' +
      '<div class="rkRow"><button class="rkBtn primary" type="submit" id="rkSupSend">Enviar chamado</button><button class="rkBtn" type="button" id="rkSupClose">Fechar</button></div><div class="rkMuted" id="rkSupMsgOut" data-notr></div></form>');
    $("#rkSupClose").onclick = closePanel;
    $("#rkSupForm").onsubmit = async function (e) {
      e.preventDefault();
      var out = $("#rkSupMsgOut"), b = $("#rkSupSend"); b.disabled = true; out.textContent = T("Enviando…");
      try {
        var r = await api({ action: "support", subject: $("#rkSupSub").value.trim(), message: $("#rkSupMsg").value.trim() }), data = await r.json().catch(function () { return {}; });
        if (!r.ok) throw new Error(data.error || "Não foi possível enviar o chamado.");
        panel('<h3>Chamado enviado</h3><p>Recebemos sua mensagem. A equipe da DNA responde pelo e-mail da sua conta.</p><div class="rkRow"><button class="rkBtn primary" id="rkSupClose" type="button">Fechar</button></div>');
        $("#rkSupClose").onclick = closePanel;
      } catch (x) { b.disabled = false; out.textContent = T(x instanceof TypeError ? "Sem conexão com o servidor. Verifique a internet e tente de novo." : (x.message || "Não foi possível enviar o chamado.")); }
    };
  }

  /* ---------- menu ---------- */
  function langSeg(id, onPick) {
    var el = $(id), cur = lang(), L = window.DNAi18n ? window.DNAi18n.LANGS : [["pt-BR", "PT", "Português"], ["en", "EN", "English"], ["es", "ES", "Español"]];
    el.innerHTML = L.map(function (l) {
      return '<button type="button" data-lang="' + l[0] + '" aria-pressed="' + (cur === l[0]) + '" title="' + esc(l[2]) + '"><b>' + l[1] + '</b><span>' + esc(l[2]) + '</span></button>';
    }).join("");
    $$("[data-lang]", el).forEach(function (b) { b.onclick = function () { setLang(b.dataset.lang); if (onPick) onPick(); }; });
  }
  function setLang(code) {
    if (window.DNAi18n) window.DNAi18n.set(code); else lsSet("rimak.language", code);
  }
  function accountCard() {
    var el = $("#rkMenuAccount");
    if (!state.user) {
      el.innerHTML = '<div class="acRow"><span class="av"><i>' + ICON.user + '</i></span><div class="acT"><b data-notr>' + esc(T("Visitante")) + '</b><small data-notr>' + esc(T("Entre para conversar e usar seus créditos.")) + '</small></div></div>' +
        '<button class="b sm" type="button" id="rkMenuLogin" data-notr>' + esc(T("Entrar")) + '<i class="ar" aria-hidden="true">' + ICON.arrow + '</i></button>';
      $("#rkMenuLogin").onclick = function () { closeMenu(); login(); };
      return;
    }
    var nm = state.name || (state.user.email || "").split("@")[0];
    el.innerHTML = '<div class="acRow"><span class="av"><b>' + esc((nm || "?").charAt(0).toUpperCase()) + '</b></span><div class="acT"><b data-notr>' + esc(nm) + '</b><small data-notr>' + esc(state.user.email || "") + '</small></div></div>' +
      '<div class="acChips"><span class="rkTag" data-notr>' + esc(String(state.plan || "free").toUpperCase()) + '</span><span class="acCr" data-notr>' + ICON.spark + esc(state.credits == null ? "—" : state.credits + " " + T("créditos")) + '</span></div>';
  }
  function openMenu() {
    accountCard();
    langSeg("#rkMenuLang", accountCard);
    updateAuthUI();
    menu.classList.add("open");
  }
  function closeMenu() { menu.classList.remove("open"); }
  function menuAction(a) {
    closeMenu();
    if (a === "auth") { state.user ? accountPanel() : login(); }
    else if (a === "plans") plans();
    else if (a === "settings") settings();
    else if (a === "continue-rimak") continueChat("rimak");
    else if (a === "continue-tempesta") continueChat("tempesta");
    else if (a === "new-rimak") newChat("rimak");
    else if (a === "new-tempesta") newChat("tempesta");
    else if (a === "support") support();
  }
  function continueChat(mode) { if (!state.user) { state.pendingMode = mode; login(); return; } openChat(mode); }
  function newChat(mode) { state.mode = mode; state.history = []; state.failed = null; saveChat(); openChat(mode); }

  /* ---------- histórico ---------- */
  function historyKey(mode) { return "rimak.chat." + (mode || state.mode); }
  function loadChat() { try { state.history = JSON.parse(lsGet(historyKey(), "[]")) || []; } catch (e) { state.history = []; } }
  function slim(h) { return h.slice(-40).map(function (x) { return x && x.image && x.image.indexOf("data:") === 0 ? Object.assign({}, x, { image: "" }) : x; }); }
  function saveChat() { lsSet(historyKey(), JSON.stringify(slim(state.history))); }
  function pushTo(mode, item) {
    var h = []; try { h = JSON.parse(lsGet(historyKey(mode), "[]")) || []; } catch (e) {}
    h.push(item); lsSet(historyKey(mode), JSON.stringify(slim(h)));
  }

  /* ---------- nuvem da TEMPESTA ---------- */
  var storms = { hdr: null, hero: null, think: null }, flashVals = {};
  function setFlash(key, I) {
    flashVals[key] = I;
    var m = 0; for (var k in flashVals) if (flashVals[k] > m) m = flashVals[k];
    flashEl.style.opacity = chat.getAttribute("data-mode") === "tempesta" ? (m * .5).toFixed(3) : "0";
  }
  /* trovão: tremor na tela e, depois do primeiro toque na nuvem, som grave e vibração */
  var audioCtx = null, soundOK = false;
  d.addEventListener("pointerdown", function (e) { if (e.target && e.target.closest && e.target.closest(".dn-hero.st,#rkChatMark")) soundOK = true; }, { passive: true });
  function rumble(k) {
    if (!soundOK || d.documentElement.getAttribute("data-motion") === "off") return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audioCtx = audioCtx || new AC(); if (audioCtx.state === "suspended") audioCtx.resume();
      var dur = 1.5 + k, n = Math.floor(audioCtx.sampleRate * dur), buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate), ch = buf.getChannelData(0), last = 0;
      for (var i = 0; i < n; i++) { last = (last + (Math.random() * 2 - 1) * .06) / 1.02; ch[i] = last * 9 * (1 - i / n) * (.6 + .4 * Math.sin(i / audioCtx.sampleRate * 9)); }
      var src = audioCtx.createBufferSource(); src.buffer = buf;
      var lp = audioCtx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 170 + k * 90;
      var g = audioCtx.createGain(); g.gain.value = .22 * k;
      src.connect(lp); lp.connect(g); g.connect(audioCtx.destination); src.start();
    } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([40, 30, 70 * k]); } catch (e) {}
  }
  function thunder(k, slot) {
    if (!chat.classList.contains("open") || chat.getAttribute("data-mode") !== "tempesta") return;
    chat.classList.remove("rumble"); void chat.offsetWidth; chat.classList.add("rumble");
    clearTimeout(thunder._t); thunder._t = setTimeout(function () { chat.classList.remove("rumble"); }, 900);
    if (slot === "hero") rumble(k);
  }
  function mountStorm(slot, canvas, size) {
    if (storms[slot]) { storms[slot].destroy(); storms[slot] = null; }
    if (!canvas || !window.DNAStorm) return;
    var inter = slot === "hero" || slot === "hdr";
    storms[slot] = window.DNAStorm.mount(canvas, { size: size, interactive: inter, host: inter ? (canvas.parentNode || canvas) : null, onFlash: function (I) { setFlash(slot, slot === "think" ? I * 0.35 : I); }, onThunder: slot === "think" ? null : function (k) { thunder(k, slot); } });
    if (slot === "think") storms[slot].setRate(3.2);
    storms[slot].start();
  }
  function stopStorms() {
    ["hdr", "hero", "think"].forEach(function (k) { if (storms[k]) { storms[k].destroy(); storms[k] = null; } flashVals[k] = 0; });
    flashEl.style.opacity = "0";
  }

  /* ---------- cabeçalho ---------- */
  function setHeader() {
    var m = meta();
    chat.setAttribute("data-mode", m.theme);
    chat.setAttribute("data-kind", m.kind || "");
    chat.setAttribute("data-agent", m.agent || "");
    $("#rkChatTitle").textContent = m.name;
    $("#rkChatSub").textContent = T(m.sub);
    ta.placeholder = T(m.ph);
    $("#rkFoot").textContent = T(m.foot);
    imgUI();
    var mk = $("#rkChatMark");
    if (m.theme === "tempesta") {
      mk.innerHTML = '<canvas aria-hidden="true"></canvas>';
      mountStorm("hdr", mk.firstChild, "sm");
    } else {
      if (storms.hdr) { storms.hdr.destroy(); storms.hdr = null; }
      mk.innerHTML = m.agent ? agentMark(m.agent) : MARK;
    }
    updateAuthUI();
  }

  /* ---------- conversa ---------- */
  function welcomeHTML() {
    var m = meta(), nm = state.name;
    var hero = m.theme === "tempesta"
      ? '<div class="dn-hero st"><canvas class="dn-storm" id="rkStormLg" role="img" aria-label="Nuvem de tempestade com raios"></canvas></div>'
      : m.agent ? '<div class="dn-hero ag"><div class="dn-halo"></div>' + agentMark(m.agent) + '</div>'
      : '<div class="dn-hero"><div class="dn-halo"></div>' + MARK.replace('class="dnaMark foil"', 'class="dnaMark foil lg"') +
        '<div class="dnaMark foil lg refl" aria-hidden="true"><i></i><i></i><i></i></div></div>';
    var h2 = nm ? esc(T("Olá, {n}.", { n: nm })) + "<br><span>" + esc(m.h) + "</span>" : esc(m.h);
    var sugs = m.sugs.map(function (s, i) {
      return '<button class="dn-sug" type="button" style="--i:' + i + '" data-prompt="' + esc(s[2]) + '"><i>0' + (i + 1) + '</i><span><b>' + esc(s[0]) + '</b><small>' + esc(s[1]) + '</small></span>' + ICON.arrow + '</button>';
    }).join("");
    var foot = state.user
      ? '<p class="dn-note">Suas conversas ficam salvas neste dispositivo.</p>'
      : '<button class="dn-cta" type="button" id="rkWelcomeLogin">Entrar para conversar</button><p class="dn-note">O plano FREE inclui 20 créditos por dia.</p>';
    return '<section class="dn-welcome">' + hero + '<div class="dn-eyebrow">' + esc(m.eyebrow) + '</div><h2>' + h2 + '</h2><p class="dn-lead">' + esc(m.lead) + '</p><div class="dn-sugs">' + sugs + '</div>' + foot + '</section>';
  }
  function msgEl(x, fresh) {
    var el = d.createElement("div");
    if (x.role === "user") { el.className = "dn-m user"; el.innerHTML = '<div class="dn-bubble">' + esc(x.content) + '</div>'; return el; }
    if (x.kind === "image") return imageEl(x, fresh);
    el.className = "dn-m ai" + (fresh ? " fresh" : "");
    el.innerHTML = '<div class="dn-who"><i></i>' + esc(meta().name) + '</div><div class="dn-body">' + md(x.content) + '</div>' + sourcesHTML(x.sources) +
      '<div class="dn-tools"><button class="dn-tool" type="button" data-copy data-notr>' + ICON.copy + T("Copiar") + '</button></div>';
    $$(".dn-body > *", el).forEach(function (n, i) { n.style.setProperty("--k", Math.min(i, 10)); });
    var btn = $("[data-copy]", el);
    btn.onclick = function () {
      var done = function () { btn.innerHTML = ICON.check + T("Copiado"); setTimeout(function () { btn.innerHTML = ICON.copy + T("Copiar"); }, 1600); };
      try { navigator.clipboard.writeText(x.content).then(done, function () { toast("Não foi possível copiar."); }); } catch (e) { toast("Não foi possível copiar."); }
    };
    return el;
  }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function sourcesHTML(list) {
    if (!Array.isArray(list) || !list.length) return "";
    var seen = {}, chips = "", n = 0;
    list.forEach(function (s) {
      if (!s || !/^https?:\/\//i.test(s.url || "") || seen[s.url]) return;
      seen[s.url] = 1; n++;
      chips += '<a class="dn-chip" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(s.title || "") + '"><i>' + n + '</i><span data-notr>' + esc(hostOf(s.url) || s.title || "fonte") + '</span></a>';
    });
    return chips ? '<div class="dn-src"><span class="dn-srclb">' + esc(T("Pesquisado na web")) + '</span>' + chips + '</div>' : "";
  }
  function downloadImg(url, name) {
    var a = d.createElement("a");
    function open() { try { window.open(url, "_blank", "noopener"); } catch (e) {} }
    if (url.indexOf("data:") === 0) { a.href = url; a.download = name; d.body.appendChild(a); a.click(); a.remove(); return; }
    fetch(url, { mode: "cors" }).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
      var o = URL.createObjectURL(b); a.href = o; a.download = name; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(o); }, 4000);
    }).catch(open);
  }
  function imageEl(x, fresh) {
    var el = d.createElement("div"), has = !!x.image;
    el.className = "dn-m ai img" + (fresh ? " fresh" : "");
    el.innerHTML = '<div class="dn-who"><i></i>' + esc(meta().name) + '</div>' +
      (has ? '<figure class="dn-fig loading"><img alt="" decoding="async"><span class="dn-figglow"></span></figure>'
           : '<div class="dn-fig gone"><span>' + esc(T("Esta imagem não foi guardada. Refaça para gerar de novo.")) + '</span></div>') +
      '<p class="dn-cap" data-notr></p>' +
      '<div class="dn-tools">' + (has ? '<button class="dn-tool" type="button" data-dl data-notr>' + ICON.dl + T("Baixar") + '</button>' : "") +
      '<button class="dn-tool" type="button" data-cp data-notr>' + ICON.copy + T("Copiar pedido") + '</button>' +
      '<button class="dn-tool" type="button" data-redo data-notr>' + ICON.redo + T("Refazer") + '</button></div>';
    $(".dn-cap", el).textContent = x.content;
    if (has) {
      var im = $("img", el), fg = $(".dn-fig", el);
      im.alt = x.content;
      im.onload = function () { fg.classList.remove("loading"); if (fresh) scrollEnd(); };
      im.onerror = function () { fg.classList.remove("loading"); fg.classList.add("gone"); fg.innerHTML = '<span>' + esc(T("Não foi possível carregar a imagem.")) + '</span>'; };
      im.src = x.image;
      im.onclick = function () { try { window.open(x.image, "_blank", "noopener"); } catch (e) {} };
      $("[data-dl]", el).onclick = function () { downloadImg(x.image, "dna-imagem.png"); };
    }
    $("[data-cp]", el).onclick = function (e) {
      var b = e.currentTarget, done = function () { b.innerHTML = ICON.check + T("Copiado"); setTimeout(function () { b.innerHTML = ICON.copy + T("Copiar pedido"); }, 1600); };
      try { navigator.clipboard.writeText(x.content).then(done, function () { toast("Não foi possível copiar."); }); } catch (er) { toast("Não foi possível copiar."); }
    };
    $("[data-redo]", el).onclick = function () { if (!state.busy) deliverImage(x.content); };
    return el;
  }
  function noticeEl() {
    var f = state.failed, el = d.createElement("div");
    el.className = "dn-notice";
    el.innerHTML = '<span data-notr>' + esc(T(f.message)) + '</span>' + (f.noretry ? "" : '<button type="button" data-notr>' + esc(T("Tentar de novo")) + '</button>');
    if (f.noretry) return el;
    $("button", el).onclick = function () { el.remove(); var t = f.text, im = f.img; state.failed = null; if (im) deliverImage(t); else deliver(t); };
    return el;
  }
  function renderChat() {
    if (storms.hero) { storms.hero.destroy(); storms.hero = null; }
    var c = col(); c.innerHTML = "";
    if (!state.history.length) {
      c.innerHTML = welcomeHTML();
      if (I18N) I18N.apply(c);
      $$("[data-prompt]", c).forEach(function (b) { b.onclick = function () { ta.value = T(b.getAttribute("data-prompt")); autosize(); ta.focus(); }; });
      var li = $("#rkWelcomeLogin", c); if (li) li.onclick = function () { state.pendingMode = state.mode; login(); };
      var cv = $("#rkStormLg", c); if (cv) mountStorm("hero", cv, "lg");
      bindHero(c);
    } else {
      state.history.forEach(function (x) { c.appendChild(msgEl(x, false)); });
      if (state.failed) c.appendChild(noticeEl());
    }
    if (!state.history.length) { scroller.scrollTop = 0; requestAnimationFrame(function () { scroller.scrollTop = 0; }); } else scrollEnd(false);
  }
  function bindHero(c) {
    var h = $(".dn-hero", c); if (!h || h.classList.contains("st")) return;
    var dm = $(".dnaMark.lg:not(.refl)", h);
    h.addEventListener("pointermove", function (e) {
      var r = h.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      h.style.setProperty("--ry", (x * 16).toFixed(1) + "deg"); h.style.setProperty("--rx", (-y * 12).toFixed(1) + "deg");
    });
    h.addEventListener("pointerleave", function () { h.style.setProperty("--ry", "0deg"); h.style.setProperty("--rx", "0deg"); });
    h.addEventListener("pointerdown", function () {
      if (dm) { dm.classList.remove("zap"); void dm.offsetWidth; dm.classList.add("zap"); }
      h.classList.remove("pulse"); void h.offsetWidth; h.classList.add("pulse");
    });
  }
  function scrollTo_(el) {
    var go = function () { var top = el.offsetTop - 14; try { scroller.scrollTo({ top: top, behavior: "smooth" }); } catch (e) { scroller.scrollTop = top; } };
    requestAnimationFrame(go);
  }
  function scrollEnd(smooth) {
    var go = function () { try { scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth === false ? "auto" : "smooth" }); } catch (e) { scroller.scrollTop = scroller.scrollHeight; } };
    go(); requestAnimationFrame(go);
  }
  function autosize() {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    sendBtn.setAttribute("data-empty", ta.value.trim() ? "0" : "1");
  }
  function setBusy(b) { sendBtn.disabled = b; }

  var PHASES = {
    dna: ["pensando", "organizando as ideias", "montando a resposta"],
    tempesta: ["ouvindo", "pensando com calma", "escolhendo as palavras"],
    research: ["pesquisando", "cruzando informações", "organizando as conclusões"],
    code: ["analisando o código", "escrevendo", "revisando"],
    writer: ["pensando no tom", "escrevendo", "revisando o texto"],
    designer: ["explorando ideias", "compondo", "refinando"],
    analyst: ["lendo os dados", "calculando", "interpretando"],
    marketing: ["entendendo o público", "montando a estratégia", "afinando a mensagem"],
    nevera: ["planejando", "preparando a execução", "conferindo"],
    image: ["interpretando o pedido", "compondo a cena", "ajustando luz e cor", "renderizando"]
  };
  function thinkEl(kind) {
    var m = meta(), key = kind === "image" ? "image" : (m.theme === "tempesta" ? "tempesta" : (m.agent || "dna")), ph = PHASES[key] || PHASES.dna;
    var el = d.createElement("div"), mark;
    el.className = "dn-think"; el.setAttribute("role", "status");
    if (m.theme === "tempesta") mark = '<canvas aria-hidden="true"></canvas>';
    else if (m.agent) mark = agentMark(m.agent, "busy");
    else mark = MARK.replace('class="dnaMark foil"', 'class="dnaMark foil busy"');
    el.innerHTML = '<span class="dn-tmark">' + mark + '</span><span class="dn-ttext"><b>' + esc(m.name) + '</b><span class="dn-tline"><em class="dn-tstate">' + esc(T(ph[0])) + '</em><span class="dn-dots"><i></i><i></i><i></i></span></span></span>';
    if (m.theme === "tempesta") mountStorm("think", $("canvas", el), "sm");
    var i = 0, st = $(".dn-tstate", el);
    el._iv = setInterval(function () { i = (i + 1) % ph.length; st.textContent = T(ph[i]); }, 2300);
    if (kind === "image") { el.classList.add("isimg"); el._ph = d.createElement("div"); el._ph.className = "dn-figph"; el._ph.innerHTML = "<i></i>"; }
    el.onclick = function () {
      el.classList.remove("tap"); void el.offsetWidth; el.classList.add("tap");
      clearTimeout(el._tt); el._tt = setTimeout(function () { el.classList.remove("tap"); }, 650);
      if (storms.think) storms.think.strike(.3 + Math.random() * .4, .9);
      var dm = $(".dnaMark", el); if (dm) { dm.classList.remove("zap"); void dm.offsetWidth; dm.classList.add("zap"); }
    };
    return el;
  }
  function endThink(el) {
    if (!el) return;
    clearInterval(el._iv);
    if (storms.think) { storms.think.destroy(); storms.think = null; setFlash("think", 0); }
    if (el._ph) el._ph.remove();
    el.remove();
  }

  async function deliver(text) {
    var mode = state.mode;
    state.busy = true; state.failed = null; setBusy(true);
    var t = thinkEl();
    col().appendChild(t); scrollEnd();
    try {
      var r = await api({ message: text, history: state.history.slice(-9, -1).map(function (x) { return x.kind === "image" ? { role: "assistant", content: "[imagem gerada a partir de: " + x.content + "]" } : { role: x.role, content: x.content }; }), language: lang(), mode: mode });
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(data.error || "Não foi possível responder.");
      var item = { role: "assistant", content: data.reply || T("Não recebi uma resposta.") };
      if (Array.isArray(data.sources) && data.sources.length) item.sources = data.sources.slice(0, 5).map(function (s) { return { title: String(s.title || "").slice(0, 120), url: String(s.url || "") }; });
      if (typeof data.credits === "number") { state.credits = data.credits; updateAuthUI(); }
      endThink(t);
      if (state.mode === mode) { state.history.push(item); saveChat(); var ne = msgEl(item, true); col().appendChild(ne); scrollTo_(ne); }
      else pushTo(mode, item);
    } catch (x) {
      endThink(t);
      var msg = x && x.message ? x.message : "Não foi possível responder agora.";
      if (x instanceof TypeError) msg = "Sem conexão com o servidor. Verifique a internet e tente de novo.";
      if (state.mode === mode) { state.failed = { text: text, message: msg }; col().appendChild(noticeEl()); scrollEnd(); }
    } finally { state.busy = false; setBusy(false); }
  }
  /* ---------- imagens ---------- */
  // pedidos de imagem escritos em linguagem natural ("cria uma imagem...", "faz um banner...")
  var IMG_ASK = /\b(cri[ae]r?|fa[çc]a|faz|fazer|ger[ae]r?|gera|desenh[ae]r?|monte|montar|produz[ai]r?|make|create|generate|draw|cre[ae]|genera|haz|dibuja)\b[^.?!\n]{0,40}\b(imagem|imagens|foto|arte|banner|logo|logotipo|ilustra[çc][ãa]o|poster|p[ôo]ster|cartaz|flyer|criativo|image|picture|photo|illustration|imagen)\b/i;
  var IMG_FOLLOW = /^\s*(gera|gere|faz|fa[çc]a|cria|crie|manda|quero)\b[^.?!\n]{0,30}\b(imagem|arte|pronta|ela|isso)\b|^\s*(gera|gere|faz|fa[çc]a)\s+(a|essa|isso)\b/i;
  function lastWasImageTalk() {
    var h = state.history.slice(-3);
    return h.some(function (x) { return x.kind === "image" || IMG_ASK.test(x.content || ""); });
  }
  function imgOK(mode) { mode = mode || state.mode; return mode === "rimak" || mode === "agent:designer" || mode === "agent:marketing" || mode === "agent:writer"; }
  function imgUI() {
    var ok = imgOK(); if (!ok) state.img = false;
    imgBtn.hidden = !ok;
    imgBtn.classList.toggle("on", !!state.img);
    imgBtn.setAttribute("aria-pressed", state.img ? "true" : "false");
    imgBtn.title = T("Gerar imagem · {n} créditos", { n: state.imgCost });
    $("span", imgBtn).textContent = state.img ? T("Imagem") : "";
    chat.setAttribute("data-img", state.img ? "1" : "0");
    var m = meta();
    ta.placeholder = state.img ? T("Descreva a imagem que você quer…") : T(m.ph);
  }
  async function loadImgStatus() {
    if (!state.session || state.imgLoaded) return; state.imgLoaded = true;
    try { var r = await api({ action: "image_status" }), data = await r.json(); if (r.ok && data.cost) { state.imgCost = data.cost; imgUI(); } } catch (e) {}
  }
  imgBtn.onclick = function () {
    state.img = !state.img; imgUI();
    if (state.img) { toast(T("Modo imagem ligado · cada imagem custa {n} créditos.", { n: state.imgCost })); try { ta.focus(); } catch (e) {} }
  };
  async function deliverImage(prompt) {
    var mode = state.mode;
    if (state.credits != null && state.credits < state.imgCost) { state.failed = null; toast(T("Uma imagem custa {n} créditos e você tem {c}.", { n: state.imgCost, c: state.credits })); plans(); return; }
    state.busy = true; state.failed = null; setBusy(true);
    var t = thinkEl("image");
    col().appendChild(t); col().appendChild(t._ph); scrollEnd();
    try {
      var ctx = state.history.slice(-7, -1).filter(function (x) { return x.kind !== "image"; }).map(function (x) { return { role: x.role, content: String(x.content || "").slice(0, 500) }; });
      var r = await api({ action: "image", prompt: prompt, language: lang(), mode: mode, history: ctx });
      var data = await r.json().catch(function () { return {}; });
      if (typeof data.credits === "number") { state.credits = data.credits; updateAuthUI(); }
      if (typeof data.cost === "number") state.imgCost = data.cost;
      if (!r.ok) { var er = new Error(data.error || "Não foi possível gerar a imagem agora."); er.code = data.code; throw er; }
      var item = { role: "assistant", kind: "image", content: prompt, image: data.image };
      endThink(t);
      if (state.mode === mode) { state.history.push(item); saveChat(); var ne = msgEl(item, true); col().appendChild(ne); scrollTo_(ne); }
      else pushTo(mode, item);
    } catch (x) {
      endThink(t);
      var msg = x && x.message ? x.message : "Não foi possível gerar a imagem agora.";
      if (x instanceof TypeError) msg = "Sem conexão com o servidor. Verifique a internet e tente de novo.";
      if (state.mode === mode) { state.failed = { text: prompt, message: msg, img: true, noretry: x && x.code === "image_not_configured" }; col().appendChild(noticeEl()); scrollEnd(); }
    } finally { state.busy = false; setBusy(false); }
  }

  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (state.busy) return;
    if (!state.user || !state.session) { state.pendingMode = state.mode; login(); return; }
    var text = ta.value.trim();
    if (!text) return;
    var asImg = false, cmd = /^\/(imagem|image|imagen|img)\s+/i.exec(text);
    var wants = imgOK() && (IMG_ASK.test(text) || IMG_FOLLOW.test(text) && lastWasImageTalk());
    if (imgOK() && (state.img || cmd || wants)) { asImg = true; if (cmd) text = text.slice(cmd[0].length).trim(); if (!text) return; }
    if (state.credits != null && state.credits <= 0) { plans(); return; }
    if (asImg && state.credits != null && state.credits < state.imgCost) { toast(T("Uma imagem custa {n} créditos e você tem {c}.", { n: state.imgCost, c: state.credits })); plans(); return; }
    ta.value = ""; autosize();
    var item = { role: "user", content: text };
    state.history.push(item); saveChat();
    if (state.history.length === 1) renderChat(); else { col().appendChild(msgEl(item, false)); scrollEnd(); }
    if (asImg) deliverImage(text); else deliver(text);
  }

  /* ---------- abrir / fechar ---------- */
  function fit() {
    if (!chat.classList.contains("open")) return;
    var vv = window.visualViewport;
    if (vv) { chat.style.height = vv.height + "px"; chat.style.top = vv.offsetTop + "px"; }
  }
  function openChat(mode) {
    state.mode = mode; state.failed = null; state.img = false; loadChat(); loadImgStatus();
    setHeader();
    chat.classList.add("open");
    d.documentElement.classList.add("dn-lock");
    renderChat(); autosize(); fit();
    if (!state.pushed) { try { history.pushState({ dnChat: 1 }, ""); state.pushed = true; } catch (e) {} }
    if (!COARSE) setTimeout(function () { ta.focus(); }, 60);
  }
  function hideChat() {
    chat.classList.remove("open");
    d.documentElement.classList.remove("dn-lock");
    chat.style.height = ""; chat.style.top = "";
    stopStorms();
  }
  function closeChat() {
    hideChat();
    if (state.pushed) { state.pushed = false; try { history.back(); } catch (e) {} }
  }
  // texto vindo da tela inicial
  function ask(text) {
    text = String(text || "").trim();
    openChat("rimak");
    ta.value = text; autosize();
    if (!text) return;
    if (state.user && state.session) onSubmit(); else { state.pendingMode = "rimak"; login(); }
  }

  function fill(mode, text) {
    openChat(mode);
    ta.value = String(text || ""); autosize();
    setTimeout(function () { try { ta.focus(); } catch (e) {} }, 380);
  }

  /* ---------- eventos ---------- */
  $("#rkClose").onclick = closePanel;
  $("#rkMenuClose").onclick = closeMenu;
  menu.onclick = function (e) { if (e.target === menu) closeMenu(); var b = e.target.closest("[data-menu]"); if (b) menuAction(b.dataset.menu); };
  ov.onclick = function (e) { if (e.target === ov) closePanel(); };
  $("#rkChatClose").onclick = closeChat;
  $("#rkChatSettings").onclick = accountPanel;
  $("#rkCredit").onclick = plans;
  $("#rkComposer").onsubmit = onSubmit;
  $("#rkDown").onclick = function () { scrollEnd(true); };
  ta.addEventListener("input", autosize);
  ta.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !COARSE) { e.preventDefault(); onSubmit(); }
  });
  scroller.addEventListener("scroll", function () {
    var far = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight > 220;
    $("#rkDown").classList.toggle("show", far);
  }, { passive: true });
  d.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (ov.classList.contains("open")) closePanel();
    else if (menu.classList.contains("open")) closeMenu();
    else if (chat.classList.contains("open")) closeChat();
  });
  window.addEventListener("popstate", function () { if (chat.classList.contains("open")) { state.pushed = false; hideChat(); } });
  if (window.visualViewport) { window.visualViewport.addEventListener("resize", fit); window.visualViewport.addEventListener("scroll", fit); }

  // agentes na tela inicial: cada linha abre o chat do agente
  function bindLanding() {
    var map = { research: "research", code: "code", writer: "writer", designer: "designer", analyst: "analyst", marketing: "marketing" };
    $$(".ls div").forEach(function (row) {
      var b = $("b", row); if (!b) return;
      var id = map[b.textContent.trim().toLowerCase()];
      if (!id) return;
      row.setAttribute("role", "button"); row.setAttribute("tabindex", "0"); row.setAttribute("data-agent", id);
      row.setAttribute("aria-label", "Abrir agente " + b.textContent.trim());
      row.onclick = function () { openChat("agent:" + id); };
      row.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openChat("agent:" + id); } };
    });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", bindLanding, { once: true }); else bindLanding();

  function onLang() {
    greet(); updateAuthUI();
    if (menu.classList.contains("open")) { accountCard(); langSeg("#rkMenuLang", accountCard); }
    if (ov.classList.contains("open") && $("#rkLangSeg")) settings();
    if (chat.classList.contains("open")) { setHeader(); renderChat(); }
  }
  if (I18N) { I18N.apply(chat); I18N.apply(menu); I18N.apply($("#rkOverlay")); I18N.onChange(onLang); }

  window.rimakApp = {
    openChat: openChat, agents: agents, plans: plans, login: login, settings: settings, account: accountPanel, menu: openMenu, ask: ask, fill: fill,
    _md: md
  };
  greet(); updateAuthUI();
  boot().catch(function () {});
})();
