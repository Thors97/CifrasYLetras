'use strict';
/* ================= Resolvedor de cifras ================= */
function solveCifras(nums, target){
  const key = a => a.slice().sort((x,y)=>x-y).join(',');
  const seen = new Set(), reach = new Set();
  (function dfs(arr){
    const k = key(arr); if (seen.has(k)) return; seen.add(k);
    for (const v of arr) reach.add(v);
    const n = arr.length; if (n < 2) return;
    for (let i=0;i<n;i++) for (let j=i+1;j<n;j++){
      const a = Math.max(arr[i],arr[j]), b = Math.min(arr[i],arr[j]);
      const rest = []; for (let t=0;t<n;t++) if (t!==i && t!==j) rest.push(arr[t]);
      const res = [a+b];
      if (a!==b) res.push(a-b);
      if (b>1) res.push(a*b);
      if (b>1 && a%b===0) res.push(a/b);
      for (const r of res){ rest.push(r); dfs(rest); rest.pop(); }
    }
  })(nums.slice());
  let best = null, bestD = Infinity;
  for (const v of reach){ const d = Math.abs(v-target); if (d<bestD || (d===bestD && v<best)){ bestD=d; best=v; } }
  for (let depth=0; depth<nums.length; depth++){
    const fail = new Set(), steps = [];
    const found = (function dfs(arr, left){
      if (arr.includes(best)) return true;
      if (left===0) return false;
      const k = key(arr)+'|'+left; if (fail.has(k)) return false;
      const n = arr.length;
      for (let i=0;i<n;i++) for (let j=i+1;j<n;j++){
        const a = Math.max(arr[i],arr[j]), b = Math.min(arr[i],arr[j]);
        const rest = []; for (let t=0;t<n;t++) if (t!==i && t!==j) rest.push(arr[t]);
        const ops = [['+',a+b]];
        if (a!==b) ops.push(['−',a-b]);
        if (b>1) ops.push(['×',a*b]);
        if (b>1 && a%b===0) ops.push(['÷',a/b]);
        for (const [op,r] of ops){
          steps.push({a,b,op,r}); rest.push(r);
          if (dfs(rest,left-1)) return true;
          rest.pop(); steps.pop();
        }
      }
      fail.add(k); return false;
    })(nums.slice(), depth);
    if (found) return { value:best, diff:bestD, steps:pruneSteps(steps, best) };
  }
  return { value:best, diff:bestD, steps:[] };
}
function pruneSteps(steps, best){
  const out = []; const wanted = [best];
  for (let i=steps.length-1;i>=0;i--){
    const s = steps[i], idx = wanted.indexOf(s.r);
    if (idx>=0){ wanted.splice(idx,1); wanted.push(s.a, s.b); out.unshift(s); }
  }
  return out;
}
function solveAsync(nums, target){
  return new Promise(resolve => {
    let done = false;
    const fallback = () => { if (done) return; done = true; setTimeout(() => resolve(solveCifras(nums, target)), 20); };
    try{
      const src = solveCifras.toString() + '\n' + pruneSteps.toString() + '\nonmessage = e => postMessage(solveCifras(e.data.nums, e.data.target));';
      const url = URL.createObjectURL(new Blob([src], {type:'text/javascript'}));
      const w = new Worker(url);
      const t = setTimeout(() => { try{ w.terminate(); }catch(e){} fallback(); }, 9000);
      w.onmessage = e => { clearTimeout(t); try{ w.terminate(); }catch(_){} URL.revokeObjectURL(url); if (!done){ done = true; resolve(e.data); } };
      w.onerror = e => { if (e && e.preventDefault) e.preventDefault(); clearTimeout(t); try{ w.terminate(); }catch(_){} fallback(); };
      w.postMessage({nums, target});
    }catch(e){ fallback(); }
  });
}
