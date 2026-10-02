'use strict';
/* ================= Diccionario ================= */
const Dict = { set:null, variants:null, promise:null, count:0 };
function loadScript(src){ return new Promise((ok, ko) => { const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=ko; document.head.appendChild(s); }); }
async function gunzip(bytes){
  if ('DecompressionStream' in window){
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js');
  return window.pako.ungzip(bytes, {to:'string'});
}
function loadDict(){
  if (Dict.promise) return Dict.promise;
  Dict.promise = (async () => {
    const b64 = window.DICCIONARIO; // lo define diccionario/datos.js
    if (!b64) throw new Error('Falta diccionario/datos.js');
    const bin = atob(b64); const bytes = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    const text = await gunzip(bytes);
    const set = new Set(), variants = new Map();
    let prev = '';
    const lines = text.split('\n');
    for (const ln of lines){
      if (!ln) continue;
      const k = ln.charCodeAt(0) - 48;
      const w = prev.slice(0, k) + ln.slice(1); prev = w;
      const n = w.replace(/[áéíóúü]/g, c => ACC[c]);
      if (n === w){ set.add(n); continue; }
      let e = variants.get(n);
      if (!e){ e = {plain:set.has(n), list:[]}; variants.set(n, e); }
      e.list.push(w); set.add(n);
    }
    Dict.set = set; Dict.variants = variants; Dict.count = set.size;
    return Dict;
  })();
  return Dict.promise;
}
function displayForms(n){
  const e = Dict.variants && Dict.variants.get(n);
  if (!e) return [n];
  return e.plain ? [n, ...e.list] : e.list.slice();
}
const LIDX = c => c === 241 ? 26 : c - 97;
function letterCounts(arr){ const c = new Int8Array(27); for (const ch of arr) c[LIDX(ch.charCodeAt(0))]++; return c; }
function bestWords(letters){
  const base = letterCounts(letters), tmp = new Int8Array(27);
  let best = 0, found = [];
  for (const w of Dict.set){
    const L = w.length;
    if (L < best || L > letters.length) continue;
    tmp.set(base); let ok = true;
    for (let i=0;i<L;i++){ if (--tmp[LIDX(w.charCodeAt(i))] < 0){ ok = false; break; } }
    if (!ok) continue;
    if (L > best){ best = L; found = [w]; } else found.push(w);
  }
  found.sort((a,b) => a.localeCompare(b, 'es'));
  return {len:best, words:found};
}
