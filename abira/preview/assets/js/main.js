/* ABIRA — home preview interactions. Vanilla JS, no dependencies.
   Structure maps to the WordPress theme's assets/js/theme.js (one module per feature). */
(function () {
  'use strict';
  window.__abira = true;

  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var fa = new Intl.NumberFormat('fa-IR');
  var toFa = function (n) { return fa.format(n); };
  var raf = window.requestAnimationFrame.bind(window);
  var mqDesktop = window.matchMedia('(min-width: 900px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motion = function () { return root.getAttribute('data-motion') || 'balanced'; };
  var motionOn = function () { return motion() !== 'off'; };

  /* ---------- header: sticky state, no layout shift (header is fixed) ---------- */
  var header = $('[data-header]');
  var scrolled = false;
  function onScroll() {
    var s = window.scrollY > 12;
    if (s !== scrolled) { scrolled = s; header.classList.toggle('is-scrolled', s); }
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mobile menu: focus trap, Esc, inert background, scroll lock ---------- */
  var toggle = $('[data-menu-toggle]'), menu = $('[data-mobile-menu]');
  var inertTargets = $$('main, .site-footer, .skip-link, .pv');
  var lastFocus = null;
  function menuFocusables() { return $$('a[href], button:not([disabled])', menu).concat([toggle]); }
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    doc.body.classList.toggle('menu-open', open);
    inertTargets.forEach(function (el) { open ? el.setAttribute('inert', '') : el.removeAttribute('inert'); });
    if (open) { lastFocus = doc.activeElement; var f = $('a', menu); setTimeout(function () { f && f.focus(); }, 60); }
    else if (lastFocus) { toggle.focus(); }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('[data-menu-link]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key === 'Tab') {
      var f = menuFocusables(), first = f[0], last = f[f.length - 1];
      // visual order: toggle (header) first, then links
      f = [toggle].concat($$('a[href]', menu)); first = f[0]; last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches && menu.classList.contains('is-open')) setMenu(false); });
  menu.setAttribute('aria-hidden', 'false');

  /* ---------- hero intro: fonts ready (max 700ms) → start choreography ---------- */
  var started = false;
  function startIntro() { if (started) return; started = true; raf(function () { root.classList.add('is-ready'); $('[data-hero]').classList.add('in-view'); }); }
  (doc.fonts && doc.fonts.ready ? Promise.race([doc.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })]) : Promise.resolve()).then(startIntro);
  setTimeout(startIntro, 900);

  /* ---------- scroll reveal (once) ---------- */
  $$('[data-stagger]').forEach(function (g) {
    $$('[data-reveal]', g).forEach(function (el, i) { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', i); });
  });
  // clip-revealed elements are fully clipped, so the observer watches their parent instead
  var triggers = new Map();
  function triggerFor(el) { return el.getAttribute('data-reveal') === 'clip' ? el.parentElement : el; }
  var revealObs = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      (triggers.get(e.target) || []).forEach(function (el) { el.classList.add('is-in'); });
      revealObs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  var revealEls = $$('[data-reveal]');
  function watchReveal(el) {
    var t = triggerFor(el);
    if (!revealObs) { el.classList.add('is-in'); return; }
    if (!triggers.has(t)) triggers.set(t, []);
    if (triggers.get(t).indexOf(el) < 0) triggers.get(t).push(el);
    revealObs.observe(t);
  }
  revealEls.forEach(watchReveal);

  /* ---------- parallax (very limited; desktop only; images in view only) ---------- */
  var para = $$('[data-parallax]').map(function (el) { return { el: el, k: parseFloat(el.dataset.parallax) || 0.05, vis: false, y: 0 }; });
  var paraObs = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { var p = para.filter(function (x) { return x.el === e.target; })[0]; if (p) p.vis = e.isIntersecting; });
    tick();
  }, { rootMargin: '10% 0px' }) : null;
  para.forEach(function (p) { paraObs && paraObs.observe(p.el); p.el.style.willChange = 'transform'; p.el.style.scale = '1.12'; });
  var ticking = false;
  function tick() { if (!ticking) { ticking = true; raf(updateParallax); } }
  function updateParallax() {
    ticking = false;
    var level = motion();
    var on = (level === 'balanced' || level === 'full') && mqDesktop.matches;
    var mult = level === 'full' ? 1 : 0.5;
    var vh = window.innerHeight;
    para.forEach(function (p) {
      if (!p.vis) return;
      if (!on) { p.el.style.translate = ''; return; }
      var r = p.el.parentElement.getBoundingClientRect();
      var c = (r.top + r.height / 2 - vh / 2);
      p.el.style.translate = '0 ' + (-c * p.k * mult * 1).toFixed(1) + 'px';
    });
  }
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);

  /* ---------- counters (run once) ---------- */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var end = parseFloat(el.dataset.count);
    if (!motionOn()) { el.textContent = toFa(end); return; }
    var dur = 1600, t0 = null;
    el.textContent = toFa(0);
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = toFa(Math.round(end * e));
      if (p < 1) raf(step);
    }
    raf(step);
  }
  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); cObs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cObs.observe(c); });
  }

  /* ---------- services: hover/focus swaps preview ---------- */
  var svcList = $('[data-svc-list]');
  if (svcList) {
    var items = $$('.svc', svcList), imgs = $$('[data-svc-stack] img'), tag = $('[data-svc-tag]');
    var names = ['مشاورهٔ راهبرد', 'پروژه‌های مهندسی', 'تحول دیجیتال', 'بهینه‌سازی عملیات', 'آموزش و توانمندسازی'];
    var activate = function (i) {
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
      if (tag) tag.textContent = names[i];
    };
    items.forEach(function (it, i) {
      it.addEventListener('mouseenter', function () { if (mqDesktop.matches) activate(i); });
      it.addEventListener('focusin', function () { if (mqDesktop.matches) activate(i); });
      it.addEventListener('click', function () { if (mqDesktop.matches) activate(i); });
    });
  }

  /* ---------- process: scroll-linked progress, smoothed ---------- */
  var proc = $('[data-process]');
  if (proc) {
    var steps = $$('.step', proc), cur = 0, target = 0, running = false, trackLen = 0;
    var measure = function () {
      var horizontal = mqDesktop.matches;
      var first = steps[0].getBoundingClientRect(), last = steps[steps.length - 1].getBoundingClientRect(), pr = proc.getBoundingClientRect();
      trackLen = horizontal ? (pr.width - 18) : (last.top - first.top);
      proc.style.setProperty('--track', trackLen.toFixed(0) + 'px');
    };
    var compute = function () {
      var r = proc.getBoundingClientRect(), vh = window.innerHeight;
      // progress: 0 when the track top reaches 72% of the viewport, 1 when it reaches 25%
      target = Math.max(0, Math.min(1, (vh * 0.72 - r.top) / (vh * 0.47)));
      if (!motionOn()) { cur = target; paint(); return; }
      if (!running) { running = true; raf(loop); }
    };
    var paint = function () {
      proc.style.setProperty('--p', cur.toFixed(4));
      steps.forEach(function (s, i) {
        var th = i / (steps.length - 1) * 0.92 - 0.02;
        s.classList.toggle('is-active', cur >= th - 0.001);
      });
    };
    var loop = function () {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.0005) { cur = target; running = false; }
      paint();
      if (running) raf(loop);
    };
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', function () { measure(); compute(); });
    measure(); compute();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measure(); compute(); });
  }

  /* ---------- testimonials slider ---------- */
  var tm = $('[data-tm]');
  if (tm) {
    var slides = $$('.tm-slide', tm), idx = 0, timer = null, userPaused = false, hoverPaused = false;
    var dotsWrap = $('[data-tm-dots]'), cnt = $('[data-tm-cur]'), live = $('[data-tm-live]');
    var prevB = $('[data-tm-prev]'), nextB = $('[data-tm-next]'), pauseB = $('[data-tm-pause]');
    var dots = slides.map(function (_, i) {
      var b = doc.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'دیدگاه ' + toFa(i + 1)); b.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(b); return b;
    });
    function go(n, manual) {
      var next = (n + slides.length) % slides.length, dir = n >= idx ? 1 : -1;
      slides.forEach(function (s, i) {
        s.classList.toggle('is-active', i === next);
        s.classList.toggle('is-prev', i !== next && i < next);
        s.setAttribute('aria-hidden', i === next ? 'false' : 'true');
        if (i !== next) s.setAttribute('inert', ''); else s.removeAttribute('inert');
      });
      dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === next)); d.tabIndex = i === next ? 0 : -1; });
      idx = next; cnt.textContent = toFa(idx + 1);
      if (manual) live.textContent = 'دیدگاه ' + toFa(idx + 1) + ' از ' + toFa(slides.length);
      void dir;
    }
    function schedule() {
      clearTimeout(timer);
      if (userPaused || hoverPaused || !motionOn() || mqReduce.matches) return;
      timer = setTimeout(function () { go(idx + 1, false); schedule(); }, 8000);
    }
    prevB.addEventListener('click', function () { go(idx - 1, true); schedule(); });
    nextB.addEventListener('click', function () { go(idx + 1, true); schedule(); });
    pauseB.addEventListener('click', function () {
      userPaused = !userPaused; pauseB.setAttribute('aria-pressed', String(userPaused));
      pauseB.setAttribute('aria-label', userPaused ? 'ادامهٔ جابه‌جایی خودکار' : 'توقف جابه‌جایی خودکار');
      pauseB.firstElementChild.firstElementChild.setAttribute('href', userPaused ? '#i-play' : '#i-pause');
      schedule();
    });
    tm.closest('.tm-grid').addEventListener('mouseenter', function () { hoverPaused = true; clearTimeout(timer); });
    tm.closest('.tm-grid').addEventListener('mouseleave', function () { hoverPaused = false; schedule(); });
    tm.closest('.tm-grid').addEventListener('focusin', function () { hoverPaused = true; clearTimeout(timer); });
    tm.closest('.tm-grid').addEventListener('focusout', function () { hoverPaused = false; schedule(); });
    tm.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(idx + 1, true); e.preventDefault(); }   // RTL: left = forward
      if (e.key === 'ArrowRight') { go(idx - 1, true); e.preventDefault(); }
    });
    dotsWrap.addEventListener('keydown', function (e) {
      var k = e.key; if (k !== 'ArrowLeft' && k !== 'ArrowRight') return;
      var n = idx + (k === 'ArrowLeft' ? 1 : -1); go(n, true); dots[idx].focus(); e.preventDefault();
    });
    // swipe
    var sx = null;
    tm.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    tm.addEventListener('pointerup', function (e) {
      if (sx === null) return; var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { go(idx + (dx < 0 ? 1 : -1), true); schedule(); }   // RTL: swipe left = next
    });
    tm.tabIndex = 0; tm.setAttribute('role', 'region'); tm.setAttribute('aria-roledescription', 'اسلایدر'); tm.setAttribute('aria-label', 'دیدگاه مشتریان');
    go(0, false);
    // only auto-advance while visible
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      hoverPaused = !es[0].isIntersecting; hoverPaused ? clearTimeout(timer) : schedule();
    }, { threshold: 0.3 }).observe(tm);
    schedule();
  }

  /* ---------- accordion (single open, keyboard: Up/Down/Home/End) ---------- */
  var acc = $('[data-acc]');
  if (acc) {
    var btns = $$('.acc-btn', acc);
    var setOpen = function (b, open) {
      b.setAttribute('aria-expanded', String(open));
      $('#' + b.getAttribute('aria-controls')).classList.toggle('is-open', open);
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        btns.forEach(function (o) { if (o !== b) setOpen(o, false); });
        setOpen(b, open);
      });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown') n = btns[(i + 1) % btns.length];
        if (e.key === 'ArrowUp') n = btns[(i - 1 + btns.length) % btns.length];
        if (e.key === 'Home') n = btns[0];
        if (e.key === 'End') n = btns[btns.length - 1];
        if (n) { e.preventDefault(); n.focus(); }
      });
    });
  }

  /* ---------- footer quick form (SIMULATED — no request is sent in the preview) ---------- */
  var qf = $('[data-quick]');
  if (qf) {
    var inp = $('input', qf), msg = $('.field-msg', qf), sb = $('button[type=submit]', qf);
    var say = function (t, kind) {
      msg.className = 'field-msg ' + (kind ? 'is-' + kind : '');
      msg.innerHTML = '';
      if (kind) { var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'icon'); s.setAttribute('aria-hidden', 'true'); var u = doc.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', kind === 'error' ? '#i-warn' : '#i-check'); s.appendChild(u); msg.appendChild(s); }
      msg.appendChild(doc.createTextNode(t));
    };
    inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid')) { inp.removeAttribute('aria-invalid'); say('', ''); } });
    qf.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = inp.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { inp.setAttribute('aria-invalid', 'true'); say(v ? 'قالب ایمیل درست نیست؛ مثال: name@company.com' : 'لطفاً ایمیل خود را وارد کنید.', 'error'); inp.focus(); return; }
      sb.classList.add('is-loading'); sb.disabled = true; inp.disabled = true; say('', '');
      setTimeout(function () { sb.classList.remove('is-loading'); sb.disabled = false; inp.disabled = false; inp.value = ''; say('عضویت شما ثبت شد (شبیه‌سازی پیش‌نمایش).', 'success'); }, 1100);
    });
  }

  /* ---------- preview-only panel ---------- */
  var pv = $('[data-pv]');
  if (pv) {
    var pt = $('.pv-toggle', pv), pp = $('.pv-panel', pv);
    pt.addEventListener('click', function () { var o = !pp.classList.contains('is-open'); pp.classList.toggle('is-open', o); pt.setAttribute('aria-expanded', String(o)); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pp.classList.contains('is-open')) { pp.classList.remove('is-open'); pt.setAttribute('aria-expanded', 'false'); pt.focus(); } });
    var seg = $$('[data-pv-motion] button', pv);
    var syncSeg = function () { seg.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === motion())); }); };
    syncSeg();
    seg.forEach(function (b) { b.addEventListener('click', function () {
      root.setAttribute('data-motion', b.dataset.v); try { localStorage.setItem('abira-motion', b.dataset.v); } catch (e) {}
      syncSeg(); counters.forEach(function (c) { c.textContent = toFa(c.dataset.count); }); tick();
    }); });
    $('[data-pv-replay]', pv).addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'auto' });
      root.classList.remove('is-ready'); started = false;
      revealEls.forEach(function (el) { el.classList.remove('is-in'); watchReveal(el); });
      counters.forEach(function (c) { c.textContent = toFa(0); if ('IntersectionObserver' in window) cObs.observe(c); });
      void root.offsetWidth; setTimeout(startIntro, 80);
    });
  }
})();
