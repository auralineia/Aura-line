import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const canvas = document.getElementById("matterCanvas");
if (canvas) { try { init(); } catch (e) { console.error("RIMAK 3D:", e); } }

function init() {
  const $ = id => document.getElementById(id), wrap = $("matterWrap"), st = $("sticky"), reel = $("reel");
  // ---------- estilo claro (igual à referência); app/chat/login não são tocados ----------
  const css = document.createElement("style");
  css.textContent = `#sticky{background:#fff!important;color:#111!important}
#sticky:before{background:radial-gradient(circle,rgba(0,0,0,.2) 1px,transparent 1.6px) 0 0/71px 57px,radial-gradient(circle,rgba(0,0,0,.14) 1px,transparent 1.6px) 23px 31px/113px 89px!important;opacity:.55}
#sticky .topline,#sticky .progress,#sticky .editorial-grid,#sticky .matter-glow{display:none!important}
#matterWrap{display:block!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important}
#matterCanvas{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
#sticky .rk{display:block!important;visibility:visible!important;z-index:100!important;color:#8b8e94!important;opacity:1!important;text-shadow:0 1px 8px rgba(255,255,255,.8)}
#sticky .rk.off{opacity:0!important}
#sticky .copy .kicker{color:rgba(17,18,20,.5)!important}#sticky .copy p{color:rgba(17,18,20,.55)!important}#sticky .copy em{color:#7d2948!important}
.rk{position:absolute;z-index:9;font:600 11px/1.3 ui-monospace,"SF Mono",Menlo,Consolas,monospace;letter-spacing:.14em;color:#8b8e94;background:none;border:0;padding:6px;cursor:pointer;transition:opacity .2s cubic-bezier(.23,1,.32,1),color .2s}
.rk:active{transform:scale(.96)}.rk.off{opacity:0;pointer-events:none}.rk.soft{cursor:default;pointer-events:none;color:#b9bcc2}
@media(hover:hover){button.rk:hover{color:#111}}
body.in-reel .top .brand{color:#111}body.in-reel .top .icon-btn,body.in-reel .top .credit{color:#111;background:rgba(255,255,255,.7);border-color:rgba(0,0,0,.12)}
.composer{display:none!important}body.chat-open .composer{display:block!important}
#rkAg{position:fixed;inset:0;z-index:55;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);color:#111}
#rkAg.open{display:flex}#rkAg>div{width:min(460px,100%)}#rkAg h3{font:400 34px/1 ui-serif,Georgia,serif;margin:0 0 6px}#rkAg p.s{margin:0 0 22px;color:#6b6e74;font-size:14px}
#rkAg button.a{display:block;width:100%;text-align:left;padding:18px 4px;background:none;border:0;border-top:1px solid rgba(0,0,0,.14);color:#111;cursor:pointer;transition:transform .16s cubic-bezier(.23,1,.32,1)}
#rkAg button.a:active{transform:scale(.98)}#rkAg button.a b{display:block;font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.16em}#rkAg button.a span{display:block;margin-top:5px;color:#6b6e74;font-size:14px}
#rkAg .x{margin-top:18px;background:none;border:0;color:#6b6e74;cursor:pointer;font-size:14px}`;
  document.head.appendChild(css);
  reel.style.height = "700vh";
  if (wrap) Object.assign(wrap.style, { left: "0", top: "0", width: "100%", height: "100%", transform: "none", display: "block" });
  canvas.style.width = "100%"; canvas.style.height = "100%";

  // ---------- HUD: rótulos clicáveis que levam às cenas ----------
  let MODE = "rimak";
  const PERSONA = {
    nevera: "[MODO NEVERA — agente de execução] Aja como um agente de execução: entenda o objetivo, quebre em passos, entregue o resultado final pronto para usar (texto, plano, checklist, código) e indique o próximo passo. Seja direto e objetivo.",
    tempesta: "[MODO TEMPESTA — inteligência emocional e neural] Aja com empatia e inteligência emocional: acolha, ajude a nomear o que a pessoa sente, organize os pensamentos com perguntas gentis e passos práticos. Você não substitui um profissional de saúde; se houver risco, oriente a buscar ajuda."
  };
  const NAME = { rimak: "a RIMAK", nevera: "a NEVERA", tempesta: "a TEMPESTA" };
  const _fetch = window.fetch.bind(window);
  window.fetch = (u, o) => { try { if (String(u).indexOf("/api/chat") > -1 && o && o.method === "POST" && o.body) { const b = JSON.parse(o.body); if (b.message && PERSONA[MODE]) { b.mode = MODE; b.history = [{ role: "user", content: PERSONA[MODE] }, { role: "assistant", content: "Entendido." }].concat(b.history || []); o.body = JSON.stringify(b); } } } catch (e) {} return _fetch(u, o); };
  const ag = document.createElement("div"); ag.id = "rkAg";
  ag.innerHTML = '<div><h3>Agentes</h3><p class="s">Tudo incluído na RIMAK.</p><button class="a" data-m="nevera"><b>NEVERA</b><span>Agente de execução. Transforma pedidos em passos e entrega o resultado pronto.</span></button><button class="a" data-m="tempesta"><b>TEMPESTA</b><span>Inteligência emocional e neural. Acolhe, organiza o que você sente e ajuda a decidir.</span></button><button class="a" data-m="rimak"><b>RIMAK</b><span>Conversa geral, com memória do seu histórico.</span></button><button class="x">Fechar</button></div>';
  document.body.appendChild(ag);
  ag.onclick = e => { const m = e.target.closest("[data-m]"); if (m) { ag.classList.remove("open"); openChat(m.dataset.m); } else if (e.target === ag || e.target.className === "x") ag.classList.remove("open"); };
  function openChat(m) {
    MODE = m; const inp = $("input"); if (inp) inp.placeholder = "Converse com " + NAME[m] + "...";
    const c = $("conversation"); if (c) c.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => { if (inp) inp.focus({ preventScroll: true }); }, 700);
  }
  const goto = k => { const max = reel.offsetHeight - innerHeight; scrollTo({ top: reel.offsetTop + max * k / 7 + 4, behavior: "smooth" }); };
  // The hero typography lives in index.html. Keep this script focused on the 3D matter,
  // interactions and state so labels are never rendered twice.
  const hud = () => {};
  const plan = () => { try { const s = window.state || {}; const p = s.plan || (s.user && s.user.user_metadata && s.user.user_metadata.plan) || "free"; return String(p).replace(/^./, c => c.toUpperCase()); } catch (e) { return "Free"; } };
  setInterval(() => { const b = $("creditBtn"); if (b && b.textContent && b.textContent.indexOf("·") < 0) b.textContent += " · " + plan(); }, 700);
  const inReel = () => { const r = reel.getBoundingClientRect().bottom > 80; document.body.classList.toggle("in-reel", r); document.body.classList.toggle("chat-open", !r); };
  addEventListener("scroll", inReel, { passive: true }); inReel();

  // ---------- relevo orgânico + faixas (curvas de nível) ----------
  const U = { uA: { value: .2 }, uT: { value: 0 }, uP: { value: 0 }, uBF: { value: 5 }, uBM: { value: 1 } };
  const DISP = `uniform float uA,uT,uP;varying float vN;
float dsp(vec3 p){float t=uT;float n=sin(2.6*p.x+t+uP*.9)*sin(2.3*p.y-t*.8)*sin(2.9*p.z+t*.6-uP*.7);
n+=.5*sin(5.2*p.x+3.1*p.z-t*1.1)*sin(4.4*p.y+2.*p.x+uP);return uA*n;}\n`;
  const inject = (mat, full) => {
    mat.onBeforeCompile = s => {
      Object.assign(s.uniforms, U); let v = s.vertexShader;
      if (full) {
        v = v.replace("#include <beginnormal_vertex>", `vec3 bp=normalize(position);
vec3 tg=normalize(cross(bp,vec3(0.,1.,.0001)));vec3 bt=cross(bp,tg);
vec3 q1=normalize(bp+tg*.02),q2=normalize(bp+bt*.02);
vec3 P0=bp*(1.+dsp(bp)),P1=q1*(1.+dsp(q1)),P2=q2*(1.+dsp(q2));vN=dsp(bp)/max(uA,.001);
vec3 objectNormal=normalize(cross(P1-P0,P2-P0));if(dot(objectNormal,bp)<0.)objectNormal=-objectNormal;
#ifdef USE_TANGENT
vec3 objectTangent=vec3(tangent.xyz);
#endif`).replace("#include <begin_vertex>", "vec3 transformed=P0;");
        s.fragmentShader = "uniform float uBF,uBM,uP;varying float vN;\n" + s.fragmentShader.replace("#include <dithering_fragment>",
          "float bnd=abs(sin(vN*uBF+uP*.5));gl_FragColor.rgb*=mix(1.,mix(.14,1.,smoothstep(.12,.85,bnd)),uBM);\n#include <dithering_fragment>");
      } else v = v.replace("#include <begin_vertex>", "vec3 transformed=normalize(position);transformed*=1.+dsp(transformed);");
      s.vertexShader = DISP + v;
    };
  };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .01, 80);

  // estúdio claro: reflexo prateado/azulado com brilhos nítidos
  const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(.42, .48, .62), side: THREE.BackSide })));
  [[0xffffff, 7, [-5, 4, 4], [5, 2]], [0xdff1ff, 4, [6, 1, 3], [2, 7]], [0x50607f, 1, [-6, -3, 2], [3, 6]], [0xffffff, 4, [0, 6, -4], [8, 2]]].forEach(([c, i, p, s]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s[0], s[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); env.add(m);
  });
  scene.environment = pm.fromScene(env, .02).texture;

  const solidMat = new THREE.MeshPhysicalMaterial({ color: "#a8b6d2", metalness: 1, roughness: .3, clearcoat: .7, clearcoatRoughness: .18, envMapIntensity: 1.05, transparent: true });
  const wireMat = new THREE.MeshBasicMaterial({ color: "#14161a", wireframe: true, transparent: true, opacity: 0 });
  const ptsMat = new THREE.PointsMaterial({ color: "#14161a", size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0 });
  inject(solidMat, true); inject(wireMat, false); inject(ptsMat, false);
  const solid = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 36), solidMat);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 12), wireMat);
  const pts = new THREE.Points(new THREE.IcosahedronGeometry(1, 20), ptsMat);
  [solid, wire, pts].forEach(o => o.frustumCulled = false);
  const group = new THREE.Group(); group.add(solid, wire, pts); scene.add(group);

  // fases: [relevo, escala, wire, pontos, cor, metal, rugosidade, faixas, freq. faixas]
  const K = [
    [.26, 1, 0, 0, "#a8b6d2", 1, .3, 1, 3.4], [.3, 1.04, 0, 0, "#a8b6d2", 1, .3, 1, 3], [.27, 1.04, 0, 0, "#a8b6d2", 1, .3, 1, 4.2],
    [.25, 1.04, 1, 1, "#a8b6d2", 1, .3, 0, 3.4], [.16, 1, 0, 0, "#b4bccc", 1, .3, .7, 2.6], [.29, 1.06, 0, 0, "#a8b6d2", 1, .3, 1, 3.8],
    [.05, .5, 0, 0, "#c9d2e4", 1, .12, 0, 3], [.26, 1, 0, 0, "#a8b6d2", 1, .3, 1, 3.4]
  ];
  const c1 = new THREE.Color(), c2 = new THREE.Color(); let camZ = 10;
  function apply(q) {
    const k = Math.min(6, Math.floor(q)), f = q - k, s = f * f * (3 - 2 * f), A = K[k], B = K[k + 1], L = i => A[i] + (B[i] - A[i]) * s;
    U.uA.value = L(0); group.scale.setScalar(L(1)); U.uP.value = q; U.uBM.value = L(7); U.uBF.value = L(8);
    const w = L(2), p = L(3);
    wireMat.opacity = w * .55; wire.visible = w > .01; ptsMat.opacity = p; pts.visible = p > .01;
    solidMat.opacity = 1 - w; solid.visible = solidMat.opacity > .02;
    solidMat.color.copy(c1.set(A[4]).lerp(c2.set(B[4]), s)); solidMat.metalness = L(5); solidMat.roughness = L(6);
  }
  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    camZ = 1.95 / (Math.tan(cam.fov * Math.PI / 360) * Math.min(1, cam.aspect));
    cam.position.z = camZ; cam.updateProjectionMatrix(); drawn = -1;
  }
  let target = 0, cur = 0, drawn = -1;
  new ResizeObserver(resize).observe(canvas); resize();
  window.rimakMatter = { setProgress(v) { target = Math.max(0, Math.min(7, v)); } };
  (function frame(t) {
    cur += (target - cur) * .14;
    if (Math.abs(cur - drawn) > 1e-4) { apply(cur); drawn = cur; }
    U.uT.value = t * .0005;
    group.rotation.y = cur * .5 + t * .00012; group.rotation.x = .15 + Math.sin(cur) * .1;
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  })(0);
}