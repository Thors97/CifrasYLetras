'use strict';
/* ================= Temas =================
   Se carga en el <head> para aplicar el tema antes de pintar la página.
   'auto' sigue la preferencia del sistema; los demás la fuerzan. Cada tema define sus colores en
   css/estilos.css con [data-theme="..."] (el claro es el de :root). Los colores de la muestra
   son solo para la ventana de elección. */
const TEMAS = [
  { id:'auto',      nombre:'Automático',     desc:'Sigue el modo claro u oscuro de tu dispositivo.', attr:null,        muestra:['#E8ECF5', '#131F49', '#0D1636', '#F4BE3A', '#C9362D'] },
  { id:'claro',     nombre:'Claro',          desc:'Azul marino sobre fondo claro.',                  attr:'light',     muestra:['#E8ECF5', '#FFFFFF', '#1B2A6B', '#F1B322', '#C13229'] },
  { id:'oscuro',    nombre:'Oscuro',         desc:'Azul noche, cómodo con poca luz.',                attr:'dark',      muestra:['#0D1636', '#16224D', '#3048B0', '#F4BE3A', '#C9362D'] },
  { id:'bosque',    nombre:'Bosque',         desc:'Claro, con verdes.',                              attr:'bosque',    muestra:['#E5EEE7', '#FFFFFF', '#1E5A3A', '#E9B22C', '#B5392B'] },
  { id:'atardecer', nombre:'Atardecer',      desc:'Claro y cálido, tonos tierra.',                   attr:'atardecer', muestra:['#F5EADC', '#FFFBF5', '#8A3B12', '#EDA826', '#B83A22'] },
  { id:'violeta',   nombre:'Violeta',        desc:'Oscuro, con morados.',                            attr:'violeta',   muestra:['#150F2B', '#1F1740', '#6A4FE0', '#F4BE3A', '#C9362D'] },
  { id:'contraste', nombre:'Alto contraste', desc:'Negro, blanco y amarillo, para ver mejor.',       attr:'contraste', muestra:['#000000', '#FFFFFF', '#FFD400', '#FFD400', '#C8102E'] }
];
const PALETA = '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16" cy="10" r="1.2" fill="currentColor"/><path d="M12 21c-1.5 0-2-1.3-1.4-2.4.7-1.2.2-2.6-1.4-2.6H8"/>';
const temaPorId = id => TEMAS.find(t => t.id === id) || TEMAS[0];
function leerTema(){ try{ return temaPorId(localStorage.getItem('cyl-tema')).id; }catch(e){ return 'auto'; } }
function aplicarTema(id){
  const t = temaPorId(id), root = document.documentElement;
  if (t.attr) root.setAttribute('data-theme', t.attr); else root.removeAttribute('data-theme');
  const b = document.getElementById('theme-btn');
  if (b){
    b.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PALETA}</svg>`;
    b.setAttribute('aria-label', `Tema: ${t.nombre}. Elegir tema`); b.title = `Tema: ${t.nombre}`;
  }
}
aplicarTema(leerTema());

document.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('theme-btn'), d = document.getElementById('dlg-theme'), box = document.getElementById('theme-opts');
  if (!b || !d || !box) return;
  aplicarTema(leerTema());
  const dibujar = () => {
    const actual = leerTema();
    box.innerHTML = TEMAS.map(t => `<div class="theme-opt"><input type="radio" name="tema" id="tema-${t.id}" value="${t.id}" ${t.id === actual ? 'checked' : ''}>
      <label for="tema-${t.id}"><span class="sw" aria-hidden="true">${t.muestra.map(c => `<i style="background:${c}"></i>`).join('')}</span>
      <span class="tx"><strong>${t.nombre}</strong><small>${t.desc}</small></span></label></div>`).join('');
  };
  b.addEventListener('click', () => {
    dibujar();
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    const marcado = box.querySelector('input:checked'); if (marcado) marcado.focus();
  });
  box.addEventListener('change', e => {
    const id = e.target.value;
    try{ localStorage.setItem('cyl-tema', id); }catch(_){}
    aplicarTema(id);
  });
  document.getElementById('theme-close').addEventListener('click', () => d.close());
  d.addEventListener('click', e => { if (e.target === d) d.close(); }); // clic en el fondo
});
