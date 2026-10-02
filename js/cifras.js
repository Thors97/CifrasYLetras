'use strict';
/* ================= Cifras ================= */
function cifrasPrepare(){
  const g = S.game, solo = isSolo();
  const chooser = (g.numberTurns + 1) % g.players.length; // empieza otro equipo distinto al de las letras
  renderScores(solo ? -1 : chooser);
  app.innerHTML = `<section class="round-c" aria-labelledby="h-round">
    ${roundHead()}
    <p class="turn-msg">${solo ? '¿Cuántos números grandes quieres?' : `Elige <strong>${esc(g.players[chooser].name)}</strong>: ¿cuántos números grandes queréis?`}</p>
    <div class="pick five" role="group" aria-label="Cuántos números grandes">
      ${[0,1,2,3,4].map(n => `<button type="button" class="btn" data-big="${n}" aria-label="${n} ${plural(n, 'número grande', 'números grandes')}">${n}</button>`).join('')}
    </div>
    <div class="row"><button type="button" class="btn small" data-big="azar">Al azar</button></div>
    <p class="hint" style="margin-top:14px">Saldrán 6 números y un objetivo entre 100 y 999. Los grandes son 25, 50, 75 y 100; el resto, del 1 al 10.</p>
  </section>`;
  $$('[data-big]', app).forEach(b => b.addEventListener('click', () => {
    g.numberTurns++;
    cifrasDeal(null, b.dataset.big === 'azar' ? undefined : +b.dataset.big);
  }));
  focusHeading();
}
async function cifrasDeal(preset, big){
  const {nums, target} = preset || drawNumbers(big);
  Object.assign(S.round, { nums, target });
  const token = S.round;
  if (!preset) S.round.solution = solveAsync(nums, target);
  const solo = isSolo();
  app.innerHTML = `<section class="round-c" aria-labelledby="h-round">
    ${roundHead()}
    <div class="board">
      <div class="clock-col" id="clock-host"></div>
      <div class="board-main">
        <ul class="tiles numbers" id="tiles" aria-label="Números"></ul>
        <div class="target"><span>Objetivo</span><div class="tile" id="target" aria-live="off">000</div></div>
      </div>
    </div>
    <div id="play"></div>
  </section>`;
  const ul = $('#tiles'), anim = !reduced() && !(preset && preset.instant);
  for (let i=0;i<6;i++){
    const li = document.createElement('li');
    li.innerHTML = `<span class="tile${anim ? ' deal' : ''}">${nums[i]}</span>`;
    ul.appendChild(li);
    if (anim){ beep(520 + i*40, 0.05, 0.05); await sleep(130); if (S.round !== token) return; }
  }
  const tEl = $('#target');
  if (anim){ const t0 = performance.now(); while (performance.now() - t0 < 900){ tEl.textContent = 100 + rnd(900); await sleep(55); } if (S.round !== token) return; }
  tEl.textContent = target;
  announce(`Números: ${nums.join(', ')}. Objetivo: ${target}.`);
  if (S.online) onlineCifrasPlay(preset); else if (solo) cifrasSoloPlay(); else cifrasTeamPlay();
}
function Builder(host, nums, target, opts={}){
  const tiles = nums.map((v, i) => ({id:i, v, used:false, made:false}));
  const steps = []; let sel = null, op = null, nextId = nums.length;
  host.innerHTML = `<div class="builder">
    <p class="hint" id="b-help">Elige un número, una operación y otro número, en cualquier orden. El resultado aparece como un número nuevo.</p>
    ${finePointer() ? '<p class="hint">Con el teclado: escribe los números, + − × ÷ (o * /), Retroceso para deshacer, Esc para cancelar e Intro para entregar.</p>' : ''}
    <ul class="tiles numbers b-tiles" aria-label="Números disponibles" aria-describedby="b-help"></ul>
    <div class="ops" role="group" aria-label="Operaciones">
      <button type="button" class="btn" data-op="+" aria-label="Sumar" aria-pressed="false">+</button>
      <button type="button" class="btn" data-op="−" aria-label="Restar" aria-pressed="false">−</button>
      <button type="button" class="btn" data-op="×" aria-label="Multiplicar" aria-pressed="false">×</button>
      <button type="button" class="btn" data-op="÷" aria-label="Dividir" aria-pressed="false">÷</button>
    </div>
    <p class="expr" aria-hidden="true"></p>
    <p class="msg bad b-err" role="alert"></p>
    <ol class="steps" aria-label="Operaciones hechas"></ol>
    <div class="row"><button type="button" class="btn small" data-act="undo">Deshacer</button><button type="button" class="btn small" data-act="reset">Empezar de nuevo</button></div>
    <p class="current" style="margin-top:12px"></p>
  </div>`;
  const tUl = $('.b-tiles', host), err = $('.b-err', host), expr = $('.expr', host), stepsOl = $('.steps', host), cur = $('.current', host);
  const byId = id => tiles.find(t => t.id === id);
  const answer = () => {
    const av = tiles.filter(t => !t.used);
    let best = null;
    for (const t of av){ const d = Math.abs(t.v - target); if (!best || d < best.diff || (d === best.diff && t.made && !best.made)) best = {value:t.v, diff:d, made:t.made}; }
    return best ? {value:best.value, diff:best.diff, steps:steps.map(s => ({a:s.a, b:s.b, op:s.op, r:s.r}))} : null;
  };
  const draw = (focusId) => {
    tUl.innerHTML = tiles.map(t => `<li><button type="button" class="tile${t.used ? ' used' : ''}${t.made ? ' made' : ''}${sel === t.id ? ' sel' : ''}" data-id="${t.id}" ${t.used ? 'disabled' : ''} aria-pressed="${sel === t.id}" aria-label="${t.v}${t.made ? ', resultado' : ''}">${t.v}</button></li>`).join('');
    $$('[data-op]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.op === op)));
    expr.textContent = sel !== null ? `${byId(sel).v} ${op || ''}` : '';
    stepsOl.innerHTML = steps.map(s => `<li>${s.a} ${s.op} ${s.b} = <strong>${s.r}</strong></li>`).join('');
    const a = answer();
    cur.textContent = a ? `${opts.who || 'Tu resultado'}: ${a.value}${a.diff === 0 ? ', ¡exacto!' : `, a ${a.diff} del objetivo`}` : '';
    if (focusId !== undefined){ const b = $(`[data-id="${focusId}"]`, tUl); if (b && !b.disabled) b.focus(); }
    if (opts.onChange) opts.onChange(a);
  };
  const choose = (id, focus) => {
    err.textContent = '';
    const f = focus ? id : undefined;
    if (sel === null){ sel = id; draw(f); return; }
    if (sel === id){ sel = null; op = null; draw(f); return; }
    if (!op){ sel = id; draw(f); return; }
    let A = byId(sel), B = byId(id), r = null;
    // En restas y divisiones da igual el orden en que se elijan: se pone primero el mayor.
    if ((op === '−' || op === '÷') && A.v < B.v) [A, B] = [B, A];
    if (op === '+') r = A.v + B.v;
    else if (op === '×') r = A.v * B.v;
    else if (op === '−'){ if (A.v === B.v){ err.textContent = `${A.v} menos ${B.v} da 0, y solo valen resultados positivos.`; return; } r = A.v - B.v; }
    else { if (A.v % B.v !== 0){ err.textContent = `La división tiene que ser exacta: ${A.v} entre ${B.v} no lo es.`; return; } r = A.v / B.v; }
    A.used = true; B.used = true;
    const nt = {id:nextId++, v:r, used:false, made:true}; tiles.push(nt);
    steps.push({a:A.v, b:B.v, op, r, ids:[A.id, B.id, nt.id]});
    announce(`${A.v} ${OPWORD[op]} ${B.v} igual a ${r}${r === target ? '. ¡Exacto!' : ''}`);
    if (r === target) beep(1200, 0.18, 0.12);
    sel = null; op = null; draw(focus ? nt.id : undefined);
  };
  const setOp = o => {
    err.textContent = '';
    if (sel === null){
      // Como en una calculadora: tras una operación, la siguiente sigue con su resultado.
      const last = steps.length && byId(steps[steps.length - 1].ids[2]);
      if (last && !last.used) sel = last.id;
      else { err.textContent = 'Elige primero un número.'; return; }
    }
    op = op === o ? null : o; draw();
  };
  tUl.addEventListener('click', e => {
    const b = e.target.closest('[data-id]'); if (!b || b.disabled) return;
    choose(+b.dataset.id, true);
  });
  $$('[data-op]', host).forEach(b => b.addEventListener('click', () => setOp(b.dataset.op)));
  $('[data-act="undo"]', host).addEventListener('click', () => {
    err.textContent = ''; const s = steps.pop(); if (!s) return;
    const [a, b2, n] = s.ids; tiles.splice(tiles.findIndex(t => t.id === n), 1);
    byId(a).used = false; byId(b2).used = false; sel = null; op = null; draw();
    announce(`Deshecho: ${s.a} ${OPWORD[s.op]} ${s.b}`);
  });
  $('[data-act="reset"]', host).addEventListener('click', () => {
    err.textContent = ''; steps.length = 0;
    for (let i = tiles.length - 1; i >= 0; i--) if (tiles[i].made) tiles.splice(i, 1);
    tiles.forEach(t => t.used = false); sel = null; op = null; draw(); announce('Operaciones borradas');
  });
  // Teclado: se escriben los números (los de varias cifras se esperan un momento), + − × ÷,
  // Retroceso deshace, Esc cancela la selección e Intro entrega.
  let disabled = false, buf = '', bufTimer = null, pending = null;
  const KEY_OPS = {'+':'+', '-':'−', '*':'×', 'x':'×', 'X':'×', '/':'÷', ':':'÷'};
  const showBuf = () => { expr.textContent = (sel !== null ? `${byId(sel).v} ${op || ''} ` : '') + buf; };
  const commit = t => { clearTimeout(bufTimer); buf = ''; pending = null; choose(t.id, false); };
  const flushBuf = () => { if (pending) commit(pending); else if (buf){ buf = ''; showBuf(); } };
  const typeDigit = d => {
    clearTimeout(bufTimer); err.textContent = '';
    buf += d;
    const av = tiles.filter(t => !t.used && !(op && t.id === sel));
    const cands = av.filter(t => String(t.v).startsWith(buf));
    if (!cands.length){ err.textContent = `No queda ningún ${buf} para usar.`; buf = ''; pending = null; showBuf(); return; }
    pending = av.find(t => String(t.v) === buf) || null;
    if (pending && !cands.some(t => String(t.v).length > buf.length)) return commit(pending);
    showBuf();
    if (pending) bufTimer = setTimeout(() => { if (pending) commit(pending); }, 800);
  };
  const onKey = e => {
    if (!host.isConnected){ document.removeEventListener('keydown', onKey); return; }
    if (disabled || e.ctrlKey || e.metaKey || e.altKey || $('dialog[open]')) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)){ e.preventDefault(); typeDigit(k); }
    else if (KEY_OPS[k]){ e.preventDefault(); flushBuf(); setOp(KEY_OPS[k]); }
    else if (k === 'Backspace'){ e.preventDefault(); if (buf){ clearTimeout(bufTimer); buf = buf.slice(0, -1); pending = null; showBuf(); } else $('[data-act="undo"]', host).click(); }
    else if (k === 'Escape'){ if (buf || sel !== null){ e.preventDefault(); clearTimeout(bufTimer); buf = ''; pending = null; sel = null; op = null; err.textContent = ''; draw(); } }
    else if (k === 'Enter' && opts.onEnter && !(e.target.closest && e.target.closest('button, a'))){ e.preventDefault(); flushBuf(); opts.onEnter(); }
  };
  document.addEventListener('keydown', onKey);
  draw();
  return { answer, disable(){ disabled = true; clearTimeout(bufTimer); document.removeEventListener('keydown', onKey); $$('button', host).forEach(b => b.disabled = true); } };
}
function cifrasSoloPlay(){
  cifrasInput({ secs: timeFor('C'), onDone: a => cifrasResults([a]) });
}
function cifrasInput(o){
  const R = S.round;
  $('#play').innerHTML = `<div class="panel" id="b-host"></div>
    <div class="row end"><button type="button" class="btn primary" id="send">Entregar resultado</button></div>`;
  $('#tiles').hidden = true;
  let finished = false;
  const finish = () => { if (finished) return; finished = true; stopClock(); bl.disable(); o.onDone(bl.answer()); };
  const bl = Builder($('#b-host'), R.nums, R.target, {onEnter:finish});
  $('#send').addEventListener('click', finish);
  S.clock = new Clock($('#clock-host'), o.secs, finish, { left:o.left, noPause:o.noPause });
  S.clock.start();
  focusHeading();
}
function cifrasTeamPlay(){
  const free = !timeFor('C');
  $('#play').innerHTML = `<div class="panel">
    <p>${free ? 'Haced las cuentas en papel.' : 'Haced las cuentas en papel antes de que acabe el tiempo.'} Después, cada equipo repetirá aquí sus operaciones para comprobarlas.</p>
    <button type="button" class="btn primary" id="end">${free ? 'Introducir las respuestas' : 'Terminar el tiempo ya'}</button></div>`;
  const go = () => { stopClock(); cifrasTeamAnswer(0, []); };
  $('#end').addEventListener('click', go);
  S.clock = new Clock($('#clock-host'), timeFor('C'), go);
  S.clock.start();
  focusHeading();
}
function cifrasTeamAnswer(i, acc){
  const g = S.game, R = S.round;
  if (i >= g.players.length){ cifrasResults(acc); return; }
  $('#clock-host').innerHTML = '';
  renderScores(i);
  $('#play').innerHTML = `<div class="panel">
    <h3 id="turn-h" tabindex="-1">${esc(g.players[i].name)}: vuestras operaciones</h3>
    <p class="hint">Equipo ${i+1} de ${g.players.length}. Contará el número más cercano al objetivo que tengáis.</p>
    <div id="b-host"></div>
    <div class="row" style="margin-top:14px">
      <button type="button" class="btn" id="none">No tenemos resultado</button>
      <span class="spacer"></span>
      <button type="button" class="btn primary" id="ok">Confirmar resultado</button>
    </div></div>`;
  $('#tiles').hidden = true;
  const done = () => { bl.disable(); cifrasTeamAnswer(i + 1, acc.concat([bl.answer()])); };
  const bl = Builder($('#b-host'), R.nums, R.target, {who:'Vuestro resultado', onEnter:done});
  $('#ok').addEventListener('click', done);
  $('#none').addEventListener('click', () => { bl.disable(); cifrasTeamAnswer(i + 1, acc.concat([null])); });
  $('#turn-h').focus();
}
function cifrasPointsOf(answers, sol, solo){
  if (solo){
    const a = answers[0];
    return [!a ? 0 : a.diff === 0 ? 10 : (a.diff <= 10 || a.diff === sol.diff) ? 7 : 0];
  }
  const diffs = answers.map(a => a ? a.diff : Infinity);
  const min = Math.min(...diffs);
  return diffs.map(d => d === Infinity ? 0 : d === 0 ? 10 : (min > 0 && d === min ? 7 : 0));
}
function entryC(R, answers, pts, sol){
  return { type:'C', points:pts, max: sol.diff === 0 ? 10 : 7,
    detail: answers.map(a => a ? `${a.value}${a.diff ? ` (a ${a.diff})` : ''}` : '—'),
    bestTxt: sol.diff === 0 ? `${R.target} exacto` : `${sol.value} (a ${sol.diff})` };
}
function cifrasResultsHtml(players, answers, pts, sol, target, o){
  const rows = answers.map((a, i) => {
    let badge;
    if (!a) badge = ['neutral', 'Sin resultado'];
    else if (a.diff === 0) badge = ['ok', 'Exacto'];
    else badge = [pts[i] ? 'ok' : 'neutral', `A ${a.diff} del objetivo`];
    const ops = a && a.steps.length ? `<ol class="ops-list">${a.steps.map(s => `<li>${s.a} ${s.op} ${s.b} = ${s.r}</li>`).join('')}</ol>` : '';
    return `<tr><th scope="row">${esc(players[i].name)}</th><td><span class="word">${a ? a.value : '—'}</span><br><span class="badge ${badge[0]}">${badge[1]}</span>${ops}</td><td class="pts">${pts[i]}</td></tr>`;
  }).join('');
  const solHtml = sol.steps.length
    ? `<ol class="sol-steps">${sol.steps.map(s => `<li>${s.a} ${s.op} ${s.b} = ${s.r}</li>`).join('')}</ol>`
    : `<p>Ya estaba entre los números: <strong>${sol.value}</strong>.</p>`;
  return `<div class="results">
    <h3 id="res-h" tabindex="-1">Resultado</h3>
    <table class="res"><thead><tr><th scope="col">${o.who}</th><th scope="col">Resultado</th><th scope="col" class="pts">Puntos</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="panel"><h3>${sol.diff === 0 ? `Así se llega a ${target}` : `El ${target} no se podía conseguir`}</h3>
      ${sol.diff === 0 ? '' : `<p>Lo más cerca posible era <strong>${sol.value}</strong>, a ${sol.diff} del objetivo:</p>`}
      ${solHtml}
      <p class="hint">Es la solución con menos operaciones; puede haber otras.</p></div>
    ${o.footer}</div>`;
}
async function cifrasResults(answers){
  const g = S.game, R = S.round, solo = isSolo();
  $('#clock-host').innerHTML = '';
  $('#tiles').hidden = false;
  $('#play').innerHTML = `<p class="hint" role="status">Calculando la mejor solución…</p>`;
  const sol = await R.solution;
  if (S.round !== R) return;
  const pts = cifrasPointsOf(answers, sol, solo);
  g.history.push(entryC(R, answers, pts, sol));
  recomputeScores(); renderScores(-1);
  $('#play').innerHTML = cifrasResultsHtml(g.players, answers, pts, sol, R.target, { who: solo ? 'Jugador' : 'Equipo', footer:nextButton() });
  bindNext();
  $('#res-h').focus();
  const sum = solo ? `Has sumado ${pts[0]} ${plural(pts[0], 'punto', 'puntos')}.` : resumenEquipos(pts);
  announce(`${sum} ${sol.diff === 0 ? 'La cifra exacta era posible.' : `Lo más cerca posible era ${sol.value}.`}`);
}
