'use strict';
/* ================= Cómo jugar =================
   Ventana con tres apartados (letras, cifras y en grupo) y un ejemplo de cada prueba. Los ejemplos
   están comprobados con el diccionario y el solucionador del propio juego. */
const AYUDA = {
  letras: ['n', 'a', 'c', 'e', 's', 'l', 't', 'o', 'r', 'i'], palabra: 'cantores', mala: 'escritor',
  nums: [100, 7, 8, 10, 25, 4], target: 952,
  pasos: [[100, '−', 4, 96], [96, '×', 10, 960], [960, '−', 8, 952]]
};
const AYUDA_TABS = [['letras', 'Letras'], ['cifras', 'Cifras'], ['grupo', 'En grupo']];

function ayudaTiles(items, marked){
  return `<ul class="demo-row">${items.map((v, i) => `<li><span class="tile${marked && marked[i] ? ' sel' : ''}">${esc(String(v).toUpperCase())}</span></li>`).join('')}</ul>`;
}
function ayudaLetras(){
  const used = AYUDA.letras.map(() => false);
  for (const ch of AYUDA.palabra){ const i = AYUDA.letras.findIndex((l, k) => l === ch && !used[k]); if (i >= 0) used[i] = true; }
  return `
  <h3>Forma la palabra más larga</h3>
  <ol class="help-steps">
    <li>Quien tiene el turno elige cuántas vocales quiere, de 3 a 6. Salen 10 letras y el resto son consonantes.</li>
    <li>Tienes 30 segundos para formar una palabra de <strong>5 letras o más</strong> con ellas.</li>
    <li>La palabra más larga se lleva <strong>1 punto por letra</strong>. Si hay empate, puntúan todos los empatados.</li>
  </ol>
  <div class="help-example">
    <p class="help-cap">Ejemplo</p>
    ${ayudaTiles(AYUDA.letras)}
    <p>Con estas letras puedes formar <span class="word">${esc(AYUDA.palabra)}</span>, de ${AYUDA.palabra.length} letras. Valdría 8 puntos si nadie hace una palabra más larga:</p>
    ${ayudaTiles(AYUDA.letras, used)}
    <p><span class="word">${esc(AYUDA.mala)}</span> no valdría: necesita dos R y solo hay una. Cada letra se usa tantas veces como aparece.</p>
  </div>
  <h3>Qué palabras valen</h3>
  <ul class="help-list">
    <li>Cualquiera del Diccionario de la lengua española: plurales, femeninos y cualquier forma verbal.</li>
    <li>Se admite el pronombre reflexivo pegado al verbo, como en «levántate», pero no el de complemento directo, como en «cómelo».</li>
    <li>Las tildes no cuentan.</li>
    <li>Puedes escribir la palabra o tocar las letras. Si el juego rechaza una palabra que sí está en el DLE, se puede dar por válida en los resultados.</li>
  </ul>`;
}
function ayudaCifras(){
  return `
  <h3>Llega a la cifra exacta</h3>
  <ol class="help-steps">
    <li>Quien tiene el turno elige cuántos números grandes quiere (25, 50, 75 y 100), de 0 a 4. Salen 6 números y un objetivo entre 100 y 999.</li>
    <li>Tienes 40 segundos para acercarte al objetivo sumando, restando, multiplicando y dividiendo. Cada número se usa <strong>una vez como mucho</strong> y no hace falta usarlos todos.</li>
    <li>Solo valen resultados <strong>enteros y positivos</strong>. La cifra exacta vale <strong>10 puntos</strong>. Si nadie la consigue, la aproximación más cercana vale 7.</li>
  </ol>
  <div class="help-example">
    <p class="help-cap">Ejemplo</p>
    <div class="demo-target">${ayudaTiles(AYUDA.nums)}<p class="demo-goal">Objetivo <span class="tile">${AYUDA.target}</span></p></div>
    <p>Una forma de llegar a ${AYUDA.target}:</p>
    <ol class="sol-steps">${AYUDA.pasos.map(p => `<li>${p[0]} ${p[1]} ${p[2]} = ${p[3]}</li>`).join('')}</ol>
    <p>No hizo falta usar el 7 ni el 25.</p>
  </div>
  <h3>Cómo se juega</h3>
  <ul class="help-list">
    <li>Elige un número, una operación y otro número, en cualquier orden. El resultado aparece como un número nuevo y puedes seguir con él.</li>
    <li>Con el teclado: escribe los números y <kbd>+</kbd> <kbd>−</kbd> <kbd>×</kbd> <kbd>÷</kbd> (o <kbd>*</kbd> y <kbd>/</kbd>). <kbd>Retroceso</kbd> deshace, <kbd>Esc</kbd> cancela e <kbd>Intro</kbd> entrega.</li>
    <li>Al acabar, el juego enseña la solución con menos operaciones, aunque puede haber otras.</li>
  </ul>`;
}
function ayudaGrupo(){
  return `
  <h3>Solo</h3>
  <p>Escribes tu respuesta en la pantalla. En letras sumas 1 punto por letra. En cifras, la aproximación vale 7 puntos si te quedas a 10 o menos del objetivo, o si igualas la mejor posible.</p>
  <h3>Por equipos, con un solo dispositivo</h3>
  <p>De 2 a 6 equipos. Cada equipo apunta su palabra o sus cuentas en papel mientras corre el reloj, y después las introduce en la pantalla para comprobarlas. En cada prueba de letras elige las vocales un equipo distinto.</p>
  <h3>Varios móviles</h3>
  <ul class="help-list">
    <li>Una persona crea la sala y los demás entran con el código de 4 letras o con el enlace. Hacen falta de 2 a 8 jugadores.</li>
    <li>Cada uno responde en su móvil sin ver lo que escriben los demás. Las respuestas se revelan a la vez.</li>
    <li>Quien creó la sala pasa a la siguiente prueba. Si alguien pierde la conexión, puede volver a entrar con el mismo nombre.</li>
  </ul>
  <h3>Con una pantalla grande</h3>
  <ul class="help-list">
    <li>Una tele, un portátil o un proyector enseña el tablero y no juega. Se crea con «Varios móviles» → «Crear una sala en una pantalla grande».</li>
    <li>Los jugadores escanean el código QR con el móvil y responden desde él.</li>
    <li>La pantalla y el primer jugador que entró manejan «Empezar» y «Siguiente».</li>
  </ul>`;
}
const AYUDA_VISTAS = { letras: ayudaLetras, cifras: ayudaCifras, grupo: ayudaGrupo };

function ayudaPestana(tab, focus){
  AYUDA_TABS.forEach(([id]) => {
    const b = $('#help-tab-' + id), on = id === tab;
    b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
  });
  const panel = $('#help-panel');
  panel.setAttribute('aria-labelledby', 'help-tab-' + tab);
  panel.innerHTML = AYUDA_VISTAS[tab]();
  panel.parentElement.scrollTop = 0;
  if (focus) $('#help-tab-' + tab).focus();
}
function abrirAyuda(tab){
  const d = $('#dlg-help'); if (!d || d.open) return;
  store('cyl-ayuda', true); // ya la ha visto: no se vuelve a ofrecer al entrar
  const intro = $('#intro'); if (intro) intro.remove();
  // Si hay una prueba con reloj en un solo dispositivo, se para mientras se lee.
  const wasRunning = !S.online && S.clock && S.clock.running;
  if (wasRunning) S.clock.pause();
  d.onclose = () => { if (wasRunning && S.clock) S.clock.start(); };
  ayudaPestana(tab || 'letras');
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}
(function initAyuda(){
  const d = $('#dlg-help'); if (!d) return;
  $('#help-tabs').innerHTML = AYUDA_TABS.map(([id, txt]) => `<button type="button" role="tab" class="tab" id="help-tab-${id}" aria-controls="help-panel" aria-selected="false" tabindex="-1">${txt}</button>`).join('');
  $('#help-tabs').addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b) ayudaPestana(b.id.replace('help-tab-', '')); });
  $('#help-tabs').addEventListener('keydown', e => {
    const ids = AYUDA_TABS.map(t => t[0]), cur = ids.findIndex(id => $('#help-tab-' + id).getAttribute('aria-selected') === 'true');
    let n = -1;
    if (e.key === 'ArrowRight') n = (cur + 1) % ids.length; else if (e.key === 'ArrowLeft') n = (cur + ids.length - 1) % ids.length;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = ids.length - 1;
    if (n >= 0){ e.preventDefault(); ayudaPestana(ids[n], true); }
  });
  $('#help-close').addEventListener('click', () => d.close());
  d.addEventListener('click', e => { if (e.target === d) d.close(); }); // clic en el fondo
  $('#help-btn').addEventListener('click', () => abrirAyuda());
  document.addEventListener('keydown', e => {
    if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (!d.open && !$('dialog[open]')){ e.preventDefault(); abrirAyuda(); }
  });
})();
