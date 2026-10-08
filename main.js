(() => {
  const root = document.documentElement;
  const cl = (v) => Math.max(0, Math.min(1, v));
  const ss = (v) => v * v * (3 - 2 * v);
  const io3 = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------- theme ---------- */
  const tg = $('.tg');
  const setTheme = (t) => {
    if (t === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    if (tg) tg.setAttribute('aria-label', t === 'light' ? 'Switch to night mode' : 'Switch to day mode');
  };
  let theme = 'dark';
  try { theme = localStorage.getItem('mc-theme') || 'dark'; } catch (e) {}
  setTheme(theme);
  if (tg) tg.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    setTheme(theme);
    try { localStorage.setItem('mc-theme', theme); } catch (e) {}
  });

  /* ---------- cursor ---------- */
  const cur = $('.cur');
  const dot = cur && $('i', cur);
  if (cur && dot) {
    let cx = -100, cy = -100, tx = -100, ty = -100, raf = 0, over = false, down = false, seen = false;
    const loop = () => {
      cx += (tx - cx) * 0.35; cy += (ty - cy) * 0.35;
      cur.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
      raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : 0;
    };
    const setDot = () => { const b = over ? 2 : 1; dot.style.transform = `scale(${down ? b * 1.7 : b})`; };
    window.addEventListener('mousemove', (e) => {
      if (!seen) { cx = e.clientX; cy = e.clientY; seen = true; }
      tx = e.clientX; ty = e.clientY; cur.style.opacity = '1';
      const o = !!(e.target.closest && e.target.closest('a, button'));
      if (o !== over) { over = o; setDot(); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cur.style.opacity = '0'; });
    window.addEventListener('mousedown', () => { down = true; setDot(); });
    window.addEventListener('mouseup', () => { down = false; setDot(); });
  }

  /* ---------- drawer (project pages) ---------- */
  const drawer = $('.drawer');
  if (drawer) {
    const lead = $('.d-lead', drawer), label = $('h3', drawer), body = $('.d-body', drawer);
    const open = (key) => {
      const t = document.getElementById('d-' + key);
      if (!t) return;
      lead.textContent = t.dataset.lead || '';
      label.textContent = t.dataset.label || 'In brief';
      body.innerHTML = t.innerHTML;
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      root.style.overflow = 'hidden';
      $('.dx', drawer).focus({ preventScroll: true });
    };
    const close = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      root.style.overflow = '';
    };
    $$('[data-drawer]').forEach((b) => b.addEventListener('click', () => open(b.dataset.drawer)));
    $$('.dim, .dx', drawer).forEach((b) => b.addEventListener('click', close));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------- selected work: purple mouse trail ---------- */
  const trailHost = $('.mq-wrap');
  if (trailHost && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cv = document.createElement('canvas');
    cv.className = 'trail';
    cv.setAttribute('aria-hidden', 'true');
    trailHost.prepend(cv);
    const ctx = cv.getContext('2d');
    const LIFE = 1100;
    let pts = [], raf = 0, dpr = 1, W = 0, H = 0;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = trailHost.clientWidth; H = trailHost.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);
    // fresh → old: light lavender → deep violet
    const A = [214, 199, 255], Bc = [108, 56, 230];
    const col = (k) => `rgb(${A.map((v, i) => Math.round(Bc[i] + (v - Bc[i]) * k)).join(',')})`;
    const draw = () => {
      raf = 0;
      const now = performance.now();
      pts = pts.filter((p) => now - p.t < LIFE);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        if (b.t - a.t > 120) continue;
        const life = 1 - (now - b.t) / LIFE;
        if (life <= 0) continue;
        ctx.globalAlpha = Math.min(1, life * 1.15);
        ctx.strokeStyle = col(life);
        ctx.lineWidth = 12 * (0.25 + 0.75 * life); // 12px = cursor dot size
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (pts.length) raf = requestAnimationFrame(draw);
    };
    window.addEventListener('mousemove', (e) => {
      const r = trailHost.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      const x = e.clientX - r.left, y = e.clientY - r.top, t = performance.now();
      const last = pts[pts.length - 1];
      if (last && t - last.t < 120) {
        const d = Math.hypot(x - last.x, y - last.y), n = Math.floor(d / 8);
        for (let k = 1; k < n; k++) pts.push({ x: last.x + (x - last.x) * k / n, y: last.y + (y - last.y) * k / n, t: last.t + (t - last.t) * k / n });
      }
      pts.push({ x, y, t });
      if (!raf) raf = requestAnimationFrame(draw);
    }, { passive: true });
  }

  /* ---------- home ---------- */
  const hero = $('#hero');
  if (!hero) return;
  const hdr = $('.hdr');
  const stage = $('.stage', hero);
  const intro = $('.intro', hero);
  const sentL = $('.sent', hero), sentG = $('.sent-grid', hero);
  const order = ['w0', 'w1', 'b0', 'w2', 'w3', 'w4', 'b1', 'b2', 'w5', 'w6', 'w7', 'w8', 'b3'];
  const seq = order.map((k) => $(`[data-k="${k}"]`, hero));
  const vals = $('.vals', hero);
  const lines = $$('.vals-in > span', hero);
  const emo = $('.emo', hero);
  const zoom = $('.zoom', hero);
  const zis = $$('.zi', zoom);
  const capT = $('.cap-t', zoom), capI = $('.cap-i', zoom);
  const items = JSON.parse(zoom.dataset.items);
  const mq = $('.mq');
  const cardsSec = $('.cards');
  const cards = cardsSec ? $$('.card', cardsSec) : [];
  let reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  let curIdx = 0;
  zoom.addEventListener('click', (e) => { e.preventDefault(); location.href = items[curIdx].href; });

  const enter = () => {
    const r = hero.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top + innerHeight * 0.18, behavior: reduce ? 'auto' : 'smooth' });
  };
  intro.addEventListener('click', enter);
  const hl = $('.hdr .logo');
  const toSelected = (smooth) => {
    const t = $('#selected');
    if (!t) return;
    window.scrollTo({ top: window.scrollY + t.getBoundingClientRect().top, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  };
  if (hl) hl.addEventListener('click', (e) => { e.preventDefault(); toSelected(true); });
  if (location.hash === '#selected') requestAnimationFrame(() => toSelected(false));
  if (location.hash === '#in') requestAnimationFrame(() => {
    const r = hero.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + innerHeight * 0.18);
  });

  const frame = () => {
    raf = 0;
    const vh = innerHeight;
    const r = hero.getBoundingClientRect();
    const sc = Math.max(0, Math.min(r.height - vh, -r.top)) / vh;
    const q = sc / 3;

    // intro + header
    const io = 1 - cl(q / 0.05);
    intro.style.opacity = io.toFixed(3);
    intro.style.visibility = io > 0.01 ? 'visible' : 'hidden';
    $('.logo', intro).style.transform = `scale(${(1 - 0.06 * (1 - io)).toFixed(4)})`;
    const ho = ss(cl(q / 0.05));
    hdr.style.opacity = ho.toFixed(3);
    hdr.style.pointerEvents = q > 0.02 ? 'auto' : 'none';

    // sentence
    seq.forEach((el, n) => {
      const f = n === 0 ? ss(cl(q / 0.05)) : ss(cl((q - (0.06 + (n - 1) * 0.03)) / 0.1));
      el.style.opacity = f.toFixed(3);
    });
    const top = Math.min(230, Math.max(120, 0.17 * vh));
    const fit = vh - top - 40 - sentG.offsetHeight;
    const sOut = ss(cl((q - 0.55) / 0.08));
    const base = fit >= 0 ? fit / 2 : fit * ss(cl((q - 0.12) / 0.38));
    sentL.style.opacity = (1 - sOut).toFixed(3);
    sentL.style.transform = `translateY(${(base - sOut * 40).toFixed(1)}px)`;

    // values
    const vIn = ss(cl((q - 0.6) / 0.06));
    [0.62, 0.69, 0.76, 0.83].forEach((a, i) => {
      const f = ss(cl((q - a) / 0.14));
      lines[i].style.opacity = (0.08 + 0.92 * f).toFixed(3);
      lines[i].style.transform = `translateY(${((1 - f) * 28).toFixed(1)}px)`;
    });

    // zoom
    const z = io3(cl((sc - 3.05) / 1.0));
    vals.style.opacity = (vIn * (1 - cl((z - 0.4) / 0.4))).toFixed(3);
    if (z > 0.0005) {
      const st = stage.getBoundingClientRect();
      const b = emo.getBoundingClientRect();
      const lerp = (a, c) => (a + (c - a) * z).toFixed(1);
      zoom.style.display = 'block';
      zoom.style.left = lerp(b.left - st.left, 0) + 'px';
      zoom.style.top = lerp(b.top - st.top, 0) + 'px';
      zoom.style.width = lerp(b.width, st.width) + 'px';
      zoom.style.height = lerp(b.height, st.height) + 'px';
      zoom.style.pointerEvents = z > 0.95 ? 'auto' : 'none';
      emo.style.opacity = '0';
    } else {
      zoom.style.display = 'none';
      emo.style.opacity = '1';
    }
    const gs = sc - 4.15;
    let idx = 0;
    zis.forEach((el, i) => {
      if (i === 0) { $('img', el).style.transform = `scale(${(1.06 - 0.06 * z).toFixed(4)})`; return; }
      const rr = ss(cl((gs - (i - 1) * 0.85) / 0.6));
      if (rr > 0.5) idx = i;
      el.style.clipPath = `inset(${((1 - rr) * 100).toFixed(2)}% 0 0 0)`;
      $('img', el).style.transform = `scale(${(1.1 - 0.1 * rr).toFixed(4)})`;
    });
    if (idx !== curIdx || !capT.textContent) {
      curIdx = idx;
      capT.textContent = items[idx].title;
      capI.textContent = `0${idx + 1} / 0${items.length}`;
      zoom.setAttribute('aria-label', 'Open ' + items[idx].name);
    }
    $('.cap', zoom).style.opacity = cl((z - 0.85) / 0.15).toFixed(3);

    // stacked cards: when the section ends, move the whole stack up together
    // (plain sticky would push the last card up first, over the earlier ones)
    if (cardsSec && cards.length) {
      const sb = cardsSec.getBoundingClientRect().bottom - parseFloat(getComputedStyle(cardsSec).paddingBottom || 0);
      const lims = cards.map((c) => parseFloat(getComputedStyle(c).top) + c.offsetHeight);
      const B = Math.max(...lims);
      const shift = Math.min(0, sb - B);
      cards.forEach((c, i) => {
        const own = Math.min(0, sb - lims[i]);
        c.style.transform = shift < 0 ? `translateY(${(shift - own).toFixed(1)}px)` : '';
      });
    }

    // marquee
    if (mq) {
      const w = mq.scrollWidth / 2;
      if (w > 0) mq.style.transform = `translate3d(${(-((window.scrollY * 0.7) % w)).toFixed(1)}px,0,0)`;
    }
  };
  let raf = 0;
  const req = () => { if (!raf) raf = requestAnimationFrame(frame); };
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('load', req);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(req);
  frame();
})();
