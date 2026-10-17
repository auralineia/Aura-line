/* RIMAK — movimento em tudo: HUD no hero, faixas em movimento, paralaxe, tilt 3D, ímã nos botões, cursor, rolagem viva */
(function () {
  "use strict";
  var d = document, RM = matchMedia("(prefers-reduced-motion:reduce)").matches, FINE = matchMedia("(hover:hover) and (pointer:fine)").matches;
  function $(s, r) { return (r || d).querySelector(s); } function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  if (RM) return;

  /* 1. HUD de varredura no hero (caixas, números vivos e linhas, como nas referências) */
  var hero = $("#s0");
  if (hero) {
    var hud = d.createElement("div"); hud.className = "hudL"; hud.setAttribute("aria-hidden", "true");
    hud.innerHTML =
      '<div class="hud h1"><i class="c a"></i><i class="c b"></i><i class="c c"></i><i class="c d"></i><span>ciclo</span><b data-n="4">0427</b><u></u></div>' +
      '<div class="hud h2"><i class="c a"></i><i class="c b"></i><i class="c c"></i><i class="c d"></i><span>memória</span><b data-n="3">128</b><u></u></div>' +
      '<div class="hud h3"><i class="c a"></i><i class="c b"></i><i class="c c"></i><i class="c d"></i><span>agentes</span><b data-n="2">06</b><u></u></div>' +
      '<div class="hud h4"><i class="c a"></i><i class="c b"></i><i class="c c"></i><i class="c d"></i><span>latência</span><b data-n="0">0.8s</b><u></u></div>' +
      '<svg class="hudLn" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 62 Q25 40 50 55 T100 30"/><path d="M0 80 Q30 70 55 78 T100 60"/></svg>';
    hero.appendChild(hud);
    var nums = $$("b[data-n]", hud), T = 0;
    setInterval(function () {
      if (d.hidden || scrollY > innerHeight * 1.1) return; T++;
      nums.forEach(function (b, i) {
        var n = +b.dataset.n;
        if (i === 0) b.textContent = String(427 + T).padStart(4, "0");
        else if (i === 1) b.textContent = String(120 + Math.floor(Math.random() * 40));
        else if (i === 2) b.textContent = String(5 + (T % 2)).padStart(2, "0");
        else b.textContent = (0.6 + Math.random() * .6).toFixed(1) + "s";
        b.classList.remove("tick"); void b.offsetWidth; b.classList.add("tick");
      });
    }, 1400);
  }

  /* 2. faixas em movimento entre as seções (velocidade reage à rolagem) */
  var after = $("#mais");
  function band(words, rev) {
    var w = words.join("  ✦  ") + "  ✦  ", el = d.createElement("div"); el.className = "mqB" + (rev ? " rev" : ""); el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="mqT"><span data-notr>' + w + '</span><span data-notr>' + w + '</span><span data-notr>' + w + '</span><span data-notr>' + w + '</span></div>';
    return el;
  }
  var bands = [];
  if (after) {
    var s1 = $("#creditos"), s2 = $("#pratica"), s3 = $("#faq");
    var A = ["RIMAK", "RITTY", "TEMPESTA", "RESEARCH", "CODE", "WRITER", "DESIGNER", "ANALYST", "MARKETING"], B = ["RIMAK 4.2x", "RIMAK 5.5s", "RIMAK 6.0rs", "PRO", "ULTRA", "HIGH"];
    [[s1, A, 0], [s2, B, 1], [s3, A, 0]].forEach(function (x) { if (x[0]) { var b = band(x[1], x[2]); x[0].parentNode.insertBefore(b, x[0]); bands.push(b); } });
  }

  /* 3. rolagem viva: progresso por seção, velocidade e paralaxe */
  var secs = $$(".sec,.sc"), last = scrollY, vel = 0, tick = false;
  function frame() {
    tick = false;
    var y = scrollY, dv = y - last; last = y; vel += (Math.min(Math.abs(dv), 120) - vel) * .18;
    var h = innerHeight;
    secs.forEach(function (s) {
      var r = s.getBoundingClientRect(); if (r.bottom < -200 || r.top > h + 200) return;
      s.style.setProperty("--sp", ((h - r.top) / (h + r.height)).toFixed(3));
    });
    bands.forEach(function (b, i) { var r = b.getBoundingClientRect(); if (r.bottom < 0 || r.top > h) return; b.style.setProperty("--bx", ((r.top / h) * (i % 2 ? -1 : 1) * 40).toFixed(1) + "vw"); b.style.setProperty("--bs", (1 + vel / 14).toFixed(2)); });
    if (vel > .4) requestAnimationFrame(function () { if (!tick) { tick = true; frame(); } });
  }
  addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* 4. tilt 3D com brilho nos cartões (mouse) e flutuação (toque) */
  var TL = ".plan,.bc,.step,.demo,.why,.cmp,.rk-tile,.rk-mb,.rkPlan,.rkCard";
  if (FINE) {
    d.addEventListener("pointermove", function (e) {
      var t = e.target.closest && e.target.closest(TL); if (!t) return;
      var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      t.style.setProperty("--tx", (-y * 7).toFixed(2) + "deg"); t.style.setProperty("--ty", (x * 9).toFixed(2) + "deg"); t.classList.add("tl");
    }, { passive: true });
    d.addEventListener("pointerout", function (e) { var t = e.target.closest && e.target.closest(TL); if (t && !t.contains(e.relatedTarget)) { t.classList.remove("tl"); t.style.removeProperty("--tx"); t.style.removeProperty("--ty"); } }, { passive: true });
  }

  /* 5. botões magnéticos */
  if (FINE) {
    var MG = ".b,.ask button,.dn-send,.menu-btn,#menuBtn,.dn-cta";
    d.addEventListener("pointermove", function (e) {
      var t = e.target.closest && e.target.closest(MG); if (!t) return;
      var r = t.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      t.style.translate = (x * .18).toFixed(1) + "px " + (y * .28).toFixed(1) + "px";
    }, { passive: true });
    d.addEventListener("pointerout", function (e) { var t = e.target.closest && e.target.closest(MG); if (t) t.style.translate = ""; }, { passive: true });
  }

  /* 6. cursor que acompanha e reage */
  if (FINE) {
    var cur = d.createElement("div"); cur.className = "rkCur"; cur.setAttribute("aria-hidden", "true"); d.body.appendChild(cur);
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy, on = false;
    d.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; if (!on) { on = true; cur.style.opacity = 1; } var h = e.target.closest && e.target.closest("a,button,.b,input,textarea,[data-act],.plan,.bc"); cur.classList.toggle("hv", !!h); }, { passive: true });
    d.addEventListener("pointerdown", function () { cur.classList.add("dn"); }); d.addEventListener("pointerup", function () { cur.classList.remove("dn"); });
    d.addEventListener("mouseleave", function () { cur.style.opacity = 0; on = false; });
    (function loop() { cx += (tx - cx) * .2; cy += (ty - cy) * .2; cur.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)"; requestAnimationFrame(loop); })();
  }

  /* 7. ondas de toque em qualquer botão */
  d.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest("button,.b,.rk-tile,.rk-q,.rk-bar,.rk-chip,.rk-mb,.rk-st,.rk-ch,.rk-cmd,.rk-qc,.plan");
    if (!t || t.disabled) return;
    var r = t.getBoundingClientRect(), s = d.createElement("span"), m = Math.max(r.width, r.height) * 2.2;
    s.className = "rkRip"; s.style.cssText = "left:" + (e.clientX - r.left - m / 2) + "px;top:" + (e.clientY - r.top - m / 2) + "px;width:" + m + "px;height:" + m + "px";
    if (getComputedStyle(t).position === "static") t.style.position = "relative";
    t.style.overflow = t.style.overflow || ""; t.appendChild(s); setTimeout(function () { s.remove(); }, 800);
  }, { passive: true });

  /* 8. etiquetas se "decodificam" ao entrar na tela */
  var CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/+";
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var el = en.target, txt = el.textContent, n = 0; if (el.children.length) return;
        var iv = setInterval(function () {
          n++; var out = ""; for (var i = 0; i < txt.length; i++) out += (i < n / 1.4 || txt[i] === " ") ? txt[i] : CH[Math.floor(Math.random() * CH.length)];
          el.textContent = out; if (n > txt.length * 1.4) { clearInterval(iv); el.textContent = txt; }
        }, 34);
      });
    }, { threshold: .6 });
    $$(".tag,.cmp thead th").forEach(function (t) { io.observe(t); });
  }
})();
