/* در بیرجند کجا؟ — interactions & motion */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap;
  const motion = !!G && !reduced;
  if (motion) {
    root.classList.add('anim');
    if (window.ScrollTrigger) G.registerPlugin(ScrollTrigger);
    if (window.Flip) G.registerPlugin(Flip);
  } else {
    root.classList.add('no-gsap');
  }

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- helpers ---------- */
  const starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/></svg>';
  const starsHTML = (r, cls = '') => {
    let s = `<div class="stars ${cls}" role="img" aria-label="امتیاز ${BK.faDec(r)} از ۵"${r < 3 ? ' data-level="low"' : r < 4 ? ' data-level="mid"' : ''}>`;
    for (let i = 1; i <= 5; i++) s += `<span class="s" style="--fill:${Math.max(0, Math.min(1, r - i + 1))}">${starSvg}</span>`;
    return s + '</div>';
  };
  const hydrateIcons = (scope = document) => $$('[data-ico]', scope).forEach(el => { el.innerHTML = ico(el.dataset.ico); el.removeAttribute('data-ico'); });
  const hydrateStars = (scope = document) => $$('.stars[data-rating]', scope).forEach(el => {
    const tmp = document.createElement('div');
    tmp.innerHTML = starsHTML(+el.dataset.rating, el.className.replace('stars', '').trim());
    el.replaceWith(tmp.firstElementChild);
  });
  const priceNames = ['', 'اقتصادی', 'متوسط', 'بالا', 'لوکس'];
  const price = n => `<span class="price" title="سطح قیمت: ${priceNames[n]}" aria-label="سطح قیمت: ${priceNames[n]}">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}<small>${priceNames[n]}</small></span>`;
  const favs = new Set(store.get('bk-favs', []));

  const placeCard = p => {
    const c = BK.catById(p.cat);
    return `<article class="place" data-cat="${p.cat}" data-id="${p.id}">
      <div class="cover" style="--h:${c.hue}">
        <div class="cover__tags">
          <span class="pill ${p.open ? 'pill--open' : 'pill--closed'}">${p.open ? 'باز است' : 'بسته است'}</span>
          <button class="fav ${favs.has(p.id) ? 'is-on' : ''}" aria-pressed="${favs.has(p.id)}" aria-label="افزودن ${p.name} به علاقه‌مندی‌ها" data-fav="${p.id}">${ico('heart')}</button>
        </div>
        ${ico(c.icon)}
      </div>
      <div class="place__body">
        <span class="place__cat">${c.name}</span>
        <h3 class="place__name">${p.name}${p.verified ? `<span title="تأییدشده">${ico('badge')}</span>` : ''}</h3>
        <div class="place__rate">${starsHTML(p.rating, 'stars--sm')}<b>${BK.faDec(p.rating)}</b><span>(${BK.fa(p.reviews)} نظر)</span></div>
        <div class="place__meta"><span>${ico('pin')} ${p.hood}</span>${price(p.price)}</div>
      </div>
      <a class="place__link" href="place.html?id=${p.id}" aria-label="مشاهده ${p.name}"></a>
    </article>`;
  };

  const reviewCard = r => {
    const hue = (r.name.charCodeAt(0) * 37) % 360;
    return `<article class="rv">
      <div class="rv__head"><div class="fc-avatar" style="--h:${hue}">${r.name[0]}</div><div><b>${r.name}</b><small>${r.ago}</small></div><span class="rv__verified">${ico('badge')} تأییدشده</span></div>
      ${starsHTML(r.rating, 'stars--sm')}
      <p class="rv__text">${r.text}</p>
      <span class="rv__place">${ico('pin')} ${r.place}</span>
    </article>`;
  };

  /* ---------- toast ---------- */
  let toastT;
  const toast = msg => {
    const t = $('#toast'); if (!t) return;
    t.innerHTML = ico('check') + '<span></span>'; t.lastChild.textContent = msg;
    t.classList.add('is-on'); clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('is-on'), 3200);
  };

  /* =========================================================
     Home page rendering
     ========================================================= */
  const catGrid = $('#catGrid');
  if (catGrid) {
    catGrid.innerHTML = BK.categories.map(c => `<a href="#places" class="cat reveal" style="--h:${c.hue}" data-tab-link="${c.id}"><span class="cat__ico">${ico(c.icon)}</span><b>${c.name}</b><small>${BK.fa(c.count)} مکان</small></a>`).join('');

    const mq = $('#marquee');
    const items = BK.categories.map(c => `<span>${ico(c.icon)}${c.name}</span><span>${ico('sparkles')}</span>`).join('');
    mq.innerHTML = items + items;

    $('#hood').innerHTML += BK.hoods.map(h => `<option>${h.name}</option>`).join('');

    // tabs
    const tabDefs = [{ id: 'all', name: 'همه' }, ...['food', 'cafe', 'sight', 'souvenir', 'health', 'hotel'].map(BK.catById)];
    const tabs = $('#tabs');
    tabs.insertAdjacentHTML('beforeend', tabDefs.map((t, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-tab="${t.id}">${t.name}</button>`).join(''));

    $('#placeGrid').innerHTML = BK.places.map(placeCard).join('');

    $('#hoodTrack').innerHTML = BK.hoods.map((h, i) => `<a href="#places" class="hood" style="--h:${150 + i * 12}" data-hood="${h.name}">
      <svg class="hood__art" viewBox="0 0 330 400" aria-hidden="true"><circle cx="${260 - i * 14}" cy="${90 + i * 8}" r="90" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/><circle cx="${260 - i * 14}" cy="${90 + i * 8}" r="140" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/><circle cx="${260 - i * 14}" cy="${90 + i * 8}" r="6" fill="#A3E635"/></svg>
      <span class="hood__num">${BK.fa(i + 1).padStart(2, '۰')}</span>
      <h3>${h.name}</h3><p>${h.tag}</p>
      <div class="hood__foot"><span>${BK.fa(h.places)} مکان ثبت‌شده</span><span class="hood__go">${ico('arrow')}</span></div>
    </a>`).join('');

    const half = Math.ceil(BK.reviews.length / 2);
    const r1 = BK.reviews.slice(0, half).map(reviewCard).join(''), r2 = BK.reviews.slice(half).map(reviewCard).join('');
    $('#rvRow1').innerHTML = r1 + r1;
    $('#rvRow2').innerHTML = r2 + r2;

    const top = [...BK.places].sort((a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews)).slice(0, 5);
    $('#leader').innerHTML = top.map(p => `<li class="reveal"><div><b>${p.name}</b><small>${BK.catById(p.cat).name} · ${p.hood} · ${BK.fa(p.reviews)} نظر</small></div><span class="leader__score">${BK.faDec(p.rating)}</span><i class="leader__bar" style="--w:${p.rating / 5 * 100}"></i></li>`).join('');
  }

  /* =========================================================
     Place detail page
     ========================================================= */
  const pp = $('#placePage');
  if (pp) {
    const id = +new URLSearchParams(location.search).get('id') || 1;
    const p = BK.places.find(x => x.id === id) || BK.places[0];
    const c = BK.catById(p.cat);
    document.title = `${p.name} | در بیرجند کجا؟`;
    const w = [1, 2, 3, 4, 5].map(k => Math.exp(-((k - p.rating) ** 2) * 1.1));
    const sum = w.reduce((a, b) => a + b, 0);
    const dist = w.map(x => Math.round(x / sum * 100)).reverse();
    const own = BK.reviews.filter(r => p.name.includes(r.place) || r.place.includes(p.name.split(' ').slice(-1)[0]));
    const generic = [
      { name: 'سارا ت.', rating: 5, text: `تجربه‌ی خیلی خوبی از ${p.name} داشتم. برخورد محترمانه و فضای تمیز؛ حتماً دوباره میام.`, ago: '۳ روز پیش' },
      { name: 'محمد ج.', rating: 4, text: 'کیفیت خوب بود و قیمت‌ها منصفانه. فقط ساعت‌های شلوغ کمی باید منتظر بمونید.', ago: 'هفته پیش' },
      { name: 'الهام ف.', rating: 5, text: 'به دوستانی که از شهرهای دیگه میان بیرجند همیشه اینجا رو پیشنهاد می‌دم.', ago: '۲ هفته پیش' }
    ];
    const list = [...own.map(r => ({ ...r })), ...generic].slice(0, 5);
    const sim = BK.places.filter(x => x.id !== p.id && (x.cat === p.cat || x.hood === p.hood)).slice(0, 4);
    const fill = (sel, html) => { const el = $(sel, pp); if (el) el.innerHTML = html; };

    fill('#crumbs', `<a href="index.html">خانه</a>${ico('chevron')}<a href="index.html#places">${c.name}</a>${ico('chevron')}<span aria-current="page">${p.name}</span>`);
    fill('#gallery', [0, 1, 2, 3, 4].map(i => `<div class="cover" style="--base:${c.hue}">${ico(i === 0 ? c.icon : ['camera', 'sparkles', 'heart', 'star'][i - 1])}${i === 4 ? `<span class="pill gallery__more">${ico('camera')} ${BK.fa(24)} عکس</span>` : ''}</div>`).join(''));
    fill('#pTitle', `<div><span class="place__cat">${c.name}</span><h1>${p.name}${p.verified ? `<span title="تأییدشده">${ico('badge')}</span>` : ''}</h1>
      <div class="p-sub">${starsHTML(p.rating)}<b style="color:var(--ink)">${BK.faDec(p.rating)}</b><span>${BK.fa(p.reviews)} نظر</span><span>${ico('pin')} ${p.hood}</span><span class="pill ${p.open ? 'pill--open' : 'pill--closed'}" style="background:var(--tint)">${p.open ? 'اکنون باز است' : 'اکنون بسته است'}</span>${price(p.price)}</div></div>
      <div class="p-actions"><button class="icon-btn" id="shareBtn" aria-label="اشتراک‌گذاری">${ico('share')}</button><button class="icon-btn fav ${favs.has(p.id) ? 'is-on' : ''}" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="افزودن به علاقه‌مندی‌ها">${ico('heart')}</button></div>`);
    fill('#pDesc', p.desc);
    fill('#pTags', p.tags.map(t => `<span class="tag">${t}</span>`).join(''));
    fill('#pSummary', `<div class="summary__score"><b data-count="${p.rating}" data-dec="1">${BK.faDec(p.rating)}</b>${starsHTML(p.rating)}<small>بر اساس ${BK.fa(p.reviews)} نظر</small></div>
      <div class="bars">${dist.map((d, i) => `<div class="bar"><span>${BK.fa(5 - i)} ستاره</span><span class="bar__track"><i style="--w:${d}"></i></span><span>${BK.fa(d)}٪</span></div>`).join('')}</div>`);
    fill('#pReviews', list.map((r, i) => reviewCard({ ...r, place: p.name }).replace('</article>',
      `${i === 0 ? `<div class="rv__reply"><b>پاسخ مدیریت ${p.name}</b>ممنون از لطفتون؛ خوشحالیم که تجربه خوبی داشتید.</div>` : ''}
       <div class="rv__foot"><button data-helpful aria-pressed="false">${ico('thumb')} مفید بود (<span>${BK.fa(12 - i * 2)}</span>)</button><button>${ico('flag')} گزارش</button></div></article>`)).join(''));
    fill('#pInfo', `<div class="mini-map"><svg viewBox="0 0 360 180" aria-hidden="true"><rect width="360" height="180" fill="#ECFDF5"/><path d="M0 120 C100 110 160 60 360 70" stroke="#6EE7B7" stroke-width="10" fill="none"/><path d="M140 0 C150 60 130 120 150 180" stroke="#A7F3D0" stroke-width="8" fill="none"/><g transform="translate(180 82)"><circle r="22" class="pulse"/><path d="M0 12s-12-9-12-18a12 12 0 0 1 24 0c0 9-12 18-12 18Z" fill="#059669" stroke="#fff" stroke-width="2"/><circle cy="-6" r="4" fill="#fff"/></g></svg></div>
      <ul class="info-list">
        <li>${ico('pin')}<div><small>آدرس</small>بیرجند، محله ${p.hood}</div></li>
        <li>${ico('clock')}<div><small>ساعت کاری</small>${p.hours}</div></li>
        <li>${ico('phone')}<div><small>تلفن</small><span dir="ltr">${p.phone}</span></div></li>
      </ul>`);
    $('[data-open-review]', pp)?.setAttribute('data-open-review', p.id);
    fill('#pSimilar', sim.map(s => { const sc = BK.catById(s.cat); return `<a href="place.html?id=${s.id}"><span class="s-ico" style="--h:${sc.hue}">${ico(sc.icon)}</span><div><b>${s.name}</b><small>${sc.name} · ${s.hood}</small></div><span class="s-rate" style="margin-inline-start:auto;font-weight:800;color:var(--g-700)">${BK.faDec(s.rating)}</span></a>`; }).join(''));

    pp.addEventListener('click', e => {
      const h = e.target.closest('[data-helpful]');
      if (h) {
        const on = h.getAttribute('aria-pressed') !== 'true', n = h.querySelector('span');
        const cur = +n.textContent.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        n.textContent = BK.fa(cur + (on ? 1 : -1)); h.setAttribute('aria-pressed', on); h.classList.toggle('is-on', on);
        if (motion) G.fromTo(h, { scale: .85 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
      }
      if (e.target.closest('#shareBtn')) {
        if (navigator.share) navigator.share({ title: p.name, url: location.href }).catch(() => {});
        else navigator.clipboard?.writeText(location.href).then(() => toast('لینک کپی شد'), () => toast('کپی لینک ممکن نشد'));
      }
    });
  }

  hydrateIcons(); hydrateStars();

  /* ---------- tabs & filtering ---------- */
  const grid = $('#placeGrid');
  let currentTab = 'all', currentQ = '', currentHood = '';
  const moveInk = () => {
    const sel = $('.tab[aria-selected="true"]'), ink = $('.tabs__ink');
    if (!sel || !ink) return;
    ink.style.left = sel.offsetLeft + 'px'; ink.style.width = sel.offsetWidth + 'px';
  };
  const norm = s => s.replace(/[‌\s]+/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک');
  const matches = (p, q = currentQ, hood = currentHood, tab = currentTab) => {
    const c = BK.catById(p.cat);
    const hay = norm([p.name, p.desc, c.name, p.hood, ...p.tags].join(' '));
    return (tab === 'all' || p.cat === tab) && (!hood || p.hood === hood) && (!q || hay.includes(norm(q)));
  };
  const applyFilter = () => {
    if (!grid) return 0;
    const cards = $$('.place', grid);
    const state = motion && window.Flip ? Flip.getState(cards) : null;
    let n = 0;
    cards.forEach(el => { const ok = matches(BK.places.find(p => p.id === +el.dataset.id)); el.style.display = ok ? '' : 'none'; n += ok; });
    $('#empty').hidden = n > 0;
    if (state) Flip.from(state, {
      duration: .7, ease: 'power3.inOut', stagger: .03, absolute: true, scale: true,
      onEnter: els => G.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6, ease: 'back.out(1.6)' }),
      onLeave: els => G.to(els, { opacity: 0, scale: .85, duration: .35 })
    });
    return n;
  };
  const selectTab = id => {
    const btn = $(`.tab[data-tab="${id}"]`);
    currentTab = btn ? id : 'all';
    $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === currentTab));
    moveInk(); applyFilter();
  };
  $$('.tab').forEach(t => t.addEventListener('click', () => selectTab(t.dataset.tab)));
  $$('[data-tab-link]').forEach(a => a.addEventListener('click', () => { currentQ = ''; selectTab(a.dataset.tabLink); }));
  $$('[data-hood]').forEach(a => a.addEventListener('click', () => { currentHood = a.dataset.hood; const s = $('#hood'); if (s) s.value = currentHood; applyFilter(); toast(`نمایش مکان‌های محله ${currentHood}`); }));
  addEventListener('resize', moveInk);
  if (document.fonts) document.fonts.ready.then(moveInk);
  moveInk();

  /* ---------- favorites ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]'); if (!b) return;
    e.preventDefault();
    const id = +b.dataset.fav, on = !favs.has(id);
    on ? favs.add(id) : favs.delete(id);
    store.set('bk-favs', [...favs]);
    b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on);
    if (motion) G.fromTo(b, { scale: .6 }, { scale: 1, duration: .6, ease: 'elastic.out(1.2,.4)' });
    toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
  });

  /* ---------- search + suggestions ---------- */
  const form = $('#heroSearch');
  if (form) {
    const q = $('#q'), sug = $('#suggest');
    let active = -1;
    const render = () => {
      const v = q.value.trim();
      if (!v) { sug.hidden = true; return; }
      const cats = BK.categories.filter(c => norm(c.name).includes(norm(v))).slice(0, 2);
      const ps = BK.places.filter(p => matches(p, v, '', 'all')).slice(0, 5);
      if (!cats.length && !ps.length) { sug.innerHTML = '<p style="padding:12px;color:var(--muted)">نتیجه‌ای پیدا نشد</p>'; sug.hidden = false; return; }
      sug.innerHTML =
        cats.map(c => `<a href="#places" role="option" data-cat-sug="${c.id}"><span class="s-ico" style="--h:${c.hue}">${ico(c.icon)}</span><div><b>${c.name}</b><small>دسته‌بندی · ${BK.fa(c.count)} مکان</small></div></a>`).join('') +
        ps.map(p => { const c = BK.catById(p.cat); return `<a href="place.html?id=${p.id}" role="option"><span class="s-ico" style="--h:${c.hue}">${ico(c.icon)}</span><div><b>${p.name}</b><small>${c.name} · ${p.hood}</small></div><span class="s-rate">${BK.faDec(p.rating)}</span></a>`; }).join('');
      sug.hidden = false; active = -1;
      if (motion) G.from(sug.children, { y: 8, opacity: 0, stagger: .04, duration: .3 });
    };
    q.addEventListener('input', render);
    q.addEventListener('keydown', e => {
      const opts = $$('a', sug); if (sug.hidden || !opts.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        opts.forEach((o, i) => o.classList.toggle('is-active', i === active));
      } else if (e.key === 'Enter' && active > -1) { e.preventDefault(); opts[active].click(); }
      else if (e.key === 'Escape') sug.hidden = true;
    });
    sug.addEventListener('click', e => { const a = e.target.closest('[data-cat-sug]'); if (a) { q.value = ''; currentQ = ''; selectTab(a.dataset.catSug); sug.hidden = true; } });
    document.addEventListener('click', e => { if (!form.contains(e.target)) sug.hidden = true; });
    form.addEventListener('submit', e => {
      e.preventDefault(); sug.hidden = true;
      currentQ = q.value.trim(); currentHood = $('#hood').value;
      currentTab = 'all'; $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === 'all')); moveInk();
      const n = applyFilter();
      $('#places').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      toast(n ? `${BK.fa(n)} مکان پیدا شد` : 'نتیجه‌ای پیدا نشد');
    });
    $$('.chip[data-q]').forEach(c => c.addEventListener('click', () => { q.value = c.dataset.q; q.focus(); render(); }));
  }

  /* ---------- header, menu, progress ---------- */
  const header = $('#header'), prog = $('#progress');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    header.classList.toggle('is-hidden', y > 400 && y > lastY && !$('#nav').classList.contains('is-open'));
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('#menuBtn'), nav = $('#nav');
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.innerHTML = ico(open ? 'x' : 'menu');
    if (open && motion) G.from($$('a', nav), { x: 30, opacity: 0, stagger: .05, duration: .4, delay: .1 });
  });
  $$('a', nav || document.createElement('i')).forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', false); menuBtn.innerHTML = ico('menu'); }));

  /* ---------- review modal ---------- */
  const modal = $('#reviewModal');
  if (modal) {
    const panel = $('.modal__panel', modal), rate = $('#rateInput'), sel = $('#rmPlace'), txt = $('#rmText');
    const labels = ['', 'خیلی بد', 'بد', 'معمولی', 'خوب', 'عالی'];
    let lastFocus, value = 0;
    sel.innerHTML = BK.places.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    rate.innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" role="radio" aria-checked="false" aria-label="${BK.fa(i)} ستاره - ${labels[i]}" data-v="${i}">${starSvg}</button>`).join('');
    const setRate = v => {
      value = v; rate.dataset.v = v;
      $$('button', rate).forEach(b => b.setAttribute('aria-checked', +b.dataset.v === v));
      $('#rateLabel').textContent = labels[v];
      if (motion) G.fromTo($$('button', rate).slice(0, v), { scale: .7 }, { scale: 1, stagger: .05, duration: .5, ease: 'back.out(3)' });
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
    $$('[data-open-review]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(b.dataset.openReview); }));
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
      if (!value) { err.textContent = 'لطفاً امتیاز خود را انتخاب کنید.'; err.hidden = false; rate.querySelector('button').focus(); return; }
      if (txt.value.trim().length < 20) { err.textContent = 'متن نظر باید حداقل ۲۰ نویسه باشد.'; err.hidden = false; txt.closest('.field').classList.add('has-error'); txt.focus(); return; }
      const place = BK.places.find(p => p.id === +sel.value);
      const r = { name: 'شما', place: place.name, rating: value, text: txt.value.trim(), ago: 'همین حالا' };
      const row = $('#rvRow1') || $('#pReviews');
      if (row) {
        row.insertAdjacentHTML('afterbegin', reviewCard(r));
        if (motion) G.from(row.firstElementChild, { scale: .8, opacity: 0, duration: .7, ease: 'back.out(1.7)' });
      }
      e.target.reset(); setRate(0); rate.removeAttribute('data-v'); $('#rateLabel').textContent = 'روی ستاره‌ها بزن'; $('#rmCount').textContent = '۰';
      close(); toast('ممنون! نظرت ثبت شد و پس از بررسی نمایش داده می‌شه.');
    });
  }

  $('#newsletter')?.addEventListener('submit', e => { e.preventDefault(); e.target.reset(); toast('عضویتت در خبرنامه ثبت شد'); });

  /* =========================================================
     Motion (GSAP)
     ========================================================= */
  if (!motion) {
    $('#loader')?.classList.add('is-done');
    $$('[data-count]').forEach(el => el.textContent = el.dataset.dec ? BK.faDec(el.dataset.count) : BK.fa(el.dataset.count));
    startRotator();
    return;
  }

  // split section titles into words
  $$('.split').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });

  /* ---------- loader → hero intro ---------- */
  const intro = G.timeline({ paused: true, defaults: { ease: 'power4.out' } });
  if ($('.hero')) {
    intro
      .from('.hero__title .word, .hero__title .rotator', { yPercent: 115, rotate: 4, duration: 1.1, stagger: .06 })
      .fromTo('.underline', { '--u': 0 }, { '--u': 1, duration: .8, ease: 'power2.inOut' }, '-=.5')
      .fromTo('.reveal-hero', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .1 }, '-=.9')
      .from('.map-card', { scale: .7, rotate: 8, opacity: 0, duration: 1.2, ease: 'expo.out' }, '-=1')
      .to('.map-road:not(.map-road--thin)', { strokeDashoffset: 0, duration: 1.6, stagger: .2, ease: 'power2.inOut' }, '-=.9')
      .from('.map-pin', { scale: 0, transformOrigin: 'center', stagger: .12, duration: .6, ease: 'back.out(3)' }, '-=1.2')
      .from('.float-card', { y: 40, opacity: 0, scale: .9, stagger: .15, duration: .9, ease: 'back.out(1.6)' }, '-=1')
      .from('.trust-row li', { y: 20, opacity: 0, stagger: .1, duration: .6 }, '-=.6')
      .add(() => { countUp($('.eyebrow [data-count]')); startRotator(); }, 0.4);
  }

  const loader = $('#loader');
  if (loader) {
    G.timeline({ onComplete: () => { loader.classList.add('is-done'); } })
      .to('.loader__stroke', { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut' })
      .to('.loader__fill', { opacity: 1, duration: .4 }, '-=.2')
      .fromTo('.loader__dome', { opacity: 0, y: 12, scale: .6 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(2.5)' }, '-=.2')
      .to('.loader__pin', { y: -10, duration: .3, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '-=.2')
      .to('.loader__word span', { opacity: 1, y: 0, stagger: .08, duration: .5, ease: 'power3.out' }, '-=.6')
      .to('.loader__bar i', { scaleX: 1, duration: .8, ease: 'power2.inOut' }, '-=.6')
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '+=.1')
      .add(() => intro.play(), '-=.45');
    loader.style.clipPath = 'inset(0 0 0% 0)';
  } else intro.play();

  /* ---------- rotating hero word ---------- */
  function startRotator() {
    const item = $('.rotator__item'); if (!item || item.dataset.on) return; item.dataset.on = 1;
    const words = ['کافه‌ها', 'رستوران‌ها', 'پزشک‌ها', 'سوغاتی‌ها', 'هتل‌ها', 'باشگاه‌ها', 'جاذبه‌ها'];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      if (!motion) { item.textContent = words[i]; return; }
      G.timeline()
        .to(item, { yPercent: -100, opacity: 0, rotateX: 60, duration: .45, ease: 'power3.in' })
        .add(() => { item.textContent = words[i]; })
        .fromTo(item, { yPercent: 100, opacity: 0, rotateX: -60 }, { yPercent: 0, opacity: 1, rotateX: 0, duration: .6, ease: 'power3.out' });
    }, 2600);
  }

  /* ---------- counters ---------- */
  function countUp(el) {
    if (!el || el.dataset.done) return; el.dataset.done = 1;
    const end = +el.dataset.count, dec = !!el.dataset.dec, o = { v: 0 };
    G.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => el.textContent = dec ? BK.faDec(o.v) : BK.fa(Math.round(o.v)) });
  }
  if (!window.ScrollTrigger) { $$('.reveal').forEach(e => e.style.opacity = 1); return; }

  $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  /* ---------- section titles ---------- */
  $$('.split').forEach(el => G.from($$('.w', el), {
    scrollTrigger: { trigger: el, start: 'top 85%' },
    yPercent: 80, opacity: 0, rotate: 3, stagger: .06, duration: .9, ease: 'power4.out'
  }));
  $$('.kicker').forEach(el => G.from(el, { scrollTrigger: { trigger: el, start: 'top 90%' }, x: 30, opacity: 0, duration: .7 }));

  /* ---------- batch reveals ---------- */
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%', once: true,
    onEnter: els => G.fromTo(els, { y: 50, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, stagger: .07, duration: .9, ease: 'power3.out', overwrite: true, clearProps: 'transform' })
  });
  ScrollTrigger.batch('.place', {
    start: 'top 90%', once: true,
    onEnter: els => G.fromTo(els, { y: 70, opacity: 0, rotateX: -12, transformPerspective: 800 }, { y: 0, opacity: 1, rotateX: 0, stagger: .08, duration: 1, ease: 'power3.out', clearProps: 'transform' })
  });
  if ($('.steps')) {
  G.from('.step', { scrollTrigger: { trigger: '.steps', start: 'top 80%' }, y: 60, opacity: 0, stagger: .15, duration: .9, ease: 'back.out(1.4)' });
  G.from('.steps__line path', { scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: 1 }, strokeDashoffset: 1000, strokeDasharray: '1000 1000' });
  G.from('.step__ico', { scrollTrigger: { trigger: '.steps', start: 'top 75%' }, rotate: -30, scale: 0, stagger: .15, duration: .8, delay: .3, ease: 'back.out(2)' });
  G.from('.leader__bar', { scrollTrigger: { trigger: '#leader', start: 'top 80%' }, scaleX: 0, stagger: .1, duration: 1.2, ease: 'power3.out' });
  G.from('.award', { scrollTrigger: { trigger: '.award', start: 'top 90%' }, y: 30, opacity: 0, duration: .8 });
  G.from('.stats__score, .stat', { scrollTrigger: { trigger: '.stats', start: 'top 80%' }, y: 40, opacity: 0, stagger: .1, duration: .8 });
  G.from('.stats .stars .s', { scrollTrigger: { trigger: '.stats', start: 'top 75%' }, scale: 0, rotate: -90, stagger: .1, duration: .6, ease: 'back.out(2.5)' });
  G.from('.checks li', { scrollTrigger: { trigger: '.checks', start: 'top 85%' }, x: 40, opacity: 0, stagger: .12, duration: .7 });
  G.from('.biz-actions', { scrollTrigger: { trigger: '.biz-actions', start: 'top 92%' }, y: 20, opacity: 0, duration: .7 });
  }

  // dashboard mock
  const dash = $('.dash');
  if (dash) {
    G.timeline({ scrollTrigger: { trigger: dash, start: 'top 75%' } })
      .from(dash, { y: 80, rotateY: -14, rotateX: 8, transformPerspective: 1200, opacity: 0, duration: 1.2, ease: 'expo.out' })
      .from('.dash__kpis div', { y: 20, opacity: 0, stagger: .1, duration: .5 }, '-=.7')
      .to('.dash__line', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, '-=.3')
      .from('.dash__area', { opacity: 0, duration: 1 }, '-=1')
      .from('.dash__review', { y: 30, opacity: 0, scale: .9, duration: .7, ease: 'back.out(2)' }, '-=.6');
    G.to(dash, { scrollTrigger: { trigger: '.business', scrub: 1 }, y: -40 });
  }
  if ($('.cta')) G.from('.cta', { scrollTrigger: { trigger: '.cta', start: 'top 85%' }, y: 60, scale: .95, opacity: 0, duration: 1, ease: 'power3.out' });
  if ($('.cta')) G.to('.cta__glow', { x: 200, y: 80, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  G.from('.footer__grid > div', { scrollTrigger: { trigger: '.footer', start: 'top 90%' }, y: 30, opacity: 0, stagger: .1, duration: .8 });

  /* ---------- hero parallax ---------- */
  if ($('.hero')) {
    G.to('.blob--1', { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }, y: 160, x: -60 });
    G.to('.blob--2', { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }, y: -120 });
    G.to('.hero__visual', { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }, y: 90, rotate: -3 });
    G.to('.hero__copy', { scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }, y: 60, opacity: .3 });
    G.to('.blob', { scale: 1.15, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 1.5 });
  }

  /* ---------- marquees (speed reacts to scroll velocity) ---------- */
  const loops = [];
  const loop = (el, dur, dir = 1) => {
    if (!el) return;
    const t = dir > 0 ? G.fromTo(el, { xPercent: 0 }, { xPercent: 50, duration: dur, ease: 'none', repeat: -1 })
                      : G.fromTo(el, { xPercent: 50 }, { xPercent: 0, duration: dur, ease: 'none', repeat: -1 });
    loops.push(t); return t;
  };
  loop($('#marquee'), 36);
  const rv1 = loop($('#rvRow1'), 60), rv2 = loop($('#rvRow2'), 60, -1);
  $('.rv-marquee')?.addEventListener('pointerenter', () => { G.to([rv1, rv2], { timeScale: 0, duration: .5 }); });
  $('.rv-marquee')?.addEventListener('pointerleave', () => { G.to([rv1, rv2], { timeScale: 1, duration: .5 }); });
  ScrollTrigger.create({
    onUpdate: self => {
      const v = Math.min(Math.abs(self.getVelocity()) / 400, 5);
      if (loops[0]) G.to(loops[0], { timeScale: 1 + v, duration: .2, overwrite: true, onComplete: () => G.to(loops[0], { timeScale: 1, duration: 1 }) });
    }
  });
  if ($('.marquee')) G.to('.marquee', { scrollTrigger: { trigger: '.marquee', scrub: true }, rotate: 1.2 });

  /* ---------- horizontal neighborhoods (desktop) ---------- */
  const mm = G.matchMedia();
  mm.add('(min-width: 721px)', () => {
    const track = $('#hoodTrack'); if (!track) return;
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    G.to(track, {
      x: () => dist(), ease: 'none',
      scrollTrigger: { trigger: '.hoods', start: 'top top', end: () => '+=' + dist(), pin: '.hoods__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    G.fromTo('.hood', { y: 100, opacity: 0, rotate: -4 }, { scrollTrigger: { trigger: '.hoods', start: 'top 70%' }, y: 0, opacity: 1, rotate: 0, stagger: .08, duration: 1, ease: 'power3.out' });
  });
  mm.add('(max-width: 720px)', () => {
    if (!$('.hood')) return;
    G.from('.hood', { scrollTrigger: { trigger: '.hoods', start: 'top 75%' }, x: -60, opacity: 0, stagger: .1, duration: .8 });
  });

  /* ---------- pointer effects ---------- */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    // cursor follower
    const cur = $('#cursor');
    if (cur) {
      const xTo = G.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), yTo = G.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
      addEventListener('pointermove', e => { cur.style.opacity = 1; xTo(e.clientX); yTo(e.clientY); });
      document.addEventListener('pointerleave', () => cur.style.opacity = 0);
      document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest('a, button, input, select, textarea')));
    }
    // magnetic buttons
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        G.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => G.to(el, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }));
    });
    // 3D tilt + spotlight
    $$('.cat, .place, .hood').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        G.to(el, { rotateY: (px - .5) * 10, rotateX: (.5 - py) * 10, y: -6, transformPerspective: 700, duration: .5, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => G.to(el, { rotateX: 0, rotateY: 0, y: 0, duration: .8, ease: 'elastic.out(1,.5)', overwrite: 'auto' }));
    });
    // hero visual follows mouse
    const hv = $('.hero__visual');
    if (hv) $('.hero').addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      G.to('.map-card', { x: x * 20, y: y * 20, duration: 1, ease: 'power3.out' });
      G.to('.fc-1', { x: x * -40, y: y * -30, duration: 1, ease: 'power3.out' });
      G.to('.fc-2', { x: x * 50, y: y * 40, duration: 1, ease: 'power3.out' });
      G.to('.fc-3', { x: x * -30, y: y * 50, duration: 1, ease: 'power3.out' });
    });
  }

  if (pp) {
    G.from('#gallery .cover', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, stagger: .1, ease: 'expo.out' });
    G.from('#pTitle > *, #pDesc, #pTags .tag', { y: 30, opacity: 0, stagger: .06, duration: .8, delay: .2, ease: 'power3.out' });
    G.from('.bar__track i', { scrollTrigger: { trigger: '#pSummary', start: 'top 85%' }, scaleX: 0, stagger: .08, duration: 1.1, ease: 'power3.out' });
    ScrollTrigger.batch('#pReviews .rv', { start: 'top 90%', once: true, onEnter: els => G.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .1, duration: .8, clearProps: 'transform' }) });
    G.from('.side > *', { x: -40, opacity: 0, stagger: .12, duration: .9, delay: .4, ease: 'power3.out' });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
  window.BKUI = { starsHTML, reviewCard, placeCard, toast, hydrateIcons, countUp };
})();
