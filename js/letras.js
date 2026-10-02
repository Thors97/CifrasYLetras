'use strict';
/* ================= Letras ================= */
function letrasChoose(){
  const g = S.game, solo = isSolo();
  const chooser = g.letterTurns % g.players.length;
  S.round.chooser = chooser;
  renderScores(solo ? -1 : chooser);
  app.innerHTML = `<section class="round-l" aria-labelledby="h-round">
    ${roundHead()}
    <p class="turn-msg">${solo ? '¿Cuántas vocales quieres?' : `Elige <strong>${esc(g.players[chooser].name)}</strong>: ¿cuántas vocales queréis?`}</p>
    <div class="pick" role="group" aria-label="Número de vocales">
      ${[3,4,5,6].map(n => `<button type="button" class="btn" data-v="${n}" aria-label="${n} vocales">${n}</button>`).join('')}
    </div>
    <div class="row"><button type="button" class="btn small" data-v="azar">Al azar</button></div>
    <p class="hint" style="margin-top:14px">Saldrán 10 letras: las vocales que elijas y el resto consonantes.</p>
  </section>`;
  $$('[data-v]', app).forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.v === 'azar' ? [3,4,4,5,5,6][rnd(6)] : +b.dataset.v;
    g.letterTurns++;
    letrasDeal(v);
  }));
  focusHeading();
}
async function letrasDeal(vowels, preset){
  const letters = preset ? preset.letters : drawLetters(vowels);
  Object.assign(S.round, { letters, vowels });
  const token = S.round;
  const solo = isSolo() || (S.online && O.me >= 0); // la pantalla grande no responde: fichas sin botón
  app.innerHTML = `<section class="round-l" aria-labelledby="h-round">
    ${roundHead()}
    <div class="board">
      <div class="clock-col" id="clock-host"></div>
      <div class="board-main">
        <ul class="tiles letters" id="tiles" aria-label="Letras"></ul>
        <p class="hint" id="vowel-note" style="margin-top:10px">${vowels} vocales y ${10-vowels} consonantes.</p>
      </div>
    </div>
    <div id="play"></div>
  </section>`;
  const ul = $('#tiles');
  const anim = !reduced() && !(preset && preset.instant);
  for (let i=0;i<letters.length;i++){
    const ch = letters[i].toUpperCase();
    const li = document.createElement('li');
    li.innerHTML = solo
      ? `<button type="button" class="tile${anim?' deal':''}" data-i="${i}" aria-label="Letra ${ch}">${ch}</button>`
      : `<span class="tile${anim?' deal':''}">${ch}</span>`;
    ul.appendChild(li);
    if (anim){ beep(660 + i*30, 0.05, 0.05); await sleep(110); if (S.round !== token) return; }
  }
  announce('Letras: ' + letters.map(l => l.toUpperCase()).join(', ') + '.');
  if (!Dict.set) loadDict();
  if (S.online) onlineLetrasPlay(preset); else if (solo) letrasSoloPlay(); else letrasTeamPlay();
}
function letrasSoloPlay(){
  letrasInput({ secs: timeFor('L'), onDone: w => letrasResults([w]) });
}
function letrasInput(o){
  const letters = S.round.letters;
  $('#play').innerHTML = `<div class="answer">
    <div class="field word-row"><label for="word">Tu palabra</label>
    <input type="text" id="word" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done" aria-describedby="word-msg"></div>
    <p class="msg" id="word-msg">Escríbela o toca las letras.</p>
    <div class="row">
      <button type="button" class="btn small" id="bk">Borrar letra</button>
      <button type="button" class="btn small" id="clr">Vaciar</button>
      <span class="spacer"></span>
      <button type="button" class="btn primary" id="send">Entregar palabra</button>
    </div></div>`;
  const input = $('#word'), msg = $('#word-msg'), tiles = $$('#tiles .tile');
  const sync = () => {
    const w = normWord(input.value);
    const used = new Array(letters.length).fill(false), missing = [];
    for (const ch of w){
      const i = letters.findIndex((l, k) => l === ch && !used[k]);
      if (i >= 0) used[i] = true; else missing.push(ch);
    }
    tiles.forEach((t, k) => { t.classList.toggle('used', used[k]); t.disabled = used[k]; });
    if (/[^a-zñ]/.test(w)){ msg.className = 'msg bad'; msg.textContent = 'Solo se admiten letras.'; }
    else if (missing.length){ msg.className = 'msg bad'; msg.textContent = `No hay ${[...new Set(missing)].map(c => c.toUpperCase()).join(', ')} de sobra en el panel.`; }
    else if (w.length){ msg.className = 'msg'; msg.textContent = `${w.length} ${plural(w.length, 'letra', 'letras')}${w.length < 5 ? ': el mínimo son 5' : ''}.`; }
    else { msg.className = 'msg'; msg.textContent = 'Escríbela o toca las letras.'; }
  };
  input.addEventListener('input', sync);
  input.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); finish(); } });
  tiles.forEach((t, k) => t.addEventListener('click', () => { input.value += letters[k].toUpperCase(); sync(); }));
  $('#bk').addEventListener('click', () => { input.value = input.value.slice(0, -1); sync(); });
  $('#clr').addEventListener('click', () => { input.value = ''; sync(); });
  let finished = false;
  const finish = () => { if (finished) return; finished = true; stopClock(); o.onDone(input.value); };
  $('#send').addEventListener('click', finish);
  S.clock = new Clock($('#clock-host'), o.secs, finish, { left:o.left, noPause:o.noPause });
  S.clock.start();
  if (finePointer()) input.focus(); else focusHeading();
}
function letrasTeamPlay(){
  const free = !timeFor('L');
  $('#play').innerHTML = `<div class="panel">
    <p>${free ? 'Pensad vuestra palabra y apuntadla en papel.' : 'Apuntad vuestra palabra en papel antes de que acabe el tiempo.'} Al terminar, la escribiréis aquí.</p>
    <button type="button" class="btn primary" id="end">${free ? 'Escribir las respuestas' : 'Terminar el tiempo ya'}</button></div>`;
  const go = () => { stopClock(); letrasTeamAnswers(); };
  $('#end').addEventListener('click', go);
  S.clock = new Clock($('#clock-host'), timeFor('L'), go);
  S.clock.start();
  focusHeading();
}
function letrasTeamAnswers(){
  const g = S.game;
  $('#clock-host').innerHTML = '';
  $('#play').innerHTML = `<form id="f-ans" class="panel" novalidate>
    <h3 id="ans-h" tabindex="-1">Respuestas</h3>
    <p class="hint">Escribid la palabra de cada equipo. Dejad el hueco vacío si no tenéis ninguna.</p>
    ${g.players.map((p, i) => `<div class="field" style="margin-bottom:12px"><label for="ans-${i}">${esc(p.name)}</label>
      <input type="text" id="ans-${i}" class="ans-input" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"></div>`).join('')}
    <button type="submit" class="btn primary">Comprobar las palabras</button>
  </form>`;
  $('#f-ans').addEventListener('submit', e => { e.preventDefault(); letrasResults(g.players.map((_, i) => $('#ans-' + i).value)); });
  $('#ans-h').focus();
}
function checkWord(raw, letters){
  const w = normWord(raw);
  if (!w) return {word:'', status:'none', len:0};
  if (/[^a-zñ]/.test(w)) return {word:w, status:'chars', len:w.length};
  const pool = letters.slice(), missing = [];
  for (const ch of w){ const i = pool.indexOf(ch); if (i >= 0) pool.splice(i, 1); else missing.push(ch); }
  if (missing.length) return {word:w, status:'letters', missing, len:w.length};
  if (w.length < 5) return {word:w, status:'short', len:w.length};
  if (!Dict.set.has(w)) return {word:w, status:'dict', len:w.length};
  return {word:w, status:'ok', len:w.length};
}
const dleUrl = w => 'https://dle.rae.es/' + encodeURIComponent(w);
async function letrasResults(raws){
  app.querySelectorAll('#tiles .tile').forEach(t => { if (t.tagName === 'BUTTON') t.disabled = true; });
  const ch = $('#clock-host'); if (ch) ch.innerHTML = '';
  $('#play').innerHTML = `<p class="hint" role="status">Comprobando…</p>`;
  const R = S.round;
  await loadDict();
  if (S.round !== R) return;
  R.answers = raws.map(r => checkWord(r, R.letters));
  R.best = bestWords(R.letters);
  R.recorded = false;
  drawLetrasResults();
}
function letrasPointsOf(answers, solo){
  const valid = answers.map(a => a.status === 'ok' || (a.status === 'dict' && a.override));
  if (solo) return [valid[0] ? answers[0].len : 0];
  const max = Math.max(0, ...answers.map((a, i) => valid[i] ? a.len : 0));
  return answers.map((a, i) => (valid[i] && a.len === max && max > 0) ? max : 0);
}
function letrasPoints(){ return letrasPointsOf(S.round.answers, isSolo()); }
function entryL(answers, pts, best){
  return { type:'L', points: pts, max: best.len >= 5 ? best.len : 0,
    detail: answers.map(a => a.word ? a.word.toUpperCase() : '—'),
    bestTxt: best.len >= 5 ? `${displayForms(best.words[0]).slice(-1)[0].toUpperCase()} (${best.len})` : 'ninguna' };
}
function statusText(a){
  switch (a.status){
    case 'none': return ['neutral', 'Sin respuesta'];
    case 'chars': return ['bad', 'Solo se admiten letras'];
    case 'letters': return ['bad', `Usa letras que no están: ${[...new Set(a.missing)].map(c => c.toUpperCase()).join(', ')}`];
    case 'short': return ['bad', 'Tiene menos de 5 letras'];
    case 'dict': return a.override ? ['ok', `Dada por válida: ${a.len} letras`] : ['bad', 'No está en el diccionario del juego'];
    default: return ['ok', `Válida: ${a.len} letras`];
  }
}
function letrasResultsHtml(players, answers, pts, best, o){
  const rows = answers.map((a, i) => {
    const [cls, txt] = statusText(a);
    const acts = a.status === 'dict'
      ? `<div class="actions"><a class="link" href="${dleUrl(a.word)}" target="_blank" rel="noopener">Buscar «${esc(a.word)}» en el DLE<span class="sr-only"> (se abre en otra pestaña)</span></a>
         ${o.canOverride ? `<button type="button" class="btn small" data-ov="${i}" aria-pressed="${a.override ? 'true' : 'false'}">${a.override ? 'Quitar validez' : 'Dar por válida'}</button>` : ''}</div>` : '';
    return `<tr><th scope="row">${esc(players[i].name)}</th>
      <td><span class="word">${a.word ? esc(a.word) : '—'}</span><br><span class="badge ${cls}">${esc(txt)}</span>${acts}</td>
      <td class="pts">${pts[i]}</td></tr>`;
  }).join('');
  const total = best.count != null ? best.count : best.words.length;
  const bestHtml = best.len >= 5
    ? `<p>Con estas letras se podía llegar a <strong>${best.len} letras</strong>${total > 1 ? ` (${total} palabras posibles)` : ''}:</p>
       <ul class="best-list">${best.words.slice(0, 8).map(w => `<li><a href="${dleUrl(displayForms(w)[displayForms(w).length - 1])}" target="_blank" rel="noopener">${esc(displayForms(w).join(' / '))}<span class="sr-only"> (definición en el DLE, se abre en otra pestaña)</span></a></li>`).join('')}</ul>
       ${total > 8 ? `<p class="hint" style="margin-top:8px">Y ${total - 8} más.</p>` : ''}`
    : `<p>Con estas letras no había ninguna palabra de 5 letras o más en el diccionario.</p>`;
  return `<div class="results">
    <h3 id="res-h" tabindex="-1">Resultado</h3>
    <table class="res"><thead><tr><th scope="col">${o.who}</th><th scope="col">Palabra</th><th scope="col" class="pts">Puntos</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="panel"><h3>La palabra más larga</h3>${bestHtml}</div>
    ${o.footer}</div>`;
}
function drawLetrasResults(focusSel){
  const g = S.game, R = S.round, solo = isSolo();
  const pts = letrasPoints();
  const entry = entryL(R.answers, pts, R.best);
  if (!R.recorded){ g.history.push(entry); R.recorded = true; } else g.history[g.history.length - 1] = entry;
  recomputeScores(); renderScores(solo ? -1 : R.chooser);
  const b = R.best;
  $('#play').innerHTML = letrasResultsHtml(g.players, R.answers, pts, b, { who: solo ? 'Jugador' : 'Equipo', canOverride:true, footer:nextButton() });
  $$('[data-ov]').forEach(btn => btn.addEventListener('click', () => {
    const a = R.answers[+btn.dataset.ov]; a.override = !a.override;
    drawLetrasResults(`[data-ov="${btn.dataset.ov}"]`);
    announce(a.override ? `«${a.word}» dada por válida.` : `«${a.word}» vuelve a no ser válida.`);
  }));
  bindNext();
  if (focusSel){ const el = $(focusSel); if (el) el.focus(); }
  else {
    $('#res-h').focus();
    const sum = solo ? `Has sumado ${pts[0]} ${plural(pts[0], 'punto', 'puntos')}.` : resumenEquipos(pts);
    announce(`${sum} La palabra más larga posible tenía ${b.len} letras.`);
  }
}
function resumenEquipos(pts){
  const g = S.game, max = Math.max(...pts);
  if (max <= 0) return 'Nadie puntúa en esta prueba.';
  const w = g.players.filter((_, i) => pts[i] === max).map(p => p.name);
  return `${w.join(' y ')} ${w.length > 1 ? 'suman' : 'suma'} ${max} puntos.`;
}
