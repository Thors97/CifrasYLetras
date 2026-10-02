'use strict';
/* ================= Utilidades ================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(pointer: fine)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => Math.floor(Math.random()*n);
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function announce(msg, urgent){ const el = urgent ? $('#alert') : $('#live'); el.textContent=''; setTimeout(()=>{ el.textContent = msg; }, 40); }
const ACC = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','à':'a','è':'e','ì':'i','ò':'o','ù':'u','ï':'i','â':'a','ê':'e','î':'i','ô':'o','û':'u'};
function normWord(s){ return s.normalize('NFC').toLowerCase().replace(/\s+/g,'').replace(/[áéíóúüàèìòùïâêîôû]/g, c => ACC[c]); }
const plural = (n, one, many) => n===1 ? one : many;
const fmt = n => n.toLocaleString('es-ES');
const OPWORD = {'+':'más','−':'menos','×':'por','÷':'entre'};
function store(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function restore(k){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } }

/* ================= Sonido ================= */
let audioCtx = null;
function beep(freq=880, dur=0.12, vol=0.12){
  if (!S.settings.sound) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+dur+0.02);
  }catch(e){}
}

function unlockAudio(){ try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); }catch(_){} }
