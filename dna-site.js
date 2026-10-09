/* DNA — interações do site */
(function () {
  "use strict";
  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var off = function () {
    try { if (localStorage.getItem("rimak.motion") === "off") return true; } catch (e) {}
    return window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  };
  var app = function () { return window.rimakApp || {}; };

  /* ---------- títulos palavra a palavra ---------- */
  function splitH2(h, text) {
    var words = text.trim().split(/\s+/);
    h.setAttribute("aria-label", text.trim());
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span></span>";
    }).join(" ");
  }
  window.DNASplit = splitH2;
  $$("h2").forEach(function (h) {
    if (h.children.length || h.dataset.split) return;
    h.dataset.split = "1"; h.dataset.pt = h.textContent.trim();
    splitH2(h, h.dataset.pt);
  });

  /* ---------- barra de progresso + contador ---------- */
  var prog = $("#prog"), ct = $("#ct"), after = $(".after"), ticking = false;
  function onScroll() {
    ticking = false;
    var max = d.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
    if (ct && after) { var s6 = d.getElementById("s6"); ct.style.opacity = (after.getBoundingClientRect().top < innerHeight * 0.55 || (s6 && s6.getBoundingClientRect().top < innerHeight * 0.1)) ? "0" : ""; }
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- foco de luz que segue o dedo/cursor ---------- */
  function spot(e) {
    var t = e.target && e.target.closest ? e.target.closest(".fx,.b,#hl a") : null;
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty("--px", (e.clientX - r.left) + "px");
    t.style.setProperty("--py", (e.clientY - r.top) + "px");
    if (e.pointerType !== "mouse") { t.classList.add("touch"); clearTimeout(t._tt); t._tt = setTimeout(function () { t.classList.remove("touch"); }, 900); }
  }
  d.addEventListener("pointermove", spot, { passive: true });
  d.addEventListener("pointerdown", spot, { passive: true });

  /* ---------- botões magnéticos (somente mouse) ---------- */
  if (!off() && matchMedia("(pointer:fine)").matches) {
    $$(".b").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.08).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- planos: contagem ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(function (el) {
        var N = +el.dataset.count;
        if (off()) { el.textContent = N; return; }
        var t0 = performance.now();
        (function u(n) { var k = Math.min((n - t0) / 1100, 1); el.textContent = Math.round(N * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(u); })(t0);
      });
    });
  }, { threshold: 0.25 });
  $$(".plan,.step").forEach(function (el) { io.observe(el); });

  /* ---------- demonstração ---------- */
  var DEMOS = {
    dna: {
      q: "Quero lançar meu projeto em 30 dias. Por onde começo?",
      a: "Vamos transformar isso em plano. Uma pergunta antes: o projeto já tem um público definido?\n\nEnquanto isso, um esqueleto de 30 dias:\n\n1. **Dias 1–7 · Definir** — público, problema e a promessa em uma frase.\n2. **Dias 8–18 · Construir** — só o essencial para uma primeira versão usável.\n3. **Dias 19–25 · Testar** — 5 pessoas reais usando, sem ajuda.\n4. **Dias 26–30 · Lançar** — um canal, uma mensagem.\n\nMe conte o que é o projeto e eu ajusto cada etapa.",
      mode: "rimak", go: "Quero lançar um projeto em 30 dias. Me ajude a montar o plano."
    },
    analyst: {
      q: "Vendas: jan 120, fev 135, mar 128. O que isso indica?",
      a: "Três leituras rápidas:\n\n- **Jan → fev:** +12,5% (120 → 135).\n- **Fev → mar:** −5,2% (135 → 128).\n- **Jan → mar:** +6,7% no acumulado.\n\nA tendência geral é de alta, mas março recuou. Três meses ainda é pouco para falar em padrão: vale checar sazonalidade e se algo mudou em março (preço, campanha, estoque).\n\nQuer que eu monte um plano de análise?",
      mode: "agent:analyst", go: "Vou te passar alguns números. Me ajude a interpretar e tirar conclusões."
    },
    writer: {
      q: "Revise: “Gostaria de saber se vocês poderiam me enviar o orçamento até amanhã, se possível.”",
      a: "Versão mais direta:\n\n> Olá! Pode me enviar o orçamento até amanhã?\n\n**O que mudou:** cortei “gostaria de saber se” e “se possível” — dois rodeios que enfraquecem o pedido. O prazo ficou claro e o tom continua cordial.\n\nSe o cliente for mais formal, posso sugerir uma versão intermediária.",
      mode: "agent:writer", go: "Vou colar um texto. Revise, melhore a clareza e explique o que mudou."
    },
    tempesta: {
      q: "Expliquei tudo pra ela e a resposta foi só “ok.”",
      a: "Um “ok.” seco pode significar coisas bem diferentes: cansaço, concordar sem querer discutir, ou um desconforto que ainda não encontrou palavras. Só pelo texto, não dá para saber qual.\n\nO que você sentiu ao ler? Às vezes isso diz muito sobre o que você precisa agora: ser ouvido, ter uma resposta ou só um tempo.\n\nSe quiser, pensamos juntos em como retomar a conversa sem pressão.",
      mode: "tempesta", go: "Vou te mostrar uma conversa ou mensagem. Me ajude a entender o tom, a intenção por trás dela e como responder."
    }
  };
  var demo = $("#demo"), timer = null, cur = null, started = false;
  function reveal(box) {
    var words = $$(".wd", box), i = 0;
    clearInterval(timer);
    if (off()) { words.forEach(function (w) { w.classList.add("on"); }); return; }
    timer = setInterval(function () {
      for (var k = 0; k < 2 && i < words.length; k++, i++) words[i].classList.add("on");
      if (i >= words.length) clearInterval(timer);
    }, 38);
  }
  function wrapWords(root) {
    var walker = d.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      var parts = t.nodeValue.split(/(\s+)/), f = d.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { f.appendChild(d.createTextNode(p)); return; }
        var s = d.createElement("span"); s.className = "wd"; s.textContent = p; f.appendChild(s);
      });
      t.parentNode.replaceChild(f, t);
    });
  }
  function showDemo(key) {
    if (!demo) return;
    var D = DEMOS[key]; if (!D) return;
    cur = key;
    $$(".dtabs button", demo).forEach(function (b) { b.setAttribute("aria-selected", b.dataset.k === key ? "true" : "false"); });
    var TT = function (x) { return window.DNAi18n ? window.DNAi18n.t(x) : x; };
    $(".dq", demo).textContent = TT(D.q);
    var box = $(".tx2", demo), A = TT(D.a);
    var html = app()._md ? app()._md(A) : "<p>" + A.replace(/\n/g, "<br>") + "</p>";
    box.innerHTML = html;
    wrapWords(box);
    reveal(box);
  }
  if (demo) {
    $$(".dtabs button", demo).forEach(function (b) { b.onclick = function () { showDemo(b.dataset.k); }; });
    $("#demoGo").onclick = function (e) {
      e.preventDefault();
      var D = DEMOS[cur || "dna"];
      if (app().fill) app().fill(D.mode, window.DNAi18n ? window.DNAi18n.t(D.go) : D.go); else if (app().openChat) app().openChat(D.mode);
    };
    new IntersectionObserver(function (es, ob) {
      if (es[0].isIntersecting && !started) { started = true; ob.disconnect(); showDemo("dna"); }
    }, { threshold: 0.3 }).observe(demo);
    showDemo("dna");
    $$(".wd", demo).forEach(function (w) { w.classList.remove("on"); });
  }

  /* ---------- perguntas frequentes ---------- */
  $$(".fq").forEach(function (q) {
    var btn = $("button", q);
    btn.addEventListener("click", function () {
      var open = !q.classList.contains("open");
      $$(".fq.open").forEach(function (o) { if (o !== q) { o.classList.remove("open"); $("button", o).setAttribute("aria-expanded", "false"); } });
      q.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  $$("[data-go]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var t = d.getElementById(a.dataset.go); if (t) t.scrollIntoView({ behavior: off() ? "auto" : "smooth" }); }); });

  /* ---------- toque: onda + pulso na esfera ---------- */
  d.addEventListener("pointerdown", function (e) {
    if (off()) return;
    if (e.target.closest && e.target.closest("input,textarea,select,#rkChat,#rkOverlay,#rkMenu")) return;
    var r = d.createElement("i"); r.className = "rip"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
    d.body.appendChild(r); setTimeout(function () { r.remove(); }, 900);
    if (window.DNAPulse && !(e.target.closest && e.target.closest(".sec,.after,.plans,.demo,.faq,.foot"))) window.DNAPulse(.55);
  }, { passive: true });

  /* ---------- cursor (mouse): anel que acompanha e cresce nos botões ---------- */
  if (!off() && matchMedia("(pointer:fine)").matches) {
    var ring = d.createElement("div"); ring.id = "cur"; d.body.appendChild(ring);
    var cx = -100, cy = -100, tx = -100, ty = -100;
    d.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY; ring.classList.add("on");
      ring.classList.toggle("hot", !!(e.target.closest && e.target.closest("a,button,.fx,[role=button],input,label")));
    }, { passive: true });
    d.addEventListener("pointerleave", function () { ring.classList.remove("on"); });
    (function loop() { cx += (tx - cx) * .22; cy += (ty - cy) * .22; ring.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)"; requestAnimationFrame(loop); })();
  }

  /* ---------- logo do topo: reage ao toque e volta ao início ---------- */
  var brand = $(".dnaBrand");
  if (brand) {
    brand.style.cursor = "pointer"; brand.setAttribute("role", "button"); brand.setAttribute("tabindex", "0");
    var zap = function () {
      var m = $(".dnaMark", brand); if (!m) return;
      m.classList.remove("zap"); void m.offsetWidth; m.classList.add("zap");
      if (window.DNAPulse) window.DNAPulse(.8);
      scrollTo({ top: 0, behavior: off() ? "auto" : "smooth" });
    };
    brand.addEventListener("click", zap);
    brand.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zap(); } });
  }

  /* ---------- atalho "/" foca a pergunta ---------- */
  d.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.ctrlKey || e.metaKey) return;
    var t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    var i = $("#askIn"); if (!i) return;
    e.preventDefault(); scrollTo({ top: 0, behavior: "auto" }); setTimeout(function () { i.focus(); }, 30);
  });

  /* ---------- demonstração: avança sozinha até o visitante mexer ---------- */
  if (demo) {
    var order = ["dna", "analyst", "writer", "tempesta"], touched = false, visible = false;
    demo.addEventListener("pointerdown", function () { touched = true; }, { passive: true });
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .4 }).observe(demo);
    setInterval(function () { if (touched || !visible || off() || d.hidden) return; showDemo(order[(order.indexOf(cur) + 1) % order.length]); }, 11000);
  }

  /* ---------- planos: "como você usa?" destaca o plano certo ---------- */
  var pick = $("#planPick");
  if (pick) {
    var MAP = { few: ["free", "Para usar de vez em quando, o FREE costuma bastar: 20 créditos novos todo dia."], daily: ["pro", "Para usar todos os dias, o PRO dá 2,5× o saldo do FREE e evita ficar sem créditos no meio da tarefa."], heavy: ["ultra", "Para trabalhar o dia todo, o ULTRA tem 150 créditos por dia e o menor custo por crédito."] };
    var say = $("#planSay");
    $$("button", pick).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", pick).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var m = MAP[b.dataset.use];
        $$(".plan").forEach(function (p) { p.classList.toggle("rec", p.dataset.plan === m[0]); });
        if (say) { say.setAttribute("data-pt", m[1]); say.textContent = (window.DNAi18n ? window.DNAi18n.t(m[1]) : m[1]); }
        if (window.DNAPulse) window.DNAPulse(.4);
      });
    });
  }

  /* ---------- ações dos botões do rodapé / CTA ---------- */
  $$("[data-act]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var a = el.dataset.act, A = app();
      if (a === "plans" && A.plans) A.plans();
      else if (a === "agents" && A.agents) A.agents();
      else if (a === "menu" && A.menu) A.menu();
      else if (a === "dna" && A.openChat) A.openChat("rimak");
      else if (a === "tempesta" && A.openChat) A.openChat("tempesta");
      else if (a === "top") scrollTo({ top: 0, behavior: off() ? "auto" : "smooth" });
    });
  });
  if (window.DNAi18n) { window.DNAi18n.onChange(function () { if (window.DNAResetCt) window.DNAResetCt(); if (cur && DEMOS[cur]) showDemo(cur); }); window.DNAi18n.ready(); }
})();
