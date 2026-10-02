'use strict';
/* ================= Varios móviles: conexión directa entre móviles (WebRTC con PeerJS) ================= */
const PEER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
const ROOM_PREFIX = 'cifras-letras-';
const CODE_CHARS = 'BCDFGHJKMNPRSTVXZ';
const MAX_PLAYERS = 8, GRACE_MS = 3500;
const O = { pantalla:false, mute:false, role:null, peer:null, conn:null, code:'', name:'', me:-1, P:null, screen:'', leaving:false, wake:null, focusSel:null };
let H = null; // estado del anfitrión: es quien reparte, comprueba y puntúa

function hashCode(){ const m = /#sala=([A-Za-z]{4})/.exec(location.hash); return m ? m[1].toUpperCase() : null; }
function roomLink(code){ return location.href.split('#')[0] + '#sala=' + code; }
function newCode(){ let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[rnd(CODE_CHARS.length)]; return c; }
function peerOptions(){
  const q = new URLSearchParams(location.search), o = { debug:0 };
  if (q.get('peerhost')){ o.host = q.get('peerhost'); o.port = +(q.get('peerport') || 9000); o.path = q.get('peerpath') || '/'; o.secure = q.get('peersecure') === '1'; }
  return o;
}
async function loadPeerLib(){ if (window.Peer) return; await loadScript(PEER_SRC); if (!window.Peer) throw new Error('Peer'); }
async function requestWake(){
  try{ if ('wakeLock' in navigator && !O.wake){ O.wake = await navigator.wakeLock.request('screen'); O.wake.addEventListener('release', () => { O.wake = null; }); } }catch(_){}
}
function releaseWake(){ try{ if (O.wake) O.wake.release(); }catch(_){} O.wake = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.online) requestWake(); });

function secsFor(type){
  const t = H.settings.time;
  if (t === 'libre') return 0;
  return (type === 'L' ? 30 : 40) * (t === 'doble' ? 2 : 1);
}
// Cuando el anfitrión es una pantalla (tele o portátil) no juega: los jugadores son todos invitados.
// El «mando» de la partida lo tienen la pantalla y el primer jugador de la lista.
const firstGuest = () => H.pantalla ? 0 : 1;
const adminIdx = () => H.pantalla ? -1 : 0;
const isAdmin = i => i === adminIdx() || (H.pantalla && i === 0);
// Modo pantalla: letra y fichas grandes, y botón de pantalla completa.
function setPantallaUI(on){
  document.body.classList.toggle('pantalla', !!on);
  const b = $('#fs-btn'); if (b) b.hidden = !(on && document.fullscreenEnabled);
  if (!on && document.fullscreenElement){ try{ document.exitFullscreen(); }catch(_){} }
}
const canCtl = () => O.role === 'host' || !!(O.P && O.P.pantalla && O.me === 0);
function focusPrimary(sel, fallback){
  const b = O.pantalla ? $(sel) : null; // en una tele el mando solo puede pulsar el botón enfocado
  if (b) b.focus(); else if (fallback) fallback();
}
function qrSvg(text){
  try{
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(), m = 4; let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" role="img" aria-label="Código QR para entrar en la sala" shape-rendering="crispEdges"><rect class="qr-bg" width="100%" height="100%"/><path class="qr-fg" d="${d}"/></svg>`;
  }catch(e){ return ''; }
}
function onlineSend(m){
  if (O.role === 'host'){ if (H) hostMsg(adminIdx(), m); return; }
  try{ if (O.conn && O.conn.open) O.conn.send(m); }catch(_){}
}

/* ---------- Pantallas de estado ---------- */
function onlineConnecting(text){
  stopClock(); S.game = null; renderScores();
  app.innerHTML = `<section aria-labelledby="h-conn"><h2 id="h-conn">Sala</h2><p class="lead" role="status">${esc(text)}</p></section>`;
  focusHeading();
}
function onlineTeardown(){
  O.leaving = true; releaseWake();
  if (H){ clearTimeout(H.timer); H.conns.forEach(c => { try{ if (c) c.close(); }catch(_){} }); }
  try{ if (O.conn) O.conn.close(); }catch(_){}
  try{ if (O.peer) O.peer.destroy(); }catch(_){}
  O.peer = null; O.conn = null; O.P = null; O.screen = '';
}
function onlineLeave(){
  onlineTeardown(); H = null; O.role = null; S.online = false; S.game = null; S.round = null;
  O.pantalla = false; O.mute = false; setPantallaUI(false);
  if (hashCode()) history.replaceState(null, '', location.pathname + location.search);
}
function onlineFail(msg, retry, title){
  onlineTeardown(); stopClock(); S.game = null; renderScores(); $('#quit-btn').hidden = true;
  app.innerHTML = `<section aria-labelledby="h-fail"><h2 id="h-fail">${esc(title || 'No se ha podido conectar')}</h2><p class="lead">${esc(msg)}</p>
    <div class="row">${retry ? '<button type="button" class="btn primary" id="o-retry">Volver a intentarlo</button>' : ''}<button type="button" class="btn" id="o-back">Volver al inicio</button></div></section>`;
  if (retry) $('#o-retry').addEventListener('click', () => O.role === 'host' ? onlineHost(O.name, O.pantalla) : onlineJoin(O.code, O.name));
  $('#o-back').addEventListener('click', () => { onlineLeave(); renderSetup(); });
  focusHeading(); announce(msg, true);
}
function onlineLost(){
  stopClock(); releaseWake();
  app.innerHTML = `<section aria-labelledby="h-lost"><h2 id="h-lost">Conexión perdida</h2>
    <p class="lead">Has perdido la conexión con la sala ${esc(O.code)}. Si la partida sigue en marcha, puedes volver a entrar con el mismo nombre y continuarás donde estabas.</p>
    <div class="row"><button type="button" class="btn primary" id="o-retry">Volver a conectar</button><button type="button" class="btn" id="o-back">Salir</button></div></section>`;
  $('#o-retry').addEventListener('click', () => onlineJoin(O.code, O.name));
  $('#o-back').addEventListener('click', () => { onlineLeave(); renderSetup(); });
  focusHeading(); announce('Conexión perdida con la sala.', true);
}

/* ---------- Anfitrión ---------- */
async function onlineHost(name, pantalla){
  onlineTeardown();
  S.online = true; O.role = 'host'; O.name = name; O.leaving = false; O.pantalla = !!pantalla; O.mute = false;
  setPantallaUI(!!pantalla);
  $('#quit-btn').hidden = false;
  onlineConnecting('Creando la sala…');
  try{ await Promise.all([loadPeerLib(), loadDict()]); }
  catch(e){ return onlineFail('No se ha podido cargar el servicio de conexión. Comprueba tu conexión a internet.', true, 'No se ha podido crear la sala'); }
  const s = S.settings, plan = [];
  for (let i = 0; i < s.rounds; i++) plan.push(s.kind === 'letras' ? 'L' : s.kind === 'cifras' ? 'C' : (i % 2 === 0 ? 'L' : 'C'));
  H = { pantalla:!!pantalla, settings:{ rounds:s.rounds, kind:s.kind, time:s.time }, players: pantalla ? [] : [{ name, connected:true, score:0 }], conns: pantalla ? [] : [null],
        phase:'lobby', plan, idx:0, history:[], turns:0, chooser:0, round:null, answers:[], submitted:[], results:null, rv:0, timer:null, solution:null, finishing:false, code:'' };
  openHostPeer(0);
}
function openHostPeer(attempt){
  const code = newCode();
  let opened = false;
  const peer = new Peer(ROOM_PREFIX + code, peerOptions());
  O.peer = peer;
  const fail = (msg) => { clearTimeout(to); onlineFail(msg, true, 'No se ha podido crear la sala'); };
  const to = setTimeout(() => { if (!opened) fail('No se puede contactar con el servicio de salas. Si has abierto el juego dentro de Claude, este modo no funciona ahí: hay que alojarlo en tu propia página.'); }, 12000);
  peer.on('open', () => { opened = true; clearTimeout(to); O.code = code; H.code = code; requestWake(); hostBroadcast(); });
  peer.on('connection', conn => hostAccept(conn));
  peer.on('error', err => {
    if (O.leaving) return;
    if (!opened && err.type === 'unavailable-id' && attempt < 5){ clearTimeout(to); try{ peer.destroy(); }catch(_){} openHostPeer(attempt + 1); return; }
    if (!opened) fail('No se ha podido crear la sala (' + err.type + ').');
    else announce('Problema de conexión con el servicio de salas.', true);
  });
  peer.on('disconnected', () => { if (!O.leaving && opened){ try{ peer.reconnect(); }catch(_){} } });
}
function hostState(){
  const R = H.round;
  return {
    pantalla:H.pantalla, phase:H.phase, code:H.code, settings:H.settings, plan:H.plan, idx:H.idx, chooser:H.chooser, rv:H.rv,
    players:H.players.map(p => ({ name:p.name, connected:p.connected, score:p.score })),
    submitted:H.submitted.slice(),
    round: R ? { type:R.type, letters:R.letters, vowels:R.vowels, nums:R.nums, target:R.target, secs:R.secs, remaining: R.deadlineAt ? Math.max(0, R.deadlineAt - Date.now()) : 0 } : null,
    results: H.phase === 'results' ? H.results : null,
    history:H.history,
    screen: `${H.phase}|${H.idx}|${H.rv}|${H.phase === 'choose' ? H.chooser : ''}|${H.phase === 'lobby' ? H.players.map(p => p.connected ? 1 : 0).join('') : ''}`
  };
}
function hostBroadcast(){
  if (!H || !O.code) return;
  const st = hostState();
  H.conns.forEach(c => { try{ if (c && c.open) c.send({ t:'state', s:st }); }catch(_){} });
  onlineRender(st);
}
function hostAccept(conn){
  conn.on('data', d => hostData(conn, d));
  conn.on('close', () => hostDrop(conn));
  conn.on('error', () => hostDrop(conn));
}
function hostData(conn, d){
  if (!H || !d || typeof d !== 'object') return;
  if (d.t === 'hello') return hostHello(conn, String(d.name || ''));
  const i = H.conns.indexOf(conn);
  if (i >= firstGuest()) hostMsg(i, d);
}
function hostReject(conn, why){
  try{ conn.send({ t:'reject', why }); }catch(_){}
  setTimeout(() => { try{ conn.close(); }catch(_){} }, 400);
}
function hostHello(conn, raw){
  const name = raw.trim().replace(/\s+/g, ' ').slice(0, 20);
  if (!name) return hostReject(conn, 'name');
  const low = name.toLowerCase();
  const i = H.players.findIndex(p => p.name.toLowerCase() === low);
  if (i >= 0 && i < firstGuest()) return hostReject(conn, 'taken');
  if (i >= firstGuest()){
    const old = H.conns[i];
    const alive = old && old !== conn && old.open && H.players[i].connected;
    if (alive && H.phase === 'lobby') return hostReject(conn, 'taken');
    if (old && old !== conn){ try{ old.close(); }catch(_){} }
    H.conns[i] = conn; H.players[i].connected = true;
    announce(`${name} ha vuelto a la sala.`);
    return hostBroadcast();
  }
  if (H.phase !== 'lobby') return hostReject(conn, 'started');
  if (H.players.length >= MAX_PLAYERS) return hostReject(conn, 'full');
  H.players.push({ name, connected:true, score:0 }); H.conns.push(conn);
  announce(`${name} se ha unido a la sala.`);
  hostBroadcast();
}
function hostDrop(conn){
  if (!H) return;
  const i = H.conns.indexOf(conn);
  if (i < firstGuest()) return;
  H.conns[i] = null; H.players[i].connected = false;
  announce(`${H.players[i].name} se ha desconectado.`);
  if (H.phase === 'play' && H.players.every((p, j) => !p.connected || H.submitted[j])) hostFinish();
  else hostBroadcast();
}
function hostMsg(i, d){
  switch (d.t){
    case 'vowels': return hostVowels(i, +d.n);
    case 'answer': if (i >= 0) hostAnswer(i, d); return;
    case 'start': if (isAdmin(i)) hostStart(); return;
    case 'force': if (isAdmin(i)) hostFinish(); return;
    case 'override': if (isAdmin(i)) hostOverride(+d.i); return;
    case 'next': if (isAdmin(i)) hostNext(); return;
    case 'restart': if (isAdmin(i)) hostRestart(); return;
  }
}
function hostStart(){
  if (H.phase !== 'lobby' || H.players.filter(p => p.connected).length < 2) return;
  const keep = H.players.map(p => p.connected);
  H.players = H.players.filter((_, k) => keep[k]); H.conns = H.conns.filter((_, k) => keep[k]);
  H.idx = 0; H.turns = 0; H.history = []; hostRecompute();
  hostStartRound();
}
function hostStartRound(){
  clearTimeout(H.timer);
  H.rv = 0; H.results = null; H.finishing = false; H.solution = null;
  H.submitted = H.players.map(() => false); H.answers = H.players.map(() => null);
  const type = H.plan[H.idx];
  H.round = { type };
  if (type === 'L'){
    let k = H.turns % H.players.length, guard = 0;
    while (!H.players[k].connected && guard++ < H.players.length){ H.turns++; k = H.turns % H.players.length; }
    H.chooser = k; H.phase = 'choose';
  } else {
    const { nums, target } = drawNumbers();
    Object.assign(H.round, { nums, target });
    H.solution = solveAsync(nums, target);
    hostDeal();
  }
  hostBroadcast();
}
function hostDeal(){
  const R = H.round, secs = secsFor(R.type), allow = R.type === 'L' ? 1500 : 2300;
  R.secs = secs;
  R.deadlineAt = secs ? Date.now() + allow + secs * 1000 : 0;
  H.phase = 'play';
  clearTimeout(H.timer);
  if (secs) H.timer = setTimeout(hostFinish, allow + secs * 1000 + GRACE_MS);
}
function hostVowels(i, n){
  if (H.phase !== 'choose' || !(n >= 3 && n <= 6)) return;
  if (!(i === H.chooser || (isAdmin(i) && !H.players[H.chooser].connected))) return;
  H.turns++;
  H.round.vowels = n; H.round.letters = drawLetters(n);
  hostDeal(); hostBroadcast();
}
function verifyAnswer(nums, target, ans){
  if (!ans || !Array.isArray(ans.steps) || ans.steps.length > 5) return null;
  const pool = nums.slice(), steps = [];
  for (const s of ans.steps){
    const a = +s.a, b = +s.b, op = s.op;
    if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
    const ia = pool.indexOf(a); if (ia < 0) return null; pool.splice(ia, 1);
    const ib = pool.indexOf(b); if (ib < 0) return null; pool.splice(ib, 1);
    let r;
    if (op === '+') r = a + b;
    else if (op === '×') r = a * b;
    else if (op === '−'){ if (a <= b) return null; r = a - b; }
    else if (op === '÷'){ if (b === 0 || a % b !== 0) return null; r = a / b; }
    else return null;
    if (!(r > 0) || !Number.isInteger(r)) return null;
    pool.push(r); steps.push({ a, b, op, r });
  }
  let best = null;
  for (const v of pool){ const d = Math.abs(v - target); if (!best || d < best.diff) best = { value:v, diff:d }; }
  const pref = +ans.value;
  if (pool.includes(pref) && Math.abs(pref - target) === best.diff) best.value = pref;
  return { value:best.value, diff:best.diff, steps };
}
function hostAnswer(i, d){
  if (H.phase !== 'play' || H.submitted[i]) return;
  const R = H.round;
  if (R.type === 'L'){ if (d.k !== 'L') return; H.answers[i] = String(d.word || '').slice(0, 30); }
  else { if (d.k !== 'C') return; H.answers[i] = verifyAnswer(R.nums, R.target, d.ans); }
  H.submitted[i] = true;
  if (H.players.every((p, j) => !p.connected || H.submitted[j])) hostFinish(); else hostBroadcast();
}
function hostRecompute(){
  H.players.forEach((p, i) => { p.score = H.history.reduce((s, h) => s + (h.points[i] || 0), 0); });
}
async function hostFinish(){
  const h = H;
  if (!h || h.phase !== 'play' || h.finishing) return;
  h.finishing = true; clearTimeout(h.timer);
  const R = h.round;
  if (R.type === 'L'){
    await loadDict();
    if (H !== h) return;
    const answers = h.players.map((_, i) => checkWord(h.answers[i] || '', R.letters));
    const best = bestWords(R.letters);
    const pts = letrasPointsOf(answers, false);
    h.results = { answers, pts, best:{ len:best.len, count:best.words.length, words:best.words.slice(0, 40) } };
    h.history.push(entryL(answers, pts, h.results.best));
  } else {
    const sol = await h.solution;
    if (H !== h) return;
    const answers = h.answers.slice();
    const pts = cifrasPointsOf(answers, sol, false);
    h.results = { answers, pts, sol };
    h.history.push(entryC(R, answers, pts, sol));
  }
  hostRecompute();
  h.phase = 'results'; h.rv++;
  hostBroadcast();
}
function hostOverride(i){
  if (H.phase !== 'results' || H.round.type !== 'L') return;
  const a = H.results.answers[i];
  if (!a || a.status !== 'dict') return;
  a.override = !a.override;
  H.results.pts = letrasPointsOf(H.results.answers, false);
  H.history[H.history.length - 1] = entryL(H.results.answers, H.results.pts, H.results.best);
  hostRecompute(); H.rv++;
  hostBroadcast();
}
function hostNext(){
  if (H.phase !== 'results') return;
  if (H.idx >= H.plan.length - 1){ H.phase = 'final'; H.rv++; hostRecompute(); hostBroadcast(); }
  else { H.idx++; hostStartRound(); }
}
function hostRestart(){
  if (H.phase !== 'final') return;
  clearTimeout(H.timer);
  H.phase = 'lobby'; H.idx = 0; H.turns = 0; H.history = []; H.round = null; H.results = null; H.rv++;
  hostRecompute(); hostBroadcast();
}

/* ---------- Invitado ---------- */
function rejectText(why){
  return why === 'taken' || why === 'name' ? 'Ya hay alguien con ese nombre en la sala. Vuelve al inicio y prueba con otro.'
    : why === 'started' ? 'La partida ya ha empezado y ese nombre no estaba en ella. Para volver a entrar usa el mismo nombre de antes.'
    : why === 'full' ? `La sala está llena (${MAX_PLAYERS} jugadores).` : 'La sala no te ha dejado entrar.';
}
async function onlineJoin(code, name){
  onlineTeardown();
  S.online = true; O.role = 'guest'; O.name = name; O.code = code; O.leaving = false; O.pantalla = false; O.mute = false; setPantallaUI(false);
  $('#quit-btn').hidden = false;
  onlineConnecting(`Conectando con la sala ${code}…`);
  try{ await loadPeerLib(); }
  catch(e){ return onlineFail('No se ha podido cargar el servicio de conexión. Comprueba tu conexión a internet.', true); }
  loadDict().catch(() => {});
  let got = false;
  const peer = new Peer(undefined, peerOptions());
  O.peer = peer;
  const to = setTimeout(() => { if (!got && !O.leaving) onlineFail('No se ha podido conectar con la sala. Comprueba el código y que el anfitrión tenga el juego abierto. Si no estáis en la misma wifi, la conexión puede fallar.', true); }, 15000);
  peer.on('error', err => {
    if (O.leaving) return;
    clearTimeout(to);
    if (err.type === 'peer-unavailable') onlineFail(`No existe ninguna sala con el código ${code}.`, true);
    else if (!got) onlineFail(`No se ha podido conectar (${err.type}).`, true);
    else onlineLost();
  });
  peer.on('open', () => {
    const conn = peer.connect(ROOM_PREFIX + code, { reliable:true, serialization:'json' });
    O.conn = conn;
    conn.on('open', () => conn.send({ t:'hello', name }));
    conn.on('data', d => {
      if (!d || O.leaving) return;
      if (d.t === 'state'){ got = true; clearTimeout(to); onlineRender(d.s); }
      else if (d.t === 'reject'){ got = true; clearTimeout(to); onlineFail(rejectText(d.why), false, 'No se ha podido entrar'); }
    });
    conn.on('close', () => { clearTimeout(to); if (!O.leaving) onlineLost(); });
  });
}

/* ---------- Pantallas de la partida (iguales para todos) ---------- */
function waitingNames(P){
  const names = P.players.filter((p, i) => p.connected && !P.submitted[i]).map(p => p.name);
  return names.length ? `Esperando a: ${names.join(', ')}.` : 'Todos han respondido.';
}
function onlineRender(P){
  const prevScreen = O.screen, first = !O.P;
  O.P = P;
  O.me = O.role === 'host' ? (P.pantalla ? -1 : 0) : P.players.findIndex(p => p.name.toLowerCase() === O.name.toLowerCase());
  if (O.me < 0 && !(O.role === 'host' && P.pantalla)){ onlineFail('Ya no estás en esta sala.', false, 'No se ha podido entrar'); return; }
  O.mute = O.role === 'guest' && !!P.pantalla; // si hay pantalla, el sonido sale de ella
  S.online = true;
  S.game = { players:P.players.map((p, i) => ({ name:p.name, score:p.score, off:!p.connected, me:i === O.me })), plan:P.plan, idx:P.idx, history:P.history, letterTurns:0 };
  if (first && O.role === 'guest') requestWake();
  $('#quit-btn').hidden = false;
  renderScores(P.phase === 'choose' ? P.chooser : -1);
  if (P.screen === O.screen){ const el = $('#o-wait-list'); if (el) el.textContent = waitingNames(P); return; }
  O.screen = P.screen;
  stopClock();
  S.round = { type: P.round ? P.round.type : P.plan[P.idx] };
  switch (P.phase){
    case 'lobby': return onlineLobby(P, !prevScreen.startsWith('lobby'));
    case 'choose': return onlineChoose(P);
    case 'play': return onlinePlay(P);
    case 'results': return onlineResults(P);
    case 'final': return onlineFinal(P);
  }
}
function onlineLobby(P, focus){
  const host = O.role === 'host', ctl = canCtl(), screen = host && P.pantalla, link = roomLink(P.code), set = P.settings;
  const kindTxt = { alternas:'letras y cifras', letras:'solo letras', cifras:'solo cifras' }[set.kind];
  const timeTxt = { oficial:'con el tiempo del concurso', doble:'con el doble de tiempo', libre:'sin límite de tiempo' }[set.time];
  const online = P.players.filter(p => p.connected).length;
  const where = location.host ? (location.host + location.pathname).replace(/index\.html$/, '') : link;
  const lead = screen ? `Con el móvil, escanea el código QR, o abre <strong>${esc(where)}</strong>, elige «Varios móviles», «Unirme a una sala» y escribe el código.`
    : host ? 'Tus amigos tienen que abrir el juego, elegir «Varios móviles», «Unirme a una sala» y escribir este código. También puedes mandarles el enlace.'
    : P.pantalla ? 'Ya estás dentro. Mira la pantalla: ahí saldrán las letras y los números. Tú responderás desde este móvil.' : 'Ya estás dentro. Espera a que el anfitrión empiece la partida.';
  const badge = i => i !== 0 ? '' : P.pantalla ? '<span class="badge neutral">Tiene el mando</span>' : '<span class="badge neutral">Anfitrión</span>';
  const startMsg = online < 2 ? 'Hacen falta al menos 2 jugadores para empezar.' : '';
  app.innerHTML = `<section aria-labelledby="h-lobby" class="${screen ? 'lobby-screen' : ''}">
    <div class="lobby-main">
    <h2 id="h-lobby">Sala ${esc(P.code)}</h2>
    <p class="lead">${lead}</p>
    <div class="room-code" role="img" aria-label="Código de la sala: ${P.code.split('').join(' ')}">${P.code.split('').map(c => `<span class="tile">${c}</span>`).join('')}</div>
    ${host && !screen ? `<div class="row"><button type="button" class="btn" id="o-copy">Copiar enlace</button>${navigator.share ? '<button type="button" class="btn" id="o-share">Compartir</button>' : ''}</div>` : ''}
    <h3>Jugadores conectados: ${online}</h3>
    ${P.players.length ? `<ul class="plist">${P.players.map((p, i) => `<li><span class="nm">${esc(p.name)}${i === O.me ? ' (tú)' : ''}</span>${badge(i)}${p.connected ? '' : '<span class="badge bad">Sin conexión</span>'}</li>`).join('')}</ul>` : '<p class="hint">Todavía no ha entrado nadie.</p>'}
    <p class="hint">Partida de ${set.rounds} pruebas: ${kindTxt}, ${timeTxt}.</p>
    ${ctl ? `<p class="msg" id="o-startmsg" role="status">${startMsg}</p><button type="button" class="btn primary" id="o-start" ${online < 2 ? 'aria-disabled="true"' : ''}>Empezar partida</button>` : ''}
    </div>
    ${screen ? `<div class="lobby-qr">${qrSvg(link)}</div>` : ''}
  </section>`;
  if (host && !screen){
    $('#o-copy').addEventListener('click', async () => {
      try{ await navigator.clipboard.writeText(link); $('#o-copy').textContent = 'Enlace copiado'; announce('Enlace copiado.'); }
      catch(_){ window.prompt('Copia este enlace:', link); }
    });
    const sh = $('#o-share'); if (sh) sh.addEventListener('click', () => { navigator.share({ title:'Cifras y Letras', text:`Sala ${P.code}`, url:link }).catch(() => {}); });
  }
  if (ctl){
    $('#o-start').addEventListener('click', () => {
      if (O.P.players.filter(p => p.connected).length < 2){ $('#o-startmsg').textContent = 'Hacen falta al menos 2 jugadores para empezar.'; return; }
      onlineSend({ t:'start' });
    });
  }
  if (focus) focusPrimary('#o-start', focusHeading);
}
function onlineChoose(P){
  const me = O.me, ch = P.chooser, cname = P.players[ch].name;
  const mine = ch === me || (canCtl() && !P.players[ch].connected);
  app.innerHTML = `<section class="round-l" aria-labelledby="h-round">
    ${roundHead()}
    <p class="turn-msg">${mine ? (ch === me ? '¿Cuántas vocales queréis?' : `<strong>${esc(cname)}</strong> no está conectado. Elige tú las vocales.`) : `Elige <strong>${esc(cname)}</strong>: ¿cuántas vocales?`}</p>
    ${mine ? `<div class="pick" role="group" aria-label="Número de vocales">${[3,4,5,6].map(n => `<button type="button" class="btn" data-v="${n}" aria-label="${n} vocales">${n}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn small" data-v="azar">Al azar</button></div>
      <p class="hint" style="margin-top:14px">Saldrán 10 letras: las vocales que elijas y el resto consonantes.</p>` : '<p class="hint">Esperando a que elija.</p>'}
  </section>`;
  $$('[data-v]', app).forEach(b => b.addEventListener('click', () => {
    onlineSend({ t:'vowels', n: b.dataset.v === 'azar' ? [3,4,4,5,5,6][rnd(6)] : +b.dataset.v });
  }));
  focusHeading();
  announce(mine ? 'Te toca elegir las vocales.' : `Elige ${cname}.`);
}
function onlinePlay(P){
  const R = P.round, mine = !!P.submitted[O.me];
  const pr = { secs:R.secs, deadlineAt: Date.now() + R.remaining, instant:mine, submitted:mine };
  if (R.type === 'L') letrasDeal(R.vowels, Object.assign(pr, { letters:R.letters }));
  else cifrasDeal(Object.assign(pr, { nums:R.nums, target:R.target }));
}
const lockTiles = () => $$('#tiles .tile').forEach(t => { t.disabled = true; });
function clockLeft(pr){ return pr.secs ? Math.min(pr.secs * 1000, pr.deadlineAt - Date.now()) : undefined; }
function onlineLetrasPlay(pr){
  if (O.me < 0) return onlineScreenPlay(pr);
  if (pr.submitted){ lockTiles(); onlineWaiting(); return; }
  const scr = O.screen;
  letrasInput({ secs:pr.secs, left:clockLeft(pr), noPause:true, onDone: w => {
    onlineSend({ t:'answer', k:'L', word:w }); lockTiles();
    if (O.screen === scr) onlineWaiting();
  } });
}
function onlineCifrasPlay(pr){
  if (O.me < 0) return onlineScreenPlay(pr);
  if (pr.submitted){ $('#tiles').hidden = false; onlineWaiting(); return; }
  const scr = O.screen;
  cifrasInput({ secs:pr.secs, left:clockLeft(pr), noPause:true, onDone: a => {
    onlineSend({ t:'answer', k:'C', ans: a ? { value:a.value, steps:a.steps.map(s => ({ a:s.a, b:s.b, op:s.op, r:s.r })) } : null });
    $('#tiles').hidden = false;
    if (O.screen === scr) onlineWaiting();
  } });
}
// La pantalla grande no responde: enseña el reloj y quién ha entregado ya.
function onlineScreenPlay(pr){
  const ctl = canCtl();
  $('#play').innerHTML = `<div class="panel" role="status"><h3 id="o-wait-h" tabindex="-1">Los jugadores están respondiendo</h3>
    <p id="o-wait-list">${esc(waitingNames(O.P))}</p>
    ${ctl ? '<button type="button" class="btn" id="o-force">Cerrar la prueba ya</button>' : ''}</div>`;
  if (ctl) $('#o-force').addEventListener('click', () => onlineSend({ t:'force' }));
  S.clock = new Clock($('#clock-host'), pr.secs, () => {}, { left:clockLeft(pr), noPause:true });
  S.clock.start();
}
function onlineWaiting(){
  const P = O.P, host = canCtl();
  const ch = $('#clock-host'); if (ch) ch.innerHTML = '';
  $('#play').innerHTML = `<div class="panel" role="status"><h3 id="o-wait-h" tabindex="-1">Respuesta enviada</h3>
    <p id="o-wait-list">${esc(waitingNames(P))}</p>
    ${host ? '<button type="button" class="btn" id="o-force">Cerrar la prueba ya</button>' : ''}</div>`;
  if (host) $('#o-force').addEventListener('click', () => onlineSend({ t:'force' }));
  $('#o-wait-h').focus();
}
function staticBoard(R){
  if (R.type === 'L') return `<ul class="tiles letters" aria-label="Letras">${R.letters.map(l => `<li><span class="tile">${l.toUpperCase()}</span></li>`).join('')}</ul>
    <p class="hint" style="margin-top:10px">${R.vowels} vocales y ${10 - R.vowels} consonantes.</p>`;
  return `<ul class="tiles numbers" aria-label="Números">${R.nums.map(n => `<li><span class="tile">${n}</span></li>`).join('')}</ul>
    <div class="target"><span>Objetivo</span><div class="tile">${R.target}</div></div>`;
}
function onlineResults(P){
  const scr = O.screen, host = canCtl(), R = P.round, res = P.results;
  const last = P.idx >= P.plan.length - 1;
  const footer = host
    ? `<div class="row next-row"><button type="button" class="btn primary" id="o-next">${last ? 'Ver la clasificación final' : 'Siguiente prueba'}</button></div>`
    : `<p class="hint" style="margin-top:18px">Esperando a que ${esc(P.players[0].name)}${P.pantalla ? ' o la pantalla' : ''} pase${P.pantalla ? 'n' : ''} ${last ? 'a la clasificación final' : 'a la siguiente prueba'}.</p>`;
  const draw = () => {
    if (O.screen !== scr) return;
    const inner = R.type === 'L'
      ? letrasResultsHtml(P.players, res.answers, res.pts, res.best, { who:'Jugador', canOverride:host, footer })
      : cifrasResultsHtml(P.players, res.answers, res.pts, res.sol, R.target, { who:'Jugador', footer });
    app.innerHTML = `<section class="round-${R.type === 'L' ? 'l' : 'c'}" aria-labelledby="h-round">${roundHead()}
      <div class="board"><div class="clock-col"></div><div class="board-main">${staticBoard(R)}</div></div>${inner}</section>`;
    $$('[data-ov]').forEach(btn => btn.addEventListener('click', () => { O.focusSel = `[data-ov="${btn.dataset.ov}"]`; onlineSend({ t:'override', i:+btn.dataset.ov }); }));
    if (host) $('#o-next').addEventListener('click', () => onlineSend({ t:'next' }));
    if (O.focusSel){ const el = $(O.focusSel); O.focusSel = null; if (el) el.focus(); }
    else {
      focusPrimary('#o-next', () => $('#res-h').focus());
      const sum = resumenEquipos(res.pts);
      announce(R.type === 'L' ? `${sum} La palabra más larga posible tenía ${res.best.len} letras.` : `${sum} ${res.sol.diff === 0 ? 'La cifra exacta era posible.' : `Lo más cerca posible era ${res.sol.value}.`}`);
    }
  };
  if (R.type === 'L' && !Dict.variants) loadDict().then(draw).catch(draw); else draw();
}
function onlineFinal(P){
  const host = canCtl();
  const { html, headline } = finalHtml(S.game, host
    ? '<div class="row"><button type="button" class="btn primary" id="o-again">Otra partida en esta sala</button></div>'
    : `<p class="hint">Esperando a que ${esc(P.players[0].name)}${P.pantalla ? ' o la pantalla' : ''} abra${P.pantalla ? 'n' : ''} otra partida. Puedes salir cuando quieras.</p>`);
  app.innerHTML = html;
  if (host) $('#o-again').addEventListener('click', () => onlineSend({ t:'restart' }));
  focusPrimary('#o-again', focusHeading); announce(headline);
}
