(function(){var d=document;function go(){
if(!d.querySelector(".cyBar")){var t=["RIMAK_OS <b>v6.0rs</b>","STATUS: <b>ONLINE</b>","LATÊNCIA <b>0.9s</b>","AGENTES <b>07</b> ATIVOS","MEMÓRIA <b>SINCRONIZADA</b>","RITTY // CICLO <b>0430</b>","TEMPESTA // <b>ADAPTANDO</b>","CRÉDITOS <b>RENOVAM 00:00</b>"].map(function(x){return"<span>"+x+"</span>"}).join("");var b=d.createElement("div");b.className="cyBar";b.setAttribute("aria-hidden","true");b.innerHTML="<div>"+t+t+"</div>";d.body.appendChild(b)}
var s0=d.getElementById("s0");if(s0&&!d.querySelector(".cyGrid")){var g=d.createElement("div");g.className="cyGrid";g.setAttribute("aria-hidden","true");g.innerHTML="<i></i>";s0.appendChild(g)}
d.querySelectorAll(".rkWm").forEach(function(w,i){w.textContent="0"+(i+1)})}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",go);else go();setTimeout(go,600)})();
