/* ROZA — منطق صفحات */
(function () {
  'use strict';
  var R = window.ROZA, U = R.ui, J = R.J;
  function $(s, r) { return (r || document).querySelector(s); }
  function catOf(serviceId) { var s = U.byId(R.services, serviceId); return s ? s.cat : ''; }
  function priceText(s) { return (s.priceType === 'estimate' ? 'از ' : '') + U.price(s.price); }

  /* ---------- کامپوننت‌ها ---------- */
  function svcCard(s, i) {
    return '<article class="svc" data-reveal data-reveal-delay="' + (i % 3) + '">' +
      '<a class="media" href="service.html?id=' + s.id + '" tabindex="-1" aria-hidden="true">' + U.img(s.photo, { sizes: '(max-width: 768px) 100vw, 33vw', width: 800, height: 600, alt: '' }) + '</a>' +
      '<div class="svc__body"><h3><a href="service.html?id=' + s.id + '">' + s.name + '</a></h3><p class="svc__desc">' + s.short + '</p>' +
      '<div class="svc__meta"><span>' + U.icon('clock') + 'حدود ' + U.duration(s.duration) + '</span><span class="svc__price">' + priceText(s) + '</span>' +
      (s.priceType === 'estimate' ? '<span class="badge badge--est">برآورد اولیه</span>' : '') + '</div>' +
      '<div class="svc__actions"><a class="btn btn--soft btn--sm" href="booking.html?service=' + s.id + '">انتخاب خدمت</a>' +
      '<a class="btn btn--link btn--sm" href="service.html?id=' + s.id + '">جزئیات' + U.icon('arrow-left') + '</a></div></div></article>';
  }
  function proCard(p, i) {
    return '<article class="pro" data-reveal data-reveal-delay="' + (i % 4) + '">' +
      '<a class="media" href="specialist.html?id=' + p.id + '" tabindex="-1" aria-hidden="true">' + U.img(p.photo, { sizes: '(max-width: 900px) 50vw, 20vw', width: 600, height: 800, alt: '' }) + '<span class="stock-tag">تصویر نمونه</span></a>' +
      '<div><h3>' + p.name + '</h3><p>' + p.role + '</p></div>' +
      '<a class="btn btn--link" href="specialist.html?id=' + p.id + '">دیدن پروفایل و نوبت‌ها' + U.icon('arrow-left') + '</a></article>';
  }
  function galItem(it, i) {
    var sv = U.byId(R.services, it.service), sp = U.byId(R.specialists, it.specialist);
    var ba = it.beforeAfter && it.beforeAfter.before && it.beforeAfter.after; // فقط جفت‌عکس معتبر
    return '<figure class="gal__item is-entering" style="animation-delay:' + Math.min(i, 8) * 30 + 'ms">' +
      '<button type="button" class="gal__btn" data-gal="' + i + '" aria-label="بزرگ‌نمایی: ' + U.esc(it.title) + '">' +
      '<span class="media">' + U.img(it.photo, { sizes: '(max-width: 768px) 50vw, 33vw', width: 800, height: 1000, alt: it.title + ' — تصویر نمونه' }) +
      '<span class="stock-tag">تصویر نمونه</span><span class="gal__zoom" aria-hidden="true">' + U.icon('expand') + '</span></span></button>' +
      (ba ? '<div class="ba"><span class="badge">قبل و بعد</span></div>' : '') +
      '<figcaption class="gal__cap"><div><h3>' + it.title + '</h3><p>' + (sv ? sv.name : '') + (sp ? ' · ' + sp.name : '') + '</p></div>' +
      '<a class="gal__book" href="booking.html?service=' + it.service + (sp ? '&specialist=' + sp.id : '') + '">رزرو این خدمت</a></figcaption></figure>';
  }

  /* گالری با فیلتر و لایت‌باکس */
  function gallery(opts) {
    var grid = $(opts.grid), bar = $(opts.filters);
    if (!grid) return;
    var source = opts.items || R.gallery, current = opts.initial || 'all', shown = [];
    function counts(c) { return source.filter(function (g) { return c === 'all' || catOf(g.service) === c; }).length; }
    if (bar) {
      var cats = [{ id: 'all', name: 'همه' }].concat(R.categories.filter(function (c) { return counts(c.id) > 0 || opts.showEmpty; }));
      bar.innerHTML = cats.map(function (c) {
        return '<button type="button" class="chip" data-filter="' + c.id + '" aria-pressed="' + (c.id === current) + '">' + c.name + '<span class="count">' + U.fa(counts(c.id)) + '</span></button>';
      }).join('');
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-filter]'); if (!b) return;
        current = b.dataset.filter;
        bar.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        draw();
        if (opts.syncUrl) history.replaceState(null, '', current === 'all' ? location.pathname : '?cat=' + current);
      });
    }
    function draw() {
      shown = source.filter(function (g) { return current === 'all' || catOf(g.service) === current; });
      var list = opts.limit ? shown.slice(0, opts.limit) : shown;
      grid.innerHTML = list.length ? list.map(galItem).join('')
        : '<div class="gal-empty" style="grid-column:1/-1">' + U.icon('image') + '<p>هنوز نمونه‌کاری برای این دسته ثبت نشده است.</p></div>';
      var live = $(opts.live); if (live) live.textContent = U.fa(list.length) + ' نمونه‌کار نمایش داده شد';
      if (R.motion) R.motion.gallery(grid);
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gal]'); if (!b) return;
      U.lightbox(opts.limit ? shown.slice(0, opts.limit) : shown, +b.dataset.gal);
    });
    draw();
  }

  function reviewsHtml() {
    return R.reviews.map(function (r) {
      return '<figure class="review">' + U.icon('chat', 'review__q') +
        '<blockquote>' + r.text + '</blockquote><footer><div><strong>' + r.name + '</strong><span>' + r.service + '</span></div>' +
        (r.sample ? '<span class="badge badge--muted">ساختار نمونه</span>' : '') + '</footer></figure>';
    }).join('');
  }
  var SPACE_ICONS = ['chat', 'shield', 'sofa'];
  function spaceList() {
    return R.space.map(function (s, i) {
      return '<li data-reveal data-reveal-delay="' + i + '"><span class="ico-wrap">' + U.icon(SPACE_ICONS[i % 3]) + '</span><div><h3>' + s.title + '</h3><p>' + s.text + '</p></div></li>';
    }).join('');
  }
  function contactCards() {
    var s = R.salon;
    return '<div class="contact__card" data-reveal><span class="ico-wrap">' + U.icon('pin') + '</span><h3>آدرس</h3><p>' + s.address + '</p>' +
      '<a class="btn btn--ghost btn--sm" href="' + s.mapUrl + '" target="_blank" rel="noopener">' + U.icon('nav') + 'مسیریابی</a></div>' +
      '<div class="contact__card" data-reveal data-reveal-delay="1"><span class="ico-wrap">' + U.icon('clock') + '</span><h3>ساعات کاری</h3><ul>' +
      s.hours.map(function (h) { return '<li><span>' + h.days + '</span><span>' + h.time + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="contact__card" data-reveal data-reveal-delay="2"><span class="ico-wrap">' + U.icon('phone') + '</span><h3>تماس و شبکه‌های اجتماعی</h3>' +
      '<p>تلفن: <a href="' + s.phoneHref + '" dir="ltr">' + U.fa(s.phone) + '</a></p>' +
      '<p>اینستاگرام: <a href="https://instagram.com/' + s.instagram + '" target="_blank" rel="noopener" dir="ltr">@' + s.instagram + '</a></p>' +
      '<a class="btn btn--primary btn--sm" href="booking.html">رزرو نوبت</a></div>';
  }
  function fill(sel, html) { var el = $(sel); if (el) el.innerHTML = html; }

  /* زمان‌های آزاد آینده یک متخصص */
  function nextSlots(sp, max) {
    var out = [], d = new Date(); d.setHours(0, 0, 0, 0);
    for (var i = 0; i <= R.policy.bookingWindowDays && out.length < max; i++) {
      var day = new Date(d); day.setDate(d.getDate() + i);
      var a = R.booking.availability(sp.services[0], sp.id, day), f = a.all.filter(function (s) { return s.state === 'free'; });
      if (f.length) out.push({ date: day, slots: f.slice(0, 4), count: f.length });
    }
    return out;
  }

  /* ---------- صفحات ---------- */
  var pages = {
    home: function () {
      fill('#svcGrid', R.services.map(svcCard).join(''));
      gallery({ grid: '#galGrid', filters: '#galFilters', limit: 8, live: '#galLive' });
      fill('#teamGrid', R.specialists.slice(0, 4).map(proCard).join(''));
      fill('#spaceList', spaceList());
      fill('#reviews', reviewsHtml());
      fill('#faq', U.faqHtml(R.faq)); U.initFaq($('#faq'));
      fill('#contact', contactCards());
    },
    services: function () {
      fill('#svcGrid', R.services.map(svcCard).join(''));
      fill('#faq', U.faqHtml(R.faq)); U.initFaq($('#faq'));
    },
    service: function () {
      var s = U.byId(R.services, U.qs('id')), root = $('#svc');
      if (!s) { root.innerHTML = notFound('خدمت موردنظر پیدا نشد.', 'services.html', 'دیدن همه خدمات'); return; }
      document.title = s.name + ' | روزا';
      var pros = R.specialists.filter(function (p) { return p.services.indexOf(s.id) !== -1; });
      var gal = R.gallery.filter(function (g) { return g.service === s.id; });
      var dep = s.deposit ? Math.round(s.price * R.policy.depositPercent / 100 / 1000) * 1000 : 0;
      root.innerHTML =
        '<section class="detail container"><nav class="crumbs" aria-label="مسیر صفحه"><a href="index.html">خانه</a>' + U.icon('chev-left') + '<a href="services.html">خدمات</a>' + U.icon('chev-left') + '<span aria-current="page">' + s.name + '</span></nav>' +
        '<div class="detail__grid"><div class="media detail__img">' + U.img(s.photo, { eager: true, widths: [600, 900, 1400], w: 1200, sizes: '(max-width: 900px) 100vw, 50vw', width: 1200, height: 1000 }) + '</div>' +
        '<div class="detail__info"><p class="eyebrow">' + (U.byId(R.categories, s.cat) || {}).name + '</p><h1>' + s.name + '</h1><p class="lead">' + s.short + '</p>' +
        '<dl class="facts"><div><dt>' + U.icon('clock') + 'مدت تقریبی</dt><dd>' + U.duration(s.duration) + '</dd></div>' +
        '<div><dt>' + U.icon('tag') + (s.priceType === 'estimate' ? 'هزینه (برآورد اولیه)' : 'هزینه') + '</dt><dd>' + priceText(s) + '</dd></div>' +
        '<div><dt>' + U.icon('shield') + 'بیعانه</dt><dd>' + (dep ? U.price(dep) + ' (' + U.fa(R.policy.depositPercent) + '٪)' : 'ندارد') + '</dd></div></dl>' +
        (s.priceType === 'estimate' ? '<p class="note">' + U.icon('info') + '<span>' + R.policy.priceText + '</span></p>' : '') +
        '<h2 class="detail__h">آنچه انجام می‌شود</h2><ul class="ticks">' + s.includes.map(function (x) { return '<li>' + U.icon('check') + x + '</li>'; }).join('') + '</ul>' +
        '<p class="note">' + U.icon('info') + '<span>' + s.notes + '</span></p>' +
        '<div class="detail__cta"><a class="btn btn--primary" href="booking.html?service=' + s.id + '">رزرو ' + s.name + '</a><a class="btn btn--ghost" href="gallery.html?cat=' + s.cat + '">نمونه‌کارها</a></div></div></div></section>' +
        '<section class="section"><div class="container"><div class="sec-head"><div><p class="eyebrow">متخصصان این خدمت</p><h2>انتخاب متخصص</h2></div></div><div class="team-grid">' + pros.map(proCard).join('') + '</div></div></section>' +
        (gal.length ? '<section class="section section--soft"><div class="container"><div class="sec-head"><div><p class="eyebrow">نمونه‌کارها</p><h2>' + s.name + '</h2></div><a class="btn btn--link" href="gallery.html?cat=' + s.cat + '">همه نمونه‌کارها' + U.icon('arrow-left') + '</a></div><div class="gal" id="svcGal"></div></div></section>' : '');
      if (gal.length) gallery({ grid: '#svcGal', items: gal });
    },
    gallery: function () {
      var c = U.qs('cat');
      gallery({ grid: '#galGrid', filters: '#galFilters', live: '#galLive', syncUrl: true, initial: U.byId(R.categories, c) ? c : 'all' });
    },
    team: function () {
      fill('#teamGrid', R.specialists.map(proCard).join(''));
    },
    specialist: function () {
      var p = U.byId(R.specialists, U.qs('id')), root = $('#pro');
      if (!p) { root.innerHTML = notFound('متخصص موردنظر پیدا نشد.', 'team.html', 'دیدن همه متخصصان'); return; }
      document.title = p.name + ' | روزا';
      var svcs = R.services.filter(function (s) { return p.services.indexOf(s.id) !== -1; });
      var gal = R.gallery.filter(function (g) { return g.specialist === p.id; });
      var next = nextSlots(p, 3);
      root.innerHTML =
        '<section class="detail container"><nav class="crumbs" aria-label="مسیر صفحه"><a href="index.html">خانه</a>' + U.icon('chev-left') + '<a href="team.html">متخصصان</a>' + U.icon('chev-left') + '<span aria-current="page">' + p.name + '</span></nav>' +
        '<div class="detail__grid detail__grid--pro"><div class="media detail__img detail__img--pro">' + U.img(p.photo, { eager: true, widths: [600, 900, 1200], w: 900, sizes: '(max-width: 900px) 100vw, 40vw', width: 900, height: 1200 }) + '<span class="stock-tag">تصویر نمونه — با عکس متخصص جایگزین شود</span></div>' +
        '<div class="detail__info"><p class="eyebrow">' + p.role + '</p><h1>' + p.name + '</h1><p class="lead">' + p.bio + '</p>' +
        '<h2 class="detail__h">خدمات</h2><ul class="svc-list">' + svcs.map(function (s) {
          return '<li><div><strong>' + s.name + '</strong><span>' + U.duration(s.duration) + ' · ' + priceText(s) + '</span></div><a class="btn btn--soft btn--sm" href="booking.html?service=' + s.id + '&specialist=' + p.id + '">رزرو</a></li>';
        }).join('') + '</ul>' +
        '<h2 class="detail__h">نزدیک‌ترین زمان‌های آزاد</h2><p class="note">' + U.icon('info') + '<span>زمان‌ها برای «' + svcs[0].name + '» محاسبه شده‌اند و نمایشی‌اند.</span></p>' +
        (next.length ? '<div class="next">' + next.map(function (n) {
          return '<div class="next__day"><h3>' + U.longDate(n.date) + '</h3><div class="next__slots">' + n.slots.map(function (s) {
            return '<span class="next__slot">' + U.time(s.t) + '</span>';
          }).join('') + (n.count > 4 ? '<span class="next__more">+' + U.fa(n.count - 4) + '</span>' : '') + '</div></div>';
        }).join('') + '</div>' : '<p class="note">زمان آزادی در بازه رزرو آنلاین نیست.</p>') +
        '<div class="detail__cta"><a class="btn btn--primary" href="booking.html?specialist=' + p.id + '">رزرو نوبت با ' + p.name.replace(' (نمونه)', '') + '</a></div></div></div></section>' +
        (gal.length ? '<section class="section section--soft"><div class="container"><div class="sec-head"><div><p class="eyebrow">نمونه‌کارها</p><h2>کارهای ' + p.name + '</h2></div></div><div class="gal" id="proGal"></div></div></section>' : '');
      if (gal.length) gallery({ grid: '#proGal', items: gal });
    },
    about: function () {
      fill('#spaceList', spaceList());
      fill('#contact', contactCards());
      fill('#faq', U.faqHtml(R.faq)); U.initFaq($('#faq'));
    },
    booking: function () { R.booking.init(); },
    result: function () {
      var root = $('#result'), code = U.qs('code'), b = null;
      try { b = code && JSON.parse(localStorage.getItem('roza-booking-' + code)); } catch (e) { b = null; }
      if (!b) { root.innerHTML = notFound('اطلاعات این نوبت پیدا نشد. ممکن است در مرورگر دیگری ثبت شده باشد.', 'booking.html', 'رزرو نوبت جدید'); return; }
      var s = U.byId(R.services, b.service), sp = U.byId(R.specialists, b.assigned), d = U.fromKey(b.date);
      root.innerHTML = '<div class="result"><div class="result__ico">' + U.icon('check') + '</div>' +
        '<h1>درخواست نوبت آزمایشی ثبت شد</h1><p>' + U.esc(b.name) + ' عزیز، خلاصه درخواست شما در زیر آمده است. در نسخه واقعی، پس از تأیید سالن پیامک تأیید به شماره ' + '<span dir="ltr">' + U.fa(b.mobile) + '</span> ارسال می‌شود.</p>' +
        '<div class="result__code"><span>کد پیگیری</span><strong dir="ltr">' + b.code + '</strong><button class="icon-btn" id="copyCode" aria-label="کپی کد پیگیری">' + U.icon('copy') + '</button></div>' +
        '<p class="sr-only" id="copyLive" aria-live="polite"></p>' +
        '<div class="sum"><h2 class="sum__h">خلاصه نوبت</h2><dl class="sum__list">' +
        [['خدمت', s.name], ['متخصص', (b.specialist === 'any' ? 'اولین متخصص آزاد — ' : '') + (sp ? sp.name : '')], ['زمان', U.longDate(d) + '، ساعت ' + U.time(b.time)], ['مدت تقریبی', U.duration(s.duration)]]
          .concat(b.note ? [['توضیحات', U.esc(b.note)]] : [])
          .map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
        '<div class="sum__price"><div><span>' + (b.priceType === 'estimate' ? 'هزینه (برآورد اولیه)' : 'هزینه') + '</span><strong>' + (b.priceType === 'estimate' ? 'از ' : '') + U.price(b.price) + '</strong></div>' +
        '<div><span>بیعانه</span><strong>' + (b.deposit ? U.price(b.deposit) : 'ندارد') + '</strong></div></div></div>' +
        '<div class="policy"><h3>' + U.icon('shield') + 'قوانین لغو و تغییر</h3><p>' + R.policy.cancelText + '</p></div>' +
        '<p class="demo-note">' + U.icon('info') + '<span>این رزرو آزمایشی است: نوبتی در سالن ثبت نشده، پیامکی ارسال نشده و پرداختی انجام نشده است. اطلاعات فقط در همین مرورگر ذخیره شده است.</span></p>' +
        '<div class="result__actions"><a class="btn btn--primary" href="index.html">بازگشت به خانه</a><a class="btn btn--ghost" href="booking.html">رزرو نوبت دیگر</a></div></div>';
      $('#copyCode').addEventListener('click', function () {
        var done = function () { $('#copyLive').textContent = 'کد پیگیری کپی شد'; $('#copyCode').innerHTML = U.icon('check'); };
        if (navigator.clipboard) navigator.clipboard.writeText(b.code).then(done, done); else done();
      });
    },
    credits: function () {
      var keys = Object.keys(R.photos);
      fill('#credits', keys.map(function (k, i) {
        var p = R.photos[k];
        return '<tr><td>' + U.fa(i + 1) + '</td><td><span class="media cr__thumb">' + U.img(k, { widths: [160], w: 160, sizes: '64px', width: 160, height: 160, alt: '' }) + '</span></td>' +
          '<td>' + p.alt + '</td><td dir="ltr">' + (p.author === 'Pexels' ? 'نام عکاس در صفحه منبع' : p.author) + '</td>' +
          '<td><a href="' + p.page + '" target="_blank" rel="noopener" dir="ltr">pexels.com/photo/' + p.id + '</a></td></tr>';
      }).join(''));
    }
  };
  function notFound(msg, href, label) {
    return '<div class="container section"><div class="gal-empty">' + U.icon('info') + '<p>' + msg + '</p><a class="btn btn--primary" href="' + href + '" style="margin-top:16px">' + label + '</a></div></div>';
  }
  R.page = function (name) { if (pages[name]) pages[name](); };
})();
