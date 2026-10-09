/* DNA Storm — nuvem de tempestade procedural (canvas 2D) com raios.
   Sem dependências. Uso:
     var s = DNAStorm.mount(canvas, { size: "lg" | "sm", interactive: true, onFlash: function(intensity){} });
     s.start();  s.stop();  s.flash();  s.destroy();
   A nuvem é feita de dezenas de "puffs" com gradiente radial, que respiram devagar.
   Os raios são gerados por deslocamento de ponto médio, com ramificações e cintilação,
   e iluminam a nuvem por dentro. */
(function (global) {
  "use strict";

  var TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, exp = Math.exp, min = Math.min, max = Math.max;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }
  function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + clamp(a, 0, 1).toFixed(3) + ")"; }
  function seeded(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Paleta (azul-acinzentado com um toque de violeta, como a marca)
  var HI = [190, 201, 230], MID = [108, 117, 158], LO = [50, 56, 88], DEEP = [20, 23, 40], FLASH = [208, 222, 255];

  // Silhueta de cumulonimbus: base larga e achatada, corpo irregular e torres que sobem.
  // x, y, raio (em unidades da largura do canvas)
  var SHAPE = [
    // base achatada e pesada
    [.11, .53, .09], [.22, .55, .11], [.34, .57, .12], [.46, .58, .13], [.58, .58, .13], [.70, .56, .12], [.81, .54, .11], [.90, .52, .08],
    // corpo
    [.17, .46, .10], [.29, .44, .12], [.42, .43, .13], [.55, .43, .13], [.68, .44, .12], [.80, .46, .10],
    // torres
    [.29, .33, .10], [.34, .24, .08],
    [.50, .32, .13], [.51, .22, .11], [.52, .13, .08],
    [.67, .34, .10], [.70, .26, .07],
    // bigorna (espalhando no alto)
    [.40, .16, .06], [.61, .17, .06]
  ];

  function buildPuffs(big) {
    var rng = seeded(23), out = [];
    SHAPE.forEach(function (p) {
      var subs = big ? 4 : 1;
      for (var i = 0; i < subs; i++) {
        var dx = i ? (rng() - .5) * p[2] * 1.25 : 0, dy = i ? (rng() - .5) * p[2] * .9 : 0;
        var rr = p[2] * (i ? .42 + rng() * .3 : 1);
        var y = p[1] + dy;
        out.push({
          x: p[0] + dx, y: y, r: rr,
          ph: rng() * TAU, sp: .5 + rng() * .7, wob: .6 + rng() * .8,
          tone: clamp(1 - (y - .13) / .47 + (rng() - .5) * .16, 0, 1)
        });
      }
    });
    out.sort(function (a, b) { return b.y - a.y; }); // de baixo para cima
    return out;
  }

  // Raio por deslocamento de ponto médio
  function jag(a, b, rough, depth) {
    var pts = [a, b];
    for (var d = 0; d < depth; d++) {
      var np = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) {
        var p = pts[i], q = pts[i + 1];
        var dx = q[0] - p[0], dy = q[1] - p[1], len = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        var off = (Math.random() - .5) * len * rough;
        np.push([(p[0] + q[0]) / 2 + (-dy / len) * off, (p[1] + q[1]) / 2 + (dx / len) * off], q);
      }
      pts = np;
    }
    return pts;
  }
  function genBolt(big, tx, ty) {
    var sx, sy = .5, ex, ey;
    if (tx != null) { sx = clamp(tx + rnd(-.12, .12), .3, .7); ex = clamp(tx, .04, .96); ey = clamp(ty, .62, .975); }
    else { sx = rnd(.38, .62); ex = sx + rnd(-.17, .17); ey = rnd(.90, .975); }
    var pts = jag([sx, sy], [ex, ey], .78, 5);
    var branches = [], nb = big ? (Math.random() < .7 ? 2 : 1) : 1;
    for (var i = 0; i < nb; i++) {
      var k = Math.floor(rnd(pts.length * .25, pts.length * .7)), o = pts[k], dir = Math.random() < .5 ? -1 : 1;
      var bx = clamp(o[0] + dir * rnd(.07, .16), .05, .95), by = min(.97, o[1] + rnd(.1, .2));
      branches.push(jag(o, [bx, by], .6, 4));
    }
    return { pts: pts, branches: branches, sx: sx, sy: sy };
  }

  function envelope(e, now) {
    var t = now - e.t0;
    if (t < 0 || t > e.dur) return 0;
    if (e.kind === "bolt") {
      if (t < 45) return t / 45;
      if (t < 95) return lerp(1, .3, (t - 45) / 50);
      if (t < 150) return lerp(.3, 1, (t - 95) / 55);
      return max(0, 1 - (t - 150) / (e.dur - 150));
    }
    var u = t / e.dur; // relâmpago difuso: a nuvem acende por dentro
    return sin(Math.PI * u) * (.65 + .35 * sin(u * 16));
  }

  function motionOff() {
    try {
      return (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
        document.documentElement.getAttribute("data-motion") === "off";
    } catch (e) { return false; }
  }

  // Queda suave tipo gaussiana: evita bordas de disco visíveis nos puffs
  var FALL = [[0, 1], [.26, .88], [.48, .58], [.68, .30], [.84, .11], [1, 0]];
  function softStops(g, cHi, cMid, cEdge, a) {
    for (var i = 0; i < FALL.length; i++) {
      var pos = FALL[i][0], f = FALL[i][1];
      var col = pos < .5 ? mix(cHi, cMid, pos / .5) : mix(cMid, cEdge, (pos - .5) / .5);
      g.addColorStop(pos, rgba(col, f * a));
    }
  }

  function mount(canvas, opts) {
    opts = opts || {};
    var big = opts.size !== "sm";
    var ctx = canvas.getContext("2d");
    var puffs = buildPuffs(big);
    var rain = [], wisps = [];
    (function () { var rr = seeded(7), n = big ? 54 : 12, k; for (k = 0; k < n; k++) rain.push({ x: rr(), y: rr(), l: .035 + rr() * .05, v: .55 + rr() * .5, a: .1 + rr() * .2 });
      for (k = 0; k < (big ? 9 : 4); k++) wisps.push({ x: rr(), y: .56 + rr() * .1, r: .05 + rr() * .05, v: .012 + rr() * .02, a: .16 + rr() * .18, ph: rr() * TAU }); })();
    var S = 0, W = 0, H = 0, dpr = 1;
    var events = [], nextAt = 0, raf = 0, running = false, t0 = 0, lastMotionCheck = 0, still = false;
    var shudder = 0, lastBolt = -1e9, thunders = [], ro = null, rate = 1, tgtX = 0, tgtY = 0, lookX = 0, lookY = 0, havePtr = false, hold = 0, holdT = 0, ptrActive = false;

    function resize() {
      var r = canvas.getBoundingClientRect();
      var cw = r.width || canvas.clientWidth, ch = r.height || canvas.clientHeight;
      if (!cw || !ch) return false;
      dpr = min(global.devicePixelRatio || 1, 2);
      var w = Math.round(cw * dpr), h = Math.round(ch * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      W = w; H = h; S = w;
      return true;
    }


    // movimento da massa: cada puff gira/ferve em torno do seu ponto, o vento cisalha o topo e tudo à deriva
    function motion(p, t) {
      var drift = sin(t * .21) * .024 + sin(t * .09 + 1.3) * .014;
      var shear = (.6 - p.y) * (sin(t * .17 + 1) * .07 + .02);
      var boil = max(0, sin(t * (.35 + p.sp * .25) + p.ph)) * .02 * (.25 + p.tone);
      var sh = shudder * (.004 + .003 * p.tone);
      var o = {
        x: p.x + drift + shear + sin(t * p.sp + p.ph) * .021 * p.wob + sin(t * 43 + p.ph * 9) * sh,
        y: p.y + cos(t * p.sp * .8 + p.ph * 1.7) * .014 * p.wob - boil + cos(t * 37 + p.ph * 5) * sh,
        r: p.r * (1 + sin(t * p.sp * 1.4 + p.ph) * .075 * p.wob + boil * 2.2 + shudder * .035)
      };
      o.x = .5 + (o.x - .5) * .86; o.y = .52 + (o.y - .52) * .9; o.r *= .86;
      return o;
    }

    function drawCloud(t, fl) {
      var i, p, g, c, bx, by, br, cx, cy, r, boost, m;
      ctx.globalCompositeOperation = "source-over";

      // névoa leve sob a base
      g = ctx.createRadialGradient(.5 * S, .62 * S, 0, .5 * S, .62 * S, .42 * S);
      g.addColorStop(0, rgba(MID, .13)); g.addColorStop(1, rgba(MID, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // 1ª passada: massa escura (dá corpo e a base pesada)
      for (i = 0; i < puffs.length; i++) {
        p = puffs[i];
        m = motion(p, t); bx = m.x; by = m.y; br = m.r;
        cx = (bx + lookX * .012 * (.3 + p.tone)) * S; cy = (by + br * .12 + lookY * .008 * (.3 + p.tone)) * S; r = br * S * 1.12;
        g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        softStops(g, DEEP, DEEP, DEEP, .8);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      }

      // 2ª passada: volumes iluminados
      for (i = 0; i < puffs.length; i++) {
        p = puffs[i];
        m = motion(p, t); bx = m.x; by = m.y; br = m.r;
        cx = (bx + lookX * .012 * (.3 + p.tone)) * S; cy = (by + lookY * .008 * (.3 + p.tone)) * S; r = br * S * 1.08;
        boost = 0;
        if (fl) { var dx = bx - fl.x, dy = by - fl.y; boost = fl.i * exp(-(dx * dx + dy * dy) / .085); }
        var sm = clamp(p.r / .075, .35, 1), cHi = mix(mix(LO, HI, p.tone * p.tone * .62 * sm), FLASH, boost * .85);
        var cMid = mix(mix(DEEP, MID, p.tone * .8 + .08), FLASH, boost * .7);
        var cEdge = mix(mix(DEEP, LO, p.tone * .8), FLASH, boost * .5);
        // luz vindo do alto à esquerda; base mais escura que o topo
        g = ctx.createRadialGradient(cx - r * (.16 - lookX * .22), cy - r * (.22 - lookY * .18), 0, cx, cy, r);
        softStops(g, cHi, cMid, cEdge, ((.34 + .5 * p.tone) * (.8 + .2 * p.tone)) * (.55 + .45 * sm) + boost * .15);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      }

      // fiapos de nuvem baixa passando sob a base
      for (i = 0; i < wisps.length; i++) {
        var w = wisps[i], wx = ((w.x + t * w.v) % 1.3) - .15, wy = w.y + sin(t * .6 + w.ph) * .012, wr = w.r * S;
        g = ctx.createRadialGradient(wx * S, wy * S, 0, wx * S, wy * S, wr);
        softStops(g, mix(LO, HI, .35), MID, DEEP, w.a);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(wx * S, wy * S, wr, 0, TAU); ctx.fill();
      }
      // chuva caindo da base, inclinada pelo vento
      ctx.lineCap = "round"; ctx.lineWidth = max(.8, S * .0016);
      for (i = 0; i < rain.length; i++) {
        var d = rain[i], ry = ((d.y + t * d.v * .55) % 1), yy = .62 + ry * .36, xx = (d.x + (yy - .62) * -.16 + sin(t * .3) * .02) ;
        var al = d.a * (ry < .15 ? ry / .15 : ry > .8 ? (1 - ry) / .2 : 1) * (1 + (fl ? fl.i * 1.5 : 0));
        ctx.strokeStyle = rgba(HI, al);
        ctx.beginPath(); ctx.moveTo(xx * S, yy * S); ctx.lineTo((xx - d.l * .16) * S, (yy + d.l) * S); ctx.stroke();
      }

      // luz interna do relâmpago
      if (fl && fl.i > .01) {
        ctx.globalCompositeOperation = "lighter";
        var R = (big ? .42 : .5) * S;
        g = ctx.createRadialGradient(fl.x * S, fl.y * S, 0, fl.x * S, fl.y * S, R);
        g.addColorStop(0, rgba(FLASH, .5 * fl.i)); g.addColorStop(.5, rgba([150, 165, 255], .16 * fl.i)); g.addColorStop(1, rgba(FLASH, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }
    }

    function strokePath(pts, lw, color) {
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(pts[0][0] * S, pts[0][1] * S);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * S, pts[i][1] * S);
      ctx.stroke();
    }
    function drawBolt(b, I) {
      if (!b || I <= .01) return;
      ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      var core = max(S * .0042, 1 * dpr);
      function one(pts, k) {
        // brilho suave (shadowBlur) + núcleo fino e quente
        ctx.shadowColor = "rgba(140,165,255," + (.95 * I) + ")";
        ctx.shadowBlur = core * 11 * k;
        strokePath(pts, core * 2.2 * k, "rgba(170,190,255," + (.55 * I) + ")");
        ctx.shadowBlur = core * 4 * k;
        strokePath(pts, core * 1.2 * k, "rgba(235,241,255," + (.9 * I) + ")");
        ctx.shadowBlur = 0;
        strokePath(pts, core * .6 * k, "rgba(255,255,255," + I + ")");
      }
      one(b.pts, 1);
      for (var i = 0; i < b.branches.length; i++) one(b.branches[i], .6);
      ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
      ctx.globalCompositeOperation = "source-over";
    }

    function schedule(now) {
      nextAt = now + rnd(big ? 1500 : 2000, big ? 4200 : 5200) / rate;
    }
    function fire(now, force, tx, ty) {
      var roll = Math.random();
      if (force || roll < .68) {
        var b = genBolt(big, tx, ty);
        events.push({ kind: "bolt", t0: now, dur: 430, bolt: b, fx: b.sx, fy: b.sy - .06 });
        lastBolt = now; thunders.push({ t0: now + rnd(380, 900), k: rnd(.5, 1) });
        if ((!force || tx != null) && Math.random() < (tx != null ? .45 : .28)) { // segunda descarga
          var b2 = genBolt(big), d = rnd(150, 280);
          events.push({ kind: "bolt", t0: now + d, dur: 380, bolt: b2, fx: b2.sx, fy: b2.sy - .06 });
        }
      } else {
        events.push({ kind: "sheet", t0: now, dur: 760, bolt: null, fx: rnd(.3, .7), fy: rnd(.26, .42) });
      }
    }

    function render(now) {
      var t = (now - t0) / 1000, I = 0, i, e, v, fl = null, bolt = null, bI = 0;
      if (!havePtr) { tgtX = sin(t * .35) * .35; tgtY = cos(t * .27) * .25; }
      lookX += (tgtX - lookX) * .07; lookY += (tgtY - lookY) * .07;
      if (hold && now - holdT > 260 && ptrActive) { holdT = now; events.push({ kind: "sheet", t0: now, dur: 520, bolt: null, fx: .5 + tgtX * .25, fy: rnd(.3, .45) }); }
      shudder = exp(-(now - lastBolt) / 420);
      if (now >= nextAt) { fire(now, false); schedule(now); }
      for (i = thunders.length - 1; i >= 0; i--) if (now >= thunders[i].t0) { if (opts.onThunder) opts.onThunder(thunders[i].k); thunders.splice(i, 1); }
      for (i = events.length - 1; i >= 0; i--) {
        e = events[i];
        if (now - e.t0 > e.dur) { events.splice(i, 1); continue; }
        v = envelope(e, now);
        if (v > I) { I = v; fl = { x: e.fx, y: e.fy, i: v }; }
        if (e.bolt && v > bI) { bI = v; bolt = e.bolt; }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawCloud(t, fl);
      drawBolt(bolt, bI);
      if (opts.onFlash) opts.onFlash(I);
    }

    function drawStill() {
      if (!resize()) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var b = { pts: jag([.5, .5], [.55, .94], .5, 5), branches: [], sx: .5, sy: .5 };
      b.branches.push(jag(b.pts[10], [.7, .86], .5, 4));
      drawCloud(2.4, { x: .5, y: .46, i: .55 });
      drawBolt(b, .85);
      if (opts.onFlash) opts.onFlash(0);
    }

    function frame(now) {
      if (!running) return;
      raf = global.requestAnimationFrame(frame);
      if (document.hidden) return;
      if (now - lastMotionCheck > 800) {
        lastMotionCheck = now;
        var off = motionOff();
        if (off !== still) { still = off; if (still) drawStill(); }
      }
      if (still) return;
      render(now);
    }

    function start() {
      if (running) return;
      if (!resize()) { global.requestAnimationFrame(function () { if (!running) start(); }); return; }
      running = true; t0 = performance.now(); lastMotionCheck = 0;
      still = motionOff();
      if (still) { drawStill(); return; }
      schedule(t0 - 700); // primeiro raio logo no início
      nextAt = t0 + rnd(700, 1400);
      raf = global.requestAnimationFrame(frame);
      if (global.ResizeObserver && !ro) { ro = new ResizeObserver(function () { resize(); }); ro.observe(canvas); }
    }
    function stop() {
      running = false; if (raf) global.cancelAnimationFrame(raf); raf = 0;
      if (opts.onFlash) opts.onFlash(0);
    }
    function flash() {
      if (!running) { if (!resize()) return; running = true; t0 = performance.now(); }
      fire(performance.now(), true);
    }
    function strike(nx, ny) {
      if (!running) { if (!resize()) return; running = true; t0 = performance.now(); raf = global.requestAnimationFrame(frame); }
      fire(performance.now(), true, nx, ny);
    }
    function look(x, y) { havePtr = x != null; tgtX = clamp(x || 0, -1, 1); tgtY = clamp(y || 0, -1, 1); }
    function setRate(r) { rate = r || 1; }
    // interação: arrastar inclina a luz, tocar chama um raio até o ponto, segurar carrega a nuvem
    var host = opts.interactive ? (opts.host || canvas) : null;
    function pt(e) { var r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
    function onMove(e) { var q = pt(e); look((q[0] - .5) * 2, (q[1] - .5) * 2); }
    function onDown(e) { var q = pt(e); ptrActive = true; hold = 1; holdT = performance.now(); onMove(e); if (!motionOff()) strike(q[0], max(.66, q[1])); }
    function onUp() { if (hold && performance.now() - holdT > 600 && !motionOff()) strike(.5 + tgtX * .25, .9); hold = 0; ptrActive = false; }
    function onLeave() { hold = 0; ptrActive = false; look(null, null); }
    if (host) {
      host.addEventListener("pointermove", onMove); host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointerup", onUp); host.addEventListener("pointercancel", onLeave); host.addEventListener("pointerleave", onLeave);
    }
    function destroy() {
      stop(); if (ro) { ro.disconnect(); ro = null; } events = [];
      if (host) { host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerdown", onDown); host.removeEventListener("pointerup", onUp); host.removeEventListener("pointercancel", onLeave); host.removeEventListener("pointerleave", onLeave); }
    }

    // utilitários de teste/diagnóstico
    function snapshot(t, bolt, intensity) {
      if (!resize()) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
      var b = bolt ? genBolt(big) : null;
      drawCloud(t || 2, bolt ? { x: b.sx, y: b.sy - .06, i: intensity || .9 } : (intensity ? { x: .5, y: .38, i: intensity } : null));
      if (b) drawBolt(b, intensity || .9);
    }

    return { start: start, stop: stop, flash: flash, strike: strike, look: look, setRate: setRate, destroy: destroy, snapshot: snapshot, resize: resize };
  }

  global.DNAStorm = { mount: mount };
})(window);
