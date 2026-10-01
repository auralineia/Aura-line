import { BLOB } from "/reel-img.js?v=5";
(function () {
 const $ = id => document.getElementById(id), st = $("sticky"), reel = $("reel"), wrap = $("matterWrap");
 if (!st || !reel) return;
 const css = document.createElement("style");
 css.textContent = `#sticky{background:radial-gradient(circle,rgba(0,0,0,.07) 1px,transparent 1.5px) 0 0/73px 59px,radial-gradient(circle,rgba(0,0,0,.05) 1px,transparent 1.5px) 31px 27px/117px 91px,#fff!important;color:#111!important;--anim:1}
#sticky:before,#sticky .topline,#sticky .progress,#sticky .editorial-grid,#sticky .copy,#matterWrap{display:none!important}
#rkStage{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:min(100vw,92svh*.7096);aspect-ratio:562/792;container-type:inline-size;font:600 max(9.5px,1.75cqw)/1.3 ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;letter-spacing:.14em;color:#8b8e94}
#rkStage img{position:absolute;left:16.7%;top:15.6%;width:62.1%;height:auto;pointer-events:none;user-select:none;-webkit-user-drag:none;animation:rkf 9s ease-in-out infinite;will-change:transform}
@keyframes rkf{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-1.2%) rotate(1.5deg)}}
.rk{position:absolute;z-index:2;white-space:nowrap;background:none;border:0;padding:6px;margin:-6px;font:inherit;letter-spacing:inherit;color:inherit;cursor:pointer;transition:color .2s,transform .16s cubic-bezier(.23,1,.32,1);-webkit-tap-highlight-color:transparent}
.rk:active{transform:scale(.96)}.rk.n,.rk.w{font-weight:500}.rk.n{cursor:default;pointer-events:none}.rk.soft{color:#b4b7bd}
@media(hover:hover){button.rk:hover{color:#111}}
@media(prefers-reduced-motion:reduce){#rkStage img{animation:none}}
body.in-reel .top .brand{color:#111}body.in-reel .top .icon-btn,body.in-reel .top .credit{color:#111;background:rgba(255,255,255,.7);border-color:rgba(0,0,0,.12)}
.composer{display:none!important}body.chat-open .composer{display:block!important}
#rkAg{position:fixed;inset:0;z-index:55;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);color:#111}
#rkAg.open{display:flex}#rkAg>div{width:min(460px,100%)}#rkAg h3{font:400 34px/1 ui-serif,Georgia,serif;margin:0 0 6px}#rkAg p.s{margin:0 0 22px;color:#6b6e74;font-size:14px}
#rkAg button.a{display:block;width:100%;text-align:left;padding:18px 4px;background:none;border:0;border-top:1px solid rgba(0,0,0,.14);color:#111;cursor:pointer;transition:transform .16s cubic-bezier(.23,1,.32,1)}
#rkAg button.a:active{transform:scale(.98)}#rkAg button.a b{display:block;font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.16em}#rkAg button.a span{display:block;margin-top:5px;color:#6b6e74;font-size:14px}
#rkAg .x{margin-top:18px;background:none;border:0;color:#6b6e74;cursor:pointer;font-size:14px}`;
 document.head.appendChild(css);
 reel.style.height = "100svh";
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
 function openChat(m) {
 MODE = m; const inp = $("input"); if (inp) inp.placeholder = "Converse com " + NAME[m] + "...";
 const c = $("conversation"); if (c) c.scrollIntoView({ behavior: "smooth" });
 setTimeout(() => { if (inp) inp.focus({ preventScroll: true }); }, 700);
 }
 ag.onclick = e => { const m = e.target.closest("[data-m]"); if (m) { ag.classList.remove("open"); openChat(m.dataset.m); } else if (e.target === ag || e.target.className === "x") ag.classList.remove("open"); };
 const stage = document.createElement("div"); stage.id = "rkStage";
 const img = new Image(); img.src = BLOB; img.alt = ""; img.draggable = false; stage.appendChild(img);
 const mk = (txt, x, y, fn, cls) => { const b = document.createElement(fn ? "button" : "div"); b.className = "rk " + (cls || ""); b.textContent = txt; b.style.left = x + "%"; b.style.top = y + "%"; if (fn) b.onclick = fn; stage.appendChild(b); return b; };
 mk("01 RIMAK", 45.7, 22.3, () => openChat("rimak"), "soft");
<PARSED TEXT FOR PAGE: 2 / 2>
 mk("02 AGENTES", 78.3, 48.6, () => ag.classList.add("open"));
 mk("04 TEMPESTA", 9.3, 58.2, () => openChat("tempesta"));
 mk("03 NEVERA", 61.9, 72.6, () => openChat("nevera"));
 const greet = mk("Bem-vindo de volta.", 17.3, 79.4, null, "n");
 const hint = mk("Role para explorar ↓", 0, 79.4, () => openChat("rimak"), "w"); hint.style.left = "auto"; hint.style.right = "8.4%";
 mk("01 / 07 — RIMAK", 10.8, 81.4, null, "n");
 st.appendChild(stage);
 const first = () => { try { const m = state.user && state.user.user_metadata, n = m && (m.full_name || m.name); return n ? String(n).split(" ")[0] : ""; } catch (e) { return ""; } };
 const plan = () => { try { const p = state.plan || (state.user && state.user.user_metadata && state.user.user_metadata.plan) || "free"; return String(p).replace(/^./, c => c.toUpperCase()); } catch (e) { return "Free"; } };
 setInterval(() => { const n = first(); if (n) greet.textContent = "Bem-vindo de volta, " + n + "."; const b = $("creditBtn"); if (b && b.textContent && b.textContent.indexOf("·") < 0) b.textContent += " · " + plan(); }, 700);
 const inReel = () => { const r = reel.getBoundingClientRect().bottom > 80; document.body.classList.toggle("in-reel", r); document.body.classList.toggle("chat-open", !r); };
 addEventListener("scroll", inReel, { passive: true }); inReel();
})();