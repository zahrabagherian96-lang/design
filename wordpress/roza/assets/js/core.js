/* ROZA (وردپرس) — هسته: تاریخ شمسی، اعداد فارسی، منو، هدر، گالری، لایت‌باکس، پرسش‌ها.
   محتوا را وردپرس در HTML می‌سازد؛ این فایل فقط رفتارها را اضافه می‌کند. */
(function () {
  'use strict';
  var R = window.ROZA = window.ROZA || {};

  /* ---------- تقویم جلالی (الگوریتم jalaali-js، مجوز MIT) ---------- */
  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }
  function jalCal(jy, withoutLeap) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, leapG, march, n, i;
    for (i = 1; i < bl; i += 1) { jm = BREAKS[i]; jump = jm - jp; if (jy < jm) break; leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4); jp = jm; }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (withoutLeap) return { gy: gy, march: march };
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }
  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  }
  function d2g(jdn) {
    var j = 4 * jdn + 139361631, i, gd, gm, gy;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    i = div(mod(j, 1461), 4) * 5 + 308; gd = div(mod(i, 153), 5) + 1; gm = mod(div(i, 153), 12) + 1; gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }
  function j2d(jy, jm, jd) { var r = jalCal(jy, true); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1; }
  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy, false), k = jdn - g2d(gy, 3, r.march), jm, jd;
    if (k >= 0) { if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd }; } k -= 186; }
    else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { jy: jy, jm: jm, jd: jd };
  }
  var J = {
    toJalali: function (date) { return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate())); },
    toDate: function (jy, jm, jd) { var g = d2g(j2d(jy, jm, jd)); return new Date(g.gy, g.gm - 1, g.gd); },
    monthLength: function (jy, jm) { return jm <= 6 ? 31 : jm <= 11 ? 30 : (jalCal(jy).leap === 0 ? 30 : 29); },
    months: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
    weekdaysShort: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
    weekday: function (date) { return (date.getDay() + 1) % 7; }
  };

  /* ---------- قالب‌بندی ---------- */
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function fa(v) { return String(v).replace(/[0-9]/g, function (d) { return FA[d]; }); }
  function toEn(v) { return String(v).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }); }
  function price(n) { return fa(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬')) + ' تومان'; }
  function duration(min) { var h = Math.floor(min / 60), m = min % 60, o = []; if (h) o.push(fa(h) + ' ساعت'); if (m) o.push(fa(m) + ' دقیقه'); return o.join(' و '); }
  function time(mins) { var h = Math.floor(mins / 60), m = mins % 60; return fa((h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m); }
  function dateKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function fromKey(k) { var p = String(k).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function longDate(d) { var j = J.toJalali(d); return J.weekdays[J.weekday(d)] + ' ' + fa(j.jd) + ' ' + J.months[j.jm - 1] + ' ' + fa(j.jy); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function byId(list, id) { for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i]; return null; }

  var ICONS = {
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>', 'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    'chev-left': '<path d="m15 18-6-6 6-6"/>', 'chev-right': '<path d="m9 18 6-6-6-6"/>', 'chev-down': '<path d="m6 9 6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M16 3v3M8 3v3M3 10h18"/>',
    user: '<path d="M19 21v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V21"/><circle cx="12" cy="7.5" r="4"/>',
    users: '<path d="M16 21v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V21"/><circle cx="9.5" cy="7.5" r="4"/><path d="M21 21v-1.5a4 4 0 0 0-3-3.87M15.5 3.63a4 4 0 0 1 0 7.75"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    shield: '<path d="M12 21.5s8-4 8-10V5l-8-3-8 3v6.5c0 6 8 10 8 10z"/><path d="m9 11.5 2 2 4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.5h.01"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
  };
  function icon(name, cls) { return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>'; }
  function imgFail(el) {
    var box = el.parentNode;
    if (!box || box.classList.contains('is-broken')) return;
    box.classList.add('is-broken'); el.remove();
    box.insertAdjacentHTML('beforeend', '<span class="img-fallback">' + icon('image') + '<span>تصویر بارگذاری نشد</span></span>');
  }

  /* درخواست REST */
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: { 'X-WP-Nonce': R.api.nonce } };
    if (opts.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(R.api.root + path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) { var e = new Error(data && data.message ? data.message : 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.'); e.status = res.status; e.data = data; throw e; }
        return data;
      });
    }, function () { var e = new Error('اتصال اینترنت برقرار نیست. دوباره تلاش کنید.'); e.status = 0; throw e; });
  }

  /* ---------- رفتارها ---------- */
  var lastFocus = null;
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(container.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'), function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function initDrawer() {
    var btn = document.getElementById('menuBtn'), d = document.getElementById('drawer');
    if (!btn || !d) return;
    function open() { lastFocus = document.activeElement; d.hidden = false; requestAnimationFrame(function () { d.classList.add('is-open'); }); btn.setAttribute('aria-expanded', 'true'); document.body.classList.add('no-scroll'); d.querySelector('.drawer__top [data-close]').focus(); }
    function close() { d.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll'); setTimeout(function () { d.hidden = true; }, 200); if (lastFocus) lastFocus.focus(); }
    btn.addEventListener('click', open);
    d.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target.closest('.drawer__list a')) close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); trap(d.querySelector('.drawer__panel'), e); });
  }
  function initHeader() {
    var h = document.getElementById('hdr');
    if (!h) return;
    var on = false;
    function check() { var y = window.scrollY, s = on ? y > 8 : y > 48; if (s !== on) { on = s; h.classList.toggle('is-compact', s); } }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }
  function initReveal() {
    if (R.motionOn) return;
    var els = document.querySelectorAll('[data-reveal]:not(.is-in)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }
  function initFaq(root) {
    (root || document).querySelectorAll('.faq__q').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!open));
        b.closest('.faq__item').classList.toggle('is-open', !open);
      });
    });
  }

  /* ---------- لایت‌باکس (داده از ویژگی‌های data-* هر نمونه‌کار) ---------- */
  var LB = { items: [], i: 0, el: null };
  function lightbox(items, index) {
    LB.items = items;
    if (!LB.el) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="lb" id="lb" hidden data-lenis-prevent><div class="lb__backdrop" data-lb-close></div>' +
        '<div class="lb__dialog" role="dialog" aria-modal="true" aria-labelledby="lbTitle">' +
        '<button class="icon-btn lb__close" type="button" data-lb-close aria-label="بستن">' + icon('x') + '</button>' +
        '<button class="icon-btn lb__nav lb__prev" type="button" data-lb="-1" aria-label="تصویر قبلی">' + icon('chev-right') + '</button>' +
        '<figure class="lb__fig"><div class="lb__img"></div><figcaption class="lb__cap"><div><h2 id="lbTitle"></h2><p></p></div><a class="btn btn--primary" href="#">رزرو این خدمت</a></figcaption></figure>' +
        '<button class="icon-btn lb__nav lb__next" type="button" data-lb="1" aria-label="تصویر بعدی">' + icon('chev-left') + '</button>' +
        '<p class="lb__count" aria-live="polite"></p></div></div>');
      LB.el = document.getElementById('lb');
      LB.el.addEventListener('click', function (e) {
        if (e.target.closest('[data-lb-close]')) closeLb();
        var n = e.target.closest('[data-lb]'); if (n) showLb(LB.i + (+n.dataset.lb));
      });
      LB.el.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLb();
        else if (e.key === 'ArrowLeft') showLb(LB.i + 1); // راست‌به‌چپ: چپ = بعدی
        else if (e.key === 'ArrowRight') showLb(LB.i - 1);
        trap(LB.el.querySelector('.lb__dialog'), e);
      });
    }
    lastFocus = document.activeElement;
    LB.el.hidden = false; document.body.classList.add('no-scroll');
    showLb(index);
    requestAnimationFrame(function () { LB.el.classList.add('is-open'); LB.el.querySelector('.lb__close').focus(); });
  }
  function showLb(i) {
    var n = LB.items.length; LB.i = (i + n) % n;
    var b = LB.items[LB.i], box = LB.el.querySelector('.lb__img');
    box.classList.remove('is-broken');
    box.innerHTML = '<img src="' + esc(b.dataset.full) + '" alt="' + esc(b.dataset.title) + '" decoding="async" onerror="ROZA.ui.imgFail(this)">';
    LB.el.querySelector('#lbTitle').textContent = b.dataset.title;
    LB.el.querySelector('.lb__cap p').textContent = b.dataset.meta || '';
    LB.el.querySelector('.lb__cap a').href = b.dataset.book;
    LB.el.querySelector('.lb__count').textContent = fa(LB.i + 1) + ' از ' + fa(n);
    LB.el.querySelectorAll('.lb__nav').forEach(function (x) { x.hidden = n < 2; });
  }
  function closeLb() {
    LB.el.classList.remove('is-open'); document.body.classList.remove('no-scroll');
    setTimeout(function () { LB.el.hidden = true; }, 200);
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- گالری: فیلتر بدون بارگذاری مجدد ---------- */
  function initGalleries() {
    document.querySelectorAll('[data-gallery]').forEach(function (grid) {
      var section = grid.parentNode, bar = section.querySelector('[data-gallery-filters]'), live = section.querySelector('[data-gallery-live]');
      var limit = +grid.dataset.limit || 0;
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('.gal__btn'); if (!b) return;
        var visible = Array.prototype.filter.call(grid.querySelectorAll('.gal__item:not([hidden]) .gal__btn'), function () { return true; });
        lightbox(visible, visible.indexOf(b));
      });
      if (R.motion) R.motion.gallery(grid);
      if (!bar) return;
      bar.addEventListener('click', function (e) {
        var a = e.target.closest('[data-filter]'); if (!a) return;
        e.preventDefault();
        var f = a.dataset.filter, shown = 0;
        bar.querySelectorAll('[data-filter]').forEach(function (c) { if (c === a) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
        grid.querySelectorAll('.gal__item').forEach(function (it) {
          var match = !f || it.dataset.service === f, show = match && (!limit || shown < limit);
          it.hidden = !show; if (show) { shown++; it.classList.remove('is-entering'); void it.offsetWidth; it.classList.add('is-entering'); }
        });
        if (live) live.textContent = fa(shown) + ' نمونه‌کار نمایش داده شد';
        if (!limit && history.replaceState) history.replaceState(null, '', a.href);
        if (R.motion) R.motion.gallery(grid);
      });
    });
  }

  /* کپی کد پیگیری */
  function initCopy() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]'); if (!b) return;
      var done = function () { var l = document.getElementById('copyLive'); if (l) l.textContent = 'کد پیگیری کپی شد'; b.innerHTML = icon('check'); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, done); else done();
    });
  }

  function boot() {
    initDrawer(); initHeader(); initFaq(); initGalleries(); initCopy();
    if (document.cookie.indexOf('roza_cust=1') !== -1) document.querySelectorAll('.hdr__acc').forEach(function (a) { a.classList.add('is-auth'); });
    var page = document.body.dataset.page;
    if (R.pages && R.pages[page]) R.pages[page]();
    initReveal();
  }

  R.J = J;
  R.pages = R.pages || {};
  R.ui = { fa: fa, toEn: toEn, price: price, duration: duration, time: time, dateKey: dateKey, fromKey: fromKey, longDate: longDate, esc: esc, qs: qs, byId: byId, icon: icon, imgFail: imgFail, lightbox: lightbox, initReveal: initReveal, trap: trap, api: api };
  /* اسکریپت‌ها defer هستند؛ پس از اجرای همه، DOMContentLoaded رخ می‌دهد */
  if (document.readyState === 'complete') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
