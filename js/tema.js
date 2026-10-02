'use strict';
/* ================= Tema claro / oscuro =================
   Se carga en el <head> para aplicar el tema antes de pintar la página.
   'auto' sigue la preferencia del sistema; 'claro' y 'oscuro' la fuerzan. */
const TEMAS = ['auto', 'claro', 'oscuro'];
const TEMA_TXT = { auto:'Automático', claro:'Claro', oscuro:'Oscuro' };
function leerTema(){ try{ const t = localStorage.getItem('cyl-tema'); return TEMAS.includes(t) ? t : 'auto'; }catch(e){ return 'auto'; } }
function aplicarTema(t){
  const root = document.documentElement;
  if (t === 'claro') root.setAttribute('data-theme', 'light');
  else if (t === 'oscuro') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  const b = document.getElementById('theme-btn');
  if (b){ b.textContent = 'Tema: ' + TEMA_TXT[t]; b.setAttribute('aria-label', `Tema: ${TEMA_TXT[t]}. Cambiar tema`); }
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
