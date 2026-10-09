/* DNA — emblemas dos agentes (v3).
   Cada agente tem um emblema próprio: moldura (forma única) com acabamento metálico + símbolo central animado.
   Cores vêm das variáveis CSS do contexto (--a, --s, --bg, --t), então servem no chat, no cabeçalho e nos painéis. */
(function (global) {
  "use strict";
  var uid = 0;

  function defs(p) {
    return '<defs>' +
      '<linearGradient id="' + p + 'm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:rgb(var(--s))"/><stop offset=".5" style="stop-color:rgb(var(--a))"/><stop offset="1" style="stop-color:rgb(var(--a));stop-opacity:.55"/></linearGradient>' +
      '<linearGradient id="' + p + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:rgb(var(--s))"/><stop offset="1" style="stop-color:rgb(var(--a))"/></linearGradient>' +
      '<radialGradient id="' + p + 'f" cx=".5" cy=".38" r=".75"><stop offset="0" style="stop-color:rgb(var(--a));stop-opacity:.26"/><stop offset=".6" style="stop-color:rgb(var(--bg));stop-opacity:.94"/><stop offset="1" style="stop-color:rgb(var(--bg))"/></radialGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:#fff;stop-opacity:.5"/><stop offset="1" style="stop-color:#fff;stop-opacity:0"/></linearGradient>' +
      '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:rgb(var(--s));stop-opacity:0"/><stop offset="1" style="stop-color:rgb(var(--s));stop-opacity:.9"/></linearGradient>' +
      '</defs>';
  }

  /* moldura: forma (path/polígono em string de atributo d) + brilho + filete interno */
  function badge(p, shape, inner) {
    return '<clipPath id="' + p + 'c"><path d="' + shape + '"/></clipPath>' +
      '<path d="' + shape + '" fill="url(#' + p + 'f)"/>' +
      '<g clip-path="url(#' + p + 'c)"><ellipse cx="50" cy="-8" rx="58" ry="40" fill="url(#' + p + 'h)" opacity=".22"/>' + (inner || "") + '</g>' +
      '<path class="m-draw" d="' + shape + '" fill="none" stroke="url(#' + p + 'm)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="' + shape + '" fill="none" stroke="rgb(var(--s))" stroke-opacity=".22" stroke-width="1" stroke-linejoin="round" transform="translate(50 50) scale(.9) translate(-50 -50)"/>';
  }
  function poly(pts) { return "M" + pts.join("L") + "Z"; }
  function regular(n, r, rot, cx, cy) {
    var o = [], i, a; cx = cx || 50; cy = cy || 50;
    for (i = 0; i < n; i++) { a = rot + i * 2 * Math.PI / n; o.push((cx + r * Math.cos(a)).toFixed(2) + " " + (cy + r * Math.sin(a)).toFixed(2)); }
    return o;
  }
  function rosette(n, r0, amp) { // contorno ondulado (selo)
    var o = [], N = 120, i, a, r;
    for (i = 0; i < N; i++) { a = i * 2 * Math.PI / N; r = r0 + amp * Math.cos(n * a); o.push((50 + r * Math.cos(a)).toFixed(2) + " " + (50 + r * Math.sin(a)).toFixed(2)); }
    return poly(o);
  }
  function gear(teeth, ro, ri) { // engrenagem
    var o = [], i, a0, k = 2 * Math.PI / teeth, pts = [];
    for (i = 0; i < teeth; i++) {
      a0 = i * k;
      [[-.30, ri], [-.17, ro], [.17, ro], [.30, ri]].forEach(function (q) { var a = a0 + q[0] * k * 1.6; pts.push((50 + q[1] * Math.cos(a)).toFixed(2) + " " + (50 + q[1] * Math.sin(a)).toFixed(2)); });
    }
    return poly(pts);
  }

  var SHAPE = {
    research: "M50 4A46 46 0 1 1 49.99 4Z",
    code: poly(regular(6, 47, -Math.PI / 2)),
    writer: "M30 6H70C86 6 94 14 94 30V70C94 86 86 94 70 94H30C14 94 6 86 6 70V30C6 14 14 6 30 6Z",
    designer: "M50 4C56 4 60 7 64 11L89 36C93 40 96 44 96 50C96 56 93 60 89 64L64 89C60 93 56 96 50 96C44 96 40 93 36 89L11 64C7 60 4 56 4 50C4 44 7 40 11 36L36 11C40 7 44 4 50 4Z",
    analyst: poly(regular(8, 47, Math.PI / 8)),
    marketing: rosette(14, 43, 3.4),
    nevera: gear(12, 47, 41)
  };

  var ART = {
    /* RESEARCH — globo com varredura de radar e satélite em órbita */
    research: function (p) {
      var inner =
        '<g fill="none" stroke="rgb(var(--s))" stroke-opacity=".5" stroke-width="1.2"><circle cx="50" cy="50" r="27"/><ellipse cx="50" cy="50" rx="11" ry="27"/><ellipse cx="50" cy="50" rx="21" ry="27" stroke-opacity=".35"/><path d="M23 50H77M27.5 36H72.5M27.5 64H72.5" stroke-opacity=".38"/></g>' +
        '<g class="m-sweep"><path d="M50 50L50 23A27 27 0 0 1 73.4 36.5Z" fill="url(#' + p + 'g)" opacity=".5"/><path d="M50 50V23" stroke="rgb(var(--s))" stroke-width="1.6" stroke-linecap="round"/></g>' +
        '<circle class="m-blip" cx="62" cy="40" r="2.3" fill="rgb(var(--s))"/><circle class="m-blip m-b2" cx="40" cy="60" r="2" fill="rgb(var(--s))"/>' +
        '<g class="m-orbit"><ellipse cx="50" cy="50" rx="39" ry="39" fill="none" stroke="rgb(var(--s))" stroke-opacity=".28" stroke-width="1" stroke-dasharray="1 4"/><circle cx="50" cy="11" r="3.4" fill="url(#' + p + 'g)" stroke="rgb(var(--bg))" stroke-width="1.2"/></g>';
      return badge(p, SHAPE.research, inner) +
        '<circle cx="50" cy="50" r="3" fill="rgb(var(--s))"/>';
    },
    /* CODE — hexágono com </> e varredura de terminal */
    code: function (p) {
      var inner =
        '<g opacity=".5" stroke="rgb(var(--a))" stroke-width=".8" stroke-opacity=".45"><path d="M14 30H30M14 70H26M70 30H86M74 70H86M30 14V24M70 76V86"/></g>' +
        '<g fill="rgb(var(--s))" opacity=".7"><circle cx="30" cy="30" r="1.8"/><circle cx="70" cy="70" r="1.8"/><circle cx="26" cy="70" r="1.8"/><circle cx="74" cy="30" r="1.8"/></g>' +
        '<rect class="m-scan" x="8" y="0" width="14" height="100" fill="url(#' + p + 'w)" opacity=".5"/>';
      return badge(p, SHAPE.code, inner) +
        '<path d="M40 36L25 50L40 64M60 36L75 50L60 64" fill="none" stroke="url(#' + p + 'g)" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path class="m-pulse" d="M55.5 32L44.5 68" stroke="rgb(var(--s))" stroke-width="4.4" stroke-linecap="round"/>' +
        '<rect class="m-caret" x="39" y="76" width="22" height="3.6" rx="1.8" fill="rgb(var(--a))"/>';
    },
    /* WRITER — pena com tinta escrevendo */
    writer: function (p) {
      var inner =
        '<g stroke="rgb(var(--s))" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"><path d="M20 28H50M20 40H44M20 52H48"/></g>' +
        '<path class="m-ink" d="M18 80C30 70 38 90 52 80S72 72 84 80" fill="none" stroke="url(#' + p + 'g)" stroke-width="3" stroke-linecap="round"/>';
      return badge(p, SHAPE.writer, inner) +
        '<g class="m-nib"><path d="M73 17C58 21 44 34 36 56L33 68L43 62C60 58 71 42 73 17Z" fill="url(#' + p + 'g)" stroke="rgb(var(--bg))" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M73 17L36 63" stroke="rgb(var(--bg))" stroke-opacity=".8" stroke-width="1.8" stroke-linecap="round"/>' +
        '<g stroke="rgb(var(--bg))" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"><path d="M64 28L55 31M58 36L48 40M52 44L43 49M46 52L39 56"/></g>' +
        '<path d="M33 68L30 74" stroke="rgb(var(--s))" stroke-width="3" stroke-linecap="round"/></g>' +
        '<circle class="m-drop" cx="30" cy="77" r="2.2" fill="rgb(var(--a))"/>';
    },
    /* DESIGNER — ferramenta caneta (curva de Bézier com âncoras) sobre formas coloridas */
    designer: function (p) {
      var inner =
        '<g style="mix-blend-mode:screen"><circle class="m-c" cx="38" cy="40" r="19" fill="url(#' + p + 'g)" opacity=".7"/><circle class="m-s" cx="62" cy="40" r="19" fill="rgb(var(--s))" opacity=".5"/><circle class="m-t" cx="50" cy="60" r="19" fill="#8b5cf6" opacity=".6"/></g>';
      return badge(p, SHAPE.designer, inner) +
        '<path class="m-ink" d="M28 68C30 34 70 66 72 32" fill="none" stroke="rgb(var(--t))" stroke-width="2.6" stroke-linecap="round" style="stroke-dasharray:140"/>' +
        '<g stroke="rgb(var(--t))" stroke-opacity=".7" stroke-width="1.2"><path d="M28 68L30 44M72 32L70 56"/></g>' +
        '<g fill="rgb(var(--t))"><circle cx="30" cy="44" r="2.4"/><circle cx="70" cy="56" r="2.4"/></g>' +
        '<g fill="rgb(var(--bg))" stroke="rgb(var(--t))" stroke-width="2"><rect x="23" y="63" width="10" height="10" rx="2"/><rect x="67" y="27" width="10" height="10" rx="2"/></g>' +
        '<circle class="m-dot" cx="50" cy="50" r="3.6" fill="rgb(var(--s))"/>';
    },
    /* ANALYST — barras, linha de tendência e ponto de destaque */
    analyst: function (p) {
      var inner =
        '<g stroke="rgb(var(--s))" stroke-opacity=".16" stroke-width="1"><path d="M18 30H82M18 46H82M18 62H82"/></g>';
      return badge(p, SHAPE.analyst, inner) +
        '<path d="M22 76H78" stroke="rgb(var(--s))" stroke-opacity=".65" stroke-width="1.8" stroke-linecap="round"/>' +
        '<g fill="url(#' + p + 'g)"><rect class="m-bar" style="--i:0" x="26" y="56" width="10" height="20" rx="2.6"/><rect class="m-bar" style="--i:1" x="40" y="46" width="10" height="30" rx="2.6"/><rect class="m-bar" style="--i:2" x="54" y="52" width="10" height="24" rx="2.6"/><rect class="m-bar" style="--i:3" x="68" y="34" width="10" height="42" rx="2.6"/></g>' +
        '<path class="m-trend" d="M24 46L40 36L54 42L76 22" fill="none" stroke="rgb(var(--t))" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle class="m-dot" cx="76" cy="22" r="4.2" fill="rgb(var(--t))"/>';
    },
    /* MARKETING — alvo e flecha, com ondas de alcance */
    marketing: function (p) {
      var inner =
        '<circle class="m-p" cx="50" cy="50" r="30" fill="none" stroke="rgb(var(--a))" stroke-width="1.6"/><circle class="m-p m-p2" cx="50" cy="50" r="30" fill="none" stroke="rgb(var(--a))" stroke-width="1.6"/>';
      return badge(p, SHAPE.marketing, inner) +
        '<circle cx="50" cy="52" r="26" fill="rgba(var(--a),.1)" stroke="url(#' + p + 'g)" stroke-width="2.6"/>' +
        '<circle cx="50" cy="52" r="16.5" fill="none" stroke="rgb(var(--s))" stroke-opacity=".8" stroke-width="2.2"/>' +
        '<circle cx="50" cy="52" r="7.5" fill="url(#' + p + 'g)" stroke="rgb(var(--bg))" stroke-width="1.2"/>' +
        '<g class="m-arrow"><path d="M80 18L53 49" stroke="rgb(var(--t))" stroke-width="3.6" stroke-linecap="round"/><path d="M80 18L68 20M80 18L78 30M75 23L64 25M75 23L77 34" stroke="rgb(var(--t))" stroke-width="2.4" stroke-linecap="round"/></g>' +
        '<g class="m-spark" stroke="rgb(var(--s))" stroke-width="1.8" stroke-linecap="round"><path d="M50 40V36M50 68V72M38 52H34M62 52H66"/></g>';
    },
    /* NEVERA — engrenagem (execução) girando ao redor de um cristal (planejamento) */
    nevera: function (p) {
      var arm = "M50 28V72M50 35L44 29M50 35L56 29M50 65L44 71M50 65L56 71M50 45L46 41M50 45L54 41M50 55L46 59M50 55L54 59";
      var inner = '<circle cx="50" cy="50" r="31" fill="none" stroke="rgb(var(--s))" stroke-opacity=".3" stroke-width="1" stroke-dasharray="1.5 4"/>';
      return '<g class="m-gear">' + badge(p, SHAPE.nevera, "") + '</g>' +
        '<circle cx="50" cy="50" r="35" fill="url(#' + p + 'f)"/>' +
        '<circle cx="50" cy="50" r="35" fill="none" stroke="rgb(var(--s))" stroke-opacity=".35" stroke-width="1.2"/>' + inner +
        '<g class="m-flake" fill="none" stroke="url(#' + p + 'g)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="' + arm + '"/><path transform="rotate(60 50 50)" d="' + arm + '"/><path transform="rotate(120 50 50)" d="' + arm + '"/></g>' +
        '<polygon points="50,44 55.2,47 55.2,53 50,56 44.8,53 44.8,47" fill="rgb(var(--bg))" stroke="rgb(var(--s))" stroke-width="1.4"/>' +
        '<g fill="rgb(var(--s))"><path class="m-tw" d="M50 7l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" transform="translate(0 0)"/></g>';
    }
  };

  function agent(id, cls) {
    var f = ART[id];
    if (!f) return "";
    var p = "mk" + (++uid) + "-";
    return '<svg class="am am-' + id + (cls ? " " + cls : "") + '" viewBox="0 0 100 100" role="img" aria-label="' + id + '">' + defs(p) + f(p) + '</svg>';
  }

  global.DNAMarks = { agent: agent, ids: Object.keys(ART) };
})(window);
