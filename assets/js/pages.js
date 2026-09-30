/* در بیرجند کجا؟ — per-page rendering */
(() => {
  const { $, $$ } = BK;
  const G = window.gsap, motion = BK.motion, ST = window.ScrollTrigger;
  const page = document.body.dataset.page;
  const norm = s => String(s).replace(/[‌\s]+/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
  const hay = p => norm([p.name, p.desc, BK.catById(p.cat).name, BK.hoodById(p.hood).name, ...p.tags].join(' '));
  const crumbs = items => `<nav class="crumbs" aria-label="مسیر صفحه"><a href="index.html">خانه</a>${items.map(([t, h]) => `${ico('chevron')}${h ? `<a href="${h}">${t}</a>` : `<span aria-current="page">${t}</span>`}`).join('')}</nav>`;
  const setTitle = t => document.title = `${t} | در بیرجند کجا؟`;
  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; return el; };
  const validate = (form) => {
    let firstBad = null;
    $$('[required], [data-pattern]', form).forEach(el => {
      if (el.closest('[hidden]')) return;
      const v = el.value.trim();
      let msg = '';
      if (el.required && !v) msg = el.dataset.req || 'این بخش را پر کنید.';
      else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'نشانی ایمیل درست نیست؛ مثل name@example.com بنویسید.';
      else if (v && el.dataset.pattern === 'mobile' && !/^09\d{9}$/.test(BK.toEn(v).replace(/[\s-]/g, ''))) msg = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.';
      else if (el.minLength > 0 && v && v.length < el.minLength) msg = `حداقل ${BK.fa(el.minLength)} نویسه بنویسید.`;
      const f = el.closest('.f'); let err = f?.querySelector('.err');
      if (msg) {
        el.setAttribute('aria-invalid', 'true');
        if (f && !err) { err = document.createElement('small'); err.className = 'err'; err.id = el.id + '-err'; f.append(err); el.setAttribute('aria-describedby', err.id); }
        if (err) err.textContent = msg;
        firstBad = firstBad || el;
      } else { el.removeAttribute('aria-invalid'); err?.remove(); }
    });
    firstBad?.focus();
    return !firstBad;
  };
  const successHTML = (title, text, actions = '') => `<div class="success"><div class="success__ico">${ico('check')}</div><h3>${title}</h3><p>${text}</p>${actions}</div>`;
  const popIn = el => { if (motion && el) G.from(el, { scale: .9, opacity: 0, duration: .6, ease: 'back.out(1.8)' }); };

  const R = {};

  /* =========================================================
     HOME
     ========================================================= */
  R.home = () => {
    fill('#catGrid', BK.categories.map(c => `<a href="${BK.searchUrl('cat-' + c.id)}" class="cat reveal" style="--h:${c.hue}"><span class="cat__ico">${ico(c.icon)}</span><b>${c.name}</b><small>${BK.fa(c.count)} مکان</small></a>`).join(''));
    const items = BK.categories.map(c => `<span>${ico(c.icon)}${c.name}</span><span>${ico('sparkles')}</span>`).join('');
    fill('#marquee', items + items);
    $('#hood').innerHTML += BK.hoods.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    const tabDefs = [{ id: 'all', name: 'همه' }, ...['food', 'cafe', 'sight', 'souvenir', 'health', 'hotel'].map(BK.catById)];
    $('#tabs').insertAdjacentHTML('beforeend', tabDefs.map((t, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-tab="${t.id}">${t.name}</button>`).join(''));
    const featured = [1, 5, 8, 23, 11, 13, 2, 9, 15, 6, 12, 17];
    fill('#placeGrid', featured.map(id => BK.placeCard(BK.placeById(id))).join(''));
    fill('#hoodTrack', BK.hoods.map((h, i) => `<a href="${BK.searchUrl('hood-' + h.id)}" class="hood" style="--h:${150 + i * 12}">
      <img class="hood__art" src="${BK.img(h.photo)}" alt="" loading="lazy">
      <span class="hood__num">${BK.fa(i + 1).padStart(2, '۰')}</span>
      <h3>${h.name}</h3><p>${h.tag}</p>
      <div class="hood__foot"><span>${BK.fa(h.places)} مکان ثبت‌شده</span><span class="hood__go">${ico('arrow')}</span></div></a>`).join(''));
    const allRv = [...BK.myReviews(), ...BK.reviews];
    const half = Math.ceil(allRv.length / 2);
    const r1 = allRv.slice(0, half).map(r => BK.reviewCard(r)).join(''), r2 = allRv.slice(half).map(r => BK.reviewCard(r)).join('');
    fill('#rvRow1', r1 + r1); fill('#rvRow2', r2 + r2);
    const top = [...BK.places].sort((a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews)).slice(0, 5);
    fill('#leader', top.map(p => `<li class="reveal"><a href="${BK.placeUrl(p.id)}" class="stretch"><b>${p.name}</b><small>${BK.catById(p.cat).name} · ${BK.hoodById(p.hood).name} · ${BK.fa(p.reviews)} نظر</small></a><span class="leader__score">${BK.faDec(p.rating)}</span><i class="leader__bar" style="--w:${p.rating / 5 * 100}"></i></li>`).join(''));
    fill('#homePosts', BK.articles.slice(0, 3).map(postCard).join(''));

    // tabs (Flip filter)
    let tab = 'all';
    const moveInk = () => { const s = $('.tab[aria-selected="true"]'), ink = $('.tabs__ink'); if (s && ink) { ink.style.left = s.offsetLeft + 'px'; ink.style.width = s.offsetWidth + 'px'; } };
    const apply = () => {
      const cards = $$('#placeGrid .place');
      const state = motion && window.Flip ? Flip.getState(cards) : null;
      cards.forEach(el => el.hidden = !(tab === 'all' || el.dataset.cat === tab));
      if (state) Flip.from(state, { duration: .7, ease: 'power3.inOut', stagger: .03, absolute: true, scale: true,
        onEnter: els => G.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6, ease: 'back.out(1.6)' }),
        onLeave: els => G.to(els, { opacity: 0, scale: .85, duration: .35 }) });
    };
    $$('.tab').forEach(t => t.addEventListener('click', () => { tab = t.dataset.tab; $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t)); moveInk(); apply(); }));
    addEventListener('resize', moveInk); document.fonts?.ready.then(moveInk); moveInk();

    // search + suggestions → search page
    const form = $('#heroSearch'), q = $('#q'), sug = $('#suggest');
    let active = -1;
    const render = () => {
      const v = q.value.trim(); if (!v) { sug.hidden = true; return; }
      const cats = BK.categories.filter(c => norm(c.name).includes(norm(v))).slice(0, 2);
      const ps = BK.places.filter(p => hay(p).includes(norm(v))).slice(0, 5);
      sug.innerHTML = (!cats.length && !ps.length) ? `<p style="padding:12px;color:var(--muted)">نتیجه‌ای پیدا نشد. عبارت کوتاه‌تری امتحان کنید.</p>` :
        cats.map(c => `<a href="${BK.searchUrl('cat-' + c.id)}" role="option"><span class="s-ico" style="--h:${c.hue}">${ico(c.icon)}</span><div><b>${c.name}</b><small>دسته‌بندی · ${BK.fa(c.count)} مکان</small></div></a>`).join('') +
        ps.map(p => `<a href="${BK.placeUrl(p.id)}" role="option"><img class="s-ico" src="${BK.img(p.photos[0])}" alt="" style="object-fit:cover"><div><b>${p.name}</b><small>${BK.catById(p.cat).name} · ${BK.hoodById(p.hood).name}</small></div><span class="s-rate">${BK.faDec(p.rating)}</span></a>`).join('');
      sug.hidden = false; active = -1;
      if (motion) G.from(sug.children, { y: 8, opacity: 0, stagger: .04, duration: .3 });
    };
    q.addEventListener('input', render);
    q.addEventListener('keydown', e => {
      const opts = $$('a', sug); if (sug.hidden || !opts.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; opts.forEach((o, i) => o.classList.toggle('is-active', i === active)); }
      else if (e.key === 'Enter' && active > -1) { e.preventDefault(); opts[active].click(); }
      else if (e.key === 'Escape') sug.hidden = true;
    });
    document.addEventListener('click', e => { if (!form.contains(e.target)) sug.hidden = true; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      BK.store.sset('bk-q', q.value.trim());
      const h = $('#hood').value;
      location.href = h ? BK.searchUrl('hood-' + h) : BK.searchUrl();
    });
    $$('.chip[data-q]').forEach(c => c.addEventListener('click', () => { q.value = c.dataset.q; q.focus(); render(); }));
    $('#newsletter')?.addEventListener('submit', e => { e.preventDefault(); if (!validate(e.target)) return; e.target.reset(); BK.toast('عضویتت در خبرنامه ثبت شد'); });
    document.addEventListener('bk:review', ev => { const row = $('#rvRow1'); row.insertAdjacentHTML('afterbegin', BK.reviewCard(ev.detail)); if (motion) G.from(row.firstElementChild, { scale: .8, opacity: 0, duration: .7, ease: 'back.out(1.7)' }); });
  };

  R.homeMotion = () => {
    if (!motion) { $('#loader')?.classList.add('is-done'); startRotator(); return; }
    const intro = G.timeline({ paused: true, defaults: { ease: 'power4.out' } })
      .from('.hero__title .word, .hero__title .rotator', { yPercent: 115, rotate: 4, duration: 1.1, stagger: .06 })
      .fromTo('.underline', { '--u': 0 }, { '--u': 1, duration: .8, ease: 'power2.inOut' }, '-=.5')
      .fromTo('.reveal-hero', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .1 }, '-=.9')
      .from('.map-card', { scale: .7, rotate: 8, opacity: 0, duration: 1.2, ease: 'expo.out' }, '-=1')
      .to('.map-road:not(.map-road--thin)', { strokeDashoffset: 0, duration: 1.6, stagger: .2, ease: 'power2.inOut' }, '-=.9')
      .from('.map-pin', { scale: 0, transformOrigin: 'center', stagger: .12, duration: .6, ease: 'back.out(3)' }, '-=1.2')
      .from('.float-card', { y: 40, opacity: 0, scale: .9, stagger: .15, duration: .9, ease: 'back.out(1.6)' }, '-=1')
      .from('.trust-row li', { y: 20, opacity: 0, stagger: .1, duration: .6 }, '-=.6')
      .add(startRotator, .4);
    const loader = $('#loader');
    if (loader && !BK.store.sget('bk-seen')) {
      BK.store.sset('bk-seen', 1);
      loader.style.clipPath = 'inset(0 0 0% 0)';
      G.timeline({ onComplete: () => loader.classList.add('is-done') })
        .to('.loader__stroke', { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' })
        .to('.loader__fill', { opacity: 1, duration: .3 }, '-=.2')
        .fromTo('.loader__dome', { opacity: 0, y: 12, scale: .6 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(2.5)' }, '-=.15')
        .to('.loader__word span', { opacity: 1, y: 0, stagger: .07, duration: .4, ease: 'power3.out' }, '-=.4')
        .to('.loader__bar i', { scaleX: 1, duration: .6, ease: 'power2.inOut' }, '-=.5')
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .8, ease: 'expo.inOut' })
        .add(() => intro.play(), '-=.4');
    } else { loader?.classList.add('is-done'); intro.play(); }

    if (!ST) return;
    G.from('.step', { scrollTrigger: { trigger: '.steps', start: 'top 80%' }, y: 60, opacity: 0, stagger: .15, duration: .9, ease: 'back.out(1.4)' });
    G.from('.step__ico', { scrollTrigger: { trigger: '.steps', start: 'top 75%' }, rotate: -30, scale: 0, stagger: .15, duration: .8, delay: .3, ease: 'back.out(2)' });
    G.from('.leader__bar', { scrollTrigger: { trigger: '#leader', start: 'top 80%' }, scaleX: 0, stagger: .1, duration: 1.2, ease: 'power3.out' });
    G.from('.stats__score, .stat', { scrollTrigger: { trigger: '.stats', start: 'top 80%' }, y: 40, opacity: 0, stagger: .1, duration: .8 });
    G.from('.stats .stars .s', { scrollTrigger: { trigger: '.stats', start: 'top 75%' }, scale: 0, rotate: -90, stagger: .1, duration: .6, ease: 'back.out(2.5)' });
    G.from('.checks li', { scrollTrigger: { trigger: '.checks', start: 'top 85%' }, x: 40, opacity: 0, stagger: .12, duration: .7 });
    const dash = $('.dash');
    G.timeline({ scrollTrigger: { trigger: dash, start: 'top 75%' } })
      .from(dash, { y: 80, rotateY: -14, rotateX: 8, transformPerspective: 1200, opacity: 0, duration: 1.2, ease: 'expo.out' })
      .from('.dash__kpis div', { y: 20, opacity: 0, stagger: .1, duration: .5 }, '-=.7')
      .to('.dash__line', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, '-=.3')
      .from('.dash__area', { opacity: 0, duration: 1 }, '-=1')
      .from('.dash__review', { y: 30, opacity: 0, scale: .9, duration: .7, ease: 'back.out(2)' }, '-=.6');
    G.to('.cta__glow', { x: 200, y: 80, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    G.to('.blob--1', { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }, y: 160, x: -60 });
    G.to('.blob--2', { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }, y: -120 });
    G.to('.hero__visual', { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }, y: 90, rotate: -3 });
    G.to('.blob', { scale: 1.15, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 1.5 });
    const loops = [];
    const loop = (el, dur, dir = 1) => { const t = G.fromTo(el, { xPercent: dir > 0 ? 0 : 50 }, { xPercent: dir > 0 ? 50 : 0, duration: dur, ease: 'none', repeat: -1 }); loops.push(t); return t; };
    loop($('#marquee'), 36);
    const rv1 = loop($('#rvRow1'), 70), rv2 = loop($('#rvRow2'), 70, -1);
    $('.rv-marquee').addEventListener('pointerenter', () => G.to([rv1, rv2], { timeScale: 0, duration: .5 }));
    $('.rv-marquee').addEventListener('pointerleave', () => G.to([rv1, rv2], { timeScale: 1, duration: .5 }));
    $('.rv-marquee').addEventListener('focusin', () => G.to([rv1, rv2], { timeScale: 0, duration: .3 }));
    ST.create({ onUpdate: s => { const v = Math.min(Math.abs(s.getVelocity()) / 400, 5); G.to(loops[0], { timeScale: 1 + v, duration: .2, overwrite: true, onComplete: () => G.to(loops[0], { timeScale: 1, duration: 1 }) }); } });
    G.to('.marquee', { scrollTrigger: { trigger: '.marquee', scrub: true }, rotate: 1.2 });
    const mm = G.matchMedia();
    mm.add('(min-width: 721px)', () => {
      const track = $('#hoodTrack'), dist = () => Math.max(0, track.scrollWidth - innerWidth);
      G.to(track, { x: () => dist(), ease: 'none', scrollTrigger: { trigger: '.hoods', start: 'top top', end: () => '+=' + dist(), pin: '.hoods__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) $('.hero').addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      G.to('.map-card', { x: x * 20, y: y * 20, duration: 1, ease: 'power3.out' });
      G.to('.fc-1', { x: x * -40, y: y * -30, duration: 1, ease: 'power3.out' });
      G.to('.fc-2', { x: x * 50, y: y * 40, duration: 1, ease: 'power3.out' });
      G.to('.fc-3', { x: x * -30, y: y * 50, duration: 1, ease: 'power3.out' });
    });
  };
  function startRotator() {
    const item = $('.rotator__item'); if (!item || item.dataset.on) return; item.dataset.on = 1;
    const words = ['کافه‌ها', 'رستوران‌ها', 'پزشک‌ها', 'سوغاتی‌ها', 'هتل‌ها', 'باشگاه‌ها', 'جاذبه‌ها'];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      if (!motion) { item.textContent = words[i]; return; }
      G.timeline().to(item, { yPercent: -100, opacity: 0, rotateX: 60, duration: .45, ease: 'power3.in' })
        .add(() => { item.textContent = words[i]; })
        .fromTo(item, { yPercent: 100, opacity: 0, rotateX: -60 }, { yPercent: 0, opacity: 1, rotateX: 0, duration: .6, ease: 'power3.out' });
    }, 2600);
  }

  /* =========================================================
     SEARCH / EXPLORE
     ========================================================= */
  R.search = () => {
    const S = { q: BK.store.sget('bk-q', ''), cats: new Set(), hood: '', rating: 0, open: false, verified: false, prices: new Set(), sort: 'rec', view: 'grid', page: 1 };
    const readHash = () => {
      S.cats.clear(); S.hood = ''; S.open = false; S.verified = false; S.rating = 0; S.prices.clear();
      BK.hashTokens().forEach(t => {
        if (t.startsWith('cat-')) S.cats.add(t.slice(4));
        else if (t.startsWith('hood-')) S.hood = t.slice(5);
        else if (t === 'open') S.open = true;
        else if (t === 'verified') S.verified = true;
        else if (t.startsWith('r')) S.rating = +t.slice(1) / 10;
      });
    };
    const writeHash = () => {
      const t = [...[...S.cats].map(c => 'cat-' + c), S.hood && 'hood-' + S.hood, S.open && 'open', S.verified && 'verified', S.rating && 'r' + S.rating * 10].filter(Boolean);
      history.replaceState(null, '', t.length ? '#' + t.join('~') : location.pathname);
    };
    readHash();
    const counts = id => BK.places.filter(p => p.cat === id).length;
    fill('#fCats', BK.categories.map(c => `<label class="check"><input type="checkbox" value="${c.id}" data-f="cat">${c.name}<small>${BK.fa(counts(c.id))}</small></label>`).join(''));
    fill('#fHood', '<option value="">همه محله‌ها</option>' + BK.hoods.map(h => `<option value="${h.id}">${h.name}</option>`).join(''));
    fill('#fPrice', [1, 2, 3, 4].map(n => `<button type="button" data-price="${n}" aria-pressed="false">${BK.priceNames[n]}</button>`).join(''));
    fill('#fRating', [[0, 'همه'], [4.5, '۴.۵ به بالا'], [4, '۴ به بالا'], [3.5, '۳.۵ به بالا']].map(([v, t]) => `<label class="check"><input type="radio" name="rating" value="${v}">${t}</label>`).join(''));
    const q = $('#sq'); q.value = S.q;
    const syncUI = () => {
      $$('[data-f="cat"]').forEach(i => i.checked = S.cats.has(i.value));
      $('#fHood').value = S.hood; $('#fOpen').checked = S.open; $('#fVerified').checked = S.verified;
      $$('input[name="rating"]').forEach(i => i.checked = +i.value === S.rating);
      $$('#fPrice button').forEach(b => b.setAttribute('aria-pressed', S.prices.has(+b.dataset.price)));
      $('#sort').value = S.sort;
      $$('#view button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === S.view));
    };
    const PER = 9;
    const run = (animate = true) => {
      let list = BK.places.filter(p =>
        (!S.q || hay(p).includes(norm(S.q))) && (!S.cats.size || S.cats.has(p.cat)) && (!S.hood || p.hood === S.hood) &&
        (!S.open || p.open) && (!S.verified || p.verified) && p.rating >= S.rating && (!S.prices.size || S.prices.has(p.price)));
      const sorters = { rec: (a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews), rating: (a, b) => b.rating - a.rating, reviews: (a, b) => b.reviews - a.reviews, cheap: (a, b) => a.price - b.price || b.rating - a.rating };
      list.sort(sorters[S.sort]);
      const pages = Math.max(1, Math.ceil(list.length / PER)); S.page = Math.min(S.page, pages);
      const shown = list.slice((S.page - 1) * PER, S.page * PER);
      $('#count').innerHTML = `<b>${BK.fa(list.length)}</b> مکان پیدا شد`;
      const grid = $('#results');
      grid.classList.toggle('is-list', S.view === 'list');
      grid.innerHTML = shown.map(p => BK.placeCard(p)).join('');
      $('#noRes').hidden = list.length > 0;
      $('#pager').innerHTML = pages > 1 ? `<button data-pg="${S.page - 1}" ${S.page === 1 ? 'disabled' : ''} aria-label="صفحه قبل">${ico('chevron', 'flip')}</button>` + Array.from({ length: pages }, (_, i) => `<button data-pg="${i + 1}" ${i + 1 === S.page ? 'aria-current="true"' : ''}>${BK.fa(i + 1)}</button>`).join('') + `<button data-pg="${S.page + 1}" ${S.page === pages ? 'disabled' : ''} aria-label="صفحه بعد">${ico('chevron')}</button>` : '';
      // active chips
      const chips = [];
      if (S.q) chips.push(['q', `«${BK.esc(S.q)}»`]);
      S.cats.forEach(c => chips.push(['cat-' + c, BK.catById(c).name]));
      if (S.hood) chips.push(['hood', 'محله ' + BK.hoodById(S.hood).name]);
      if (S.rating) chips.push(['rating', 'امتیاز ' + BK.faDec(S.rating) + '+']);
      if (S.open) chips.push(['open', 'باز است']);
      if (S.verified) chips.push(['verified', 'تأییدشده']);
      S.prices.forEach(n => chips.push(['price-' + n, BK.priceNames[n]]));
      $('#chips').innerHTML = chips.map(([k, t]) => `<button class="achip" data-rm="${k}" aria-label="حذف فیلتر ${t}">${t}${ico('x')}</button>`).join('') + (chips.length ? `<button class="achip achip--clear" data-rm="all">پاک کردن همه</button>` : '');
      const head = S.cats.size === 1 ? BK.catById([...S.cats][0]) : null;
      $('#resTitle').textContent = head ? head.name + ' در بیرجند' : S.hood ? 'مکان‌های محله ' + BK.hoodById(S.hood).name : 'همه مکان‌های بیرجند';
      $('#resLead').textContent = head ? head.desc : 'با فیلترها نتیجه را دقیق‌تر کنید؛ امتیازها از نظرات تأییدشده کاربران محاسبه می‌شوند.';
      if (motion && animate) G.from($$('.place', grid), { y: 30, opacity: 0, stagger: .05, duration: .6, ease: 'power3.out', clearProps: 'all' });
      BK.pointerFx(grid);
    };
    const update = () => { S.page = 1; writeHash(); syncUI(); run(); };
    syncUI(); run(false);
    let qt; q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { S.q = q.value.trim(); BK.store.sset('bk-q', S.q); update(); }, 200); });
    $('#sqForm').addEventListener('submit', e => { e.preventDefault(); S.q = q.value.trim(); BK.store.sset('bk-q', S.q); update(); });
    $('#fCats').addEventListener('change', e => { e.target.checked ? S.cats.add(e.target.value) : S.cats.delete(e.target.value); update(); });
    $('#fHood').addEventListener('change', e => { S.hood = e.target.value; update(); });
    $('#fOpen').addEventListener('change', e => { S.open = e.target.checked; update(); });
    $('#fVerified').addEventListener('change', e => { S.verified = e.target.checked; update(); });
    $('#fRating').addEventListener('change', e => { S.rating = +e.target.value; update(); });
    $('#fPrice').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const n = +b.dataset.price; S.prices.has(n) ? S.prices.delete(n) : S.prices.add(n); update(); });
    $('#sort').addEventListener('change', e => { S.sort = e.target.value; run(); });
    $('#view').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.view = b.dataset.view; syncUI(); run(); });
    $('#pager').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; S.page = +b.dataset.pg; run(); $('#resTop').scrollIntoView({ behavior: motion ? 'smooth' : 'auto' }); });
    $('#chips').addEventListener('click', e => {
      const b = e.target.closest('[data-rm]'); if (!b) return; const k = b.dataset.rm;
      if (k === 'all') { S.q = ''; q.value = ''; BK.store.sset('bk-q', ''); S.cats.clear(); S.hood = ''; S.rating = 0; S.open = S.verified = false; S.prices.clear(); }
      else if (k === 'q') { S.q = ''; q.value = ''; BK.store.sset('bk-q', ''); }
      else if (k.startsWith('cat-')) S.cats.delete(k.slice(4));
      else if (k.startsWith('price-')) S.prices.delete(+k.slice(6));
      else if (k === 'hood') S.hood = ''; else if (k === 'rating') S.rating = 0; else if (k === 'open') S.open = false; else if (k === 'verified') S.verified = false;
      update();
    });
    $('#noResClear').addEventListener('click', () => $('#chips [data-rm="all"]')?.click());
    // mobile drawer
    const fp = $('#filters'), openF = () => { fp.classList.add('is-open'); const s = document.createElement('div'); s.className = 'scrim'; s.id = 'scrim'; s.onclick = closeF; document.body.append(s); $('#filtersClose').focus(); }, closeF = () => { fp.classList.remove('is-open'); $('#scrim')?.remove(); $('#filterToggle').focus(); };
    $('#filterToggle').addEventListener('click', openF); $('#filtersClose').addEventListener('click', closeF);
    fp.addEventListener('keydown', e => { if (e.key === 'Escape' && fp.classList.contains('is-open')) closeF(); });
    addEventListener('hashchange', () => { readHash(); syncUI(); run(); });
  };

  /* =========================================================
     CATEGORIES
     ========================================================= */
  R.categories = () => {
    const first = c => BK.places.find(p => p.cat === c.id);
    fill('#catTiles', BK.categories.map(c => `<a class="cat-tile reveal" href="${BK.searchUrl('cat-' + c.id)}">
      <img src="${BK.img(first(c).photos[0])}" alt="" loading="lazy">
      <span class="cat-tile__ico">${ico(c.icon)}</span>
      <h3>${c.name}</h3><p>${c.desc}</p>
      <span class="cat-tile__foot">${BK.fa(c.count)} مکان ثبت‌شده ${ico('arrow')}</span></a>`).join(''));
    fill('#catLists', BK.categories.slice(0, 6).map(c => `<section class="cat-list reveal"><h3>${ico(c.icon)}برترین‌های ${c.name}</h3>
      ${BK.places.filter(p => p.cat === c.id).sort((a, b) => b.rating - a.rating).slice(0, 3).map(BK.miniRow).join('')}
      <a class="link-arrow" href="${BK.searchUrl('cat-' + c.id)}" style="margin-top:10px">همه ${c.name}‌ها ${ico('arrow')}</a></section>`).join(''));
  };

  /* =========================================================
     HOODS
     ========================================================= */
  R.hoods = () => {
    const svg = $('#hoodMap');
    const zones = BK.hoods.map(h => `<g class="zone-g" data-hood="${h.id}" tabindex="0" role="button" aria-label="محله ${h.name}">
        <circle class="zone" cx="${h.x * 5}" cy="${h.y * 4}" r="${28 + h.places / 18}" fill="#A7F3D0" stroke="#fff" stroke-width="3"/>
        <text class="zone-label" x="${h.x * 5}" y="${h.y * 4 + 5}" text-anchor="middle">${h.name}</text></g>`).join('');
    svg.innerHTML = `<rect width="500" height="400" rx="28" fill="#ECFDF5"/>
      <path d="M0 200 C120 190 190 120 300 140 S 450 220 500 210" stroke="#6EE7B7" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M250 0 C240 120 270 240 240 400" stroke="#6EE7B7" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M40 360 C160 330 320 330 470 290" stroke="#D1FAE5" stroke-width="6" fill="none" stroke-dasharray="3 10" stroke-linecap="round"/>${zones}`;
    const show = id => {
      const h = BK.hoodById(id);
      $$('.zone-g').forEach(g => g.querySelector('.zone').classList.toggle('is-on', g.dataset.hood === id));
      const top = BK.places.filter(p => p.hood === id).sort((a, b) => b.rating - a.rating).slice(0, 3);
      fill('#hoodInfo', `<span class="kicker">${h.tag}</span><h3>محله ${h.name}</h3><p>${h.desc}</p>
        ${top.map(BK.miniRow).join('') || '<p>هنوز مکانی در این محله ثبت نشده است.</p>'}
        <a class="btn btn--primary magnetic" href="${BK.searchUrl('hood-' + id)}" style="margin-top:10px">${BK.fa(h.places)} مکان در ${h.name}${ico('arrow')}</a>`);
      if (motion) G.from('#hoodInfo > *', { y: 16, opacity: 0, stagger: .05, duration: .5, ease: 'power3.out' });
      BK.pointerFx($('#hoodInfo'));
    };
    svg.addEventListener('click', e => { const g = e.target.closest('.zone-g'); if (g) show(g.dataset.hood); });
    svg.addEventListener('keydown', e => { const g = e.target.closest('.zone-g'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(g.dataset.hood); } });
    show('modares');
    fill('#hoodCards', BK.hoods.map(h => `<a class="hood-card reveal" href="${BK.searchUrl('hood-' + h.id)}"><img src="${BK.img(h.photo)}" alt="" loading="lazy">
      <span class="tagline">${h.tag}</span><h3>${h.name}</h3><p>${h.desc}</p>
      <div class="hood__foot"><span>${BK.fa(h.places)} مکان</span><span class="hood__go">${ico('arrow')}</span></div></a>`).join(''));
    if (motion) G.from('.zone-g', { scale: 0, transformOrigin: 'center', transformBox: 'fill-box', stagger: .08, duration: .7, ease: 'back.out(2)', delay: .3 });
  };

  /* =========================================================
     PLACE
     ========================================================= */
  R.place = () => {
    const render = () => {
      const tok = BK.hashTokens()[0] || '';
      const id = +(tok.replace('p', '')) || +BK.store.sget('bk-last-place', 1) || 1;
      const p = BK.placeById(id) || BK.places[0], c = BK.catById(p.cat), h = BK.hoodById(p.hood);
      setTitle(p.name);
      fill('#crumbs', crumbs([[c.name, BK.searchUrl('cat-' + c.id)], [p.name]]));
      const extra = BK.places.filter(x => x.cat === p.cat && x.id !== p.id).flatMap(x => x.photos).filter(f => !p.photos.includes(f));
      const ph = [...p.photos, ...new Set(extra)].slice(0, 5);
      if (ph.length < 5) ph.push(...p.photos.slice(0, 5 - ph.length));
      fill('#gallery', ph.map((f, i) => `<button class="cover" data-lb="${i}" aria-label="نمایش عکس ${BK.fa(i + 1)} از ${p.name}"><img src="${BK.img(f)}" alt="${p.name}" ${i ? 'loading="lazy"' : ''}>${i === 4 ? `<span class="pill gallery__more">${ico('camera')} ${BK.fa(ph.length)} عکس</span>` : ''}</button>`).join(''));
      fill('#pTitle', `<div><span class="place__cat">${c.name}</span><h1>${p.name}${p.verified ? `<span title="تأییدشده">${ico('badge')}</span>` : ''}</h1>
        <div class="p-sub">${BK.starsHTML(p.rating)}<b style="color:var(--ink)">${BK.faDec(p.rating)}</b><span>${BK.fa(p.reviews)} نظر</span><a href="${BK.searchUrl('hood-' + h.id)}">${ico('pin')} ${h.name}</a><span class="pill ${p.open ? 'pill--open' : 'pill--closed'}" style="background:var(--tint)">${p.open ? 'اکنون باز است' : 'اکنون بسته است'}</span>${BK.price(p.price)}</div></div>
        <div class="p-actions"><button class="icon-btn" data-copy="${location.href.split('#')[0]}#p${p.id}" data-copy-msg="لینک صفحه کپی شد" aria-label="کپی لینک صفحه">${ico('share')}</button><button class="icon-btn fav ${BK.favs.has(p.id) ? 'is-on' : ''}" data-fav="${p.id}" aria-pressed="${BK.favs.has(p.id)}" aria-label="افزودن به علاقه‌مندی‌ها">${ico('heart')}</button></div>`);
      fill('#pDesc', p.desc);
      fill('#pTags', p.tags.map(t => `<a class="tag" href="search.html" data-q="${t}">${t}</a>`).join(''));
      fill('#pServices', p.services.map(([n, v]) => `<li><span>${n}</span><i></i><span>${v}</span></li>`).join(''));
      const w = [1, 2, 3, 4, 5].map(k => Math.exp(-((k - p.rating) ** 2) * 1.1)), sum = w.reduce((a, b) => a + b, 0), dist = w.map(x => Math.round(x / sum * 100)).reverse();
      fill('#pSummary', `<div class="summary__score"><b>${BK.faDec(p.rating)}</b>${BK.starsHTML(p.rating)}<small>بر اساس ${BK.fa(p.reviews)} نظر</small></div>
        <div class="bars">${dist.map((d, i) => `<div class="bar"><span>${BK.fa(5 - i)} ستاره</span><span class="bar__track"><i style="--w:${d}"></i></span><span>${BK.fa(d)}٪</span></div>`).join('')}</div>`);
      const generic = [
        { name: 'سارا ت.', rating: 5, text: `تجربه خیلی خوبی از ${p.name} داشتم. برخورد محترمانه و فضای تمیز؛ حتماً دوباره میام.`, ago: '۳ روز پیش' },
        { name: 'محمد ج.', rating: 4, text: 'کیفیت خوب بود و قیمت‌ها منصفانه. فقط ساعت‌های شلوغ کمی باید منتظر بمونید.', ago: 'هفته پیش' },
        { name: 'الهام ف.', rating: 5, text: 'به دوستانی که از شهرهای دیگه میان بیرجند همیشه اینجا رو پیشنهاد می‌دم.', ago: '۲ هفته پیش' }];
      const list = [...BK.myReviews().filter(r => r.pid === p.id), ...BK.reviews.filter(r => r.pid === p.id), ...generic.map(g => ({ ...g, pid: p.id }))].slice(0, 6);
      fill('#pReviews', list.map((r, i) => BK.reviewCard(r, false).replace('</article>',
        `${i === 0 && r.ago !== 'همین حالا' ? `<div class="rv__reply"><b>پاسخ مدیریت ${p.name}</b>ممنون از لطفتون؛ خوشحالیم که تجربه خوبی داشتید.</div>` : ''}
         <div class="rv__foot"><button data-helpful aria-pressed="false">${ico('thumb')} مفید بود (<span>${BK.fa(Math.max(0, 12 - i * 2))}</span>)</button><button data-report>${ico('flag')} گزارش</button></div></article>`)).join(''));
      $('#pReviewBtn').dataset.openReview = p.id;
      const mapQ = encodeURIComponent(`${p.name} بیرجند`);
      fill('#pInfo', `<div class="mini-map"><svg viewBox="0 0 360 180" aria-hidden="true"><rect width="360" height="180" fill="#ECFDF5"/><path d="M0 120 C100 110 160 60 360 70" stroke="#6EE7B7" stroke-width="10" fill="none"/><path d="M140 0 C150 60 130 120 150 180" stroke="#A7F3D0" stroke-width="8" fill="none"/><g transform="translate(180 82)"><circle r="22" class="pulse"/><path d="M0 12s-12-9-12-18a12 12 0 0 1 24 0c0 9-12 18-12 18Z" fill="#059669" stroke="#fff" stroke-width="2"/><circle cy="-6" r="4" fill="#fff"/></g></svg></div>
        <ul class="info-list">
          <li>${ico('pin')}<div><small>آدرس</small>بیرجند، ${p.address}</div></li>
          <li>${ico('clock')}<div><small>ساعت کاری</small>${p.hours}</div></li>
          <li>${ico('phone')}<div><small>تلفن (نمونه)</small><span class="copy-row"><span dir="ltr">${p.phone}</span>${p.phone !== '—' ? `<button class="copy-btn" data-copy="${BK.toEn(p.phone)}" data-copy-msg="شماره کپی شد">کپی</button>` : ''}</span></div></li>
        </ul>
        <div style="height:18px"></div>
        <a href="https://www.google.com/maps/search/?api=1&query=${mapQ}" target="_blank" rel="noopener" class="btn btn--primary btn--block magnetic">${ico('navigation')}مسیریابی در نقشه${ico('external')}</a>
        <button class="btn btn--ghost btn--block" data-copy="${p.address}" data-copy-msg="آدرس کپی شد">${ico('copy')}کپی آدرس</button>`);
      const sim = BK.places.filter(x => x.id !== p.id && (x.cat === p.cat || x.hood === p.hood)).sort((a, b) => (b.cat === p.cat) - (a.cat === p.cat) || b.rating - a.rating).slice(0, 4);
      fill('#pSimilar', sim.map(BK.miniRow).join(''));
      $('#lightbox').dataset.photos = JSON.stringify(ph);
      if (motion) {
        G.from('#gallery .cover', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, stagger: .1, ease: 'expo.out' });
        G.from('#pTitle > *, #pDesc, #pTags .tag', { y: 30, stagger: .06, duration: .8, delay: .2, ease: 'power3.out' });
        if (ST) G.from('.bar__track i', { scrollTrigger: { trigger: '#pSummary', start: 'top 85%' }, scaleX: 0, stagger: .08, duration: 1.1, ease: 'power3.out' });
      }
      BK.hydrateIcons(); BK.pointerFx(document);
    };
    render();
    addEventListener('hashchange', () => { render(); scrollTo({ top: 0, behavior: 'auto' }); });
    // tag → search
    document.addEventListener('click', e => { const t = e.target.closest('#pTags [data-q]'); if (t) BK.store.sset('bk-q', t.dataset.q); });
    // helpful / report
    $('#pReviews').addEventListener('click', e => {
      const h = e.target.closest('[data-helpful]');
      if (h) { const on = h.getAttribute('aria-pressed') !== 'true', n = h.querySelector('span'); n.textContent = BK.fa(+BK.toEn(n.textContent) + (on ? 1 : -1)); h.setAttribute('aria-pressed', on); h.classList.toggle('is-on', on); if (motion) G.fromTo(h, { scale: .85 }, { scale: 1, duration: .5, ease: 'back.out(3)' }); }
      const r = e.target.closest('[data-report]');
      if (r && !r.disabled) { r.disabled = true; r.lastChild.textContent = ' گزارش شد'; BK.toast('گزارش شما ثبت شد و تیم محتوا بررسی می‌کند.'); }
    });
    document.addEventListener('bk:review', ev => { if (ev.detail.pid === BK.placeById(+(BK.hashTokens()[0] || 'p1').slice(1))?.id || true) { const box = $('#pReviews'); box.insertAdjacentHTML('afterbegin', BK.reviewCard(ev.detail, false)); popIn(box.firstElementChild); } });
    // lightbox
    const lb = $('#lightbox'), img = $('#lbImg'); let idx = 0, lastF;
    const photos = () => JSON.parse(lb.dataset.photos || '[]');
    const showImg = i => { const ps = photos(); idx = (i + ps.length) % ps.length; img.src = BK.img(ps[idx]); $('#lbCount').textContent = `${BK.fa(idx + 1)} از ${BK.fa(ps.length)}`; if (motion) G.fromTo(img, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .4 }); };
    $('#gallery').addEventListener('click', e => { const b = e.target.closest('[data-lb]'); if (!b) return; lastF = b; lb.hidden = false; document.body.style.overflow = 'hidden'; showImg(+b.dataset.lb % photos().length); $('#lbClose').focus(); });
    const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; lastF?.focus(); };
    $('#lbClose').addEventListener('click', closeLb);
    $('#lbPrev').addEventListener('click', () => showImg(idx - 1));
    $('#lbNext').addEventListener('click', () => showImg(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    lb.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') showImg(idx + 1); if (e.key === 'ArrowRight') showImg(idx - 1); });
  };

  /* =========================================================
     BLOG & ARTICLE
     ========================================================= */
  function postCard(a) {
    return `<article class="post reveal"><div class="post__img"><img src="${BK.img(a.photo)}" alt="" loading="lazy"></div>
      <div class="post__body"><div class="post__meta"><span class="badge">${a.cat}</span><span>${a.date}</span><span>${BK.fa(a.read)} دقیقه مطالعه</span></div>
      <h3><a class="stretch" href="${BK.articleUrl(a.id)}">${a.title}</a></h3><p>${a.lead}</p></div></article>`;
  }
  R.blog = () => {
    const [f, ...rest] = BK.articles;
    fill('#feature', `<div class="post__img"><img src="${BK.img(f.photo)}" alt=""></div><div class="post__body"><div class="post__meta"><span class="badge">${f.cat}</span><span>${f.date}</span><span>${BK.fa(f.read)} دقیقه مطالعه</span></div><h2><a class="stretch" href="${BK.articleUrl(f.id)}">${f.title}</a></h2><p class="muted">${f.lead}</p><span class="link-arrow">ادامه مطلب ${ico('arrow')}</span></div>`);
    const cats = ['همه', ...new Set(BK.articles.map(a => a.cat))];
    fill('#postFilter', cats.map((c, i) => `<button type="button" aria-pressed="${i === 0}" data-c="${c}">${c}</button>`).join(''));
    const draw = c => { fill('#posts', (c === 'همه' ? rest : BK.articles.filter(a => a.cat === c)).map(postCard).join('')); if (motion) G.from('#posts .post', { y: 30, opacity: 0, stagger: .06, duration: .6, clearProps: 'all' }); BK.pointerFx($('#posts')); };
    draw('همه');
    $('#postFilter').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#postFilter button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(b.dataset.c); });
  };
  R.article = () => {
    const render = () => {
      const a = BK.articles.find(x => x.id === BK.hashTokens()[0]) || BK.articles[0];
      setTitle(a.title);
      fill('#aHero', `${crumbs([['مجله', 'blog.html'], [a.cat]])}<h1>${a.title}</h1><div class="post__meta hero-anim" style="color:var(--g-200);margin-top:14px"><span class="badge">${a.cat}</span><span>${a.date}</span><span>${BK.fa(a.read)} دقیقه مطالعه</span><span>نویسنده: ${a.author}</span></div>`);
      fill('#aBody', `<div class="article-cover"><img src="${BK.img(a.photo)}" alt=""></div><p class="lead">${a.lead}</p>` +
        a.body.map(([t, x]) => t === 'h' ? `<h2>${x}</h2>` : t === 'tip' ? `<div class="tip">${ico('info')}<div>${x}</div></div>` : `<p>${x}</p>`).join('') +
        `<div class="share-row"><b>این مطلب را به اشتراک بگذارید:</b><button class="btn btn--ghost btn--sm" data-copy="${location.href}" data-copy-msg="لینک مطلب کپی شد">${ico('copy')}کپی لینک</button></div>`);
      fill('#aAuthor', `<h3>نویسنده</h3><div class="author">${BK.avatar(a.author)}<div><b>${a.author}</b><small>عضو تحریریه مجله</small></div></div>`);
      fill('#aMore', `<h3>مطالب دیگر</h3>${BK.articles.filter(x => x.id !== a.id).slice(0, 3).map(x => `<a class="mini-row" href="${BK.articleUrl(x.id)}"><img src="${BK.img(x.photo)}" alt="" loading="lazy"><div><b style="font-size:14px">${x.title}</b><small>${x.cat}</small></div></a>`).join('')}`);
      fill('#aRelated', BK.places.filter(p => a.body.some(([, x]) => x.includes(p.name))).slice(0, 3).map(BK.miniRow).join('') || BK.places.slice(0, 3).map(BK.miniRow).join(''));
      if (motion) G.from('#aBody > *', { y: 24, opacity: 0, stagger: .05, duration: .7, ease: 'power3.out', clearProps: 'all' });
    };
    render(); addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
  };

  /* =========================================================
     BUSINESS
     ========================================================= */
  R.business = () => {
    const plans = [
      { n: 'پایه', d: 'برای شروع و دیده‌شدن', m: 0, y: 0, f: [['صفحه اختصاصی کسب‌وکار', 1], ['دریافت و پاسخ به نظرات', 1], ['۵ عکس در گالری', 1], ['گزارش ماهانه بازدید', 0], ['نشان ویژه در نتایج', 0], ['پشتیبانی اختصاصی', 0]] },
      { n: 'حرفه‌ای', d: 'محبوب‌ترین انتخاب کسب‌وکارها', m: 490000, y: 4900000, pop: 1, f: [['همه امکانات پایه', 1], ['گالری نامحدود و منوی خدمات', 1], ['گزارش هفتگی بازدید و تماس', 1], ['نشان ویژه در نتایج جستجو', 1], ['معرفی در مجله', 0], ['پشتیبانی اختصاصی', 0]] },
      { n: 'ویژه', d: 'برای برندها و مجموعه‌ها', m: 1290000, y: 12900000, f: [['همه امکانات حرفه‌ای', 1], ['معرفی در مجله و خبرنامه', 1], ['چند شعبه در یک حساب', 1], ['تبلیغ در صفحه اصلی', 1], ['پشتیبانی اختصاصی', 1], ['گزارش رقبا در محله', 1]] }];
    let yearly = false;
    const drawPlans = () => fill('#plans', plans.map(p => `<div class="plan ${p.pop ? 'plan--pop' : ''} reveal">${p.pop ? '<span class="plan__badge">پیشنهاد ما</span>' : ''}
      <h3>${p.n}</h3><p>${p.d}</p>
      <div class="plan__price"><b>${p.m ? BK.fa(yearly ? p.y : p.m) : 'رایگان'}</b><span>${p.m ? (yearly ? 'تومان در سال' : 'تومان در ماه') : 'برای همیشه'}</span></div>
      <ul>${p.f.map(([t, on]) => `<li class="${on ? '' : 'off'}">${ico(on ? 'checkCircle' : 'xCircle')}${t}</li>`).join('')}</ul>
      <a href="#register" class="btn ${p.pop ? 'btn--primary' : 'btn--ghost'} btn--block" data-plan="${p.n}">${p.m ? 'انتخاب بسته ' + p.n : 'شروع رایگان'}</a></div>`).join(''));
    drawPlans();
    $('#billing').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; yearly = b.dataset.b === 'y'; $$('#billing button').forEach(x => x.setAttribute('aria-pressed', x === b)); drawPlans(); if (motion) G.from('.plan__price b', { y: -14, opacity: 0, stagger: .08, duration: .4 }); });
    document.addEventListener('click', e => { const b = e.target.closest('[data-plan]'); if (b) { $('#rPlan').value = b.dataset.plan; } });
    fill('#faq', BK.faq.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}${ico('chevron')}</summary><div class="faq__a">${a}</div></details>`).join(''));
    $('#rCat').innerHTML = '<option value="">انتخاب کنید</option>' + BK.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    $('#rHood').innerHTML = '<option value="">انتخاب کنید</option>' + BK.hoods.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    $('#cPlace').innerHTML = '<option value="">کسب‌وکار خود را انتخاب کنید</option>' + BK.places.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    // multi-step register
    let step = 0;
    const steps = $$('#regForm .rstep'), marks = $$('#stepper li');
    const go = n => {
      step = n; steps.forEach((s, i) => s.hidden = i !== n);
      marks.forEach((m, i) => { m.classList.toggle('is-on', i === n); m.classList.toggle('is-done', i < n); });
      $('#rBack').hidden = n === 0; $('#rNext').hidden = n === steps.length - 1; $('#rSubmit').hidden = n !== steps.length - 1;
      if (n === steps.length - 1) {
        const v = id => $(id).value.trim(), o = id => $(id).selectedOptions[0]?.textContent;
        fill('#rReview', `<ul class="services"><li><span>نام کسب‌وکار</span><i></i><span>${BK.esc(v('#rName'))}</span></li><li><span>دسته</span><i></i><span>${o('#rCat')}</span></li><li><span>محله</span><i></i><span>${o('#rHood')}</span></li><li><span>موبایل</span><i></i><span dir="ltr">${BK.esc(v('#rMobile'))}</span></li><li><span>بسته</span><i></i><span>${v('#rPlan')}</span></li></ul>`);
      }
      if (motion) G.from(steps[n], { x: -30, opacity: 0, duration: .5, ease: 'power3.out' });
    };
    $('#rNext').addEventListener('click', () => { if (validate(steps[step])) go(step + 1); });
    $('#rBack').addEventListener('click', () => go(step - 1));
    $('#regForm').addEventListener('submit', e => {
      e.preventDefault(); if (!validate(steps[step])) return;
      if (!$('#rAgree').checked) { BK.toast('برای ثبت، پذیرش قوانین لازم است.'); $('#rAgree').focus(); return; }
      const card = $('#regCard'); card.innerHTML = successHTML('درخواست ثبت شد', 'کارشناسان ما حداکثر تا ۲۴ ساعت کاری برای تکمیل اطلاعات و احراز مالکیت با شما تماس می‌گیرند.', '<a class="btn btn--primary" href="dashboard.html">مشاهده نمونه داشبورد</a>'); BK.hydrateIcons(card); popIn(card.firstElementChild);
    });
    go(0);
    $('#claimForm').addEventListener('submit', e => {
      e.preventDefault(); if (!validate(e.target)) return;
      const p = BK.placeById($('#cPlace').value);
      const card = $('#claimCard'); card.innerHTML = successHTML('درخواست احراز ثبت شد', `مدارک مالکیت «${p.name}» بررسی می‌شود و نتیجه از طریق پیامک اطلاع داده می‌شود.`); popIn(card.firstElementChild);
    });
    $('#cFile').addEventListener('change', e => { const f = e.target.files[0]; $('#cFileName').textContent = f ? `فایل انتخاب‌شده: ${f.name}` : 'تصویر جواز کسب یا مدارک ثبتی (JPG یا PDF)'; });
    if (location.hash) setTimeout(() => $(location.hash)?.scrollIntoView(), 300);
  };

  /* =========================================================
     DASHBOARD (demo)
     ========================================================= */
  R.dashboard = () => {
    const p = BK.placeById(8);
    fill('#dBiz', `<img src="${BK.img(p.photos[0])}" alt=""><div><b>${p.name}</b><small>بسته حرفه‌ای · تأییدشده</small></div>`);
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    const views = [420, 510, 468, 602, 655, 810, 760], calls = [38, 44, 40, 52, 49, 71, 66];
    const W = 640, H = 240, pad = { l: 40, r: 16, t: 16, b: 32 }, max = 900;
    const x = i => W - pad.r - i * ((W - pad.l - pad.r) / 6), y = v => pad.t + (1 - v / max) * (H - pad.t - pad.b);
    const path = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const ticks = [0, 300, 600, 900];
    $('#chart').innerHTML = `<defs><linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10B981" stop-opacity=".25"/><stop offset="1" stop-color="#10B981" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map(t => `<line class="grid-l" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end">${BK.fa(t)}</text>`).join('')}
      ${days.map((d, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${d}</text>`).join('')}
      <path class="ar" d="${path(views)} L${x(6)} ${y(0)} L${x(0)} ${y(0)}Z"/>
      <path class="ln" d="${path(views)}"/><path class="ln2" d="${path(calls.map(c => c * 6))}"/>
      ${views.map((v, i) => `<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="${i === 5 ? 6 : 4}"><title>${days[i]}: ${BK.fa(v)} بازدید</title></circle>`).join('')}
      <text x="${x(5)}" y="${y(views[5]) - 12}" text-anchor="middle" style="fill:var(--g-800);font-weight:800">${BK.fa(views[5])}</text>`;
    const pending = [...BK.myReviews().filter(r => r.pid === p.id), { name: 'نگار م.', pid: 8, rating: 4, text: 'دمنوش عناب رو حتماً امتحان کنید. فقط آخر هفته شلوغه.', ago: 'دیروز' }, { name: 'حمید ص.', pid: 8, rating: 3, text: 'قهوه خوب بود ولی سفارش ما حدود بیست دقیقه طول کشید تا آماده بشه.', ago: '۲ روز پیش' }];
    fill('#inbox', pending.map((r, i) => BK.reviewCard(r, false).replace('</article>', `<form class="reply-box" data-i="${i}"><label class="sr-only" for="rep${i}">پاسخ به ${BK.esc(r.name)}</label><textarea class="textarea" id="rep${i}" placeholder="پاسخ رسمی شما به این نظر…" required minlength="5"></textarea><div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><span class="status-pill">در انتظار پاسخ</span><button class="btn btn--primary btn--sm">ارسال پاسخ</button></div></form></article>`)).join(''));
    $('#inbox').addEventListener('submit', e => {
      e.preventDefault(); const f = e.target, t = f.querySelector('textarea');
      if (t.value.trim().length < 5) { t.setAttribute('aria-invalid', 'true'); t.focus(); BK.toast('متن پاسخ را کامل‌تر بنویسید.'); return; }
      f.outerHTML = `<div class="rv__reply"><b>پاسخ شما</b>${BK.esc(t.value.trim())}</div>`; BK.toast('پاسخ شما منتشر شد.');
      const n = $('#dCount'); n.textContent = BK.fa(Math.max(0, +BK.toEn(n.textContent) - 1));
    });
    fill('#dTable', [['۱ مهر', 'نمایش در جستجو', '۱٬۲۴۰'], ['۱ مهر', 'بازدید صفحه', '۶۵۵'], ['۱ مهر', 'تماس تلفنی', '۴۹'], ['۱ مهر', 'مسیریابی', '۸۲'], ['۳۱ شهریور', 'بازدید صفحه', '۶۰۲']].map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join(''));
    $('#dTabs').addEventListener('click', e => {
      const b = e.target.closest('button[role="tab"]'); if (!b) return;
      $$('#dTabs button').forEach(x => x.setAttribute('aria-selected', x === b));
      $$('.dpanel').forEach(pn => pn.hidden = pn.id !== b.getAttribute('aria-controls'));
      if (motion) G.from('#' + b.getAttribute('aria-controls') + ' > *', { y: 20, opacity: 0, stagger: .05, duration: .5, clearProps: 'all' });
    });
    $('#dProfile').addEventListener('submit', e => { e.preventDefault(); if (validate(e.target)) BK.toast('اطلاعات کسب‌وکار ذخیره شد.'); });
    if (motion) {
      G.from('.kpi', { y: 30, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', clearProps: 'all' });
      G.fromTo('#chart .ln, #chart .ln2', { strokeDasharray: 1400, strokeDashoffset: 1400 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', delay: .3, onComplete() { $('#chart .ln2').style.strokeDasharray = '5 5'; $('#chart .ln').style.strokeDasharray = 'none'; } });
      G.from('#chart .dot', { scale: 0, transformOrigin: 'center', transformBox: 'fill-box', stagger: .08, duration: .5, delay: 1.2, ease: 'back.out(3)' });
      G.from('#ring', { strokeDashoffset: 264, duration: 1.6, ease: 'power3.out', delay: .4 });
    }
  };

  /* =========================================================
     AUTH
     ========================================================= */
  R.login = () => {
    if (BK.user()) { fill('#authBox', `<h1>شما وارد شده‌اید</h1><p class="muted">به حساب ${BK.esc(BK.user().name)} وارد شده‌اید.</p><a class="btn btn--primary" href="profile.html">رفتن به پروفایل</a>`); return; }
    const s1 = $('#step1'), s2 = $('#step2'), s3 = $('#step3');
    let mobile = '';
    s1.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(s1)) return;
      mobile = BK.toEn($('#mobile').value).replace(/[\s-]/g, '');
      $('#sentTo').textContent = BK.fa(mobile).replace(/٬/g, '');
      s1.hidden = true; s2.hidden = false; $$('.otp input')[0].focus();
      if (motion) G.from(s2, { x: -30, opacity: 0, duration: .5 });
    });
    const boxes = $$('.otp input');
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = BK.toEn(b.value).replace(/\D/g, '').slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); if (boxes.every(x => x.value)) s2.requestSubmit(); });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener('paste', e => { const t = BK.toEn(e.clipboardData.getData('text')).replace(/\D/g, ''); if (t.length >= 5) { e.preventDefault(); boxes.forEach((x, j) => x.value = t[j] || ''); s2.requestSubmit(); } });
    });
    s2.addEventListener('submit', e => {
      e.preventDefault();
      const code = boxes.map(b => b.value).join('');
      if (code !== '12345') { $('#otpErr').hidden = false; if (motion) G.fromTo('.otp', { x: -10 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' }); boxes.forEach(b => b.value = ''); boxes[0].focus(); return; }
      $('#otpErr').hidden = true; s2.hidden = true; s3.hidden = false; $('#fullName').focus();
    });
    $('#editMobile').addEventListener('click', () => { s2.hidden = true; s1.hidden = false; $('#mobile').focus(); });
    s3.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(s3)) return;
      BK.store.set('bk-user', { name: $('#fullName').value.trim(), mobile, since: Date.now() });
      BK.toast('خوش آمدید!'); setTimeout(() => location.href = 'profile.html', 600);
    });
  };

  /* =========================================================
     PROFILE
     ========================================================= */
  R.profile = () => {
    const u = BK.user();
    if (!u) {
      fill('#pHead', `<div><h1>پروفایل من</h1><p>برای ذخیره علاقه‌مندی‌ها در این مرورگر و ثبت نظر با نام خودتان وارد شوید.</p><a class="btn btn--lime hero-anim" href="login.html" style="margin-top:16px">${ico('user')}ورود یا ثبت‌نام</a></div>`);
    } else {
      fill('#pHead', `<div class="profile-head"><div class="big-av">${BK.esc(u.name[0])}</div><div><h1>${BK.esc(u.name)}</h1><div class="profile-stats"><span><b>${BK.fa(BK.favs.size)}</b>علاقه‌مندی</span><span><b>${BK.fa(BK.myReviews().length)}</b>نظر</span><span dir="ltr">${BK.fa(u.mobile).replace(/٬/g, '')}</span></div></div></div>`);
    }
    const panels = {
      favs: () => { const ps = [...BK.favs].map(BK.placeById).filter(Boolean);
        return ps.length ? `<div class="place-grid results-3">${ps.map(p => BK.placeCard(p)).join('')}</div>` : `<div class="empty-state">${ico('heart')}<h3>هنوز علاقه‌مندی ندارید</h3><p>روی قلب هر مکان بزنید تا اینجا ذخیره شود.</p><a class="btn btn--primary" href="search.html">کاوش مکان‌ها</a></div>`; },
      reviews: () => { const rs = BK.myReviews();
        return rs.length ? `<div class="p-reviews">${rs.map(r => BK.reviewCard(r)).join('')}</div>` : `<div class="empty-state">${ico('message')}<h3>هنوز نظری ننوشته‌اید</h3><p>تجربه‌تان از یک کافه، رستوران یا پزشک را بنویسید.</p><button class="btn btn--primary" data-open-review>${ico('plus')}نوشتن اولین نظر</button></div>`; },
      settings: () => u ? `<form class="form-card" id="setForm" novalidate style="max-width:560px"><h2>تنظیمات حساب</h2><p>این اطلاعات فقط در همین مرورگر ذخیره می‌شود.</p>
        <div class="form-grid"><div class="f full"><label for="sName">نام و نام خانوادگی</label><input class="input" id="sName" required value="${BK.esc(u.name)}"></div>
        <label class="switch full">خبرنامه هفتگی<input type="checkbox" checked></label></div>
        <div class="form-actions"><button class="btn btn--primary">ذخیره تغییرات</button><button type="button" class="btn btn--ghost" id="logout">${ico('logout')}خروج از حساب</button></div></form>`
        : `<div class="empty-state">${ico('lock')}<h3>برای تنظیمات وارد شوید</h3><p>ورود با شماره موبایل کمتر از یک دقیقه طول می‌کشد.</p><a class="btn btn--primary" href="login.html">ورود</a></div>`
    };
    const show = k => {
      $$('#ptabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === k));
      fill('#ptab', panels[k]()); BK.hydrateIcons($('#ptab'));
      history.replaceState(null, '', '#' + k);
      if (motion) G.from('#ptab > * , #ptab .place', { y: 24, opacity: 0, stagger: .05, duration: .5, clearProps: 'all' });
      BK.pointerFx($('#ptab'));
      $('#setForm')?.addEventListener('submit', e => { e.preventDefault(); if (!validate(e.target)) return; BK.store.set('bk-user', { ...u, name: $('#sName').value.trim() }); BK.toast('تغییرات ذخیره شد'); setTimeout(() => location.reload(), 500); });
      $('#logout')?.addEventListener('click', () => { BK.store.set('bk-user', null); BK.toast('از حساب خارج شدید'); setTimeout(() => location.href = 'index.html', 500); });
    };
    $('#ptabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.t); });
    show(['favs', 'reviews', 'settings'].includes(BK.hashTokens()[0]) ? BK.hashTokens()[0] : 'favs');
    document.addEventListener('bk:favs', () => { if ($('#ptabs [aria-selected="true"]').dataset.t === 'favs') setTimeout(() => show('favs'), 400); });
    document.addEventListener('bk:review', () => show('reviews'));
  };

  /* =========================================================
     ABOUT / CONTACT / LEGAL / CAREERS
     ========================================================= */
  R.about = () => {
    fill('#team', BK.team.map(t => `<div class="member reveal"><div class="member__img"><img src="${BK.img(t.photo)}" alt="${t.name}" loading="lazy"></div><b>${t.name}</b><small>${t.role}</small></div>`).join(''));
  };
  R.contact = () => {
    $('#contactForm').addEventListener('submit', e => {
      e.preventDefault(); if (!validate(e.target)) return;
      const card = $('#contactCard'); card.innerHTML = successHTML('پیام شما ثبت شد', 'پیامتان در صف پاسخ‌گویی قرار گرفت. معمولاً ظرف یک روز کاری پاسخ می‌دهیم.', '<a class="btn btn--ghost" href="index.html">بازگشت به خانه</a>'); popIn(card.firstElementChild);
    });
    fill('#cFaq', BK.faq.slice(0, 3).map(([q, a]) => `<details><summary>${q}${ico('chevron')}</summary><div class="faq__a">${a}</div></details>`).join(''));
  };
  R.legal = () => {
    const links = $$('.toc a'), secs = links.map(a => $(a.getAttribute('href')));
    if (!ST) return;
    secs.forEach((s, i) => s && ST.create({ trigger: s, start: 'top 40%', end: 'bottom 40%', onToggle: st => st.isActive && links.forEach((l, j) => l.classList.toggle('is-on', j === i)) }));
  };
  R.rules = R.legal; R.privacy = R.legal;
  R.careers = () => {
    fill('#jobs', BK.jobs.map((j, i) => `<details class="job reveal" ${i === 0 ? 'open' : ''}><summary><b>${j.title}</b><span class="job__meta"><span>${j.type}</span><span>${j.place}</span></span>${ico('chevron')}</summary>
      <div class="faq__a"><p>${j.desc}</p><ul>${j.req.map(r => `<li>${r}</li>`).join('')}</ul><a href="#apply" class="btn btn--primary btn--sm" data-job="${j.title}" style="margin-top:12px">درخواست برای این موقعیت</a></div></details>`).join(''));
    $('#aJob').innerHTML = BK.jobs.map(j => `<option>${j.title}</option>`).join('');
    document.addEventListener('click', e => { const b = e.target.closest('[data-job]'); if (b) $('#aJob').value = b.dataset.job; });
    $('#aFile').addEventListener('change', e => { const f = e.target.files[0]; $('#aFileName').textContent = f ? `فایل انتخاب‌شده: ${f.name}` : 'فایل PDF رزومه (اختیاری)'; });
    $('#applyForm').addEventListener('submit', e => {
      e.preventDefault(); if (!validate(e.target)) return;
      const card = $('#applyCard'); card.innerHTML = successHTML('درخواست شما ثبت شد', 'رزومه شما را بررسی می‌کنیم و در صورت هم‌خوانی برای مصاحبه تماس می‌گیریم.'); popIn(card.firstElementChild);
    });
  };

  (R[page] || (() => {}))();
  BK.boot();
  if (page === 'home') R.homeMotion();
})();
