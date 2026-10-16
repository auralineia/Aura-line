/* RIMAK — identidade de cada chat: emblema animado, fundo animado, tela inicial e estrutura próprios. */
(function () {
  "use strict";
  var five = '<i></i><i></i><i></i><i></i><i></i>';
  function up(root) { var l = root.querySelectorAll ? root.querySelectorAll(".dnaMark") : []; for (var k = 0; k < l.length; k++) { var m = l[k]; if (!m.getAttribute("data-up")) { m.setAttribute("data-up", "1"); m.innerHTML = five; } } }
  up(document);
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var a = ms[i].addedNodes; for (var j = 0; j < a.length; j++) { var n = a[j]; if (n.nodeType === 1) { if (n.classList && n.classList.contains("dnaMark") && !n.getAttribute("data-up")) { n.setAttribute("data-up", "1"); n.innerHTML = five; } else up(n); } } } }).observe(document.documentElement, { childList: true, subtree: true });

  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function key(m) { return m.theme === "tempesta" ? "tempesta" : (m.agent || "rimak"); }

  /* ---------- emblemas (SVG animado por CSS) ---------- */
  var EMB = {
    research: '<svg class="rkE rkE-research" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="8"/><path class="sw" d="M32 32 L32 4 A28 28 0 0 1 58 22 Z"/><circle class="bp b1" cx="46" cy="20" r="2.4"/><circle class="bp b2" cx="20" cy="42" r="2"/><circle class="bp b3" cx="38" cy="46" r="1.8"/></svg>',
    code: '<svg class="rkE rkE-code" viewBox="0 0 64 64" aria-hidden="true"><path class="l" d="M22 18 8 32l14 14"/><path class="r" d="M42 18l14 14-14 14"/><path class="sl" d="M37 14 27 50"/><rect class="cu" x="26" y="52" width="14" height="4" rx="1"/></svg>',
    writer: '<svg class="rkE rkE-writer" viewBox="0 0 64 64" aria-hidden="true"><path class="ink" d="M6 52c8-2 12-14 20-14s8 10 16 6 8-14 16-18"/><g class="nib"><path d="M44 6l14 14-20 20-12 3 3-12z"/><path d="M26 31l8 8"/></g></svg>',
    designer: '<svg class="rkE rkE-designer" viewBox="0 0 64 64" aria-hidden="true"><circle class="c1" cx="24" cy="26" r="15"/><circle class="c2" cx="40" cy="26" r="15"/><circle class="c3" cx="32" cy="40" r="15"/></svg>',
    analyst: '<svg class="rkE rkE-analyst" viewBox="0 0 64 64" aria-hidden="true"><rect class="b1" x="8" y="34" width="10" height="22" rx="2"/><rect class="b2" x="27" y="22" width="10" height="34" rx="2"/><rect class="b3" x="46" y="10" width="10" height="46" rx="2"/><path class="tr" d="M6 30l18-10 16 6 20-18"/></svg>',
    marketing: '<svg class="rkE rkE-marketing" viewBox="0 0 64 64" aria-hidden="true"><path class="mg" d="M10 26h12l22-12v36L22 38H10z"/><path class="w1" d="M50 24a12 12 0 0 1 0 16"/><path class="w2" d="M55 17a22 22 0 0 1 0 30"/><path class="w3" d="M24 38l4 14h8l-4-12"/></svg>',
    nevera: '<svg class="rkE rkE-nevera" viewBox="0 0 64 64" aria-hidden="true"><g class="g1"><circle cx="24" cy="30" r="9"/><path d="M24 14v6M24 40v6M8 30h6M34 30h6M12.7 18.7l4.2 4.2M31.1 37.1l4.2 4.2M12.7 41.3l4.2-4.2M31.1 22.9l4.2-4.2"/></g><g class="g2"><circle cx="46" cy="44" r="6"/><path d="M46 33v4M46 51v4M35 44h4M53 44h4M38.2 36.2l2.8 2.8M51 49l2.8 2.8M38.2 51.8l2.8-2.8M51 39l2.8-2.8"/></g><circle class="nd" cx="52" cy="14" r="3"/><path class="fl" d="M40 22 52 14"/></svg>',
    tempesta: '<svg class="rkE rkE-tempesta" viewBox="0 0 64 64" aria-hidden="true"><circle class="o1" cx="32" cy="32" r="24"/><circle class="o2" cx="32" cy="32" r="16"/><circle class="o3" cx="32" cy="32" r="7"/></svg>'
  };
  function emblem(k, busy) { return EMB[k] ? '<span class="rkEm' + (busy ? " busy" : "") + '">' + EMB[k] + '</span>' : ""; }

  /* ---------- tela inicial: uma estrutura diferente para cada chat ---------- */
  function S(ctx, i) { var s = ctx.sugs[i]; return s ? { t: ctx.esc(s[0]), d: ctx.esc(s[1]), p: ctx.esc(s[2]) } : { t: "", d: "", p: "" }; }
  function nm(ctx, plain) { return ctx.name ? ctx.esc(ctx.T("Olá, {n}.", { n: ctx.name })) + " " : ""; }
  var W = {
    rimak: function (c) {
      var tiles = c.sugs.map(function (s, i) { return '<button class="rk-tile" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><b>' + c.esc(s[0]) + '</b><small>' + c.esc(s[1]) + '</small><i>' + ARROW + '</i></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-rimak"><div class="rk-orbit"><div class="dn-hero"><div class="dn-halo"></div><div class="dnaMark foil lg" role="img" aria-label="RIMAK"><i></i><i></i><i></i><i></i><i></i></div></div></div><p class="rk-kick">' + nm(c) + c.esc(c.m.sub) + '</p><h2>' + c.esc(c.m.h) + '</h2><p class="dn-lead">' + c.esc(c.m.lead) + '</p><div class="rk-tiles">' + tiles + '</div>' + c.foot + '</section>';
    },
    research: function (c) {
      var rows = c.sugs.map(function (s, i) { return '<button class="rk-q" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><em>Q' + (i + 1) + '</em><span><b>' + c.esc(s[0]) + '</b><small>' + c.esc(s[1]) + '</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/></svg></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-research"><div class="rk-rhead">' + emblem("research") + '<div><p class="rk-kick">' + nm(c) + 'Modo investigação</p><h2>' + c.esc(c.m.h) + '</h2></div></div><p class="dn-lead">' + c.esc(c.m.lead) + '</p><div class="rk-srcs" aria-hidden="true"><span>Artigos</span><span>Notícias</span><span>Dados abertos</span><span>Documentos</span><span>Estudos</span></div><div class="rk-qs">' + rows + '</div>' + c.foot + '</section>';
    },
    code: function (c) {
      var rows = c.sugs.map(function (s, i) { return '<button class="rk-cmd" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><span class="pr">▸</span><b>' + c.esc(s[0]).toLowerCase().replace(/\s+/g, "-") + '</b><small># ' + c.esc(s[1]) + '</small></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-code"><div class="rk-term"><div class="rk-tbar"><i></i><i></i><i></i><span>rimak@code ~ sessão</span></div><div class="rk-tbody"><p class="ln"><span class="pr">$</span> rimak code <span class="fl">--iniciar</span></p><p class="ln ok">✓ ambiente pronto. ' + nm(c) + '</p><h2>' + c.esc(c.m.h) + '</h2><p class="dn-lead"># ' + c.esc(c.m.lead) + '</p><div class="rk-cmds">' + rows + '</div><p class="ln"><span class="pr">$</span> <span class="cur"></span></p></div></div>' + c.foot + '</section>';
    },
    writer: function (c) {
      var rows = c.sugs.map(function (s, i) { return '<button class="rk-ch" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><em>' + ["I", "II", "III", "IV"][i] + '</em><span><b>' + c.esc(s[0]) + '</b><small>' + c.esc(s[1]) + '</small></span></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-writer"><div class="rk-paper">' + emblem("writer") + '<p class="rk-kick">' + nm(c) + 'Página em branco</p><h2>' + c.esc(c.m.h) + '<span class="cur"></span></h2><p class="dn-lead">' + c.esc(c.m.lead) + '</p><div class="rk-chs">' + rows + '</div></div>' + c.foot + '</section>';
    },
    designer: function (c) {
      var shp = ['<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38"/></svg>', '<svg viewBox="0 0 100 100"><path d="M50 10 92 86H8z"/></svg>', '<svg viewBox="0 0 100 100"><rect x="14" y="14" width="72" height="72" rx="10"/></svg>', '<svg viewBox="0 0 100 100"><path d="M50 8c30 0 42 22 42 42S74 92 50 92 8 72 8 50 20 8 50 8z"/></svg>'];
      var tiles = c.sugs.map(function (s, i) { return '<button class="rk-mb m' + i + '" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><span class="sh">' + shp[i % 4] + '</span><b>' + c.esc(s[0]) + '</b><small>' + c.esc(s[1]) + '</small></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-designer"><div class="rk-dhead">' + emblem("designer") + '<h2>' + c.esc(c.m.h) + '</h2></div><p class="dn-lead">' + nm(c) + c.esc(c.m.lead) + '</p><div class="rk-swatch" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="rk-board">' + tiles + '</div>' + c.foot + '</section>';
    },
    analyst: function (c) {
      var rows = c.sugs.map(function (s, i) { return '<button class="rk-qc" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><svg class="sp" viewBox="0 0 80 28" aria-hidden="true"><path d="' + ["M2 22 18 16 32 19 48 8 64 12 78 3", "M2 6 16 12 30 10 46 20 62 15 78 24", "M2 18 14 8 28 14 44 6 58 16 78 10"][i % 3] + '"/></svg><b>' + c.esc(s[0]) + '</b><small>' + c.esc(s[1]) + '</small></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-analyst"><div class="rk-ahead">' + emblem("analyst") + '<div><p class="rk-kick">' + nm(c) + 'Painel de análise</p><h2>' + c.esc(c.m.h) + '</h2></div></div><p class="dn-lead">' + c.esc(c.m.lead) + '</p><div class="rk-kpis" aria-hidden="true"><div><small>Tendência</small><i></i></div><div><small>Padrões</small><i></i></div><div><small>Hipóteses</small><i></i></div></div><div class="rk-qcs">' + rows + '</div>' + c.foot + '</section>';
    },
    marketing: function (c) {
      var rows = c.sugs.map(function (s, i) { return '<button class="rk-bar" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><b>' + c.esc(s[0]) + '</b><small>' + c.esc(s[1]) + '</small>' + ARROW + '</button>'; }).join("");
      var words = "POSICIONAR ✦ CAMPANHA ✦ CONTEÚDO ✦ PÚBLICO ✦ MENSAGEM ✦ MÉTRICA ✦ ";
      return '<section class="dn-welcome rk-w rk-w-marketing"><div class="rk-mq" aria-hidden="true"><div><span>' + words + words + '</span><span>' + words + words + '</span></div></div><div class="rk-mh">' + emblem("marketing") + '<h2>' + c.esc(c.m.h) + '</h2></div><p class="dn-lead">' + nm(c) + c.esc(c.m.lead) + '</p><div class="rk-bars">' + rows + '</div>' + c.foot + '</section>';
    },
    nevera: function (c) {
      var labs = ["Entrada", "Plano", "Execução", "Resultado"];
      var steps = c.sugs.map(function (s, i) { return '<button class="rk-st" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><span class="no">' + (i + 1) + '</span><small>' + labs[i % 4] + '</small><b>' + c.esc(s[0]) + '</b><em>' + c.esc(s[1]) + '</em></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-nevera"><div class="rk-nhead">' + emblem("nevera") + '<div><p class="rk-kick">' + nm(c) + 'Linha de execução</p><h2>' + c.esc(c.m.h) + '</h2></div></div><p class="dn-lead">' + c.esc(c.m.lead) + '</p><div class="rk-flow"><div class="rk-wire" aria-hidden="true"><i></i></div>' + steps + '</div>' + c.foot + '</section>';
    },
    tempesta: function (c) {
      var chips = c.sugs.map(function (s, i) { return '<button class="rk-chip" type="button" style="--i:' + i + '" data-prompt="' + c.esc(s[2]) + '"><b>' + c.esc(s[0]) + '</b><small>' + c.esc(s[1]) + '</small></button>'; }).join("");
      return '<section class="dn-welcome rk-w rk-w-tempesta"><div class="dn-hero st"><canvas class="dn-storm" id="rkStormLg" role="img" aria-label="Nuvem de tempestade com raios"></canvas></div><p class="rk-kick">' + nm(c) + 'Sem pressa</p><h2>' + c.esc(c.m.h) + '</h2><p class="dn-lead">' + c.esc(c.m.lead) + '</p><div class="rk-chips">' + chips + '</div><p class="rk-breath" aria-hidden="true"><span></span>respire, e conte do seu jeito</p>' + c.foot + '</section>';
    }
  };
  function welcome(k, ctx) { return (W[k] || W.rimak)(ctx); }

  /* ---------- fundos animados (um por chat) ---------- */
  var FX = {}, cur = null;
  function rgb(v, d) { var p = (v || "").trim().split(/[ ,]+/).map(Number); return p.length >= 3 && !isNaN(p[0]) ? p : d; }
  function css(el, n, d) { return rgb(getComputedStyle(el).getPropertyValue(n), d); }
  function col(c, a) { return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a + ")"; }
  var R = Math.random, TAU = Math.PI * 2;
  FX.rimak = function (cv, x, o) {
    var P = [], i, A = css(o.chat, "--a", [143, 214, 255]), S2 = css(o.chat, "--s", [180, 170, 255]);
    for (i = 0; i < 260; i++) P.push({ u: R() * TAU, v: R() * TAU, r: R() }); var D = []; for (i = 0; i < 90; i++) D.push({ x: R(), y: R(), z: R() });
    return function (t, w, h, px, py) {
      x.clearRect(0, 0, w, h); var cx = w * .5 + px * 30, cy = h * .34 + py * 20, s = Math.min(w, h) * .24, rot = t * .00006;
      D.forEach(function (d) { var yy = (d.y + t * .000006 * (.3 + d.z)) % 1; x.fillStyle = col(A, .1 + d.z * .35); x.fillRect(d.x * w + px * 14 * d.z, yy * h, 1 + d.z * 1.4, 1 + d.z * 1.4); });
      P.forEach(function (p) { var R0 = 1 + .46 * Math.cos(p.v), X = R0 * Math.cos(p.u + rot), Y = R0 * Math.sin(p.u + rot), Z = .46 * Math.sin(p.v), tl = .9, y2 = Y * Math.cos(tl) - Z * Math.sin(tl), z2 = Y * Math.sin(tl) + Z * Math.cos(tl), f = .55 + .45 * (z2 + 1.5) / 3; x.fillStyle = col(p.r > .8 ? S2 : A, f * .55); x.beginPath(); x.arc(cx + X * s, cy + y2 * s * .9, .8 + p.r * 1.2, 0, TAU); x.fill(); });
    };
  };
  FX.research = function (cv, x, o) {
    var N = [], i, A = css(o.chat, "--a", [90, 220, 210]);
    for (i = 0; i < 56; i++) N.push({ x: R(), y: R(), vx: (R() - .5) * .00006, vy: (R() - .5) * .00006, l: 0 });
    return function (t, w, h, px, py) {
      x.clearRect(0, 0, w, h); var ang = (t * .0004) % TAU, cx = w * .86, cy = h * .9, rr = Math.hypot(w, h);
      N.forEach(function (n) { n.x += n.vx * 16; n.y += n.vy * 16; if (n.x < 0 || n.x > 1) n.vx *= -1; if (n.y < 0 || n.y > 1) n.vy *= -1; var a = Math.atan2(n.y * h - cy, n.x * w - cx); var d = ((ang - a) % TAU + TAU) % TAU; if (d < .25) n.l = 1; n.l *= .985; });
      for (i = 0; i < N.length; i++) for (var j = i + 1; j < N.length; j++) { var dx = (N[i].x - N[j].x) * w, dy = (N[i].y - N[j].y) * h, dd = Math.hypot(dx, dy); if (dd < 150) { x.strokeStyle = col(A, (1 - dd / 150) * (.1 + Math.max(N[i].l, N[j].l) * .35)); x.beginPath(); x.moveTo(N[i].x * w, N[i].y * h); x.lineTo(N[j].x * w, N[j].y * h); x.stroke(); } }
      N.forEach(function (n) { x.fillStyle = col(A, .35 + n.l * .65); x.beginPath(); x.arc(n.x * w, n.y * h, 1.6 + n.l * 2.4, 0, TAU); x.fill(); });
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, col(A, .0)); g.addColorStop(1, col(A, 0)); x.save(); x.translate(cx, cy); x.rotate(ang); var lg = x.createLinearGradient(0, 0, rr, 0); lg.addColorStop(0, col(A, .22)); lg.addColorStop(1, col(A, 0)); x.fillStyle = lg; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, rr, -.28, 0); x.closePath(); x.fill(); x.restore();
    };
  };
  FX.code = function (cv, x, o) {
    var A = css(o.chat, "--a", [90, 255, 150]), ch = "01{}[]<>/=+*;#$%&?:", cols = [], i; for (i = 0; i < 90; i++) cols.push({ y: R() * 100, v: .3 + R() * .9, o: R() });
    return function (t, w, h) {
      x.clearRect(0, 0, w, h); var fs = 15, n = Math.ceil(w / fs); x.font = fs + "px ui-monospace,Menlo,monospace";
      for (i = 0; i < n; i++) { var c = cols[i % cols.length]; c.y += c.v * .22; if (c.y * fs > h + 200) c.y = -R() * 20; for (var k = 0; k < 12; k++) { var yy = (c.y - k) * fs; if (yy < 0 || yy > h) continue; x.fillStyle = col(A, (1 - k / 12) * (.05 + c.o * .22)); x.fillText(ch[(i * 7 + k * 3 + Math.floor(t / 160 + i)) % ch.length], i * fs, yy); } }
      x.fillStyle = col(A, .05); x.fillRect(0, (t * .06) % h, w, 2);
    };
  };
  FX.writer = function (cv, x, o) {
    var A = css(o.chat, "--t", [30, 26, 22]), S2 = css(o.chat, "--a", [150, 92, 48]), L = []; for (var i = 0; i < 6; i++) L.push({ p: R() * 100, y: .15 + R() * .7, a: 30 + R() * 60, f: .004 + R() * .004, s: R() });
    return function (t, w, h) {
      x.clearRect(0, 0, w, h); x.strokeStyle = col(A, .045); for (var y = 80; y < h; y += 34) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
      L.forEach(function (l, i) { var prog = ((t * .00005 + l.p) % 1); x.strokeStyle = col(i % 2 ? S2 : A, .16 * Math.sin(prog * Math.PI)); x.lineWidth = 1.2 + l.s * 2; x.beginPath(); for (var k = 0; k <= 60; k++) { var u = k / 60; if (u > prog) break; var X = u * w * 1.1 - w * .05, Y = l.y * h + Math.sin(u * 9 + l.s * 6 + t * .0003) * l.a * (.6 + u) + Math.sin(u * 23) * 6; k ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); });
    };
  };
  FX.designer = function (cv, x, o) {
    var C = [[255, 80, 170], [255, 150, 60], [140, 100, 255], [60, 200, 255], [120, 255, 190]], B = C.map(function (c, i) { return { c: c, x: R(), y: R(), r: .22 + R() * .2, p: R() * 9 }; }), S2 = []; for (var i = 0; i < 12; i++) S2.push({ x: R(), y: R(), k: i % 3, s: 14 + R() * 26, r: R() * 6, c: C[i % 5] });
    return function (t, w, h, px, py) {
      x.clearRect(0, 0, w, h); x.globalCompositeOperation = "lighter";
      B.forEach(function (b, i) { var X = (b.x + Math.sin(t * .00021 + b.p) * .22 + px * .03 * (i + 1)) * w, Y = (b.y + Math.cos(t * .00017 + b.p) * .2 + py * .03 * (i + 1)) * h, rr = b.r * Math.max(w, h); var g = x.createRadialGradient(X, Y, 0, X, Y, rr); g.addColorStop(0, col(b.c, .2)); g.addColorStop(1, col(b.c, 0)); x.fillStyle = g; x.beginPath(); x.arc(X, Y, rr, 0, TAU); x.fill(); });
      x.globalCompositeOperation = "source-over";
      S2.forEach(function (s) { var X = (s.x + Math.sin(t * .00012 + s.r) * .05) * w, Y = (s.y + Math.cos(t * .0001 + s.r) * .05) * h; x.save(); x.translate(X, Y); x.rotate(s.r + t * .0003); x.strokeStyle = col(s.c, .35); x.lineWidth = 1.4; x.beginPath(); if (s.k === 0) x.arc(0, 0, s.s, 0, TAU); else if (s.k === 1) { x.moveTo(0, -s.s); x.lineTo(s.s, s.s * .8); x.lineTo(-s.s, s.s * .8); x.closePath(); } else x.rect(-s.s * .8, -s.s * .8, s.s * 1.6, s.s * 1.6); x.stroke(); x.restore(); });
    };
  };
  FX.analyst = function (cv, x, o) {
    var A = css(o.chat, "--a", [90, 170, 255]), S2 = css(o.chat, "--s", [255, 190, 80]), series = [0, 1, 2].map(function (k) { var a = [], v = .5; for (var i = 0; i < 120; i++) { v += (R() - .5) * .08; v = Math.max(.15, Math.min(.85, v)); a.push(v); } return a; }), bars = []; for (var i = 0; i < 28; i++) bars.push(R());
    return function (t, w, h) {
      x.clearRect(0, 0, w, h); x.strokeStyle = col(A, .06); for (var gx = 0; gx < w; gx += 48) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, h); x.stroke(); } for (var gy = 0; gy < h; gy += 48) { x.beginPath(); x.moveTo(0, gy); x.lineTo(w, gy); x.stroke(); }
      var bw = w / bars.length; bars.forEach(function (b, i) { var hh = (.1 + .16 * (.5 + .5 * Math.sin(t * .0007 + i * .6 + b * 6))) * h; x.fillStyle = col(A, .07); x.fillRect(i * bw + 3, h - hh, bw - 6, hh); });
      series.forEach(function (s, k) { if (R() < .02) { s.push(Math.max(.12, Math.min(.88, s[s.length - 1] + (R() - .5) * .14))); s.shift(); } x.strokeStyle = col(k === 2 ? S2 : A, k === 2 ? .3 : .14); x.lineWidth = k === 2 ? 1.8 : 1.2; x.beginPath(); s.forEach(function (v, i) { var X = i / (s.length - 1) * w, Y = (.1 + (1 - v) * .55 + k * .04) * h; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke(); });
    };
  };
  FX.marketing = function (cv, x, o) {
    var A = css(o.chat, "--a", [255, 70, 50]), rings = [], last = 0;
    return function (t, w, h, px, py, ev) {
      x.clearRect(0, 0, w, h); if (t - last > 1500 || (ev && ev.tap)) { rings.push({ t: t, x: ev && ev.tap ? ev.x : w * .8, y: ev && ev.tap ? ev.y : h * .22 }); last = t; if (ev) ev.tap = 0; }
      rings = rings.filter(function (r) { return t - r.t < 5200; }); rings.forEach(function (r) { var k = (t - r.t) / 5200; for (var j = 0; j < 3; j++) { var kk = k - j * .06; if (kk < 0) continue; x.strokeStyle = col(A, (1 - kk) * .32); x.lineWidth = 2.5 - j * .6; x.beginPath(); x.arc(r.x, r.y, kk * Math.max(w, h) * .9, 0, TAU); x.stroke(); } });
      x.fillStyle = col(A, .05); for (var s = -h; s < w; s += 60) { var o2 = (t * .03) % 60; x.beginPath(); x.moveTo(s + o2, h); x.lineTo(s + o2 + 18, h); x.lineTo(s + o2 + 18 + h, 0); x.lineTo(s + o2 + h, 0); x.fill(); }
    };
  };
  FX.nevera = function (cv, x, o) {
    var A = css(o.chat, "--a", [255, 150, 40]), paths = [], pulses = [], i;
    function build(w, h) { paths = []; var n = 14; for (i = 0; i < n; i++) { var px = R() * w, py = R() * h, pts = [[px, py]]; for (var k = 0; k < 5; k++) { if (k % 2) py += (R() - .5) * 260; else px += (R() - .2) * 280; pts.push([px, py]); } paths.push(pts); } pulses = paths.map(function (p, j) { return { p: j, s: R() * (p.length - 1), v: .004 + R() * .006 }; }); }
    var bw = 0, bh = 0;
    return function (t, w, h) {
      if (w !== bw || h !== bh) { bw = w; bh = h; build(w, h); }
      x.clearRect(0, 0, w, h); x.lineWidth = 1; paths.forEach(function (p) { x.strokeStyle = col(A, .1); x.beginPath(); p.forEach(function (q, i) { i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.stroke(); p.forEach(function (q, i) { x.fillStyle = col(A, .22); x.fillRect(q[0] - 2, q[1] - 2, 4, 4); }); });
      pulses.forEach(function (u) { var p = paths[u.p]; u.s += u.v * 16 / 4; if (u.s >= p.length - 1) u.s = 0; var i = Math.floor(u.s), f = u.s - i, a = p[i], b = p[i + 1], X = a[0] + (b[0] - a[0]) * f, Y = a[1] + (b[1] - a[1]) * f; var g = x.createRadialGradient(X, Y, 0, X, Y, 14); g.addColorStop(0, col(A, .9)); g.addColorStop(1, col(A, 0)); x.fillStyle = g; x.beginPath(); x.arc(X, Y, 14, 0, TAU); x.fill(); });
    };
  };
  FX.tempesta = function (cv, x, o) {
    var A = css(o.chat, "--a", [160, 140, 255]), S2 = css(o.chat, "--s", [120, 180, 255]);
    return function (t, w, h, px, py) {
      x.clearRect(0, 0, w, h);
      for (var k = 0; k < 4; k++) { x.beginPath(); for (var i = 0; i <= 40; i++) { var u = i / 40, X = u * w, Y = h * (.25 + k * .17) + Math.sin(u * 4 + t * .00035 * (1 + k * .3) + k) * 40 + Math.sin(u * 9 - t * .0004) * 14 + py * 20; i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fillStyle = col(k % 2 ? S2 : A, .035 + k * .005); x.fill(); }
    };
  };
  function fxStop() { if (cur) { cancelAnimationFrame(cur.raf); cur.cv.remove(); window.removeEventListener("pointermove", cur.mv); cur = null; } }
  function fxStart(chat, k) {
    fxStop(); var host = chat.querySelector(".dn-bg"); if (!host || !FX[k] || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    var cv = document.createElement("canvas"); cv.className = "rk-fx"; host.appendChild(cv); var x = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 1.5), w = 0, h = 0, px = 0, py = 0, ev = { tap: 0, x: 0, y: 0 };
    function rs() { w = chat.clientWidth; h = chat.clientHeight; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    rs(); var draw = FX[k](cv, x, { chat: chat }), mv = function (e) { px += ((e.clientX / w - .5) * 2 - px) * .2; py += ((e.clientY / h - .5) * 2 - py) * .2; if (e.type === "pointerdown") { ev.tap = 1; ev.x = e.clientX; ev.y = e.clientY; } };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerdown", mv);
    cur = { cv: cv, mv: mv, raf: 0 }; var last = 0;
    (function loop(t) { cur && (cur.raf = requestAnimationFrame(loop)); if (!chat.classList.contains("open")) return; if (t - last < 30) return; last = t; if (chat.clientWidth !== w || chat.clientHeight !== h) rs(); draw(t, w, h, px, py, ev); })(0);
  }

  window.RKSkins = { key: key, welcome: welcome, emblem: emblem, fx: fxStart, stop: fxStop };
})();

/* logo interativo: passe o dedo/mouse e o nome deixa um rastro, como nas referências */
(function(){var t;function z(e){var m=e.target.closest&&e.target.closest(".dnaMark");if(!m||m.classList.contains("rkTrail"))return;m.classList.add("rkTrail");clearTimeout(t);t=setTimeout(function(){m.classList.remove("rkTrail")},1100)}
document.addEventListener("pointerover",z,{passive:true});document.addEventListener("pointerdown",z,{passive:true})})();
