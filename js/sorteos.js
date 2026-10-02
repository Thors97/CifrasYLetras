'use strict';
/* ================= Sorteos ================= */
const VOWEL_BAG = {a:12, e:12, o:9, i:6, u:5};
const CONS_BAG = {s:6, n:5, r:5, d:5, l:4, t:4, c:4, g:2, b:2, m:2, p:2, h:2, f:1, v:1, y:1, q:1, j:1, 'ñ':1, x:1, z:1};
const bagOf = o => shuffle(Object.entries(o).flatMap(([k,n]) => Array(n).fill(k)));
function drawLetters(vowels){
  const v = bagOf(VOWEL_BAG).slice(0, vowels), c = bagOf(CONS_BAG).slice(0, 10 - vowels);
  return shuffle(v.concat(c));
}
function drawNumbers(){
  const pool = []; for (let i=1;i<=10;i++) pool.push(i, i); pool.push(25, 50, 75, 100);
  shuffle(pool);
  return { nums: pool.slice(0, 6), target: 100 + rnd(900) };
}
