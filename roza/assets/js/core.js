/* ROZA — هسته مشترک: تاریخ شمسی، اعداد فارسی، آیکون‌ها، هدر/فوتر، حرکت */
(function () {
  'use strict';
  var R = window.ROZA;

  /* ---------- تقویم جلالی (الگوریتم jalaali-js، مجوز MIT) ---------- */
  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }
  function jalCal(jy, withoutLeap) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, leapG, march, n, i;
    for (i = 1; i < bl; i += 1) {
      jm = BREAKS[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
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
    i = div(mod(j, 1461), 4) * 5 + 308;
    gd = div(mod(i, 153), 5) + 1;
    gm = mod(div(i, 153), 12) + 1;
    gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }
  function j2d(jy, jm, jd) {
    var r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy, false), k = jdn - g2d(gy, 3, r.march), jm, jd;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd }; }
      k -= 186;
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
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
    /* 0=شنبه … 6=جمعه */
    weekday: function (date) { return (date.getDay() + 1) % 7; }
  };

  /* ---------- اعداد و قالب‌بندی ---------- */
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function fa(v) { return String(v).replace(/[0-9]/g, function (d) { return FA[d]; }); }
  function toEn(v) {
    return String(v).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
  }
  function price(n) { return fa(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬')) + ' تومان'; }
  function duration(min) {
    var h = Math.floor(min / 60), m = min % 60, out = [];
    if (h) out.push(fa(h) + ' ساعت');
    if (m) out.push(fa(m) + ' دقیقه');
    return out.join(' و ');
  }
  function time(mins) { var h = Math.floor(mins / 60), m = mins % 60; return fa((h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m); }
  function dateKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function fromKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function longDate(d) { var j = J.toJalali(d); return J.weekdays[J.weekday(d)] + ' ' + fa(j.jd) + ' ' + J.months[j.jm - 1] + ' ' + fa(j.jy); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  /* ---------- آیکون‌ها (خطی، ضخامت ۱٫۵) ---------- */
  var ICONS = {
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    'chev-left': '<path d="m15 18-6-6 6-6"/>',
    'chev-right': '<path d="m9 18 6-6-6-6"/>',
    'chev-down': '<path d="m6 9 6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M16 3v3M8 3v3M3 10h18"/>',
    user: '<path d="M19 21v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V21"/><circle cx="12" cy="7.5" r="4"/>',
    users: '<path d="M16 21v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V21"/><circle cx="9.5" cy="7.5" r="4"/><path d="M21 21v-1.5a4 4 0 0 0-3-3.87M15.5 3.63a4 4 0 0 1 0 7.75"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.1-.45c.9.34 1.84.58 2.8.7a2 2 0 0 1 1.7 2z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    spark: '<path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    shield: '<path d="M12 21.5s8-4 8-10V5l-8-3-8 3v6.5c0 6 8 10 8 10z"/><path d="m9 11.5 2 2 4-4"/>',
    chat: '<path d="M21 14.5a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    sofa: '<path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 12v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-4 0v1.5H6V12a2 2 0 0 0-4 0Z"/><path d="M5 18v2M19 18v2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.5h.01"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
    nav: '<path d="M3 11 21 3l-8 18-2-8-8-2z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function icon(name, cls) {
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- تصویر با srcset، ابعاد مشخص و حالت خطا ---------- */
  function img(key, o) {
    o = o || {};
    var p = R.photos[key];
    if (!p) return '';
    var widths = o.widths || [480, 800, 1200], srcset = widths.map(function (w) { return R.px(p.id, w) + ' ' + w + 'w'; }).join(', ');
    var lazy = o.eager ? 'fetchpriority="high"' : 'loading="lazy"';
    return '<img src="' + R.px(p.id, o.w || 800) + '" srcset="' + srcset + '" sizes="' + (o.sizes || '(max-width: 768px) 100vw, 50vw') + '"' +
      ' width="' + (o.width || 800) + '" height="' + (o.height || 1000) + '" alt="' + esc(o.alt != null ? o.alt : p.alt) + '" ' + lazy +
      ' decoding="async" onerror="ROZA.ui.imgFail(this)"' + (o.pos ? ' style="object-position:' + o.pos + '"' : '') + '>';
  }
  function imgFail(el) {
    var box = el.parentNode;
    if (!box || box.classList.contains('is-broken')) return;
    box.classList.add('is-broken');
    el.remove();
    box.insertAdjacentHTML('beforeend', '<span class="img-fallback">' + icon('image') + '<span>تصویر بارگذاری نشد</span></span>');
  }

  /* ---------- هدر و فوتر ---------- */
  var NAV = [
    ['services.html', 'خدمات', 'services'],
    ['gallery.html', 'نمونه‌کارها', 'gallery'],
    ['team.html', 'متخصصان', 'team'],
    ['about.html', 'درباره سالن', 'about'],
    ['about.html#contact', 'تماس با ما', 'contact']
  ];
  function logo() {
    return '<a class="logo" href="index.html" aria-label="روزا، صفحه اصلی"><span class="logo__fa">روزا</span><span class="logo__en" lang="en" dir="ltr">ROZA Beauty Lounge</span></a>';
  }
  function header(page) {
    var links = NAV.map(function (n) {
      return '<li><a href="' + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : '') + '>' + n[1] + '</a></li>';
    }).join('');
    return '<a class="skip" href="#main">رفتن به محتوای اصلی</a>' +
      '<div class="demo-bar" role="note">نسخه نمایشی؛ اطلاعات، قیمت‌ها و تصاویر نمونه‌اند و رزرو واقعی ثبت نمی‌شود.</div>' +
      '<header class="hdr" id="hdr"><div class="container hdr__in">' + logo() +
      '<nav class="hdr__nav" aria-label="منوی اصلی"><ul>' + links + '</ul></nav>' +
      '<a class="btn btn--primary hdr__cta" href="booking.html">رزرو نوبت</a>' +
      '<button class="icon-btn hdr__menu" id="menuBtn" aria-label="باز کردن منو" aria-expanded="false" aria-controls="drawer">' + icon('menu') + '</button>' +
      '</div></header>' +
      '<div class="drawer" id="drawer" hidden><div class="drawer__backdrop" data-close></div>' +
      '<div class="drawer__panel" role="dialog" aria-modal="true" aria-label="منو">' +
      '<div class="drawer__top">' + logo() + '<button class="icon-btn" data-close aria-label="بستن منو">' + icon('x') + '</button></div>' +
      '<ul class="drawer__list">' + '<li><a href="index.html"' + (page === 'home' ? ' aria-current="page"' : '') + '>خانه</a></li>' + links + '</ul>' +
      '<a class="btn btn--primary btn--block" href="booking.html">رزرو نوبت</a>' +
      '<a class="drawer__phone" href="' + R.salon.phoneHref + '">' + icon('phone') + '<span dir="ltr">' + fa(R.salon.phone) + '</span></a>' +
      '</div></div>';
  }
  function footer() {
    var s = R.salon;
    var hours = s.hours.map(function (h) { return '<li><span>' + h.days + '</span><span>' + h.time + '</span></li>'; }).join('');
    return '<footer class="ftr"><div class="container">' +
      '<div class="ftr__grid">' +
      '<div class="ftr__brand">' + logo() + '<p>زمانی برای خودت؛ تجربه‌ای دقیق و آرام از زیبایی.</p>' +
      '<a class="btn btn--primary" href="booking.html">رزرو نوبت</a></div>' +
      '<div><h2 class="ftr__h">تماس</h2><ul class="ftr__list">' +
      '<li>' + icon('pin') + '<span>' + s.address + '</span></li>' +
      '<li>' + icon('phone') + '<a href="' + s.phoneHref + '" dir="ltr">' + fa(s.phone) + '</a></li>' +
      '<li>' + icon('instagram') + '<a href="https://instagram.com/' + s.instagram + '" target="_blank" rel="noopener" dir="ltr">@' + s.instagram + '</a></li>' +
      '<li>' + icon('nav') + '<a href="' + s.mapUrl + '" target="_blank" rel="noopener">مسیریابی روی نقشه</a></li></ul></div>' +
      '<div><h2 class="ftr__h">ساعات کاری</h2><ul class="ftr__hours">' + hours + '</ul></div>' +
      '<div><h2 class="ftr__h">صفحات</h2><ul class="ftr__links">' +
      NAV.map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + '</a></li>'; }).join('') +
      '<li><a href="credits.html">منابع تصاویر</a></li></ul></div>' +
      '</div>' +
      '<p class="ftr__demo">' + icon('info') + 'اطلاعات تماس، آدرس، قیمت‌ها و نام متخصصان نمونه و قابل‌ویرایش‌اند. تصاویر از Pexels و فقط برای پیش‌نمایش‌اند.</p>' +
      '<p class="ftr__copy">© ' + fa(1405) + ' روزا · ROZA Beauty Lounge</p>' +
      '<div class="ftr__mega" aria-hidden="true">روزا</div>' +
      '</div></footer>' +
      '<div class="mcta" id="mcta"><a class="btn btn--primary btn--block" href="booking.html">' + icon('calendar') + 'رزرو نوبت</a></div>';
  }

  /* ---------- رفتارها ---------- */
  var lastFocus = null;
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var f = container.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function initDrawer() {
    var btn = document.getElementById('menuBtn'), d = document.getElementById('drawer');
    if (!btn || !d) return;
    function open() { lastFocus = document.activeElement; d.hidden = false; requestAnimationFrame(function () { d.classList.add('is-open'); }); btn.setAttribute('aria-expanded', 'true'); document.body.classList.add('no-scroll'); d.querySelector('[data-close].icon-btn').focus(); }
    function close() { d.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll'); setTimeout(function () { d.hidden = true; }, 200); if (lastFocus) lastFocus.focus(); }
    btn.addEventListener('click', open);
    d.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target.closest('.drawer__list a')) close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); trap(d.querySelector('.drawer__panel'), e); });
  }
  function initHeader() {
    var h = document.getElementById('hdr');
    if (!h) return;
    var on = false;
    function check() { var s = window.scrollY > 24; if (s !== on) { on = s; h.classList.toggle('is-compact', s); } }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }
  function initReveal() {
    if (R.motionOn) return;
    var els = document.querySelectorAll('[data-reveal]:not(.is-in)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- لایت‌باکس (کیبورد: Esc، فلش‌ها با منطق راست‌به‌چپ) ---------- */
  var LB = { items: [], i: 0, el: null };
  function lightbox(items, index) {
    LB.items = items; LB.i = index;
    if (!LB.el) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="lb" id="lb" hidden><div class="lb__backdrop" data-lb-close></div>' +
        '<div class="lb__dialog" role="dialog" aria-modal="true" aria-labelledby="lbTitle">' +
        '<button class="icon-btn lb__close" data-lb-close aria-label="بستن">' + icon('x') + '</button>' +
        '<button class="icon-btn lb__nav lb__prev" data-lb="-1" aria-label="تصویر قبلی">' + icon('chev-right') + '</button>' +
        '<figure class="lb__fig"><div class="lb__img"></div><figcaption class="lb__cap"><div><h2 id="lbTitle"></h2><p></p></div><a class="btn btn--primary" href="#">رزرو این خدمت</a></figcaption></figure>' +
        '<button class="icon-btn lb__nav lb__next" data-lb="1" aria-label="تصویر بعدی">' + icon('chev-left') + '</button>' +
        '<p class="lb__count" aria-live="polite"></p></div></div>');
      LB.el = document.getElementById('lb');
      LB.el.addEventListener('click', function (e) {
        if (e.target.closest('[data-lb-close]')) closeLb();
        var n = e.target.closest('[data-lb]'); if (n) showLb(LB.i + (+n.dataset.lb));
      });
      LB.el.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLb();
        else if (e.key === 'ArrowLeft') showLb(LB.i + 1);   // RTL: چپ = بعدی
        else if (e.key === 'ArrowRight') showLb(LB.i - 1);
        trap(LB.el.querySelector('.lb__dialog'), e);
      });
    }
    lastFocus = document.activeElement;
    LB.el.hidden = false;
    document.body.classList.add('no-scroll');
    showLb(index);
    requestAnimationFrame(function () { LB.el.classList.add('is-open'); LB.el.querySelector('.lb__close').focus(); });
  }
  function showLb(i) {
    var n = LB.items.length; LB.i = (i + n) % n;
    var it = LB.items[LB.i], sv = byId(R.services, it.service), sp = byId(R.specialists, it.specialist);
    var box = LB.el.querySelector('.lb__img');
    box.classList.remove('is-broken');
    box.innerHTML = img(it.photo, { widths: [800, 1200, 1600], w: 1200, sizes: '(max-width: 768px) 100vw, 70vw', eager: true });
    LB.el.querySelector('#lbTitle').textContent = it.title;
    LB.el.querySelector('.lb__cap p').textContent = (sv ? sv.name : '') + (sp ? ' · ' + sp.name : '') + ' · تصویر نمونه (استوک)';
    LB.el.querySelector('.lb__cap a').href = 'booking.html?service=' + it.service + (sp ? '&specialist=' + sp.id : '');
    LB.el.querySelector('.lb__count').textContent = fa(LB.i + 1) + ' از ' + fa(n);
    var multi = n > 1;
    LB.el.querySelectorAll('.lb__nav').forEach(function (b) { b.hidden = !multi; });
  }
  function closeLb() {
    LB.el.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { LB.el.hidden = true; }, 200);
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- آکاردئون پرسش‌ها ---------- */
  function faqHtml(list) {
    return list.map(function (f, i) {
      return '<div class="faq__item"><h3><button class="faq__q" aria-expanded="false" aria-controls="faq' + i + '" id="faqq' + i + '">' +
        '<span>' + f.q + '</span>' + icon('plus', 'faq__ico') + '</button></h3>' +
        '<div class="faq__a" id="faq' + i + '" role="region" aria-labelledby="faqq' + i + '"><div><p>' + f.a + '</p></div></div></div>';
    }).join('');
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

  /* ---------- ابتدای هر صفحه ---------- */
  function boot() {
    var page = document.body.dataset.page;
    var top = document.getElementById('layout-top'), bottom = document.getElementById('layout-bottom');
    if (top) top.outerHTML = header(page);
    if (bottom) bottom.outerHTML = footer();
    if (page === 'booking') document.body.classList.add('no-mcta');
    document.querySelectorAll('[data-ico]').forEach(function (el) { el.outerHTML = icon(el.dataset.ico, el.className); });
    initDrawer(); initHeader();
    if (window.ROZA.page) window.ROZA.page(page);
    initReveal();
  }

  R.J = J;
  R.ui = {
    fa: fa, toEn: toEn, price: price, duration: duration, time: time, dateKey: dateKey, fromKey: fromKey, longDate: longDate,
    esc: esc, qs: qs, byId: byId, icon: icon, img: img, imgFail: imgFail, lightbox: lightbox, faqHtml: faqHtml, initFaq: initFaq,
    initReveal: initReveal, trap: trap
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
