'use strict';
/* ================= Sorteos ================= */
const VOWEL_BAG = {a:12, e:12, o:9, i:6, u:5};
const CONS_BAG = {s:6, n:5, r:5, d:5, l:4, t:4, c:4, g:2, b:2, m:2, p:2, h:2, f:1, v:1, y:1, q:1, j:1, 'ñ':1, x:1, z:1};
const bagOf = o => shuffle(Object.entries(o).flatMap(([k,n]) => Array(n).fill(k)));
function drawLetters(vowels){
  const v = bagOf(VOWEL_BAG).slice(0, vowels), c = bagOf(CONS_BAG).slice(0, 10 - vowels);
  return shuffle(v.concat(c));
}
const BIG_NUMS = [25, 50, 75, 100];
// big: cuántos números grandes (0 a 4). Sin indicar, salen 6 al azar de todos los números.
function drawNumbers(big){
  const small = []; for (let i=1;i<=10;i++) small.push(i, i);
  let nums;
  if (big == null) nums = shuffle(small.concat(BIG_NUMS)).slice(0, 6);
  else nums = shuffle(shuffle(BIG_NUMS.slice()).slice(0, big).concat(shuffle(small).slice(0, 6 - big)));
  return { nums, target: 100 + rnd(900) };
}
