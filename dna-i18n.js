/* DNA — idiomas (pt-BR, en, es).
   O português é a fonte: o HTML e o JS escrevem o texto em português e este módulo troca pelo idioma escolhido.
   - apply(root): traduz nós de texto e atributos (aria-label, placeholder, title, alt) pelo texto exato em português
   - t(pt, vars): traduz uma frase isolada ({n} etc. são substituídos)
   Sem tradução disponível, o texto em português é mantido. */
(function (global) {
  "use strict";
  var KEY = "rimak.language";
  var LANGS = [["pt-BR", "PT", "Português"], ["en", "EN", "English"], ["es", "ES", "Español"]];
  var DICT = { en: {}, es: {} };
  var cur = "pt-BR", cbs = [], misses = {};
  var cache = typeof WeakMap === "function" ? new WeakMap() : null;
  var ATTRS = ["aria-label", "placeholder", "title", "alt"];
  var SKIP = "script,style,textarea,pre,code,svg,[data-notr],.dn-body,.dn-bubble,#askPh,.tx2,.dq,.sr-skip";

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function put(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function norm(c) {
    c = String(c || "").toLowerCase();
    if (c.indexOf("en") === 0) return "en";
    if (c.indexOf("es") === 0) return "es";
    return "pt-BR";
  }
  cur = get() ? norm(get()) : norm((global.navigator && (navigator.language || (navigator.languages || [])[0])) || "pt-BR");

  function add(rows) { // rows: [pt, en, es]
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1]) DICT.en[r[0]] = r[1];
      if (r[2]) DICT.es[r[0]] = r[2];
    }
  }
  function lookup(key) {
    if (cur === "pt-BR") return null;
    var v = DICT[cur][key];
    if (v == null && /\p{L}{3,}/u.test(key)) misses[key] = 1;
    return v == null ? null : v;
  }
  function t(pt, vars) {
    var out = pt;
    if (cur !== "pt-BR") { var v = lookup(String(pt).trim()); if (v != null) out = v; }
    if (vars) out = String(out).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? m : vars[k]; });
    return out;
  }

  function node(n) {
    var rec = cache.get(n), now = n.nodeValue;
    if (rec && now !== rec.tr && now !== rec.pt) rec = null; // alterado por outro código
    if (!rec) { rec = { pt: now, tr: now }; cache.set(n, rec); }
    var key = rec.pt.trim(), out = rec.pt;
    if (key && cur !== "pt-BR") { var v = lookup(key); if (v != null) out = rec.pt.replace(key, function () { return v; }); }
    rec.tr = out;
    if (n.nodeValue !== out) n.nodeValue = out;
  }
  function inSkip(el) { return el && el.closest && el.closest(SKIP); }

  function apply(root) {
    root = root || document.body;
    if (!root || !cache) return;
    if (root.nodeType === 3) { if (root.nodeValue.trim() && !inSkip(root.parentNode)) node(root); return; }
    if (root.nodeType === 1 && root.closest && root.closest(SKIP)) return;
    // títulos divididos em palavras
    var hs = root.querySelectorAll ? root.querySelectorAll("h2[data-pt]") : [];
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i], pt = h.dataset.pt, tr = cur === "pt-BR" ? null : lookup(pt.trim());
      if (global.DNASplit) global.DNASplit(h, tr || pt);
    }
    if (root.nodeType === 1 && root.matches && root.matches("h2[data-pt]")) { var v0 = cur === "pt-BR" ? null : lookup(root.dataset.pt.trim()); if (global.DNASplit) global.DNASplit(root, v0 || root.dataset.pt); }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (p && p.closest && (p.closest(SKIP) || p.closest("h2[data-pt]"))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var list = [], x;
    while ((x = w.nextNode())) list.push(x);
    for (i = 0; i < list.length; i++) node(list[i]);
    var SEL = "[aria-label],[placeholder],[title],[alt]";
    var all = [].slice.call(root.querySelectorAll ? root.querySelectorAll(SEL) : []);
    if (root.nodeType === 1 && root.matches && root.matches(SEL)) all.unshift(root);
    for (i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.closest && el.closest("[data-notr]")) continue;
      for (var k = 0; k < ATTRS.length; k++) {
        var a = ATTRS[k]; if (!el.hasAttribute(a)) continue;
        var store = "data-pt-" + a, cv = el.getAttribute(a), saved = el.getAttribute(store), trk = el.getAttribute("data-tr-" + a);
        if (saved == null || (cv !== trk && cv !== saved)) { saved = cv; el.setAttribute(store, saved); }
        var out = saved;
        if (cur !== "pt-BR") { var v = lookup(saved.trim()); if (v != null) out = v; }
        el.setAttribute("data-tr-" + a, out);
        if (cv !== out) el.setAttribute(a, out);
      }
    }
  }

  function meta() {
    try {
      document.documentElement.lang = cur;
      var d = document.querySelector('meta[name="description"]');
      if (d) { if (!d.dataset.pt) d.dataset.pt = d.getAttribute("content") || ""; d.setAttribute("content", t(d.dataset.pt)); }
      if (!document.documentElement.dataset.ptTitle) document.documentElement.dataset.ptTitle = document.title;
      document.title = t(document.documentElement.dataset.ptTitle);
    } catch (e) {}
  }

  function set(code) {
    code = norm(code);
    put(code);
    if (code === cur) { cbs.forEach(function (f) { try { f(cur); } catch (e) {} }); return; }
    cur = code;
    meta();
    apply(document.body);
    cbs.forEach(function (f) { try { f(cur); } catch (e) {} });
  }

  global.DNAi18n = {
    LANGS: LANGS, add: add, t: t, apply: apply, set: set,
    lang: function () { return cur; },
    onChange: function (f) { cbs.push(f); },
    misses: function () { return Object.keys(misses); },
    ready: function () { meta(); apply(document.body); }
  };
  meta();
})(window);
