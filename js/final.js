'use strict';
/* ================= Final ================= */
function finalHtml(g, actions){
  const solo = g.players.length === 1;
  const order = g.players.map((p, i) => ({...p, i})).sort((a, b) => b.score - a.score);
  const top = order[0].score, winners = order.filter(p => p.score === top);
  const maxPossible = g.history.reduce((s, h) => s + h.max, 0);
  let headline;
  if (solo) headline = `Has hecho ${top} ${plural(top, 'punto', 'puntos')} en ${g.history.length} pruebas.`;
  else if (winners.length > 1) headline = `Empate a ${top} puntos entre ${winners.map(w => w.name).join(' y ')}.`;
  else headline = `Gana ${winners[0].name} con ${top} puntos.`;
  let pos = 0, last = null;
  const ranking = order.map((p, k) => { if (p.score !== last){ pos = k + 1; last = p.score; }
    return `<li class="${p.score === top ? 'win' : ''}"><span class="pos">${pos}.º</span><span class="nm">${esc(p.name)}</span><span class="p">${p.score}</span><span class="sr-only"> puntos</span></li>`; }).join('');
  const head = g.players.map(p => `<th scope="col" class="n">${esc(p.name)}</th>`).join('');
  const rows = g.history.map((h, k) => `<tr><th scope="row"><span class="tag ${h.type === 'L' ? 'l' : 'c'}">${h.type === 'L' ? 'Letras' : 'Cifras'}</span> ${k + 1}</th>
    ${solo ? `<td>${esc(h.detail[0])}</td><td>${esc(h.bestTxt)}</td>` : ''}${h.points.map(p => `<td class="n">${p}</td>`).join('')}</tr>`).join('');
  const html = `<section aria-labelledby="h-final">
    <h2 id="h-final">Final de la partida</h2>
    <p class="lead">${esc(headline)}</p>
    ${solo ? `<p class="hint">El máximo posible con estas tiradas era ${maxPossible} puntos.</p>` : `<ol class="ranking" aria-label="Clasificación">${ranking}</ol>`}
    <h3>Prueba a prueba</h3>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Puntos por prueba"><table class="hist">
      <thead><tr><th scope="col">Prueba</th>${solo ? '<th scope="col">Tu respuesta</th><th scope="col">Lo mejor posible</th>' : ''}${solo ? '<th scope="col" class="n">Puntos</th>' : head}</tr></thead><tbody>${rows}</tbody></table></div>
    ${actions}
  </section>`;
  return { html, headline };
}
function renderFinal(){
  stopClock();
  const g = S.game;
  recomputeScores(); renderScores(-1);
  const { html, headline } = finalHtml(g, `<div class="row"><button type="button" class="btn primary" id="again">Jugar otra vez</button><button type="button" class="btn" id="setup">Cambiar ajustes</button></div>`);
  app.innerHTML = html;
  $('#again').addEventListener('click', newGame);
  $('#setup').addEventListener('click', renderSetup);
  $('#quit-btn').hidden = true;
  focusHeading();
  announce(headline);
}
