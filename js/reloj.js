'use strict';
/* ================= Reloj ================= */
class Clock{
  constructor(host, seconds, onEnd, opts={}){
    this.host = host; this.total = seconds*1000; this.left = this.total; this.onEnd = onEnd;
    if (opts.left != null) this.left = Math.max(0, Math.min(opts.left, this.total));
    this.running = false; this.done = false; this.lastSec = null; this.raf = null;
    const C = 2*Math.PI*52; this.C = C;
    host.innerHTML = seconds ? `
      <div class="clock" role="timer" aria-label="Tiempo restante">
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="52"/><circle class="arc" cx="60" cy="60" r="52" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
        <div class="num" aria-hidden="true">${seconds}</div>
        <span class="sr-only sr-time">${seconds} segundos</span>
      </div>
      ${opts.noPause ? '' : '<div class="clock-ctl"><button type="button" class="btn small" data-c="pause">Pausar</button></div>'}` : `
      <div class="clock free"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="52"/></svg><div class="num">Sin límite de tiempo</div></div>`;
    this.arc = $('.arc', host); this.num = $('.num', host); this.srt = $('.sr-time', host); this.box = $('.clock', host);
    const pb = $('[data-c="pause"]', host);
    if (pb) pb.addEventListener('click', () => {
      if (this.running){ this.pause(); pb.textContent = 'Reanudar'; announce('Reloj en pausa'); }
      else if (!this.done){ this.start(); pb.textContent = 'Pausar'; announce('Reloj en marcha'); }
    });
    this.pauseBtn = pb;
    if (opts.left != null && seconds) this.paint(this.left);
  }
  start(){ if (!this.total || this.running || this.done) return; this.running = true; this.t0 = performance.now(); this.loop(); }
  pause(){ if (!this.running) return; this.left -= performance.now() - this.t0; this.running = false; cancelAnimationFrame(this.raf); clearTimeout(this.to); }
  stop(){ this.running = false; this.done = true; cancelAnimationFrame(this.raf); clearTimeout(this.to); if (this.pauseBtn) this.pauseBtn.disabled = true; }
  loop(){
    if (!this.running) return;
    const rem = Math.max(0, this.left - (performance.now() - this.t0));
    this.paint(rem);
    if (rem <= 0){ this.stop(); beep(520, 0.5, 0.18); announce('¡Tiempo!', true); this.onEnd(); return; }
    cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.loop());
    clearTimeout(this.to); this.to = setTimeout(() => this.loop(), 250); // sigue aunque la pestaña no pinte
  }
  paint(rem){
    const sec = Math.ceil(rem/1000);
    this.arc.setAttribute('stroke-dashoffset', String(this.C * (1 - rem/this.total)));
    if (sec !== this.lastSec){
      this.lastSec = sec; this.num.textContent = sec;
      this.srt.textContent = `${sec} segundos`;
      this.box.classList.toggle('low', sec <= 5);
      if (sec === 10 && this.total > 10000) announce('Quedan 10 segundos');
      if (sec <= 5 && sec > 0) beep(980, 0.07, 0.08);
    }
  }
}
