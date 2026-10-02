'use strict';
/* ================= Inicio ================= */
function renderSetup(){
  stopClock(); S.game = null; S.round = null; renderScores(); $('#quit-btn').hidden = true;
  const s = S.settings;
  app.innerHTML = `
  <section aria-labelledby="h-setup">
    <h2 id="h-setup">Nueva partida</h2>
    <p class="lead">La palabra más larga y la cifra exacta, con las normas actuales del concurso de La 2.</p>
    <form id="f-setup" novalidate>
      <fieldset class="modes-fs">
        <legend>¿Quién juega?</legend>
        <div class="modes">
          <div class="mode"><input type="radio" name="mode" id="m-solo" value="solo" ${s.mode==='solo'?'checked':''}><label for="m-solo"><strong>Solo</strong><span>Escribes tu respuesta en la pantalla.</span></label></div>
          <div class="mode"><input type="radio" name="mode" id="m-eq" value="equipos" ${s.mode==='equipos'?'checked':''}><label for="m-eq"><strong>Por equipos</strong><span>De 2 a 6 equipos con un solo dispositivo.</span></label></div>
          <div class="mode"><input type="radio" name="mode" id="m-on" value="online" ${s.mode==='online'?'checked':''}><label for="m-on"><strong>Varios móviles</strong><span>Cada jugador con su móvil, en una sala.</span></label></div>
        </div>
      </fieldset>
      <fieldset id="teams-fs" ${s.mode==='equipos'?'':'hidden'}>
        <legend>Equipos</legend>
        <ul class="team-list" id="team-list"></ul>
        <button type="button" class="btn small" id="add-team">Añadir equipo</button>
      </fieldset>
      <fieldset id="online-fs" ${s.mode==='online'?'':'hidden'}>
        <legend>Varios móviles</legend>
        <div class="seg" style="margin-bottom:14px">
          <input type="radio" name="orole" id="or-host" value="host" checked><label for="or-host">Crear una sala</label>
          <input type="radio" name="orole" id="or-join" value="join"><label for="or-join">Unirme a una sala</label>
        </div>
        <div class="field" style="margin-bottom:12px"><label for="o-name">Tu nombre</label>
          <input type="text" id="o-name" maxlength="20" autocomplete="nickname" value="${esc(s.name || '')}"></div>
        <div class="field" id="o-code-f" hidden><label for="o-code">Código de la sala</label>
          <input type="text" id="o-code" class="ans-input" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="o-code-h">
          <p class="hint" id="o-code-h" style="margin-top:6px">Son 4 letras. Te las da quien ha creado la sala.</p></div>
      </fieldset>
      <div id="cfg">
      <fieldset>
        <legend>Número de pruebas</legend>
        <div class="seg">
          ${[4,6,10].map(n => `<input type="radio" name="rounds" id="r-${n}" value="${n}" ${s.rounds===n?'checked':''}><label for="r-${n}">${n}${n===10?' (como en la tele)':''}</label>`).join('')}
        </div>
      </fieldset>
      <fieldset>
        <legend>Pruebas</legend>
        <div class="seg">
          <input type="radio" name="kind" id="k-alt" value="alternas" ${s.kind==='alternas'?'checked':''}><label for="k-alt">Letras y cifras</label>
          <input type="radio" name="kind" id="k-l" value="letras" ${s.kind==='letras'?'checked':''}><label for="k-l">Solo letras</label>
          <input type="radio" name="kind" id="k-c" value="cifras" ${s.kind==='cifras'?'checked':''}><label for="k-c">Solo cifras</label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Tiempo</legend>
        <div class="seg">
          <input type="radio" name="time" id="t-of" value="oficial" ${s.time==='oficial'?'checked':''}><label for="t-of">Oficial: 30 y 40 s</label>
          <input type="radio" name="time" id="t-do" value="doble" ${s.time==='doble'?'checked':''}><label for="t-do">Doble: 60 y 80 s</label>
          <input type="radio" name="time" id="t-li" value="libre" ${s.time==='libre'?'checked':''}><label for="t-li">Sin límite</label>
        </div>
      </fieldset>
      </div>
      <label class="check"><input type="checkbox" id="sound" ${s.sound?'checked':''}> Sonido del reloj</label>
      <p class="msg bad" id="setup-msg" role="alert"></p>
      <button type="submit" class="btn primary" id="go">Empezar partida</button>
    </form>
    <details class="rules">
      <summary>Normas del juego</summary>
      <h3>Letras: la palabra más larga</h3>
      <ul>
        <li>Quien tiene el turno elige cuántas vocales quiere, de 3 a 6. Salen 10 letras y el resto son consonantes.</li>
        <li>Hay 30 segundos para formar la palabra más larga, con 5 letras como mínimo. Cada letra se puede usar tantas veces como aparece.</li>
        <li>Vale cualquier palabra del Diccionario de la lengua española, también plurales, femeninos y cualquier forma verbal. Se admite el pronombre reflexivo pegado al verbo, como en «levántate», pero no el de complemento directo, como en «cómelo». Las tildes no cuentan.</li>
        <li>La palabra más larga se lleva 1 punto por letra. Si hay empate, puntúan todos los empatados.</li>
      </ul>
      <h3>Cifras: la cifra exacta</h3>
      <ul>
        <li>Salen 6 números (del 1 al 10, 25, 50, 75 y 100) y un objetivo entre 100 y 999.</li>
        <li>Hay 40 segundos para acercarse sumando, restando, multiplicando y dividiendo. Cada número se usa una vez como mucho y no hace falta usarlos todos. Solo valen resultados enteros y positivos.</li>
        <li>La cifra exacta vale 10 puntos. Si nadie la consigue, la aproximación más cercana vale 7. Los empates puntúan para todos.</li>
      </ul>
      <h3>Jugando solo</h3>
      <ul>
        <li>En letras sumas 1 punto por letra de tu palabra válida.</li>
        <li>En cifras no hay rival con quien comparar: la aproximación vale 7 puntos si te quedas a 10 o menos del objetivo, o si igualas la mejor aproximación posible.</li>
      </ul>
      <h3>Varios móviles</h3>
      <ul>
        <li>Uno crea la sala y los demás entran con el código de 4 letras o con el enlace. Hacen falta de 2 a 8 jugadores.</li>
        <li>Cada uno responde en su móvil sin ver lo que escriben los demás. Al acabar el tiempo, o cuando todos han entregado, se revelan las respuestas a la vez.</li>
        <li>Se puntúa como por equipos: gana la prueba quien tiene la palabra más larga o el número más cercano, y los empates puntúan para todos. En cada prueba de letras elige las vocales un jugador distinto.</li>
        <li>Quien crea la sala maneja el paso entre pruebas y puede dar por válida una palabra que el diccionario rechace. Si alguien pierde la conexión, puede volver a entrar con el mismo nombre.</li>
      </ul>
      <h3>Diccionario</h3>
      <ul>
        <li>El juego lleva su propio diccionario, hecho a partir del lemario actual del DLE con sus plurales, femeninos y conjugaciones. Funciona sin conexión.</li>
        <li>Si rechaza una palabra que sí aparece en el DLE, podéis darla por válida en los resultados de la prueba.</li>
      </ul>
    </details>
    <p class="status" id="dict-status" aria-live="polite">${Dict.set ? `Diccionario listo: ${fmt(Dict.count)} palabras de 5 a 10 letras.` : 'Preparando el diccionario…'}</p>
  </section>`;
  const list = $('#team-list');
  const drawTeams = () => {
    list.innerHTML = S.settings.teams.map((t, i) => `
      <li><label class="sr-only" for="team-${i}">Nombre del equipo ${i+1}</label>
      <input type="text" id="team-${i}" value="${esc(t)}" maxlength="24" autocomplete="off">
      ${S.settings.teams.length > 2 ? `<button type="button" class="btn small" data-rm="${i}" aria-label="Quitar ${esc(t || 'equipo ' + (i+1))}">Quitar</button>` : ''}</li>`).join('');
    $('#add-team').disabled = S.settings.teams.length >= 6;
  };
  const syncTeams = () => { S.settings.teams = $$('input[type=text]', list).map(i => i.value); };
  drawTeams();
  list.addEventListener('input', syncTeams);
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-rm]'); if (!b) return;
    syncTeams(); S.settings.teams.splice(+b.dataset.rm, 1); drawTeams();
    const last = $$('input[type=text]', list).pop(); if (last) last.focus();
  });
  $('#add-team').addEventListener('click', () => {
    syncTeams(); if (S.settings.teams.length >= 6) return;
    S.settings.teams.push('Equipo ' + (S.settings.teams.length + 1)); drawTeams();
    const last = $$('input[type=text]', list).pop(); last.focus(); last.select();
  });
  const syncSetup = () => {
    const mode = $('input[name=mode]:checked').value, join = mode === 'online' && $('#or-join').checked;
    $('#teams-fs').hidden = mode !== 'equipos';
    $('#online-fs').hidden = mode !== 'online';
    $('#o-code-f').hidden = !join;
    $('#cfg').hidden = join;
    $('#go').textContent = mode === 'online' ? (join ? 'Unirme a la sala' : 'Crear la sala') : 'Empezar partida';
    $('#setup-msg').textContent = '';
  };
  $$('input[name=mode], input[name=orole]').forEach(r => r.addEventListener('change', syncSetup));
  const hc = hashCode();
  if (hc){ $('#m-on').checked = true; $('#or-join').checked = true; $('#o-code').value = hc; }
  syncSetup();
  $('#f-setup').addEventListener('submit', e => {
    e.preventDefault();
    syncTeams();
    const f = new FormData(e.target);
    Object.assign(S.settings, { mode:f.get('mode'), rounds:+f.get('rounds'), kind:f.get('kind'), time:f.get('time'), sound:$('#sound').checked });
    if (S.settings.mode === 'online'){
      const name = $('#o-name').value.trim().replace(/\s+/g, ' '), join = $('#or-join').checked;
      if (!name){ $('#setup-msg').textContent = 'Escribe tu nombre.'; $('#o-name').focus(); return; }
      let code = '';
      if (join){
        code = $('#o-code').value.toUpperCase().replace(/[^A-Z]/g, '');
        if (code.length !== 4){ $('#setup-msg').textContent = 'El código de la sala tiene 4 letras.'; $('#o-code').focus(); return; }
      }
      S.settings.name = name; store('cyl-ajustes', S.settings); unlockAudio();
      if (join) onlineJoin(code, name); else onlineHost(name);
      return;
    }
    if (S.settings.mode === 'equipos'){
      const names = S.settings.teams.map(t => t.trim());
      if (names.some(n => !n)){ $('#setup-msg').textContent = 'Pon nombre a todos los equipos.'; $$('input[type=text]', list).find(i => !i.value.trim()).focus(); return; }
      const low = names.map(n => n.toLowerCase());
      if (new Set(low).size !== low.length){ $('#setup-msg').textContent = 'Cada equipo necesita un nombre distinto.'; return; }
      S.settings.teams = names;
    }
    store('cyl-ajustes', S.settings);
    unlockAudio();
    newGame();
  });
  focusHeading();
}

function newGame(){
  const s = S.settings;
  const players = s.mode === 'solo' ? [{name:'Tú', score:0}] : s.teams.map(n => ({name:n, score:0}));
  const plan = [];
  for (let i=0;i<s.rounds;i++) plan.push(s.kind==='letras' ? 'L' : s.kind==='cifras' ? 'C' : (i%2===0 ? 'L' : 'C'));
  S.game = { players, plan, idx:0, history:[], letterTurns:0 };
  $('#quit-btn').hidden = false;
  startRound();
}
function startRound(){
  stopClock();
  const type = S.game.plan[S.game.idx];
  S.round = { type };
  renderScores();
  if (type === 'L') letrasChoose(); else cifrasPrepare();
}
function roundHead(){
  const t = S.round.type, n = S.game.idx + 1, tot = S.game.plan.length;
  return `<div class="round-head"><h2 id="h-round"><span class="kind ${t==='L'?'l':'c'}">${t==='L'?'Letras':'Cifras'}</span> <span class="count">Prueba ${n} de ${tot}</span></h2></div>`;
}
function nextButton(){
  const last = S.game.idx >= S.game.plan.length - 1;
  return `<div class="row next-row"><button type="button" class="btn primary" id="next">${last ? 'Ver la clasificación final' : 'Siguiente prueba'}</button></div>`;
}
function bindNext(){
  $('#next').addEventListener('click', () => {
    if (S.game.idx >= S.game.plan.length - 1) renderFinal();
    else { S.game.idx++; startRound(); }
  });
}
