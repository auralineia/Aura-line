import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const canvas = document.getElementById("matterCanvas");
if (canvas) { try { init(); } catch (e) { console.warn("RIMAK 3D:", e); } }

function init() {
  // ---------- layout: canvas em tela cheia + HUD editorial ----------
  const wrap = document.getElementById("matterWrap"), st = document.getElementById("sticky");
  if (wrap) { Object.assign(wrap.style, { left: "0", top: "0", width: "100%", height: "100%", transform: "none" }); const g = wrap.querySelector(".matter-glow"); if (g) g.remove(); }
  if (st) [["01 / ECOSYSTEM", "top:74px;left:50%;transform:translateX(-50%)"], ["03 / EXPERIENCE", "bottom:22px;left:24px"], ["02 / ACADEMY", "bottom:22px;right:24px"]].forEach(([t, css]) => {
    const d = document.createElement("div"); d.textContent = t;
    d.style.cssText = "position:absolute;z-index:9;pointer-events:none;font-size:9px;letter-spacing:.22em;opacity:.55;" + css; st.appendChild(d);
  });

  // ---------- relevo orgânico (mesma função em sólido, wire e pontos) ----------
  const U = { uA: { value: .03 }, uT: { value: 0 }, uP: { value: 0 } };
  const DISP = `uniform float uA,uT,uP;
float dsp(vec3 p){float t=uT;float n=sin(2.6*p.x+t+uP*.9)*sin(2.3*p.y-t*.8)*sin(2.9*p.z+t*.6-uP*.7);
n+=.5*sin(5.2*p.x+3.1*p.z-t*1.1)*sin(4.4*p.y+2.*p.x+uP);return uA*n;}
`;
  const inject = (mat, full) => {
    mat.onBeforeCompile = s => {
      Object.assign(s.uniforms, U);
      let v = s.vertexShader;
      if (full) {
        v = v.replace("#include <beginnormal_vertex>", `vec3 bp=normalize(position);
vec3 tg=normalize(cross(bp,vec3(0.,1.,.0001)));vec3 bt=cross(bp,tg);
vec3 q1=normalize(bp+tg*.02),q2=normalize(bp+bt*.02);
vec3 P0=bp*(1.+dsp(bp)),P1=q1*(1.+dsp(q1)),P2=q2*(1.+dsp(q2));
vec3 objectNormal=normalize(cross(P1-P0,P2-P0));if(dot(objectNormal,bp)<0.)objectNormal=-objectNormal;
#ifdef USE_TANGENT
vec3 objectTangent=vec3(tangent.xyz);
#endif`).replace("#include <begin_vertex>", "vec3 transformed=P0;");
      } else v = v.replace("#include <begin_vertex>", "vec3 transformed=normalize(position);transformed*=1.+dsp(transformed);");
      s.vertexShader = DISP + v;
    };
  };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .01, 80);

  // estúdio virtual (painéis de luz) para reflexo cromado
  const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(.03, .035, .04), side: THREE.BackSide })));
  [[0xffffff, 6, [-5, 4, 4], [5, 2]], [0xbfe8f5, 4, [6, 0, 3], [2, 7]], [0x9a4161, 3, [-6, -3, 2], [3, 6]], [0xffffff, 3, [0, 6, -4], [8, 2]]].forEach(([c, i, p, s]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s[0], s[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); env.add(m);
  });
  scene.environment = pm.fromScene(env, .02).texture;

  const solidMat = new THREE.MeshPhysicalMaterial({ color: "#0b0b0d", metalness: 1, roughness: .06, clearcoat: 1, envMapIntensity: 1.3, transparent: true, iridescence: .001, iridescenceIOR: 1.7, iridescenceThicknessRange: [200, 750] });
  const wireMat = new THREE.MeshBasicMaterial({ color: "#16181c", wireframe: true, transparent: true, opacity: 0 });
  const ptsMat = new THREE.PointsMaterial({ color: "#16181c", size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0 });
  inject(solidMat, true); inject(wireMat, false); inject(ptsMat, false);
  const solid = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 36), solidMat);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 12), wireMat);
  const pts = new THREE.Points(new THREE.IcosahedronGeometry(1, 20), ptsMat);
  [solid, wire, pts].forEach(o => o.frustumCulled = false);
  const group = new THREE.Group(); group.add(solid, wire, pts); scene.add(group);

  // fases: [relevo, escala, wire, pontos, cor, metal, rugosidade, iridescência, cor wire/pontos, câmera(1=longe, ~0=dentro)]
  const K = [
    [.03, 1, 0, 0, "#0b0b0d", 1, .06, 0, "#16181c", 1],   // 0 bolha preta cromada (fundo escuro)
    [.14, 1.05, 0, 0, "#0b0b0d", 1, .07, 0, "#16181c", 1], // 1 relevo orgânico (fundo claro)
    [.2, 1.08, 0, 0, "#5a25a8", .9, .12, 1, "#16181c", 1], // 2 iridescente roxo/verde
    [.2, 1.08, 1, 1, "#5a25a8", .9, .12, 1, "#16181c", 1], // 3 linhas + pontos escuros
    [.22, 1.1, 1, 1, "#5a25a8", .9, .12, 1, "#f0e2a8", 1], // 4 aramado dourado (fundo escuro)
    [.22, 1.1, .35, 1, "#5a25a8", .9, .12, 1, "#ffffff", .03], // 5 câmera entra na esfera de pontos
    [.03, .42, 0, 0, "#f4f6f8", 1, .02, 0, "#ffffff", 1],  // 6 bolha pequena "the future"
    [.05, .9, 0, 0, "#0b0b0d", 1, .06, 0, "#16181c", 1]    // 7 bolha final
  ];
  const c1 = new THREE.Color(), c2 = new THREE.Color(); let camZ = 10;
  function apply(q) {
    const k = Math.min(6, Math.floor(q)), f = q - k, s = f * f * (3 - 2 * f), A = K[k], B = K[k + 1], L = i => A[i] + (B[i] - A[i]) * s;
    U.uA.value = L(0); group.scale.setScalar(L(1)); U.uP.value = q;
    const w = L(2), p = L(3);
    wireMat.opacity = w * .5; wire.visible = w > .01; ptsMat.opacity = p; pts.visible = p > .01;
    solidMat.opacity = 1 - w * (k >= 3 || (k === 2 && s > .5) ? 1 : s); solid.visible = solidMat.opacity > .02;
    solidMat.color.copy(c1.set(A[4]).lerp(c2.set(B[4]), s)); solidMat.metalness = L(5); solidMat.roughness = L(6); solidMat.iridescence = Math.max(.001, L(7));
    const wc = c1.set(A[8]).lerp(c2.set(B[8]), s); wireMat.color.copy(wc); ptsMat.color.copy(wc);
    cam.position.z = camZ * Math.max(.02, L(9));
  }
  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    camZ = 2.75 / (Math.tan(cam.fov * Math.PI / 360) * Math.min(1, cam.aspect));
    cam.updateProjectionMatrix(); drawn = -1;
  }
  let target = 0, cur = 0, drawn = -1;
  new ResizeObserver(resize).observe(canvas); resize();
  window.rimakMatter = { setProgress(v) { target = Math.max(0, Math.min(7, v)); } };
  (function frame(t) {
    cur += (target - cur) * .14;
    if (Math.abs(cur - drawn) > 1e-4) { apply(cur); drawn = cur; }
    U.uT.value = t * .0006;
    group.rotation.y = cur * .5 + t * .00015; group.rotation.x = .15;
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  })(0);
}
