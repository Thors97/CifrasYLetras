'use strict';
/* ================= Estado ================= */
const DEFAULTS = { mode:'solo', teams:['Equipo 1','Equipo 2'], rounds:10, kind:'alternas', time:'oficial', sound:true, name:'' };
const S = { settings: Object.assign({}, DEFAULTS, restore('cyl-ajustes') || {}), game:null, round:null, clock:null };
function timeFor(type){
  const base = type==='L' ? 30 : 40;
  if (S.settings.time==='doble') return base*2;
  if (S.settings.time==='libre') return 0;
  return base;
}
const isSolo = () => S.game && S.game.players.length===1;

/* ================= Pantallas comunes ================= */
const app = $('#app');
function focusHeading(){ const h = $('h2', app); if (h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:false}); } }
function renderScores(turnIdx){
  const ul = $('#scores');
  if (!S.game){ ul.hidden = true; ul.innerHTML = ''; return; }
  ul.hidden = false;
  ul.innerHTML = S.game.players.map((p, i) => `<li class="${i===turnIdx ? 'turn' : ''}${p.off ? ' off' : ''}"><span class="n">${esc(p.name)}${p.me ? ' (tú)' : ''}${p.off ? '<span class="sr-only"> (sin conexión)</span>' : ''}</span><span class="p">${p.score}</span><span class="sr-only"> puntos</span></li>`).join('');
}
function recomputeScores(){
  S.game.players.forEach((p, i) => { p.score = S.game.history.reduce((s, h) => s + (h.points[i] || 0), 0); });
}
function stopClock(){ if (S.clock){ S.clock.stop(); S.clock = null; } }
