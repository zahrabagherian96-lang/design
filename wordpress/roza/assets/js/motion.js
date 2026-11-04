/* ROZA — لایه حرکت (GSAP + ScrollTrigger + Lenis)
   اسکرول نرم، پیش‌بارگذار، انتقال صفحه، متن‌های اسکرول‌محور، خدمات افقیِ پین‌شده،
   ستون‌های پارالاکس گالری، کرسر سفارشی، دکمه‌های مغناطیسی و تیلت تصویر.
   با prefers-reduced-motion همه این‌ها خاموش می‌شود و سایت ایستا و کامل می‌ماند. */
(function () {
  'use strict';
  var R = window.ROZA;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  R.motionOn = true; // core.js با این پرچم انیمیشن ساده خودش را اجرا نمی‌کند

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  var html = document.documentElement;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mm = gsap.matchMedia();
  var EASE = 'expo.out';

  /* ---------- شکستن متن به کلمه (حروف فارسی به‌هم‌چسبیده نمی‌شکنند) ---------- */
  function splitWords(el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = '1';
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'), i = document.createElement('span');
            w.className = 'w'; i.className = 'wi'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w); out.push(i);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'svg') walk(n);
      });
    })(el);
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    return out;
  }

  /* ---------- اسکرول نرم ---------- */
  var lenis = null;
  function initLenis() {
    if (!window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    R.lenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    /* توقف هنگام باز بودن منو/لایت‌باکس */
    new MutationObserver(function () {
      if (document.body.classList.contains('no-scroll')) lenis.stop(); else lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    /* لینک‌های داخل همین صفحه */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href*="#"]');
      if (!a) return;
      var url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
      var t = document.querySelector(url.hash);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -88 });
      history.replaceState(null, '', url.hash);
      if (url.hash === '#main') t.focus({ preventScroll: true });
    });
  }

  /* ---------- نوار پیشرفت و هدرِ پنهان‌شونده ---------- */
  function initChrome() {
    var bar = document.createElement('div');
    bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    var hdr = document.getElementById('hdr');
    if (hdr && document.body.dataset.page !== 'booking') {
      ST.create({
        start: 'top -320', end: 'max',
        onUpdate: function (s) { hdr.classList.toggle('is-hidden', s.direction === 1 && !document.body.classList.contains('no-scroll')); }
      });
      ST.create({ start: 'top -320', onLeaveBack: function () { hdr.classList.remove('is-hidden'); } });
    }
  }

  /* ---------- پرده: پیش‌بارگذار و انتقال صفحه ---------- */
  var curtain = document.querySelector('.curtain');
  function revealPage(done) {
    var isPre = html.classList.contains('preload'), isIn = html.classList.contains('pt-in');
    if (!curtain || (!isPre && !isIn)) { done(); return; }
    var tl = gsap.timeline({ onComplete: function () { html.classList.remove('preload', 'pt-in'); gsap.set(curtain, { clearProps: 'all' }); done(); } });
    if (isPre) {
      try { sessionStorage.setItem('roza-seen', '1'); } catch (e) { /* */ }
      tl.from('.curtain__fa', { yPercent: 110, duration: 0.9, ease: EASE })
        .from('.curtain__en span', { yPercent: 110, opacity: 0, stagger: 0.025, duration: 0.6, ease: EASE }, '-=0.6')
        .fromTo('.curtain__bar', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, '-=0.5')
        .to('.curtain__brand', { yPercent: -40, opacity: 0, duration: 0.5, ease: 'power3.in' }, '+=0.1');
    }
    tl.to(curtain, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, isPre ? '-=0.2' : 0.05);
  }
  function initTransitions() {
    if (!curtain) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // لینک هم‌صفحه
      e.preventDefault();
      try { sessionStorage.setItem('roza-pt', '1'); } catch (er) { /* */ }
      html.classList.add('pt-out');
      gsap.fromTo(curtain, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.55, ease: 'expo.inOut', onComplete: function () { location.href = url.href; } });
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { html.classList.remove('pt-out', 'pt-in'); gsap.set(curtain, { clearProps: 'all' }); } });
  }

  /* ---------- هیرو ---------- */
  function heroIntro() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var words = splitWords(hero.querySelector('.hero__title'));
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from(words, { yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.08 })
      .from('.hero .eyebrow', { opacity: 0, x: 24, duration: 0.8 }, 0.1)
      .from('.hero__lead, .hero__actions > *, .hero__meta > *', { opacity: 0, y: 24, duration: 0.9, stagger: 0.07 }, 0.35)
      .fromTo('.hero__img', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
      .fromTo('.hero__img img', { scale: 1.45 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.2)
      .from('.hero__accent', { scale: 0.6, opacity: 0, duration: 1.2 }, 0.5)
      .from('.hero__card', { y: 40, opacity: 0, scale: 0.92, duration: 0.9 }, 0.9);
    /* اسکرول: تصویر و متن با سرعت متفاوت */
    gsap.fromTo('.hero__img img', { yPercent: 0 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__copy', { y: -80, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'center center', end: 'bottom top', scrub: true } });
    gsap.to('.hero__card', { y: -60, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- جمله شاخص: کلمه‌به‌کلمه پررنگ می‌شود ---------- */
  function statement() {
    document.querySelectorAll('.statement__text').forEach(function (el) {
      var w = splitWords(el);
      gsap.fromTo(w, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true } });
    });
    document.querySelectorAll('.statement__img').forEach(function (el, i) {
      gsap.fromTo(el, { y: 120 * (i % 2 ? 1.6 : 1), rotate: i % 2 ? 6 : -5 }, { y: -120 * (i % 2 ? 1.2 : 0.8), rotate: i % 2 ? -3 : 3, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- نوار متحرک: سرعت و جهت با اسکرول ---------- */
  function marquees() {
    document.querySelectorAll('.marquee').forEach(function (m) {
      var track = m.querySelector('.marquee__track');
      if (!track) return;
      track.innerHTML += track.innerHTML; // دو نسخه برای حلقه بی‌درز
      var dir = m.dataset.dir === 'rev' ? -1 : 1;
      var tw = gsap.fromTo(track, { xPercent: 0 }, { xPercent: 50 * dir, duration: +m.dataset.speed || 28, ease: 'none', repeat: -1 });
      var boost = gsap.quickTo(tw, 'timeScale', { duration: 0.6, ease: 'power3' });
      ST.create({
        trigger: m, start: 'top bottom', end: 'bottom top',
        onUpdate: function (s) { var v = s.getVelocity() / 220; boost(gsap.utils.clamp(-6, 6, s.direction * Math.max(1, Math.abs(v)))); }
      });
      ST.create({ trigger: m, start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? tw.play() : tw.pause(); } });
    });
  }

  /* ---------- خدمات: اسکرول افقیِ پین‌شده (دسکتاپ) ---------- */
  function horizontalServices() {
    var sec = document.querySelector('.hs');
    if (!sec) return;
    mm.add('(min-width: 1024px)', function () {
      html.classList.add('hs-on');
      var track = sec.querySelector('.hs__track'), vp = sec.querySelector('.hs__viewport'), bar = sec.querySelector('.hs__bar i');
      function dist() { return Math.max(0, track.scrollWidth - vp.clientWidth); }
      var tween = gsap.to(track, {
        x: function () { return dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, pin: true, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.8, invalidateOnRefresh: true } });
      /* تصویر هر کارت داخل قابش خلاف جهت حرکت ریل جابه‌جا می‌شود (راست‌به‌چپ) */
      gsap.fromTo(track.querySelectorAll('.svc .media img'), { xPercent: 10, scale: 1.2 }, {
        xPercent: -10, scale: 1.2, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, scrub: true, invalidateOnRefresh: true }
      });
      /* ورود کارت‌ها وقتی بخش به دید می‌آید */
      gsap.from(track.querySelectorAll('.svc'), { y: 120, opacity: 0, rotate: -4, duration: 1.2, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: sec, start: 'top 70%' } });
      ST.refresh();
      return function () { html.classList.remove('hs-on'); };
    });
  }

  /* ---------- آشکارسازی‌ها ---------- */
  function reveals() {
    var heads = document.querySelectorAll('.sec-head h2, .bridal__copy h2, .page-head h1, .detail__info h1, #spaceTitle, .about-intro h2, .bk-page__title, .result h1');
    heads.forEach(function (h) {
      var w = splitWords(h);
      gsap.from(w, { yPercent: 115, rotate: 3, duration: 1.1, ease: EASE, stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    gsap.utils.toArray('.eyebrow').forEach(function (e) {
      if (e.closest('.hero')) return;
      gsap.from(e, { opacity: 0, x: 30, duration: 0.9, ease: EASE, scrollTrigger: { trigger: e, start: 'top 90%' } });
    });
    /* عناصر عمومی */
    var items = gsap.utils.toArray('[data-reveal]').filter(function (el) { return !el.closest('.hs-on .hs'); });
    gsap.set(items, { opacity: 0, y: 60 });
    ST.batch(items, { start: 'top 90%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.09, overwrite: true }); } });
    /* تصاویر: پرده عمودی + زوم */
    gsap.utils.toArray('.bridal .media, .space__imgs .media, .pro .media, .detail__img, .about-intro .media, .svc-grid .svc .media').forEach(function (m) {
      if (m.closest('.hs-on .hs')) return;
      var img = m.querySelector('img');
      var tl = gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 88%' } });
      tl.fromTo(m, { clipPath: 'inset(18% 10% 18% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' });
      if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: EASE }, 0);
    });
    /* پارالاکس داخل قاب */
    gsap.utils.toArray('.bridal .media img, .space__imgs .media img, .about-intro .media img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      img.style.scale = '1.2';
    });
    /* متخصصان: ستون‌های زوج سریع‌تر */
    mm.add('(min-width: 900px)', function () {
      gsap.utils.toArray('.team-grid .pro').forEach(function (p, i) {
        gsap.fromTo(p, { y: i % 2 ? 90 : 0 }, { y: i % 2 ? -50 : 0, ease: 'none', scrollTrigger: { trigger: p.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
    /* بنر عروس: کارت متن کمی بالاتر می‌رود */
    gsap.utils.toArray('.bridal__copy').forEach(function (c) {
      gsap.fromTo(c.children, { y: 40 }, { y: -20, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- گالری: ستون‌ها با سرعت‌های متفاوت ---------- */
  var galTriggers = [];
  function gallery(grid) {
    galTriggers.forEach(function (t) { t.kill(); });
    galTriggers = [];
    if (!grid) return;
    var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    var speeds = cols >= 4 ? [0, 90, 30, 130] : cols === 3 ? [0, 110, 40] : [0, 60];
    var items = grid.querySelectorAll('.gal__item');
    items.forEach(function (it, i) {
      var s = speeds[i % cols] || 0;
      var tw = gsap.fromTo(it, { y: s * 0.6 }, { y: -s * 0.6, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true } });
      galTriggers.push(tw.scrollTrigger);
      var m = it.querySelector('.media'), img = m && m.querySelector('img');
      if (m) {
        var tl = gsap.timeline({ scrollTrigger: { trigger: it, start: 'top 95%' } });
        tl.fromTo(m, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', delay: (i % cols) * 0.08, clearProps: 'clipPath' });
        if (img) tl.fromTo(img, { scale: 1.4 }, { scale: 1, duration: 1.6, ease: EASE }, '<');
        galTriggers.push(tl.scrollTrigger);
      }
    });
    grid.classList.add('gal--moving');
    ST.refresh();
  }

  /* ---------- کرسر سفارشی ---------- */
  function cursor() {
    if (!fine || R.cursor === false) return;
    html.classList.add('has-cursor');
    var c = document.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"><span class="cursor__label"></span></span>';
    document.body.appendChild(c);
    var dot = c.querySelector('.cursor__dot'), ring = c.querySelector('.cursor__ring'), label = c.querySelector('.cursor__label');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { c.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', function () { c.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      var v = e.target.closest('[data-cursor]'), a = e.target.closest('a, button, label, input, textarea, select, [role="button"]');
      c.classList.toggle('is-view', !!v);
      c.classList.toggle('is-link', !v && !!a);
      c.classList.toggle('is-text', !!e.target.closest('input, textarea'));
      label.textContent = v ? v.dataset.cursor : '';
    });
    document.addEventListener('pointerdown', function () { c.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { c.classList.remove('is-down'); });
  }
  function tagCursorTargets() {
    document.querySelectorAll('.gal__btn').forEach(function (b) { b.dataset.cursor = 'بزرگ‌نمایی'; });
    document.querySelectorAll('.svc .media, .pro .media').forEach(function (b) { b.dataset.cursor = 'مشاهده'; });
    document.querySelectorAll('.hero__img').forEach(function (b) { b.dataset.cursor = 'روزا'; });
  }

  /* ---------- دکمه‌های مغناطیسی ---------- */
  function magnetic(root) {
    if (!fine) return;
    (root || document).querySelectorAll('.btn--primary, .btn--ghost, .icon-btn, .hdr__nav a, .logo').forEach(function (el) {
      if (el.dataset.mag || el.closest('.bk, .lb, .drawer')) return;
      el.dataset.mag = '1';
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' }), yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28); yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- تیلت سه‌بعدی تصاویر گالری ---------- */
  function tilt(root) {
    if (!fine) return;
    (root || document).querySelectorAll('.gal__btn .media, .pro .media').forEach(function (m) {
      if (m.dataset.tilt) return;
      m.dataset.tilt = '1';
      gsap.set(m, { transformPerspective: 900 });
      var rX = gsap.quickTo(m, 'rotationX', { duration: 0.6, ease: 'power3' }), rY = gsap.quickTo(m, 'rotationY', { duration: 0.6, ease: 'power3' });
      m.addEventListener('pointermove', function (e) {
        var r = m.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        rY(px * 8); rX(-py * 8);
      });
      m.addEventListener('pointerleave', function () { rX(0); rY(0); });
    });
  }

  /* ---------- رزرو: انتقال نرم بین مراحل ---------- */
  function bookingSteps() {
    var root = document.getElementById('booking');
    if (!root) return;
    var last = null;
    new MutationObserver(function () {
      var p = root.querySelector('.bk__panel'), step = root.querySelector('.bk__count');
      var key = step && step.textContent;
      if (!p || key === last) return;
      last = key;
      gsap.from(p.querySelectorAll('.bk__head > *, .opt, .cal, .slots, .form > *'), { opacity: 0, y: 24, duration: 0.6, stagger: 0.035, ease: EASE, clearProps: 'all' });
    }).observe(root, { childList: true });
  }

  /* ---------- شروع ---------- */
  R.motion = {
    gallery: function (grid) { tagCursorTargets(); tilt(grid); if (started) gallery(grid); else pendingGrids.push(grid); }
  };
  var started = false, pendingGrids = [];
  function start() {
    html.classList.add('has-motion');
    initLenis();
    initTransitions();
    tagCursorTargets();
    cursor();
    revealPage(function () {
      started = true;
      initChrome();
      heroIntro();
      statement();
      marquees();
      horizontalServices();
      reveals();
      pendingGrids.forEach(gallery); pendingGrids = [];
      magnetic(); tilt();
      bookingSteps();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
      if (document.readyState === 'complete') ST.refresh(); else window.addEventListener('load', function () { ST.refresh(); });
    });
  }
  if (document.readyState === 'complete') start(); else document.addEventListener('DOMContentLoaded', start);
})();
