'use strict';
/* ================= Tema claro / oscuro =================
   Se carga en el <head> para aplicar el tema antes de pintar la página.
   'auto' sigue la preferencia del sistema; 'claro' y 'oscuro' la fuerzan. */
const TEMAS = ['auto', 'claro', 'oscuro'];
const TEMA_TXT = { auto:'Automático', claro:'Claro', oscuro:'Oscuro' };
const ICONOS = {
  auto:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  claro:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  oscuro:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>'
};
function leerTema(){ try{ const t = localStorage.getItem('cyl-tema'); return TEMAS.includes(t) ? t : 'auto'; }catch(e){ return 'auto'; } }
function aplicarTema(t){
  const root = document.documentElement;
  if (t === 'claro') root.setAttribute('data-theme', 'light');
  else if (t === 'oscuro') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  const b = document.getElementById('theme-btn');
  if (b){
    b.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[t]}</svg>`;
    b.setAttribute('aria-label', `Tema: ${TEMA_TXT[t]}. Cambiar tema`); b.title = `Tema: ${TEMA_TXT[t]}`;
  }
}
aplicarTema(leerTema());
document.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('theme-btn'); if (!b) return;
  aplicarTema(leerTema());
  b.addEventListener('click', () => {
    const t = TEMAS[(TEMAS.indexOf(leerTema()) + 1) % TEMAS.length];
    try{ localStorage.setItem('cyl-tema', t); }catch(e){}
    aplicarTema(t);
  });
});
