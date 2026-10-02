'use strict';
/* ================= Estado ================= */
const DEFAULTS = { mode:'solo', teams:['Equipo 1','Equipo 2'], rounds:10, kind:'alternas', time:'oficial', sound:true, name:'' };
// Los ajustes guardados pueden venir de una versión anterior o estar corruptos: cada campo
// se comprueba y, si no es válido, se usa el valor por defecto.
function cleanSettings(raw){
  const o = raw && typeof raw === 'object' ? raw : {};
  const oneOf = (v, list, def) => list.includes(v) ? v : def;
  const teams = Array.isArray(o.teams) ? o.teams.filter(t => typeof t === 'string').map(t => t.slice(0, 24)).slice(0, 6) : [];
  return {
    mode: oneOf(o.mode, ['solo', 'equipos', 'online'], DEFAULTS.mode),
    teams: teams.length >= 2 ? teams : DEFAULTS.teams.slice(),
    rounds: oneOf(o.rounds, [4, 6, 10], DEFAULTS.rounds),
    kind: oneOf(o.kind, ['alternas', 'letras', 'cifras'], DEFAULTS.kind),
    time: oneOf(o.time, ['oficial', 'doble', 'libre'], DEFAULTS.time),
    sound: typeof o.sound === 'boolean' ? o.sound : DEFAULTS.sound,
    name: typeof o.name === 'string' ? o.name.slice(0, 20) : DEFAULTS.name,
  };
}
const S = { settings: cleanSettings(restore('cyl-ajustes')), game:null, round:null, clock:null };
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
