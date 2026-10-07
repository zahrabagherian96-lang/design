/* در بیرجند کجا؟ — shared state, layout, map, review flow and light motion */
(() => {
  const BK = window.BK;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  Object.assign(BK, { $, $$ });
  const page = document.body.dataset.page || '';
  const file = (location.pathname.split('/').pop() || 'index.html').split('?')[0] || 'index.html';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap;
  const motion = BK.motion = !!G && !reduced;
  

  /* ---------- storage (this browser only; a real site keeps this on a server) ---------- */
  BK.store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    sget(k, d) { try { return sessionStorage.getItem(k) ?? d; } catch { return d; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} }
  };
  const S = BK.store;
  BK.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  BK.nowFa = () => new Date().toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' });

  /* page views (for the admin's "most visited pages") */
  const views = S.get('bk-views', {}); views[file] = (views[file] || 0) + 1; S.set('bk-views', views);
  BK.views = () => { const v = { ...BK.seedViews }; Object.entries(S.get('bk-views', {})).forEach(([k, n]) => v[k] = (v[k] || 0) + n); return v; };

  /* moderation state */
  BK.mod = () => S.get('bk-mod', {});
  BK.setMod = (id, status) => { const m = BK.mod(); m[id] = status; S.set('bk-mod', m); };
  BK.statusOf = (o) => BK.mod()[o.id] || o.status || 'pending';

  /* categories: base list + admin additions / removals / renames */
  const baseCats = BK.categories.map(c => ({ ...c }));
  BK.baseCats = baseCats;
  BK.applyCats = () => {
    const o = S.get('bk-cats', { added: [], removed: [], names: {} });
    BK.categories = [...baseCats, ...o.added].filter(c => !o.removed.includes(c.id)).map(c => ({ ...c, name: o.names[c.id] || c.name }));
  };
  BK.applyCats();
  BK.catById = id => BK.categories.find(c => c.id === id) || baseCats.find(c => c.id === id) || { id, name: 'سایر', icon: 'store', count: 0, desc: '', subs: [] };

  /* businesses: approved registrations join the public list */
  const catPhoto = cat => (BK.places.find(p => p.cat === cat) || {}).photos?.[0] || 'shop-1.jpg';
  BK.registered = () => [...BK.seedPendingBiz, ...S.get('bk-biz', [])];
  const basePlaces = BK.places.slice();
  BK.applyBiz = () => {
    const approved = BK.registered().filter(b => BK.statusOf(b) === 'approved').map((b, i) => ({
      id: 1000 + i, bizId: b.id, name: b.name, cat: b.cat, hood: b.hood, rating: 0, reviews: 0, price: 2, open: true, verified: true,
      desc: b.desc || 'کسب‌وکار تازه ثبت‌شده و تأییدشده در «در بیرجند کجا». اولین نفری باشید که نظر می‌دهد.',
      tags: ['تازه ثبت‌شده'], hours: b.hours || '—', phone: b.mobile ? b.mobile.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3') : '—', address: b.address,
      photos: [b.photo || catPhoto(b.cat)], services: []
    }));
    BK.places = [...basePlaces, ...approved].filter(p => BK.categories.some(c => c.id === p.cat));
  };
  BK.applyBiz();

  /* users */
  BK.user = () => S.get('bk-user', null);
  BK.login = (mobile, name) => {
    const users = S.get('bk-users', []);
    let u = users.find(x => x.mobile === mobile);
    if (!u) { u = { name, mobile, since: BK.nowFa(), ts: Date.now() }; users.unshift(u); S.set('bk-users', users); }
    else if (name) { u.name = name; S.set('bk-users', users); }
    S.set('bk-user', u); return u;
  };
  BK.logout = () => S.set('bk-user', null);

  /* reviews: seeded public reviews + user reviews that the admin approved */
  BK.userReviews = () => S.get('bk-reviews', []);
  BK.publicReviews = pid => {
    const mine = BK.user()?.mobile;
    const approved = [...BK.seedPendingReviews, ...BK.userReviews()].filter(r => BK.statusOf(r) === 'approved' || (mine && r.mobile === mine && BK.statusOf(r) === 'pending'));
    const all = [...approved, ...BK.reviews];
    return pid ? all.filter(r => r.pid === +pid) : all;
  };

  /* favorites */
  BK.favs = new Set(S.get('bk-favs', []));

  /* ---------- URLs ---------- */
  BK.placeUrl = id => `place.html#p${id}`;
  BK.searchUrl = (...t) => 'search.html' + (t.length ? '#' + t.join('~') : '');
  BK.articleUrl = id => `article.html#${id}`;
  BK.hashTokens = () => decodeURIComponent(location.hash.slice(1)).split('~').filter(Boolean);
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="place.html#p"]'); if (a) S.sset('bk-last-place', a.getAttribute('href').split('#p')[1]); });

  /* ---------- render helpers ---------- */
  BK.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const starPath = 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z';
  BK.starSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${starPath}"/></svg>`;
  const five = BK.starSvg.repeat(5);
  BK.stars = (r, cls = '') => `<span class="stars ${cls}" role="img" aria-label="امتیاز ${BK.faDec(r)} از ۵" style="--w:${Math.max(0, Math.min(100, r / 5 * 100))}%"><span class="stars__row stars__bg">${five}</span><span class="stars__row stars__fg">${five}</span></span>`;
  BK.score = r => r ? `<span class="score ${r < 4 ? 'score--mid' : ''}">${BK.faDec(r)}</span>` : `<span class="pill">بدون امتیاز</span>`;
  BK.priceNames = ['', 'اقتصادی', 'متوسط', 'بالا', 'لوکس'];
  BK.price = n => `<span class="price" title="سطح قیمت: ${BK.priceNames[n]}" aria-label="سطح قیمت: ${BK.priceNames[n]}">${'●'.repeat(n)}<i>${'●'.repeat(4 - n)}</i></span>`;
  BK.photoOf = p => BK.img(p.photos[0]);
  BK.avatar = (r, size = '') => r.photo ? `<img class="avatar ${size}" src="${BK.img(r.photo)}" alt="">` : `<span class="avatar ${size}" aria-hidden="true">${BK.esc((r.name || '؟')[0])}</span>`;

  BK.pcard = p => {
    const c = BK.catById(p.cat), h = BK.hoodById(p.hood) || { name: '' }, fav = BK.favs.has(p.id);
    return `<article class="pcard reveal" data-cat="${p.cat}" data-id="${p.id}">
      <div class="pcard__img"><img src="${BK.photoOf(p)}" alt="" loading="lazy" width="400" height="300">
        <div class="pcard__top"><span class="pill ${p.open ? 'pill--open' : 'pill--closed'}">${p.open ? 'باز است' : 'بسته است'}</span>
        <button class="fav ${fav ? 'is-on' : ''}" aria-pressed="${fav}" aria-label="افزودن ${p.name} به علاقه‌مندی‌ها" data-fav="${p.id}">${ico('heart')}</button></div></div>
      <div class="pcard__body">
        <span class="pcard__cat">${ico(c.icon)}${c.name}</span>
        <h3 class="pcard__name">${p.name}${p.verified ? `<span class="verified" title="هویت کسب‌وکار تأیید شده">${ico('badge')}</span>` : ''}</h3>
        <div class="pcard__rate">${BK.score(p.rating)}${p.rating ? BK.stars(p.rating) : ''}<span>${BK.fa(p.reviews)} نظر</span></div>
        <div class="pcard__meta"><span>${ico('pin')}${h.name}</span>${BK.price(p.price)}</div>
      </div>
      <a class="pcard__link" href="${BK.placeUrl(p.id)}" aria-label="مشاهده ${p.name}"></a>
    </article>`;
  };
  BK.mrow = p => `<a class="mrow" href="${BK.placeUrl(p.id)}"><img src="${BK.photoOf(p)}" alt="" loading="lazy" width="52" height="52"><div><b>${p.name}</b><small>${BK.catById(p.cat).name} · ${(BK.hoodById(p.hood) || {}).name || ''}</small></div>${BK.score(p.rating)}</a>`;
  BK.rcard = (r, { place = true, foot = false, i = 0 } = {}) => {
    const p = BK.placeById(r.pid), st = r.id ? BK.statusOf(r) : 'approved';
    return `<article class="rcard">
      <div class="rcard__head">${BK.avatar(r)}<div><b>${BK.esc(r.name)}</b><small>${BK.esc(r.ago || '')}</small></div>${BK.stars(r.rating)}</div>
      ${st === 'pending' ? `<span class="pending-note">${ico('clock')}نظر شما در انتظار تأیید مدیر است و هنوز برای دیگران نمایش داده نمی‌شود.</span>` : ''}
      <p class="rcard__text">${BK.esc(r.text)}</p>
      ${place && p ? `<a class="rcard__place" href="${BK.placeUrl(p.id)}">${ico('pin')}${p.name}</a>` : ''}
      ${foot ? `<div class="rcard__foot"><button data-helpful aria-pressed="false">${ico('thumb')}مفید بود (<span>${BK.fa(Math.max(0, 9 - i * 2))}</span>)</button><button data-report>${ico('flag')}گزارش</button></div>` : ''}
    </article>`;
  };
  BK.hydrateIcons = (scope = document) => $$('[data-ico]', scope).forEach(el => { el.innerHTML = ico(el.dataset.ico); el.removeAttribute('data-ico'); });

  /* =========================================================
     Birjand map (illustrative, drawn in SVG so it works offline)
     ========================================================= */
  const xyCache = {};
  BK.placeXY = p => {
    if (xyCache[p.id]) return xyCache[p.id];
    const h = BK.hoodById(p.hood) || { mx: 500, my: 320 };
    const k = BK.places.filter(x => x.hood === p.hood).sort((a, b) => a.id - b.id).findIndex(x => x.id === p.id);
    const a = k * 2.4 + 0.6, r = k === 0 ? 0 : 30 + k * 14;
    return xyCache[p.id] = [Math.max(40, Math.min(960, h.mx + Math.cos(a) * r * 1.5)), Math.max(105, Math.min(570, h.my - 18 + Math.sin(a) * r))];
  };
  const road = (d, w = 10) => `<path d="${d}" fill="none" stroke="#D5DFD9" stroke-width="${w + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round"/>`;
  const label = (x, y, t, rot = 0, cls = 'st') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle" transform="rotate(${rot} ${x} ${y})">${t}</text>`;
  BK.mapSVG = () => `<svg viewBox="0 0 1000 620" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="blk" width="22" height="22" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="18" height="18" rx="3" fill="#EEF2EE"/></pattern>
      <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 0v10" stroke="#C9D8CF" stroke-width="1.4"/></pattern>
      <style>.st{font:600 13px Vazirmatn,Tahoma,sans-serif;fill:#8A9A92}.hd{font:700 15px Vazirmatn,Tahoma,sans-serif;fill:#5E7A6E;opacity:.75}.mt{font:700 16px Naskh,Vazirmatn,serif;fill:#6E8B7E}</style>
    </defs>
    <rect width="1000" height="620" fill="#EAF0EB"/>
    <path d="M0 520 C120 480 220 505 320 470 C420 440 520 490 620 455 C730 420 860 470 1000 440 V620 H0Z" fill="#DCE7E0"/>
    <path d="M0 520 C120 480 220 505 320 470 C420 440 520 490 620 455 C730 420 860 470 1000 440 V620 H0Z" fill="url(#hatch)" opacity=".7"/>
    <path d="M150 560 l40-46 34 30 40-52 46 58M640 545 l46-60 30 34 44-56 54 70" fill="none" stroke="#B8CBBF" stroke-width="2"/>
    ${label(560, 585, 'کوه باقران', 0, 'mt')}
    <path d="M70 120 C220 60 420 70 560 80 C760 90 900 130 950 220 C990 300 960 380 900 420 C780 470 640 440 520 450 C380 462 230 470 120 430 C40 400 30 320 40 240 C46 180 50 140 70 120Z" fill="#F7F9F6" stroke="#DCE5DF" stroke-width="2"/>
    <path d="M70 120 C220 60 420 70 560 80 C760 90 900 130 950 220 C990 300 960 380 900 420 C780 470 640 440 520 450 C380 462 230 470 120 430 C40 400 30 320 40 240 C46 180 50 140 70 120Z" fill="url(#blk)" opacity=".75"/>
    <path d="M20 392 C140 372 220 400 330 384 S 520 360 640 392 S 860 400 990 372" fill="none" stroke="#BFD8E2" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 0"/>
    ${label(860, 410, 'رودخانه فصلی', -4)}
    <ellipse cx="455" cy="150" rx="46" ry="24" fill="#CFE5D8"/><ellipse cx="610" cy="470" rx="54" ry="22" fill="#CFE5D8"/><ellipse cx="160" cy="250" rx="34" ry="20" fill="#CFE5D8"/>
    ${road('M60 300 C250 282 420 312 560 300 S 820 268 960 290', 13)}
    ${road('M110 430 C300 448 520 428 700 452 S 880 462 950 438', 10)}
    ${road('M250 110 C320 190 380 250 470 300', 9)}
    ${road('M520 80 C515 200 505 300 498 452', 10)}
    ${road('M560 300 C640 262 720 205 830 150', 9)}
    ${road('M180 360 C300 382 400 362 498 342', 8)}
    ${road('M498 452 C560 492 590 520 612 560', 8)}
    ${road('M80 210 C300 70 700 60 930 190', 6)}
    ${label(250, 292, 'بلوار شهید آوینی', -3)}${label(800, 278, 'بلوار شهید آوینی', -4)}
    ${label(330, 450, 'بلوار پاسداران', 2)}
    ${label(345, 186, 'خیابان معلم', 42)}
    ${label(536, 210, 'خیابان مدرس', 88)}
    ${label(720, 214, 'خیابان غفاری', -30)}
    ${label(300, 362, 'خیابان منتظری', 5)}
    ${BK.hoods.map(h => label(h.mx, h.my + 46, h.name, 0, 'hd')).join('')}
    <g transform="translate(940 70)"><circle r="24" fill="#fff" stroke="#DCE5DF"/><path d="M0 -16 6 2H-6Z" fill="#2C7F65"/><path d="M0 16 6 -2H-6Z" fill="#C9D5CF"/><text y="-20" class="st" text-anchor="middle" style="font-size:11px">ش</text></g>
  </svg>`;
  const pinShape = '<svg class="pin-shape" viewBox="0 0 34 42" aria-hidden="true"><path d="M17 1C8.2 1 1 8 1 16.6 1 28 17 41 17 41s16-13 16-24.4C33 8 25.8 1 17 1Z" stroke="#fff" stroke-width="2"/></svg>';

  BK.mountMap = (el, opts = {}) => {
    let list = opts.places || BK.places;
    const compact = !!opts.compact, side = opts.side !== false && !compact;
    const cats = [...new Set(list.map(p => p.cat))].slice(0, 8).map(BK.catById);
    el.innerHTML = `<div class="bmap ${compact ? 'bmap--compact' : ''}">
      <div class="bmap__wrap">
        ${opts.filters === false || compact ? '' : `<div class="bmap__toolbar" role="group" aria-label="فیلتر روی نقشه"><button class="chip" aria-pressed="true" data-mc="all">همه</button>${cats.map(c => `<button class="chip" aria-pressed="false" data-mc="${c.id}">${ico(c.icon)}${c.name}</button>`).join('')}</div>`}
        <div class="bmap__scroll" dir="ltr"><div class="bmap__canvas">${BK.mapSVG()}<div class="bmap__pins"></div></div></div>
        <span class="bmap__note">نقشه نمایشی؛ موقعیت‌ها تقریبی است</span>
      </div>
      ${side ? `<aside class="bmap__side"><h3>${opts.title || 'مکان‌های روی نقشه'}</h3><p>روی هر نشانگر بزن تا کارتش باز شود.</p><div class="bmap__list"></div></aside>` : ''}
    </div>`;
    const canvas = $('.bmap__canvas', el), pinsEl = $('.bmap__pins', el), listEl = $('.bmap__list', el);
    let pop = null, cur = null, filter = 'all';
    const close = () => { pop?.remove(); pop = null; $$('.bpin.is-on', el).forEach(b => b.classList.remove('is-on')); $$('.mrow.is-on', el).forEach(b => b.classList.remove('is-on')); cur = null; };
    const open = (id, scroll) => {
      const p = list.find(x => x.id === +id); if (!p) return;
      close(); cur = p.id;
      const [x, y] = BK.placeXY(p), c = BK.catById(p.cat), h = BK.hoodById(p.hood) || { name: '' };
      $(`.bpin[data-id="${p.id}"]`, el)?.classList.add('is-on');
      const row = $(`.mrow[data-id="${p.id}"]`, el); row?.classList.add('is-on'); if (scroll && row) row.scrollIntoView({ block: 'nearest' });
      const W = canvas.clientWidth, px = Math.max(136, Math.min(W - 136, x / 1000 * W));
      pop = document.createElement('div');
      pop.className = 'bpop' + (y < 250 ? ' below' : '');
      pop.style.left = px + 'px'; pop.style.top = (y / 620 * 100) + '%';
      pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', p.name);
      pop.innerHTML = `<img src="${BK.photoOf(p)}" alt=""><button class="bpop__close" aria-label="بستن">${ico('x')}</button>
        <div class="bpop__body"><b>${p.name}</b><div class="bpop__row">${BK.score(p.rating)}<span>${BK.fa(p.reviews)} نظر</span><span>${c.name}</span></div>
        <div class="bpop__row">${ico('pin')}${h.name} · <span class="pill ${p.open ? 'pill--open' : 'pill--closed'}">${p.open ? 'باز است' : 'بسته است'}</span></div>
        <a class="btn btn--primary btn--sm" href="${BK.placeUrl(p.id)}" style="margin-top:8px">مشاهده صفحه</a></div>`;
      canvas.append(pop); BK.hydrateIcons(pop);
      $('.bpop__close', pop).onclick = close;
      if (motion) G.from(pop, { y: 10, opacity: 0, duration: .3, ease: 'power2.out' });
      const sc = $('.bmap__scroll', el); if (sc.scrollWidth > sc.clientWidth) sc.scrollTo({ left: px - sc.clientWidth / 2 - (canvas.clientWidth - sc.clientWidth), behavior: 'smooth' });
      opts.onSelect?.(p);
    };
    const draw = () => {
      const shown = list.filter(p => filter === 'all' || p.cat === filter);
      pinsEl.innerHTML = list.map(p => { const [x, y] = BK.placeXY(p), dim = !shown.includes(p);
        return `<button class="bpin ${dim ? 'is-dim' : ''} ${opts.focus === p.id ? 'is-focus' : ''}" data-id="${p.id}" style="left:${x / 10}%;top:${y / 6.2}%" aria-label="${p.name}" ${dim ? 'tabindex="-1"' : ''}>${pinShape}${ico(BK.catById(p.cat).icon)}</button>`; }).join('');
      if (listEl) listEl.innerHTML = shown.length ? shown.map(p => `<button class="mrow" data-id="${p.id}"><img src="${BK.photoOf(p)}" alt="" loading="lazy" width="52" height="52"><div><b>${p.name}</b><small>${BK.catById(p.cat).name} · ${(BK.hoodById(p.hood) || {}).name || ''}</small></div>${BK.score(p.rating)}</button>`).join('') : '<p class="muted" style="padding:12px">مکانی در این دسته نیست.</p>';
      if (motion && opts.animate !== false) G.from($$('.bpin:not(.is-dim)', pinsEl), { y: -16, opacity: 0, stagger: .025, duration: .45, ease: 'back.out(2)', clearProps: 'transform,opacity' });
    };
    el.addEventListener('click', e => {
      const pin = e.target.closest('.bpin'); if (pin) { cur === +pin.dataset.id ? close() : open(pin.dataset.id, true); return; }
      const row = e.target.closest('.bmap__list .mrow'); if (row) { open(row.dataset.id, false); return; }
      const f = e.target.closest('[data-mc]'); if (f) { filter = f.dataset.mc; $$('[data-mc]', el).forEach(b => b.setAttribute('aria-pressed', b === f)); close(); draw(); return; }
      if (pop && !e.target.closest('.bpop') && e.target.closest('.bmap__canvas')) close();
    });
    el.addEventListener('mouseover', e => { const row = e.target.closest('.bmap__list .mrow'); $$('.bpin', el).forEach(b => b.classList.toggle('is-hover', row && b.dataset.id === row.dataset.id)); });
    el.addEventListener('keydown', e => { if (e.key === 'Escape' && pop) { const id = cur; close(); $(`.bpin[data-id="${id}"]`, el)?.focus(); } });
    draw();
    if (opts.zoom) {
      const sc = $('.bmap__scroll', el); sc.style.height = (opts.height || 240) + 'px'; sc.style.overflow = 'hidden'; canvas.style.width = opts.zoom * 100 + '%';
      const center = () => { const f = list.find(x => x.id === opts.focus); if (!f) return; const [x, y] = BK.placeXY(f); sc.scrollLeft = x / 1000 * canvas.clientWidth - sc.clientWidth / 2; sc.scrollTop = y / 620 * canvas.clientHeight - sc.clientHeight / 2; };
      requestAnimationFrame(center); addEventListener('resize', center);
    } else if (opts.focus) setTimeout(() => open(opts.focus), 50);
    return { open, close, setPlaces(l) { list = l; close(); draw(); } };
  };

  /* =========================================================
     Layout: header, footer, review modal
     ========================================================= */
  const NAV = [['index.html', 'خانه', 'home'], ['search.html', 'کاوش مکان‌ها', 'search'], ['categories.html', 'دسته‌بندی‌ها', 'categories'], ['hoods.html', 'محله‌ها و نقشه', 'hoods'], ['blog.html', 'مجله', 'blog'], ['business.html', 'کسب‌وکارها', 'business']];
  const current = { place: 'search', article: 'blog', dashboard: 'business' }[page] || page;
  const brand = (light = false) => `<a href="index.html" class="brand ${light ? 'brand--light' : ''}" aria-label="در بیرجند کجا — صفحه اصلی"><img src="assets/img/logo-mark.svg" alt="" width="40" height="40" class="brand__mark"><span class="brand__name"><b>در بیرجند <em>کجا؟</em></b><small>راهنمای مردمی کسب‌وکارهای بیرجند</small></span></a>`;
  const u = BK.user();
  const top = $('#layout-top');
  if (top) top.outerHTML = `<a class="skip" href="#main">رفتن به محتوای اصلی</a>
    <header class="header" id="header"><div class="container header__row">
      ${brand()}
      <nav class="nav" id="nav" aria-label="منوی اصلی">${NAV.map(([h, t, k]) => `<a href="${h}"${k === current ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      <div class="header__actions">
        <a href="business.html#register" class="btn btn--secondary btn--sm hide-sm">${ico('store')}ثبت کسب‌وکار</a>
        <a class="user-btn" href="${u ? 'profile.html' : 'login.html'}"><span class="hide-sm">${u ? BK.esc(u.name.split(' ')[0]) : 'ورود / ثبت‌نام'}</span><span class="av">${u ? BK.esc(u.name[0]) : ico('user')}</span></a>
        <button class="icon-btn menu-btn" id="menuBtn" aria-label="باز کردن منو" aria-expanded="false" aria-controls="nav">${ico('menu')}</button>
      </div></div></header>`;

  const popCats = BK.categories.slice(0, 6);
  const bottom = $('#layout-bottom');
  if (bottom) bottom.outerHTML = `
    <footer class="footer">
      <div class="footer__news"><div class="container">
        <div><h2>هر پنجشنبه، تازه‌های بیرجند در ایمیلت</h2><p>کافه‌های تازه، رویدادهای آخر هفته و مطالب مجله؛ ماهی چهار ایمیل، بدون تبلیغ مزاحم.</p></div>
        <form class="news-form" id="newsForm" novalidate><label for="newsEmail" class="sr-only">ایمیل</label><input type="email" id="newsEmail" required placeholder="نشانی ایمیل شما" dir="ltr" autocomplete="email"><button class="btn btn--light">عضویت</button></form>
      </div></div>
      <div class="container footer__grid">
        <div class="footer__about">${brand(true)}
          <p>«در بیرجند کجا؟» راهنمای مستقل کسب‌وکارهای بیرجند است. امتیازها فقط از نظر کاربرانی می‌آید که شماره موبایلشان را تأیید کرده‌اند.</p>
          <div class="contact-lines"><span>${ico('pin')}بیرجند، خیابان معلم، ساختمان نوآوری، طبقه ۳</span><span>${ico('phone')}<bdi dir="ltr">۰۵۶-۳۲۰۰۰۰۰۰</bdi> (نمونه)</span><span>${ico('mail')}<bdi dir="ltr">hello@example.com</bdi></span></div>
        </div>
        <div class="footer__col"><h4>دسترسی سریع</h4><a href="search.html">کاوش مکان‌ها</a><a href="hoods.html">نقشه و محله‌ها</a><a href="blog.html">مجله</a><a href="profile.html">حساب کاربری</a><a href="rules.html">قوانین نظردهی</a></div>
        <div class="footer__col"><h4>دسته‌های پرطرفدار</h4>${popCats.map(c => `<a href="${BK.searchUrl('cat-' + c.id)}">${c.name}</a>`).join('')}</div>
        <div class="footer__col"><h4>کسب‌وکارها</h4><a href="business.html#register">ثبت رایگان کسب‌وکار</a><a href="business.html#claim">احراز مالکیت صفحه</a><a href="business.html#pricing">تعرفه‌ها</a><a href="dashboard.html">داشبورد کسب‌وکار</a><a href="about.html">درباره ما</a><a href="contact.html">تماس با ما</a></div>
        <div><h4>مجوزها</h4><div class="trust"><div class="trust__badge">${ico('shield')}محل نماد اعتماد الکترونیکی</div><div class="trust__badge">${ico('badge')}محل نشان ساماندهی</div></div></div>
      </div>
      <div class="footer__bottom"><div class="container">
        <span>© ۱۴۰۵ در بیرجند کجا · عکس‌ها نمایشی‌اند</span>
        <nav class="footer__links" aria-label="پیوندهای قانونی"><a href="privacy.html">حریم خصوصی</a><a href="rules.html">قوانین</a><a href="careers.html">فرصت‌های شغلی</a><a href="admin.html">ورود مدیر</a></nav>
        <div class="socials"><a href="contact.html#social" aria-label="اینستاگرام">${ico('instagram')}</a><a href="contact.html#social" aria-label="تلگرام">${ico('send')}</a><a href="blog.html" aria-label="مجله">${ico('book')}</a></div>
      </div></div>
    </footer>
    <nav class="bottom-nav" aria-label="ناوبری موبایل">
      <a href="index.html"${page === 'home' ? ' class="active"' : ''}>${ico('home')}خانه</a>
      <a href="search.html"${['search', 'place'].includes(page) ? ' class="active"' : ''}>${ico('search')}کاوش</a>
      <button data-open-review class="bn-add" aria-label="ثبت نظر">${ico('plus')}</button>
      <a href="hoods.html"${page === 'hoods' ? ' class="active"' : ''}>${ico('map')}نقشه</a>
      <a href="${u ? 'profile.html' : 'login.html'}"${['profile', 'login'].includes(page) ? ' class="active"' : ''}>${ico('user')}${u ? 'پروفایل' : 'ورود'}</a>
    </nav>
    <div class="modal" id="reviewModal" role="dialog" aria-modal="true" aria-labelledby="rmTitle" hidden>
      <div class="modal__backdrop" data-close></div>
      <div class="modal__panel">
        <button class="icon-btn modal__close" data-close aria-label="بستن">${ico('x')}</button>
        <h3 id="rmTitle">ثبت نظر</h3>
        <p class="modal__sub" id="rmSub"></p>
        <form class="mstep" id="mvPhone" novalidate hidden>
          <div class="f"><label for="mvMobile">شماره موبایل</label><input class="input" id="mvMobile" required data-pattern="mobile" inputmode="tel" dir="ltr" placeholder="09xxxxxxxxx" autocomplete="tel"><span class="hint">شماره شما نمایش داده نمی‌شود؛ فقط برای جلوگیری از نظرات جعلی است.</span></div>
          <button class="btn btn--primary btn--block">دریافت کد تأیید</button>
        </form>
        <form class="mstep" id="mvCode" novalidate hidden>
          <div class="demo-code">نسخه نمایشی است و پیامکی ارسال نمی‌شود. کد: <b dir="ltr">12345</b></div>
          <div class="otp" role="group" aria-label="کد تأیید ۵ رقمی">${[1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" maxlength="1" aria-label="رقم ${BK.fa(i)}">`).join('')}</div>
          <small class="err" id="mvErr" hidden>کد درست نیست. کد نمایشی ۱۲۳۴۵ است.</small>
          <div class="f"><label for="mvName">نام نمایشی</label><input class="input" id="mvName" required placeholder="مثلاً مریم ر." maxlength="30"></div>
          <button class="btn btn--primary btn--block">تأیید و ادامه</button>
        </form>
        <form class="mstep" id="reviewForm" novalidate hidden>
          <div class="f"><label for="rmPlace">کسب‌وکار</label><select class="select" id="rmPlace" required></select></div>
          <fieldset class="f" style="border:0;padding:0;margin:0"><legend class="lbl" style="font-weight:700;margin-bottom:6px">امتیاز شما</legend>
            <div class="rate-input" id="rateInput" role="radiogroup" aria-label="امتیاز از ۱ تا ۵"></div><small class="rate-label" id="rateLabel">روی ستاره‌ها بزنید</small></fieldset>
          <div class="f"><label for="rmText">تجربه شما</label><textarea class="textarea" id="rmText" rows="4" required minlength="20" placeholder="کی رفتید؟ چه چیزی خوب بود و چه چیزی بهتر می‌شد؟"></textarea><small class="hint"><span id="rmCount">۰</span> نویسه از حداقل ۲۰</small><small class="err" id="rmError" hidden></small></div>
          <button class="btn btn--primary btn--block">ارسال برای تأیید</button>
        </form>
      </div>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  /* ---------- toast & copy ---------- */
  let toastT;
  BK.toast = msg => { const t = $('#toast'); if (!t) return; t.innerHTML = ico('check') + '<span></span>'; t.lastChild.textContent = msg; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 3400); };
  BK.copy = (text, ok = 'کپی شد') => { const bad = () => BK.toast('کپی خودکار ممکن نشد؛ متن را انتخاب و کپی کنید.'); try { navigator.clipboard.writeText(text).then(() => BK.toast(ok), bad); } catch { bad(); } };
  document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) { e.preventDefault(); BK.copy(b.dataset.copy, b.dataset.copyMsg); } });

  /* ---------- validation ---------- */
  BK.validate = form => {
    let bad = null;
    $$('[required], [data-pattern]', form).forEach(el => {
      if (el.closest('[hidden]') || el.type === 'file') return;
      const v = el.value.trim(); let msg = '';
      if (el.required && !v) msg = el.dataset.req || 'این بخش را پر کنید.';
      else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'نشانی ایمیل درست نیست؛ مثل name@example.com بنویسید.';
      else if (v && el.dataset.pattern === 'mobile' && !/^09\d{9}$/.test(BK.toEn(v).replace(/[\s-]/g, ''))) msg = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.';
      else if (v && el.dataset.pattern === 'nid' && !BK.validNid(BK.toEn(v))) msg = 'کد ملی ۱۰ رقمی معتبر نیست.';
      else if (el.minLength > 0 && v && v.length < el.minLength) msg = `حداقل ${BK.fa(el.minLength)} نویسه بنویسید.`;
      const f = el.closest('.f'); let err = f?.querySelector(':scope > .err');
      if (msg) {
        el.setAttribute('aria-invalid', 'true');
        if (f && !err) { err = document.createElement('small'); err.className = 'err'; err.id = (el.id || BK.uid()) + '-err'; f.append(err); el.setAttribute('aria-describedby', err.id); }
        if (err) err.textContent = msg; bad = bad || el;
      } else { el.removeAttribute('aria-invalid'); err?.remove(); }
    });
    if (bad) bad.focus();
    return !bad;
  };
  BK.validNid = n => { if (!/^\d{10}$/.test(n) || /^(\d)\1{9}$/.test(n)) return false; const c = +n[9], s = [...n.slice(0, 9)].reduce((a, d, i) => a + +d * (10 - i), 0) % 11; return s < 2 ? c === s : c === 11 - s; };
  BK.otp = (wrap, onDone) => {
    const boxes = $$('input', wrap);
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = BK.toEn(b.value).replace(/\D/g, '').slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); if (boxes.every(x => x.value)) onDone(boxes.map(x => x.value).join('')); });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener('paste', e => { const t = BK.toEn(e.clipboardData.getData('text')).replace(/\D/g, ''); if (t.length >= 5) { e.preventDefault(); boxes.forEach((x, j) => x.value = t[j] || ''); onDone(t.slice(0, 5)); } });
    });
    return { clear() { boxes.forEach(b => b.value = ''); boxes[0].focus(); }, focus() { boxes[0].focus(); }, value: () => boxes.map(x => x.value).join('') };
  };

  /* ---------- favorites ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]'); if (!b) return;
    e.preventDefault();
    const id = +b.dataset.fav, on = !BK.favs.has(id);
    on ? BK.favs.add(id) : BK.favs.delete(id); S.set('bk-favs', [...BK.favs]);
    $$(`[data-fav="${id}"]`).forEach(x => { x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    BK.toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
    document.dispatchEvent(new CustomEvent('bk:favs'));
  });

  /* ---------- header & menu ---------- */
  const header = $('#header'), nav = $('#nav'), menuBtn = $('#menuBtn');
  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const closeMenu = () => { nav?.classList.remove('is-open'); menuBtn?.setAttribute('aria-expanded', false); if (menuBtn) menuBtn.innerHTML = ico('menu'); };
  menuBtn?.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); menuBtn.setAttribute('aria-expanded', open); menuBtn.innerHTML = ico(open ? 'x' : 'menu'); });
  $$('a', nav || document.createElement('i')).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav?.classList.contains('is-open')) { closeMenu(); menuBtn.focus(); } });

  /* ---------- newsletter ---------- */
  $('#newsForm')?.addEventListener('submit', e => {
    e.preventDefault(); const i = $('#newsEmail'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value.trim());
    i.setAttribute('aria-invalid', !ok); if (!ok) { i.focus(); BK.toast('نشانی ایمیل درست نیست؛ مثل name@example.com بنویسید.'); return; }
    const list = S.get('bk-news', []); list.push({ email: i.value.trim(), ts: Date.now() }); S.set('bk-news', list);
    e.target.reset(); i.removeAttribute('aria-invalid'); BK.toast('عضو خبرنامه شدید. اولین ایمیل پنجشنبه می‌رسد.');
  });

  /* ---------- review modal: verified phone required ---------- */
  const modal = $('#reviewModal');
  if (modal) {
    const panel = $('.modal__panel', modal), fPhone = $('#mvPhone'), fCode = $('#mvCode'), fRev = $('#reviewForm');
    const rate = $('#rateInput'), sel = $('#rmPlace'), txt = $('#rmText');
    const labels = ['', 'خیلی بد', 'بد', 'معمولی', 'خوب', 'عالی'];
    let lastFocus, value = 0, mobile = '', wantPlace = '';
    sel.innerHTML = BK.categories.map(c => { const ps = BK.places.filter(p => p.cat === c.id); return ps.length ? `<optgroup label="${c.name}">${ps.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</optgroup>` : ''; }).join('');
    rate.innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" role="radio" aria-checked="false" aria-label="${BK.fa(i)} ستاره، ${labels[i]}" data-v="${i}">${BK.starSvg}</button>`).join('');
    const setRate = v => { value = v; v ? rate.dataset.v = v : rate.removeAttribute('data-v'); $$('button', rate).forEach(b => b.setAttribute('aria-checked', +b.dataset.v === v)); $('#rateLabel').textContent = v ? labels[v] : 'روی ستاره‌ها بزنید'; };
    rate.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setRate(+b.dataset.v); });
    rate.addEventListener('keydown', e => { if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); setRate(Math.max(1, value - 1)); $$('button', rate)[value - 1].focus(); } if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setRate(Math.min(5, value + 1)); $$('button', rate)[value - 1].focus(); } });
    txt.addEventListener('input', () => { $('#rmCount').textContent = BK.fa(txt.value.trim().length); });
    const show = step => {
      [fPhone, fCode, fRev].forEach(f => f.hidden = f !== step);
      $('#rmTitle').textContent = step === fRev ? 'نظرت رو بنویس' : 'اول شماره‌ات رو تأیید کن';
      $('#rmSub').textContent = step === fRev ? `با نام «${BK.user().name}» ثبت می‌شود و پس از تأیید مدیر منتشر می‌شود.` : 'برای جلوگیری از نظرات جعلی، فقط کاربرانی که شماره موبایلشان را تأیید کرده‌اند می‌توانند نظر بدهند.';
      if (step === fRev && wantPlace) sel.value = wantPlace;
      setTimeout(() => (step === fCode ? $('.otp input', fCode) : $('input, select', step))?.focus(), 30);
    };
    const otp = BK.otp($('.otp', fCode), () => { $('#mvName').focus(); });
    const open = pid => {
      lastFocus = document.activeElement; wantPlace = pid || '';
      modal.hidden = false; document.body.style.overflow = 'hidden';
      show(BK.user() ? fRev : fPhone);
      if (motion) G.fromTo(panel, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out' });
    };
    const close = () => { modal.hidden = true; document.body.style.overflow = ''; lastFocus?.focus(); };
    BK.openReview = open;
    document.addEventListener('click', e => { const b = e.target.closest('[data-open-review]'); if (b) { e.preventDefault(); open(b.dataset.openReview); } });
    $$('[data-close]', modal).forEach(b => b.addEventListener('click', close));
    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { const f = $$('button, select, textarea, input', panel).filter(x => !x.disabled && x.offsetParent); if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); } }
    });
    fPhone.addEventListener('submit', e => { e.preventDefault(); if (!BK.validate(fPhone)) return; mobile = BK.toEn($('#mvMobile').value).replace(/[\s-]/g, ''); show(fCode); });
    fCode.addEventListener('submit', e => {
      e.preventDefault();
      if (otp.value() !== '12345') { $('#mvErr').hidden = false; otp.clear(); return; }
      $('#mvErr').hidden = true; if (!BK.validate(fCode)) return;
      BK.login(mobile, $('#mvName').value.trim()); BK.toast('شماره شما تأیید شد'); show(fRev);
    });
    fRev.addEventListener('submit', e => {
      e.preventDefault(); const err = $('#rmError');
      if (!value) { err.textContent = 'امتیاز را با انتخاب یکی از ستاره‌ها مشخص کنید.'; err.hidden = false; rate.querySelector('button').focus(); return; }
      if (txt.value.trim().length < 20) { err.textContent = 'متن نظر باید حداقل ۲۰ نویسه باشد.'; err.hidden = false; txt.focus(); return; }
      err.hidden = true;
      const me = BK.user();
      const r = { id: 'r' + BK.uid(), pid: +sel.value, name: me.name, mobile: me.mobile, rating: value, text: txt.value.trim(), ago: 'همین حالا', date: BK.nowFa(), ts: Date.now(), status: 'pending' };
      S.set('bk-reviews', [r, ...BK.userReviews()]);
      document.dispatchEvent(new CustomEvent('bk:review', { detail: r }));
      fRev.reset(); setRate(0); $('#rmCount').textContent = '۰';
      close(); BK.toast('نظرت ثبت شد و بعد از تأیید مدیر منتشر می‌شه.');
    });
  }

  /* =========================================================
     Light motion: content is visible at rest; below-fold items fade up once
     ========================================================= */
  const belowFold = el => el.getBoundingClientRect().top > innerHeight * .92;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target); const el = en.target;
    if (el.dataset.count) BK.countUp(el); else { el.style.transition = 'opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1)'; el.style.opacity = 1; el.style.transform = 'none'; }
  }), { rootMargin: '0px 0px -6% 0px' }) : null;
  BK.reveal = els => {
    if (!motion || !io) return;
    els.filter(e => !e.dataset.rv && belowFold(e)).forEach(e => { e.dataset.rv = 1; e.style.opacity = 0; e.style.transform = 'translateY(16px)'; io.observe(e); });
  };
  BK.countUp = el => {
    if (!motion) return; const end = +el.dataset.count, o = { v: 0 };
    G.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: () => el.textContent = BK.fa(Math.round(o.v)) });
  };
  BK.boot = () => {
    BK.hydrateIcons();
    $$('[data-count]').forEach(el => el.textContent = BK.fa(el.dataset.count));
    if (!motion || !io) return;
    BK.reveal($$('.reveal'));
    $$('[data-count]').filter(belowFold).forEach(el => io.observe(el));
    // safety net: never leave content hidden
    setTimeout(() => $$('[data-rv]').forEach(e => { if (e.getBoundingClientRect().top < innerHeight) { e.style.opacity = 1; e.style.transform = 'none'; } }), 2500);
  };
})();
