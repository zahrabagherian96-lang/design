/* در بیرجند کجا؟ — shared layout, helpers, interactions and motion */
(() => {
  const BK = window.BK;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  Object.assign(BK, { $, $$ });
  const root = document.documentElement;
  const page = document.body.dataset.page || '';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap;
  const motion = BK.motion = !!G && !reduced;
  if (motion) {
    root.classList.add('anim');
    if (window.ScrollTrigger) G.registerPlugin(ScrollTrigger);
    if (window.Flip) G.registerPlugin(Flip);
  } else root.classList.add('no-gsap');

  /* ---------- storage (per-viewer conveniences only) ---------- */
  BK.store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    sget(k, d) { try { return sessionStorage.getItem(k) ?? d; } catch { return d; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} }
  };
  BK.favs = new Set(BK.store.get('bk-favs', []));
  BK.user = () => BK.store.get('bk-user', null);
  BK.myReviews = () => BK.store.get('bk-myreviews', []);

  /* ---------- URLs ---------- */
  BK.placeUrl = id => `place.html#p${id}`;
  BK.searchUrl = (...tokens) => 'search.html' + (tokens.length ? '#' + tokens.join('~') : '');
  BK.articleUrl = id => `article.html#${id}`;
  BK.hashTokens = () => decodeURIComponent(location.hash.slice(1)).split('~').filter(Boolean);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="place.html#p"]');
    if (a) BK.store.sset('bk-last-place', a.getAttribute('href').split('#p')[1]);
  });

  /* ---------- small render helpers ---------- */
  const starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/></svg>';
  BK.starSvg = starSvg;
  BK.starsHTML = (r, cls = '') => {
    let s = `<div class="stars ${cls}" role="img" aria-label="امتیاز ${BK.faDec(r)} از ۵"${r < 3 ? ' data-level="low"' : r < 4 ? ' data-level="mid"' : ''}>`;
    for (let i = 1; i <= 5; i++) s += `<span class="s" style="--fill:${Math.max(0, Math.min(1, r - i + 1))}">${starSvg}</span>`;
    return s + '</div>';
  };
  const priceNames = ['', 'اقتصادی', 'متوسط', 'بالا', 'لوکس'];
  BK.priceNames = priceNames;
  BK.price = n => `<span class="price" title="سطح قیمت: ${priceNames[n]}" aria-label="سطح قیمت: ${priceNames[n]}">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}<small>${priceNames[n]}</small></span>`;
  BK.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  BK.placeCard = (p, extra = '') => {
    const c = BK.catById(p.cat), h = BK.hoodById(p.hood), fav = BK.favs.has(p.id);
    return `<article class="place reveal ${extra}" data-cat="${p.cat}" data-id="${p.id}">
      <div class="cover" style="--h:${c.hue}">
        <img src="${BK.img(p.photos[0])}" alt="${p.name}" loading="lazy" width="960" height="660">
        <div class="cover__tags">
          <span class="pill ${p.open ? 'pill--open' : 'pill--closed'}">${p.open ? 'باز است' : 'بسته است'}</span>
          <button class="fav ${fav ? 'is-on' : ''}" aria-pressed="${fav}" aria-label="افزودن ${p.name} به علاقه‌مندی‌ها" data-fav="${p.id}">${ico('heart')}</button>
        </div>
        <span class="cover__cat">${ico(c.icon)}${c.name}</span>
      </div>
      <div class="place__body">
        <h3 class="place__name">${p.name}${p.verified ? `<span title="تأییدشده">${ico('badge')}</span>` : ''}</h3>
        <div class="place__rate">${BK.starsHTML(p.rating, 'stars--sm')}<b>${BK.faDec(p.rating)}</b><span>(${BK.fa(p.reviews)} نظر)</span></div>
        <p class="place__desc">${p.desc}</p>
        <div class="place__meta"><span>${ico('pin')} ${h.name}</span>${BK.price(p.price)}</div>
      </div>
      <a class="place__link" href="${BK.placeUrl(p.id)}" aria-label="مشاهده ${p.name}"></a>
    </article>`;
  };
  BK.miniRow = p => `<a class="mini-row" href="${BK.placeUrl(p.id)}"><img src="${BK.img(p.photos[0])}" alt="" loading="lazy" width="52" height="52"><div><b>${p.name}</b><small>${BK.catById(p.cat).name} · ${BK.hoodById(p.hood).name}</small></div><span class="s-rate">${BK.faDec(p.rating)}</span></a>`;
  BK.avatar = (name, cls = '') => `<div class="fc-avatar ${cls}" style="--h:${(name.charCodeAt(0) * 37) % 360}">${BK.esc(name[0])}</div>`;
  BK.reviewCard = (r, withPlace = true) => {
    const p = BK.placeById(r.pid);
    return `<article class="rv">
      <div class="rv__head">${BK.avatar(r.name)}<div><b>${BK.esc(r.name)}</b><small>${r.ago}</small></div><span class="rv__verified">${ico('badge')} تأییدشده</span></div>
      ${BK.starsHTML(r.rating, 'stars--sm')}
      <p class="rv__text">${BK.esc(r.text)}</p>
      ${withPlace && p ? `<a class="rv__place" href="${BK.placeUrl(p.id)}">${ico('pin')} ${p.name}</a>` : ''}
    </article>`;
  };
  BK.hydrateIcons = (scope = document) => $$('[data-ico]', scope).forEach(el => { el.innerHTML = ico(el.dataset.ico); el.removeAttribute('data-ico'); });

  /* ---------- layout ---------- */
  const NAV = [['index.html', 'خانه', 'home'], ['search.html', 'کاوش', 'search'], ['categories.html', 'دسته‌بندی‌ها', 'categories'], ['hoods.html', 'محله‌ها', 'hoods'], ['blog.html', 'مجله', 'blog'], ['business.html', 'کسب‌وکارها', 'business']];
  const current = { place: 'search', article: 'blog', dashboard: 'business' }[page] || page;
  const brand = (light = false) => `<a href="index.html" class="brand ${light ? 'brand--light' : ''}" aria-label="در بیرجند کجا — صفحه اصلی">
      <img src="assets/img/logo-mark.svg" alt="" width="42" height="42" class="brand__mark">
      <span class="brand__text"><b>در بیرجند <em>کجا؟</em></b><small>راهنمای مشاغل و نظرات مردم</small></span></a>`;
  const u = BK.user();
  const top = $('#layout-top');
  if (top) top.outerHTML = `
    <a class="skip" href="#main">رفتن به محتوای اصلی</a>
    <div class="progress" id="progress" aria-hidden="true"></div>
    <div class="cursor" id="cursor" aria-hidden="true"></div>
    <header class="header ${document.body.dataset.darkHero ? 'on-dark' : ''}" id="header">
      <div class="container header__row">
        ${brand()}
        <nav class="nav" id="nav" aria-label="منوی اصلی">
          ${NAV.map(([h, t, k]) => `<a href="${h}"${k === current ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
        </nav>
        <div class="header__actions">
          <a class="user-btn" href="${u ? 'profile.html' : 'login.html'}" ${page === 'profile' || page === 'login' ? 'aria-current="page"' : ''}>
            <span class="hide-xs">${u ? BK.esc(u.name.split(' ')[0]) : 'ورود'}</span><span class="av">${u ? BK.esc(u.name[0]) : ico('user')}</span></a>
          <a href="business.html#register" class="btn btn--primary btn--sm magnetic hide-sm">${ico('plus')}ثبت کسب‌وکار</a>
          <button class="icon-btn menu-btn" id="menuBtn" aria-label="باز کردن منو" aria-expanded="false" aria-controls="nav">${ico('menu')}</button>
        </div>
      </div>
    </header>`;

  const bottom = $('#layout-bottom');
  if (bottom) bottom.outerHTML = `
    <footer class="footer">
      <div class="container footer__grid">
        <div class="footer__brand">
          ${brand(true)}
          <p>اولین مرجع مستقل معرفی و امتیازدهی کسب‌وکارهای بیرجند؛ ساخته‌شده برای مردم خراسان جنوبی.</p>
          <div class="socials">
            <a href="contact.html#social" aria-label="اینستاگرام">${ico('instagram')}</a>
            <a href="contact.html#social" aria-label="تلگرام">${ico('send')}</a>
            <a href="blog.html" aria-label="مجله">${ico('book')}</a>
          </div>
        </div>
        <div><h4>کاربران</h4><a href="search.html">کاوش مکان‌ها</a><a href="categories.html">دسته‌بندی‌ها</a><a href="hoods.html">محله‌ها</a><a href="profile.html#favs">علاقه‌مندی‌ها</a><a href="rules.html">قوانین نظردهی</a></div>
        <div><h4>کسب‌وکارها</h4><a href="business.html#register">ثبت کسب‌وکار</a><a href="business.html#claim">احراز مالکیت</a><a href="business.html#pricing">تعرفه‌ها</a><a href="dashboard.html">داشبورد</a></div>
        <div><h4>در بیرجند کجا</h4><a href="about.html">درباره ما</a><a href="contact.html">تماس با ما</a><a href="blog.html">مجله</a><a href="careers.html">فرصت‌های شغلی</a><a href="privacy.html">حریم خصوصی</a></div>
      </div>
      <div class="container footer__bottom">
        <span>© ۱۴۰۵ در بیرجند کجا. تمامی حقوق محفوظ است.</span>
        <span>عکس‌ها نمایشی‌اند · بیرجند، خراسان جنوبی</span>
      </div>
    </footer>
    <nav class="bottom-nav" aria-label="ناوبری موبایل">
      <a href="index.html"${page === 'home' ? ' class="active"' : ''}>${ico('home')}خانه</a>
      <a href="search.html"${['search', 'place', 'categories'].includes(page) ? ' class="active"' : ''}>${ico('search')}کاوش</a>
      <button data-open-review class="bottom-nav__fab" aria-label="ثبت نظر">${ico('plus')}</button>
      <a href="hoods.html"${page === 'hoods' ? ' class="active"' : ''}>${ico('pin')}محله‌ها</a>
      <a href="${u ? 'profile.html' : 'login.html'}"${['profile', 'login'].includes(page) ? ' class="active"' : ''}>${ico('user')}${u ? 'پروفایل' : 'ورود'}</a>
    </nav>
    <div class="modal" id="reviewModal" role="dialog" aria-modal="true" aria-labelledby="rmTitle" hidden>
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel">
        <button class="icon-btn modal__close" data-close aria-label="بستن">${ico('x')}</button>
        <h3 id="rmTitle">تجربه‌ات رو با بقیه به اشتراک بذار</h3>
        <form id="reviewForm" novalidate>
          <div class="field"><label for="rmPlace">کسب‌وکار</label><select id="rmPlace" required></select></div>
          <fieldset class="field"><legend>امتیاز تو</legend>
            <div class="rate-input" id="rateInput" role="radiogroup" aria-label="امتیاز از ۱ تا ۵"></div>
            <small class="rate-label" id="rateLabel">روی ستاره‌ها بزن</small></fieldset>
          <div class="field"><label for="rmName">نام نمایشی</label><input class="input" id="rmName" maxlength="30" placeholder="مثلاً مریم ر."></div>
          <div class="field"><label for="rmText">نظرت</label>
            <textarea id="rmText" rows="4" minlength="20" required placeholder="از کیفیت، برخورد، قیمت و … بگو"></textarea>
            <small class="hint"><span id="rmCount">۰</span> نویسه / حداقل ۲۰ نویسه</small>
            <small class="error" id="rmError" hidden></small></div>
          <button class="btn btn--primary btn--block" type="submit">ثبت نظر${ico('send')}</button>
        </form>
      </div>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  /* ---------- toast ---------- */
  let toastT;
  BK.toast = msg => {
    const t = $('#toast'); if (!t) return;
    t.innerHTML = ico('check') + '<span></span>'; t.lastChild.textContent = msg;
    t.classList.add('is-on'); clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('is-on'), 3200);
  };

  /* ---------- copy to clipboard ---------- */
  BK.copy = (text, okMsg = 'کپی شد') => {
    const fallback = () => BK.toast('کپی خودکار ممکن نشد؛ متن را انتخاب و کپی کنید.');
    try { navigator.clipboard.writeText(text).then(() => BK.toast(okMsg), fallback); } catch { fallback(); }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy]');
    if (b) { e.preventDefault(); BK.copy(b.dataset.copy, b.dataset.copyMsg || 'کپی شد'); }
  });

  /* ---------- favorites ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]'); if (!b) return;
    e.preventDefault();
    const id = +b.dataset.fav, on = !BK.favs.has(id);
    on ? BK.favs.add(id) : BK.favs.delete(id);
    BK.store.set('bk-favs', [...BK.favs]);
    $$(`[data-fav="${id}"]`).forEach(x => { x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    if (motion) G.fromTo(b, { scale: .6 }, { scale: 1, duration: .6, ease: 'elastic.out(1.2,.4)' });
    BK.toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
    document.dispatchEvent(new CustomEvent('bk:favs'));
  });

  /* ---------- header, menu, progress ---------- */
  const header = $('#header'), prog = $('#progress'), nav = $('#nav'), menuBtn = $('#menuBtn');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header?.classList.toggle('is-scrolled', y > 10);
    header?.classList.toggle('is-hidden', y > 400 && y > lastY && !nav?.classList.contains('is-open'));
    lastY = y;
    const h = root.scrollHeight - innerHeight;
    if (prog) prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const closeMenu = () => { nav?.classList.remove('is-open'); menuBtn?.setAttribute('aria-expanded', false); if (menuBtn) menuBtn.innerHTML = ico('menu'); };
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.innerHTML = ico(open ? 'x' : 'menu');
    if (open && motion) G.from($$('a', nav), { x: 30, opacity: 0, stagger: .05, duration: .4, delay: .1 });
  });
  $$('a', nav || document.createElement('i')).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav?.classList.contains('is-open')) { closeMenu(); menuBtn.focus(); } });

  /* ---------- review modal ---------- */
  const modal = $('#reviewModal');
  if (modal) {
    const panel = $('.modal__panel', modal), rate = $('#rateInput'), sel = $('#rmPlace'), txt = $('#rmText');
    const labels = ['', 'خیلی بد', 'بد', 'معمولی', 'خوب', 'عالی'];
    let lastFocus, value = 0;
    sel.innerHTML = BK.categories.map(c => `<optgroup label="${c.name}">${BK.places.filter(p => p.cat === c.id).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</optgroup>`).join('');
    rate.innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" role="radio" aria-checked="false" aria-label="${BK.fa(i)} ستاره - ${labels[i]}" data-v="${i}">${starSvg}</button>`).join('');
    if (u) $('#rmName').value = u.name;
    const setRate = v => {
      value = v; if (v) rate.dataset.v = v; else rate.removeAttribute('data-v');
      $$('button', rate).forEach(b => b.setAttribute('aria-checked', +b.dataset.v === v));
      $('#rateLabel').textContent = v ? labels[v] : 'روی ستاره‌ها بزن';
      if (motion && v) G.fromTo($$('button', rate).slice(0, v), { scale: .7 }, { scale: 1, stagger: .05, duration: .5, ease: 'back.out(3)' });
    };
    rate.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setRate(+b.dataset.v); });
    rate.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setRate(Math.max(1, value - 1)); $$('button', rate)[value - 1].focus(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setRate(Math.min(5, value + 1)); $$('button', rate)[value - 1].focus(); }
    });
    txt.addEventListener('input', () => { $('#rmCount').textContent = BK.fa(txt.value.trim().length); if (txt.value.trim().length >= 20) { $('#rmError').hidden = true; txt.closest('.field').classList.remove('has-error'); } });
    const open = placeId => {
      lastFocus = document.activeElement;
      if (placeId) sel.value = placeId;
      modal.hidden = false; document.body.style.overflow = 'hidden';
      if (motion) {
        G.fromTo('.modal__backdrop', { opacity: 0 }, { opacity: 1, duration: .3 });
        G.fromTo(panel, { y: 60, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .55, ease: 'power4.out' });
      }
      setTimeout(() => sel.focus(), 50);
    };
    const close = () => {
      const done = () => { modal.hidden = true; document.body.style.overflow = ''; lastFocus?.focus(); };
      if (motion) { G.to(panel, { y: 40, opacity: 0, duration: .25, ease: 'power2.in', onComplete: done }); G.to('.modal__backdrop', { opacity: 0, duration: .25 }); }
      else done();
    };
    BK.openReview = open;
    document.addEventListener('click', e => { const b = e.target.closest('[data-open-review]'); if (b) { e.preventDefault(); open(b.dataset.openReview); } });
    $$('[data-close]', modal).forEach(b => b.addEventListener('click', close));
    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('button, select, textarea, input', panel).filter(x => !x.disabled && x.offsetParent);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    });
    $('#reviewForm').addEventListener('submit', e => {
      e.preventDefault();
      const err = $('#rmError');
      if (!value) { err.textContent = 'امتیاز را با انتخاب یکی از ستاره‌ها مشخص کنید.'; err.hidden = false; rate.querySelector('button').focus(); return; }
      if (txt.value.trim().length < 20) { err.textContent = 'متن نظر باید حداقل ۲۰ نویسه باشد.'; err.hidden = false; txt.closest('.field').classList.add('has-error'); txt.focus(); return; }
      const r = { name: $('#rmName').value.trim() || 'کاربر مهمان', pid: +sel.value, rating: value, text: txt.value.trim(), ago: 'همین حالا', ts: Date.now() };
      BK.store.set('bk-myreviews', [r, ...BK.myReviews()].slice(0, 50));
      document.dispatchEvent(new CustomEvent('bk:review', { detail: r }));
      e.target.reset(); setRate(0); $('#rmCount').textContent = '۰'; if (u) $('#rmName').value = u.name;
      close(); BK.toast('نظرت ثبت شد و پس از بررسی برای همه نمایش داده می‌شه.');
    });
  }

  /* =========================================================
     Boot: called by pages.js after the page content is rendered
     ========================================================= */
  BK.boot = () => {
    BK.hydrateIcons();
    $$('.stars[data-rating]').forEach(el => {
      const t = document.createElement('div');
      t.innerHTML = BK.starsHTML(+el.dataset.rating, el.className.replace('stars', '').trim());
      el.replaceWith(t.firstElementChild);
    });
    $$('[data-count]').forEach(el => { if (!el.dataset.done) el.textContent = el.dataset.dec ? BK.faDec(el.dataset.count) : BK.fa(el.dataset.count); });
    if (!motion) return;
    initMotion();
  };

  BK.countUp = el => {
    if (!el || el.dataset.done || !motion) return; el.dataset.done = 1;
    const end = +el.dataset.count, dec = !!el.dataset.dec, o = { v: 0 };
    G.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => el.textContent = dec ? BK.faDec(o.v) : BK.fa(Math.round(o.v)) });
  };

  const belowFold = el => el.getBoundingClientRect().top > innerHeight * .9;
  BK.reveal = (els) => {
    if (!motion || !window.ScrollTrigger) return;
    els = els.filter(e => !e.dataset.revealed); els.forEach(e => e.dataset.revealed = 1);
    const later = els.filter(belowFold), now = els.filter(e => !later.includes(e));
    if (now.length) G.from(now, { y: 26, stagger: .05, duration: .8, ease: 'power3.out', clearProps: 'transform' });
    if (later.length) {
      G.set(later, { opacity: 0, y: 50 });
      ScrollTrigger.batch(later, { start: 'top 92%', once: true, onEnter: b => G.to(b, { opacity: 1, y: 0, stagger: .07, duration: .9, ease: 'power3.out', clearProps: 'transform' }) });
    }
  };

  function initMotion() {
    const ST = window.ScrollTrigger;
    // headings: words rise in (visible at rest; only transform animates above the fold)
    $$('.split').forEach(el => {
      if (el.dataset.split) return; el.dataset.split = 1;
      el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
      const words = $$('.w', el);
      if (belowFold(el) && ST) {
        G.set(words, { opacity: 0, yPercent: 80 });
        ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => G.to(words, { opacity: 1, yPercent: 0, rotate: 0, stagger: .06, duration: .9, ease: 'power4.out' }) });
      } else G.from(words, { yPercent: 60, stagger: .06, duration: .9, ease: 'power4.out', delay: .15 });
    });
    BK.reveal($$('.reveal'));
    if (ST) $$('[data-count]').forEach(el => {
      if (belowFold(el)) { el.textContent = el.dataset.dec ? BK.faDec(0) : BK.fa(0); ST.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => BK.countUp(el) }); }
      else { el.textContent = el.dataset.dec ? BK.faDec(0) : BK.fa(0); BK.countUp(el); }
    });
    // page hero entrance
    if ($('.page-hero')) {
      G.from('.page-hero .crumbs, .page-hero h1, .page-hero p, .page-hero .hero-anim', { y: 30, stagger: .08, duration: .9, ease: 'power3.out' });
      if ($('.page-hero__bg img') && ST) G.to('.page-hero__bg img', { scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true }, yPercent: 18, scale: 1.08 });
    }
    // pointer effects
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const cur = $('#cursor');
      if (cur) {
        const xTo = G.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), yTo = G.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
        addEventListener('pointermove', e => { cur.style.opacity = 1; xTo(e.clientX); yTo(e.clientY); });
        document.addEventListener('pointerleave', () => cur.style.opacity = 0);
        document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest('a, button, input, select, textarea, label')));
      }
      BK.pointerFx(document);
    }
    addEventListener('load', () => ST?.refresh());
  }

  BK.pointerFx = scope => {
    if (!motion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.magnetic', scope).forEach(el => {
      if (el.dataset.fx) return; el.dataset.fx = 1;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        G.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => G.to(el, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }));
    });
    $$('.cat, .place, .hood, .cat-tile, .hood-card, .post, .plan, .feature, .member', scope).forEach(el => {
      if (el.dataset.fx) return; el.dataset.fx = 1;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        G.to(el, { rotateY: (px - .5) * 8, rotateX: (.5 - py) * 8, y: -6, transformPerspective: 800, duration: .5, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => G.to(el, { rotateX: 0, rotateY: 0, y: 0, duration: .8, ease: 'elastic.out(1,.5)', overwrite: 'auto' }));
    });
  };
})();
