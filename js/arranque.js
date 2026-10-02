'use strict';
/* ================= Salir ================= */
$('#quit-btn').addEventListener('click', () => {
  const d = $('#dlg-quit'), online = !!S.online;
  const wasRunning = !online && S.clock && S.clock.running;
  if (wasRunning) S.clock.pause();
  $('#dlg-quit-p').textContent = online
    ? (O.role === 'host' ? 'Se cerrará la sala para todos los jugadores.' : 'Saldrás de la sala. Podrás volver a entrar con el mismo nombre.')
    : 'Se perderá la puntuación de esta partida.';
  d.returnValue = '';
  d.onclose = () => {
    if (d.returnValue === 'ok'){ if (online) onlineLeave(); renderSetup(); }
    else if (wasRunning && S.clock) S.clock.start();
  };
  if (typeof d.showModal === 'function') d.showModal();
  else if (confirm('¿Salir de la partida?')){ if (online) onlineLeave(); renderSetup(); }
});


/* ================= Arranque ================= */
$('#fs-btn').addEventListener('click', () => {
  try{ if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }catch(_){}
});
window.addEventListener('hashchange', () => { if (!S.online && $('#f-setup')) renderSetup(); });
renderSetup();
loadDict().then(() => {
  const st = $('#dict-status'); if (st) st.textContent = `Diccionario listo: ${fmt(Dict.count)} palabras de 5 a 10 letras.`;
}).catch(() => {
  const st = $('#dict-status'); if (st) st.textContent = 'No se ha podido preparar el diccionario en este navegador. Prueba con una versión más reciente.';
});
