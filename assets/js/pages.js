/* در بیرجند کجا؟ — per-page rendering */
(() => {
  const { $, $$ } = BK;
  const G = window.gsap, motion = BK.motion;
  const page = document.body.dataset.page;
  const norm = s => String(s).replace(/[‌\s]+/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
  const hay = p => norm([p.name, p.desc, BK.catById(p.cat).name, (BK.hoodById(p.hood) || {}).name, ...(p.tags || [])].join(' '));
  const fill = (sel, html) => { const el = typeof sel === 'string' ? $(sel) : sel; if (el) el.innerHTML = html; return el; };
  const setTitle = t => document.title = `${t} | در بیرجند کجا؟`;
  const crumbs = items => `<nav class="crumbs" aria-label="مسیر صفحه"><a href="index.html">خانه</a>${items.map(([t, h]) => `${ico('chevron')}${h ? `<a href="${h}">${t}</a>` : `<span aria-current="page">${t}</span>`}`).join('')}</nav>`;
  const success = (t, d, a = '') => `<div class="success"><div class="success__ico">${ico('check')}</div><h3>${t}</h3><p>${d}</p>${a}</div>`;
  const rank = (a, b) => b.rating * Math.log(b.reviews + 2) - a.rating * Math.log(a.reviews + 2);
  const R = {};

  /* =========================================================
     HOME
     ========================================================= */
  R.home = () => {
    // search
    $('#where').innerHTML = '<option value="">همه محله‌ها</option>' + BK.hoods.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    const form = $('#heroSearch'), q = $('#q'), sug = $('#suggest');
    let act = -1;
    const render = () => {
      const v = q.value.trim(); if (!v) { sug.hidden = true; return; }
      const cats = BK.categories.filter(c => norm(c.name).includes(norm(v))).slice(0, 2);
      const ps = BK.places.filter(p => hay(p).includes(norm(v))).slice(0, 5);
      sug.innerHTML = (!cats.length && !ps.length) ? `<p style="padding:10px;color:var(--muted)">چیزی پیدا نشد؛ کلمه کوتاه‌تری امتحان کنید.</p>` :
        cats.map(c => `<a href="${BK.searchUrl('cat-' + c.id)}" role="option"><span class="s-ico">${ico(c.icon)}</span><div><b>${c.name}</b><small>همه ${c.name}‌ها</small></div></a>`).join('') +
        ps.map(p => `<a href="${BK.placeUrl(p.id)}" role="option"><img src="${BK.photoOf(p)}" alt=""><div><b>${p.name}</b><small>${BK.catById(p.cat).name} · ${(BK.hoodById(p.hood) || {}).name || ''}</small></div>${BK.score(p.rating)}</a>`).join('');
      sug.hidden = false; act = -1; BK.hydrateIcons(sug);
    };
    q.addEventListener('input', render);
    q.addEventListener('keydown', e => {
      const o = $$('a', sug); if (sug.hidden || !o.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + o.length) % o.length; o.forEach((x, i) => x.classList.toggle('is-active', i === act)); }
      else if (e.key === 'Enter' && act > -1) { e.preventDefault(); o[act].click(); } else if (e.key === 'Escape') sug.hidden = true;
    });
    document.addEventListener('click', e => { if (!form.contains(e.target)) sug.hidden = true; });
    form.addEventListener('submit', e => { e.preventDefault(); BK.store.sset('bk-q', q.value.trim()); const w = $('#where').value; location.href = w ? BK.searchUrl('hood-' + w) : BK.searchUrl(); });
    $$('#popular [data-q]').forEach(b => b.addEventListener('click', () => { q.value = b.dataset.q; q.focus(); render(); }));

    // categories rail (photo + icon)
    const photoFor = c => (BK.places.filter(p => p.cat === c.id).sort(rank)[0] || {}).photos?.[0] || 'shop-1.jpg';
    fill('#catRail', BK.categories.map(c => `<a class="cat-chip reveal" href="${BK.searchUrl('cat-' + c.id)}"><span class="cat-chip__img"><img src="${BK.img(photoFor(c))}" alt="" loading="lazy" width="112" height="112"><span class="cat-chip__ico">${ico(c.icon)}</span></span><b>${c.name}</b><small>${BK.fa(c.count || BK.places.filter(p => p.cat === c.id).length)} مکان</small></a>`).join(''));

    // featured places with tabs
    const tabs = [['all', 'پیشنهاد همشهری‌ها'], ['food', 'غذا'], ['cafe', 'کافه'], ['sight', 'دیدنی‌ها'], ['souvenir', 'سوغات'], ['health', 'درمان']].filter(([id]) => id === 'all' || BK.categories.some(c => c.id === id));
    fill('#tabs', tabs.map(([id, t], i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${id}">${t}</button>`).join(''));
    const drawPlaces = tab => {
      const list = (tab === 'all' ? BK.places.slice().sort(rank) : BK.places.filter(p => p.cat === tab).sort(rank)).slice(0, 8);
      fill('#placeGrid', list.map(BK.pcard).join(''));
      if (motion) G.from('#placeGrid .pcard', { opacity: 0, y: 12, stagger: .04, duration: .4, clearProps: 'all' });
    };
    $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); drawPlaces(b.dataset.tab); });
    drawPlaces('all');

    // map
    BK.mountMap($('#homeMap'), { title: 'محبوب‌ترین‌ها روی نقشه' });

    // neighborhoods with icons
    fill('#hoodGrid', BK.hoods.map(h => {
      const cats = [...new Set(BK.places.filter(p => p.hood === h.id).map(p => p.cat))].slice(0, 3).map(BK.catById);
      return `<a class="hood-tile reveal" href="${BK.searchUrl('hood-' + h.id)}"><span class="hood-tile__ico">${ico(h.icon)}</span><b>${h.name}</b><small>${h.tag}</small>
        <span class="hood-tile__foot"><span>${BK.fa(h.places)} مکان</span><span class="hood-tile__cats">${cats.map(c => `<span title="${c.name}">${ico(c.icon)}</span>`).join('')}</span></span></a>`;
    }).join(''));

    // reviews from real people
    fill('#reviewGrid', BK.reviews.filter(r => r.photo).slice(0, 6).map(r => BK.rcard(r)).join(''));

    // magazine teaser
    const [a, ...rest] = BK.articles;
    fill('#magTeaser', `<article class="mag-lead reveal"><div class="mag-lead__img"><img src="${BK.img(a.photo)}" alt="" loading="lazy"></div><div class="meta"><span class="cat">${a.cat}</span><span>${a.date}</span><span>${BK.fa(a.read)} دقیقه</span></div><h3><a href="${BK.articleUrl(a.id)}">${a.title}</a></h3><p>${a.lead}</p></article>
      <div class="mag-list">${rest.slice(0, 4).map(x => `<article class="post-row reveal"><div><div class="meta"><span class="cat">${x.cat}</span><span>${x.date}</span></div><h3><a href="${BK.articleUrl(x.id)}">${x.title}</a></h3></div><img src="${BK.img(x.photo)}" alt="" loading="lazy"></article>`).join('')}</div>`);
  };

  /* =========================================================
     LISTING (category detail / search)
     ========================================================= */
  R.search = () => {
    const S = { q: BK.store.sget('bk-q', ''), cat: '', hood: '', rating: 0, price: 0, open: false, verified: false, sort: 'rec', page: 1 };
    const read = () => { S.cat = ''; S.hood = ''; S.open = false; S.verified = false; BK.hashTokens().forEach(t => { if (t.startsWith('cat-')) S.cat = t.slice(4); else if (t.startsWith('hood-')) S.hood = t.slice(5); else if (t === 'open') S.open = true; else if (t === 'verified') S.verified = true; }); };
    const write = () => { const t = [S.cat && 'cat-' + S.cat, S.hood && 'hood-' + S.hood, S.open && 'open', S.verified && 'verified'].filter(Boolean); history.replaceState(null, '', t.length ? '#' + t.join('~') : location.pathname); };
    read();
    $('#fCat').innerHTML = '<option value="">همه دسته‌ها</option>' + BK.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    $('#fHood').innerHTML = '<option value="">همه محله‌ها</option>' + BK.hoods.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    $('#sq').value = S.q;
    const sync = () => { $('#fCat').value = S.cat; $('#fHood').value = S.hood; $('#fRating').value = S.rating; $('#fPrice').value = S.price; $('#fOpen').setAttribute('aria-pressed', S.open); $('#fVerified').setAttribute('aria-pressed', S.verified); $('#sort').value = S.sort; };
    const map = BK.mountMap($('#listMap'), { places: [], filters: false, side: false, compact: true, animate: false });
    const PER = 8;
    const run = () => {
      let list = BK.places.filter(p => (!S.q || hay(p).includes(norm(S.q))) && (!S.cat || p.cat === S.cat) && (!S.hood || p.hood === S.hood) && p.rating >= S.rating && (!S.price || p.price <= S.price) && (!S.open || p.open) && (!S.verified || p.verified));
      const sorters = { rec: rank, rating: (a, b) => b.rating - a.rating, reviews: (a, b) => b.reviews - a.reviews, cheap: (a, b) => a.price - b.price || b.rating - a.rating };
      list.sort(sorters[S.sort]);
      const pages = Math.max(1, Math.ceil(list.length / PER)); S.page = Math.min(S.page, pages);
      const shown = list.slice((S.page - 1) * PER, S.page * PER);
      const c = S.cat && BK.catById(S.cat), h = S.hood && BK.hoodById(S.hood);
      const title = c ? `${c.name}${h ? ' در محله ' + h.name : ' در بیرجند'}` : h ? `مکان‌های محله ${h.name}` : 'همه مکان‌های بیرجند';
      setTitle(title); $('#lTitle').textContent = title;
      $('#lLead').textContent = c ? `${c.desc}. امتیازها فقط از نظر کاربران تأییدشده محاسبه می‌شود.` : 'با فیلترهای بالا نتیجه را دقیق‌تر کنید. امتیازها فقط از نظر کاربران تأییدشده محاسبه می‌شود.';
      fill('#lCrumbs', crumbs(c ? [['دسته‌بندی‌ها', 'categories.html'], [c.name]] : [['کاوش مکان‌ها']]));
      fill('#subs', c && c.subs ? c.subs.map(s => `<button class="chip" data-sub="${s}">${s}</button>`).join('') : '');
      $('#count').innerHTML = `<b>${BK.fa(list.length)}</b> نتیجه`;
      fill('#rows', shown.map((p, i) => {
        const cc = BK.catById(p.cat), hh = BK.hoodById(p.hood) || { name: '' }, n = (S.page - 1) * PER + i + 1;
        return `<article class="lrow" data-id="${p.id}">
          <div class="lrow__img"><img src="${BK.photoOf(p)}" alt="" loading="lazy"><span class="lrow__idx">${BK.fa(n)}</span></div>
          <div class="lrow__body">
            <div class="lrow__title"><h3><a href="${BK.placeUrl(p.id)}">${p.name}</a>${p.verified ? `<span class="verified" title="هویت کسب‌وکار تأیید شده">${ico('badge')}</span>` : ''}</h3><button class="fav ${BK.favs.has(p.id) ? 'is-on' : ''}" data-fav="${p.id}" aria-pressed="${BK.favs.has(p.id)}" aria-label="افزودن ${p.name} به علاقه‌مندی‌ها">${ico('heart')}</button></div>
            <div class="lrow__rate">${BK.score(p.rating)}${p.rating ? BK.stars(p.rating) : ''}<span>${BK.fa(p.reviews)} نظر</span></div>
            <div class="lrow__meta"><span>${ico(cc.icon)}${cc.name}</span><span>${ico('pin')}${hh.name}</span>${BK.price(p.price)}<span class="pill ${p.open ? 'pill--open' : 'pill--closed'}">${p.open ? 'باز است' : 'بسته است'}</span></div>
            <p class="lrow__desc">${p.desc}</p>
            <div class="lrow__tags">${(p.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}</div>
          </div></article>`;
      }).join(''));
      $('#noRes').hidden = list.length > 0;
      fill('#pager', pages > 1 ? `<button data-pg="${S.page - 1}" ${S.page === 1 ? 'disabled' : ''} aria-label="صفحه قبل">${ico('chevron', 'flip')}</button>` + Array.from({ length: pages }, (_, i) => `<button data-pg="${i + 1}" ${i + 1 === S.page ? 'aria-current="true"' : ''}>${BK.fa(i + 1)}</button>`).join('') + `<button data-pg="${S.page + 1}" ${S.page === pages ? 'disabled' : ''} aria-label="صفحه بعد">${ico('chevron')}</button>` : '');
      const ch = [];
      if (S.q) ch.push(['q', `«${BK.esc(S.q)}»`]); if (c) ch.push(['cat', c.name]); if (h) ch.push(['hood', 'محله ' + h.name]);
      if (S.rating) ch.push(['rating', `امتیاز ${BK.faDec(S.rating)}+`]); if (S.price) ch.push(['price', 'تا سطح ' + BK.priceNames[S.price]]);
      if (S.open) ch.push(['open', 'باز است']); if (S.verified) ch.push(['verified', 'تأییدشده']);
      fill('#chips', ch.map(([k, t]) => `<button class="achip" data-rm="${k}" aria-label="حذف فیلتر ${t}">${t}${ico('x')}</button>`).join('') + (ch.length ? `<button class="achip achip--clear" data-rm="all">پاک کردن همه</button>` : ''));
      map.setPlaces(shown);
    };
    const update = () => { S.page = 1; write(); sync(); run(); };
    sync(); run();
    let qt; $('#sq').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { S.q = e.target.value.trim(); BK.store.sset('bk-q', S.q); update(); }, 200); });
    $('#fCat').onchange = e => { S.cat = e.target.value; update(); };
    $('#fHood').onchange = e => { S.hood = e.target.value; update(); };
    $('#fRating').onchange = e => { S.rating = +e.target.value; update(); };
    $('#fPrice').onchange = e => { S.price = +e.target.value; update(); };
    $('#sort').onchange = e => { S.sort = e.target.value; run(); };
    $('#fOpen').onclick = () => { S.open = !S.open; update(); };
    $('#fVerified').onclick = () => { S.verified = !S.verified; update(); };
    $('#subs').addEventListener('click', e => { const b = e.target.closest('[data-sub]'); if (!b) return; const on = b.getAttribute('aria-pressed') !== 'true'; $$('#subs .chip').forEach(x => x.setAttribute('aria-pressed', x === b && on)); S.q = on ? b.dataset.sub.split(' ')[0] : ''; $('#sq').value = S.q; S.page = 1; run(); $$('#subs .chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.sub === b.dataset.sub && on)); });
    $('#pager').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; S.page = +b.dataset.pg; run(); scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' }); });
    $('#chips').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; const k = b.dataset.rm;
      if (k === 'all' || k === 'q') { S.q = ''; $('#sq').value = ''; BK.store.sset('bk-q', ''); }
      if (k === 'all') Object.assign(S, { cat: '', hood: '', rating: 0, price: 0, open: false, verified: false }); else if (k !== 'q') S[k] = typeof S[k] === 'boolean' ? false : (typeof S[k] === 'number' ? 0 : '');
      update(); });
    $('#noResClear').onclick = () => $('#chips [data-rm="all"]')?.click();
    $('#rows').addEventListener('mouseover', e => { const r = e.target.closest('.lrow'); $$('#listMap .bpin').forEach(p => p.classList.toggle('is-on', !!r && p.dataset.id === r.dataset.id)); });
    $('#rows').addEventListener('mouseleave', () => $$('#listMap .bpin').forEach(p => p.classList.remove('is-on')));
    addEventListener('hashchange', () => { read(); sync(); run(); });
  };

  /* =========================================================
     CATEGORIES DIRECTORY
     ========================================================= */
  R.categories = () => {
    const draw = (f = '') => {
      const cats = BK.categories.filter(c => !f || norm(c.name + (c.subs || []).join('')).includes(norm(f)));
      $('#catCount').textContent = `${BK.fa(cats.length)} دسته`;
      fill('#dirGrid', cats.map(c => {
        const ps = BK.places.filter(p => p.cat === c.id).sort(rank), img = ps[0]?.photos[0] || 'shop-1.jpg';
        return `<article class="dir-card reveal"><div class="dir-card__img"><img src="${BK.img(img)}" alt="" loading="lazy"><span class="dir-card__ico">${ico(c.icon)}</span></div>
          <div class="dir-card__body"><h3><a href="${BK.searchUrl('cat-' + c.id)}">${c.name}</a><small>${BK.fa(c.count || ps.length)} مکان</small></h3><p>${c.desc || ''}</p>
            ${c.subs?.length ? `<div class="subs">${c.subs.map(s => `<a href="${BK.searchUrl('cat-' + c.id)}" data-q="${s.split(' ')[0]}">${s}</a>`).join('')}</div>` : ''}
            ${ps.length ? `<div class="dir-card__top">${ps.slice(0, 2).map(BK.mrow).join('')}</div>` : ''}</div>
          <div class="dir-card__foot"><a class="link" href="${BK.searchUrl('cat-' + c.id)}">مشاهده همه ${c.name}‌ها ${ico('arrow')}</a></div></article>`;
      }).join('') || `<div class="empty-state" style="grid-column:1/-1">${ico('search')}<h3>دسته‌ای پیدا نشد</h3><p>عبارت دیگری امتحان کنید.</p></div>`);
      BK.hydrateIcons($('#dirGrid'));
    };
    draw(); $('#dirSearch').addEventListener('input', e => draw(e.target.value.trim()));
    document.addEventListener('click', e => { const a = e.target.closest('.subs [data-q]'); if (a) BK.store.sset('bk-q', a.dataset.q); });
  };

  /* =========================================================
     HOODS + FULL MAP
     ========================================================= */
  R.hoods = () => {
    const m = BK.mountMap($('#fullMap'), { title: 'همه مکان‌ها' });
    fill('#hoodGrid', BK.hoods.map(h => {
      const cats = [...new Set(BK.places.filter(p => p.hood === h.id).map(p => p.cat))].slice(0, 3).map(BK.catById);
      return `<a class="hood-tile reveal" href="${BK.searchUrl('hood-' + h.id)}"><span class="hood-tile__ico">${ico(h.icon)}</span><b>${h.name}</b><small>${h.desc}</small>
        <span class="hood-tile__foot"><span>${BK.fa(h.places)} مکان · ${h.tag}</span><span class="hood-tile__cats">${cats.map(c => `<span title="${c.name}">${ico(c.icon)}</span>`).join('')}</span></span></a>`;
    }).join(''));
  };

  /* =========================================================
     PLACE
     ========================================================= */
  R.place = () => {
    let ph = [], map;
    const render = () => {
      const id = +(BK.hashTokens()[0] || '').replace('p', '') || +BK.store.sget('bk-last-place', 1) || 1;
      const p = BK.placeById(id) || BK.places[0], c = BK.catById(p.cat), h = BK.hoodById(p.hood) || { name: '', id: '' };
      setTitle(p.name);
      fill('#crumbs', crumbs([[c.name, BK.searchUrl('cat-' + c.id)], [p.name]]));
      const extra = BK.places.filter(x => x.cat === p.cat && x.id !== p.id).flatMap(x => x.photos).filter(f => !p.photos.includes(f));
      ph = [...p.photos, ...new Set(extra)].slice(0, 5);
      fill('#gallery', ph.map((f, i) => `<button data-lb="${i}" aria-label="نمایش عکس ${BK.fa(i + 1)}"><img src="${BK.img(f)}" alt="${i ? '' : p.name}" ${i ? 'loading="lazy"' : ''}>${i === ph.length - 1 ? `<span class="more">${ico('image')}${BK.fa(ph.length)} عکس</span>` : ''}</button>`).join(''));
      $('#gallery').style.gridTemplateRows = ph.length < 3 ? '320px' : '';
      fill('#pHead', `<div><h1>${p.name}${p.verified ? `<span class="verified" title="هویت کسب‌وکار تأیید شده">${ico('badge')}</span>` : ''}</h1>
        <div class="p-sub">${BK.score(p.rating)}${p.rating ? BK.stars(p.rating) : ''}<span>${BK.fa(p.reviews)} نظر</span><a href="${BK.searchUrl('cat-' + c.id)}">${ico(c.icon)}${c.name}</a><a href="${BK.searchUrl('hood-' + h.id)}">${ico('pin')}${h.name}</a>${BK.price(p.price)}<span class="pill ${p.open ? 'pill--open' : 'pill--closed'}">${p.open ? 'اکنون باز است' : 'اکنون بسته است'}</span></div></div>
        <div class="p-actions"><button class="icon-btn" data-copy="${location.href.split('#')[0]}#p${p.id}" data-copy-msg="لینک صفحه کپی شد" aria-label="کپی لینک صفحه">${ico('share')}</button><button class="icon-btn fav ${BK.favs.has(p.id) ? 'is-on' : ''}" data-fav="${p.id}" aria-pressed="${BK.favs.has(p.id)}" aria-label="افزودن به علاقه‌مندی‌ها">${ico('heart')}</button></div>`);
      fill('#pDesc', p.desc);
      fill('#pTags', (p.tags || []).map(t => `<a class="tag" href="search.html" data-q="${t}">${t}</a>`).join(''));
      fill('#pServices', p.services.length ? p.services.map(([n, v]) => `<li><span>${n}</span><i></i><span>${v}</span></li>`).join('') : '<li class="muted">هنوز منوی خدماتی ثبت نشده است.</li>');
      const w = [1, 2, 3, 4, 5].map(k => Math.exp(-((k - (p.rating || 3)) ** 2) * 1.1)), sum = w.reduce((a, b) => a + b, 0), dist = w.map(x => Math.round(x / sum * 100)).reverse();
      fill('#pSummary', `<div class="summary__score"><b>${p.rating ? BK.faDec(p.rating) : '—'}</b>${BK.stars(p.rating || 0, 'stars--lg')}<small>از ${BK.fa(p.reviews)} نظر تأییدشده</small></div>
        <div class="bars">${dist.map((d, i) => `<div class="bar"><span>${BK.fa(5 - i)} ستاره</span><span class="bar__track"><i style="--w:${p.reviews ? d : 0}"></i></span><span>${BK.fa(p.reviews ? d : 0)}٪</span></div>`).join('')}</div>`);
      const generic = [
        { name: 'سارا تقوی', photo: 'person-5.jpg', rating: 5, text: `تجربه خیلی خوبی از ${p.name} داشتم. برخورد محترمانه و فضای تمیز؛ حتماً دوباره میام.`, ago: '۳ روز پیش' },
        { name: 'محمد جعفری', photo: 'person-4.jpg', rating: 4, text: 'کیفیت خوب بود و قیمت‌ها منصفانه. فقط ساعت‌های شلوغ باید کمی منتظر بمونید.', ago: 'هفته پیش' }];
      const list = [...BK.publicReviews(p.id), ...(p.reviews ? generic.map(g => ({ ...g, pid: p.id })) : [])].slice(0, 6);
      fill('#pReviews', list.length ? list.map((r, i) => BK.rcard(r, { place: false, foot: true, i }).replace('</article>', i === 0 && !r.id ? `<div class="reply"><b>پاسخ مدیریت ${p.name}</b>ممنون از لطفتون؛ خوشحالیم که تجربه خوبی داشتید.</div></article>` : '</article>')).join('') :
        `<div class="empty-state">${ico('message')}<h3>هنوز نظری ثبت نشده</h3><p>اولین نفری باشید که تجربه‌اش را می‌نویسد.</p></div>`);
      $('#pReviewBtn').dataset.openReview = p.id;
      const mapQ = encodeURIComponent(`${p.name} بیرجند`);
      fill('#pInfo', `<h2>اطلاعات تماس و مسیر</h2><div id="pMap"></div>
        <ul class="info-list">
          <li>${ico('pin')}<div><small>نشانی</small>بیرجند، ${p.address}</div></li>
          <li>${ico('clock')}<div><small>ساعت کاری</small>${p.hours}</div></li>
          <li>${ico('phone')}<div><small>تلفن (نمونه)</small><span class="copy-row"><bdi dir="ltr">${p.phone}</bdi>${p.phone !== '—' ? `<button class="copy-btn" data-copy="${BK.toEn(p.phone)}" data-copy-msg="شماره کپی شد">کپی</button>` : ''}</span></div></li>
        </ul>
        <a href="https://www.google.com/maps/search/?api=1&query=${mapQ}" target="_blank" rel="noopener" class="btn btn--primary btn--block">${ico('navigation')}مسیریابی در نقشه گوگل</a>
        <button class="btn btn--secondary btn--block" data-copy="بیرجند، ${p.address}" data-copy-msg="نشانی کپی شد">${ico('copy')}کپی نشانی</button>`);
      const near = BK.places.filter(x => x.hood === p.hood || x.id === p.id).slice(0, 10);
      map = BK.mountMap($('#pMap'), { places: near, compact: true, focus: p.id, animate: false, zoom: 2.4, height: 230 });
      fill('#pSimilar', BK.places.filter(x => x.id !== p.id && (x.cat === p.cat || x.hood === p.hood)).sort((a, b) => (b.cat === p.cat) - (a.cat === p.cat) || b.rating - a.rating).slice(0, 4).map(BK.mrow).join(''));
      BK.hydrateIcons();
    };
    render();
    addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
    document.addEventListener('click', e => { const t = e.target.closest('#pTags [data-q]'); if (t) BK.store.sset('bk-q', t.dataset.q); });
    $('#pReviews').addEventListener('click', e => {
      const h = e.target.closest('[data-helpful]');
      if (h) { const on = h.getAttribute('aria-pressed') !== 'true', n = h.querySelector('span'); n.textContent = BK.fa(+BK.toEn(n.textContent) + (on ? 1 : -1)); h.setAttribute('aria-pressed', on); h.classList.toggle('is-on', on); }
      const r = e.target.closest('[data-report]'); if (r && !r.disabled) { r.disabled = true; r.lastChild.textContent = 'گزارش شد'; BK.toast('گزارش شما برای مدیر ارسال شد.'); }
    });
    document.addEventListener('bk:review', render);
    // lightbox
    const lb = $('#lightbox'), img = $('#lbImg'); let idx = 0, lastF;
    const show = i => { idx = (i + ph.length) % ph.length; img.src = BK.img(ph[idx]); $('#lbCount').textContent = `${BK.fa(idx + 1)} از ${BK.fa(ph.length)}`; };
    $('#gallery').addEventListener('click', e => { const b = e.target.closest('[data-lb]'); if (!b) return; lastF = b; lb.hidden = false; document.body.style.overflow = 'hidden'; show(+b.dataset.lb); $('#lbClose').focus(); });
    const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; lastF?.focus(); };
    $('#lbClose').onclick = closeLb; $('#lbPrev').onclick = () => show(idx - 1); $('#lbNext').onclick = () => show(idx + 1);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    lb.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(idx + 1); if (e.key === 'ArrowRight') show(idx - 1); });
  };

  /* =========================================================
     MAGAZINE
     ========================================================= */
  const authorPhoto = n => ({ 'سارا تقوی': 'person-5.jpg', 'علی حسینی': 'person-2.jpg', 'نگار محمدی': 'person-3.jpg', 'رضا نیکو': 'person-6.jpg' }[n] || 'person-1.jpg');
  const postItem = a => `<article class="post-item reveal"><div class="post-item__img"><img src="${BK.img(a.photo)}" alt="" loading="lazy"></div><div><div class="meta"><span class="cat">${a.cat}</span><span>${a.date}</span><span>${BK.fa(a.read)} دقیقه مطالعه</span></div><h3><a href="${BK.articleUrl(a.id)}">${a.title}</a></h3><p>${a.lead}</p><div class="author-line"><img src="${BK.img(authorPhoto(a.author))}" alt="">${a.author}</div></div></article>`;
  R.blog = () => {
    const [a, ...rest] = BK.articles;
    fill('#magTop', `<article class="mag-lead"><div class="mag-lead__img"><img src="${BK.img(a.photo)}" alt=""></div><div class="meta"><span class="cat">${a.cat}</span><span>${a.date}</span><span>${BK.fa(a.read)} دقیقه مطالعه</span></div><h2><a href="${BK.articleUrl(a.id)}">${a.title}</a></h2><p>${a.lead}</p><div class="author-line"><img src="${BK.img(authorPhoto(a.author))}" alt="">${a.author}</div></article>
      <aside class="mag-side"><h3 class="side-t">تازه‌ها</h3><div class="mag-list">${rest.slice(0, 4).map(x => `<article class="post-row"><div><div class="meta"><span class="cat">${x.cat}</span><span>${x.date}</span></div><h3><a href="${BK.articleUrl(x.id)}">${x.title}</a></h3></div><img src="${BK.img(x.photo)}" alt="" loading="lazy"></article>`).join('')}</div></aside>`);
    const topics = ['همه', ...new Set(BK.articles.map(x => x.cat))];
    fill('#topics', topics.map((t, i) => `<button aria-pressed="${i === 0}" data-t="${t}"><span>${t}</span><span>${BK.fa(t === 'همه' ? BK.articles.length : BK.articles.filter(x => x.cat === t).length)}</span></button>`).join(''));
    const draw = t => fill('#postList', (t === 'همه' ? rest : BK.articles.filter(x => x.cat === t)).map(postItem).join(''));
    draw('همه');
    $('#topics').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#topics button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(b.dataset.t); });
  };
  R.article = () => {
    const render = () => {
      const a = BK.articles.find(x => x.id === BK.hashTokens()[0]) || BK.articles[0];
      setTitle(a.title);
      fill('#aHead', `${crumbs([['مجله', 'blog.html'], [a.cat]])}<div class="meta"><span class="cat">${a.cat}</span><span>${a.date}</span><span>${BK.fa(a.read)} دقیقه مطالعه</span></div><h1>${a.title}</h1><div class="byline"><img src="${BK.img(authorPhoto(a.author))}" alt=""><div><b>${a.author}</b>نویسنده مجله در بیرجند کجا</div></div>`);
      fill('#aCover', `<img src="${BK.img(a.photo)}" alt="">`);
      fill('#aBody', `<p class="lead">${a.lead}</p>` + a.body.map(([t, x]) => t === 'h' ? `<h2>${x}</h2>` : t === 'tip' ? `<div class="tip">${ico('info')}<div>${x}</div></div>` : `<p>${x}</p>`).join(''));
      fill('#aMore', `<div class="share-row"><b>این مطلب را به اشتراک بگذارید</b><button class="btn btn--secondary btn--sm" data-copy="${location.href}" data-copy-msg="لینک مطلب کپی شد">${ico('copy')}کپی لینک</button></div>
        <h2 style="font-size:24px">مطالب دیگر</h2><div class="more-posts">${BK.articles.filter(x => x.id !== a.id).slice(0, 3).map(x => `<a href="${BK.articleUrl(x.id)}"><img src="${BK.img(x.photo)}" alt="" loading="lazy"><span class="meta"><span class="cat">${x.cat}</span></span><b>${x.title}</b></a>`).join('')}</div>`);
      BK.hydrateIcons();
    };
    render(); addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
  };

  /* =========================================================
     BUSINESS: register / claim with identity documents
     ========================================================= */
  const fileToThumb = file => new Promise(res => {
    if (!file) return res(null);
    if (!file.type.startsWith('image/')) return res({ name: file.name, img: null });
    const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 360 / im.width), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res({ name: file.name, img: c.toDataURL('image/jpeg', .7) }); }; im.onerror = () => res({ name: file.name, img: null }); im.src = fr.result; };
    fr.onerror = () => res({ name: file.name, img: null }); fr.readAsDataURL(file);
  });
  R.business = () => {
    // plans
    const plans = [
      { n: 'پایه', d: 'برای دیده‌شدن', m: 0, f: [['صفحه اختصاصی و نقشه', 1], ['پاسخ به نظرات', 1], ['۵ عکس', 1], ['گزارش ماهانه', 0], ['جایگاه ویژه در نتایج', 0]] },
      { n: 'حرفه‌ای', d: 'انتخاب بیشتر کسب‌وکارها', m: 490000, pop: 1, f: [['همه امکانات پایه', 1], ['گالری و منوی کامل', 1], ['گزارش هفتگی بازدید', 1], ['جایگاه ویژه در نتایج', 1], ['معرفی در مجله', 0]] },
      { n: 'ویژه', d: 'برای مجموعه‌ها و برندها', m: 1290000, f: [['همه امکانات حرفه‌ای', 1], ['چند شعبه در یک حساب', 1], ['معرفی در مجله و خبرنامه', 1], ['تبلیغ در صفحه اصلی', 1], ['پشتیبانی اختصاصی', 1]] }];
    let yearly = false;
    const drawPlans = () => fill('#plans', plans.map(p => `<div class="plan ${p.pop ? 'plan--pop' : ''}">${p.pop ? '<span class="plan__badge">پیشنهاد ما</span>' : ''}<h3>${p.n}</h3><p class="muted">${p.d}</p><div class="plan__price"><b>${p.m ? BK.fa(yearly ? p.m * 10 : p.m) : 'رایگان'}</b><span>${p.m ? (yearly ? 'تومان در سال' : 'تومان در ماه') : 'برای همیشه'}</span></div><ul>${p.f.map(([t, on]) => `<li class="${on ? '' : 'off'}">${ico(on ? 'checkCircle' : 'minus')}${t}</li>`).join('')}</ul><a href="#register" class="btn ${p.pop ? 'btn--primary' : 'btn--secondary'} btn--block" data-plan="${p.n}">${p.m ? 'انتخاب ' + p.n : 'شروع رایگان'}</a></div>`).join(''));
    drawPlans();
    $('#billing').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; yearly = b.dataset.b === 'y'; $$('#billing button').forEach(x => x.setAttribute('aria-pressed', x === b)); drawPlans(); });
    fill('#faq', BK.faq.map(([q, a], i) => `<details ${i ? '' : 'open'}><summary>${q}${ico('chevron')}</summary><div class="faq__a">${a}</div></details>`).join(''));
    // form
    $('#kCat').innerHTML = '<option value="">انتخاب کنید</option>' + BK.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    $('#kHood').innerHTML = '<option value="">انتخاب کنید</option>' + BK.hoods.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    $('#kClaimPlace').innerHTML = '<option value="">صفحه موجود را انتخاب کنید</option>' + BK.places.filter(p => p.id < 1000).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    let mode = 'new', step = 0, mobile = '', verified = false;
    const files = {};
    const steps = $$('#kycForm .kstep'), marks = $$('#stepsV li');
    const setMode = m => {
      mode = m; $$('#kMode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
      $('#kNewFields').hidden = m !== 'new'; $('#kClaimFields').hidden = m !== 'claim';
      $('#kClaimPlace').required = m === 'claim'; ['#kName', '#kCat', '#kHood', '#kAddr'].forEach(s => $(s).required = m === 'new');
      $('#kycTitle').textContent = m === 'new' ? 'ثبت کسب‌وکار جدید' : 'احراز مالکیت صفحه موجود';
    };
    $('#kMode').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });
    const go = n => {
      step = n; steps.forEach((s, i) => s.hidden = i !== n);
      marks.forEach((m, i) => { m.classList.toggle('is-on', i === n); m.classList.toggle('is-done', i < n); });
      $('#kBack').hidden = n === 0; $('#kNext').hidden = n >= steps.length - 1; $('#kSubmit').hidden = n !== steps.length - 1;
      if (n === steps.length - 1) {
        const o = s => $(s).selectedOptions[0]?.textContent || '—', v = s => BK.esc($(s).value.trim());
        fill('#kSummary', `<li><span>نوع درخواست</span><b>${mode === 'new' ? 'ثبت کسب‌وکار جدید' : 'احراز مالکیت'}</b></li>` +
          (mode === 'new' ? `<li><span>نام</span><b>${v('#kName')}</b></li><li><span>دسته / محله</span><b>${o('#kCat')} · ${o('#kHood')}</b></li>` : `<li><span>صفحه</span><b>${o('#kClaimPlace')}</b></li>`) +
          `<li><span>مالک</span><b>${v('#kOwner')}</b></li><li><span>کد ملی</span><b dir="ltr">${v('#kNid')}</b></li><li><span>شماره جواز</span><b>${v('#kLicNo')}</b></li><li><span>مدارک</span><b>${['کارت ملی', 'جواز کسب'].filter((_, i) => files[i ? 'lic' : 'card']).join(' و ')}</b></li><li><span>موبایل تأییدشده</span><b dir="ltr">${mobile}</b></li>`);
      }
      $('#kycCard').scrollIntoView({ block: 'start', behavior: motion ? 'smooth' : 'auto' });
    };
    const checkFiles = () => { let ok = true; ['card', 'lic'].forEach(k => { const box = $(`#up-${k}`); const has = !!files[k]; box.classList.toggle('is-bad', !has); ok = ok && has; }); if (!ok) BK.toast('تصویر کارت ملی و جواز کسب را بارگذاری کنید.'); return ok; };
    $$('.upload input').forEach(inp => inp.addEventListener('change', async () => {
      const f = inp.files[0], k = inp.dataset.k, box = inp.closest('.upload');
      if (f && f.size > 5e6) { BK.toast('حجم فایل باید کمتر از ۵ مگابایت باشد.'); inp.value = ''; return; }
      files[k] = await fileToThumb(f);
      box.classList.toggle('is-ok', !!f); box.classList.remove('is-bad');
      $('.upload__thumb', box).innerHTML = files[k]?.img ? `<img src="${files[k].img}" alt="پیش‌نمایش">` : ico(f ? 'file' : 'upload');
      $('.upload__txt small', box).textContent = f ? f.name : box.dataset.hint;
    }));
    const otp = BK.otp($('#kOtp'), () => {});
    $('#kSend').addEventListener('click', () => { if (!BK.validate($('#kPhoneBox'))) return; mobile = BK.toEn($('#kMobile').value).replace(/[\s-]/g, ''); $('#kOtpBox').hidden = false; otp.focus(); });
    $('#kVerify').addEventListener('click', () => { if (otp.value() !== '12345') { $('#kOtpErr').hidden = false; otp.clear(); return; } verified = true; $('#kOtpErr').hidden = true; $('#kOtpBox').hidden = true; $('#kVerified').hidden = false; $('#kMobile').readOnly = true; BK.toast('شماره موبایل تأیید شد'); });
    $('#kNext').addEventListener('click', () => {
      if (!BK.validate(steps[step])) return;
      if (step === 1 && !checkFiles()) return;
      if (step === 2 && !verified) { BK.toast('شماره موبایل را با کد تأیید کنید.'); $('#kMobile').focus(); return; }
      go(step + 1);
    });
    $('#kBack').addEventListener('click', () => go(step - 1));
    $('#kycForm').addEventListener('submit', e => {
      e.preventDefault();
      if (!$('#kAgree').checked) { BK.toast('برای ارسال، پذیرش درستی اطلاعات لازم است.'); $('#kAgree').focus(); return; }
      const claimP = mode === 'claim' && BK.placeById($('#kClaimPlace').value);
      const b = { id: 'u' + BK.uid(), type: mode, name: claimP ? claimP.name : $('#kName').value.trim(), cat: claimP ? claimP.cat : $('#kCat').value, hood: claimP ? claimP.hood : $('#kHood').value, address: claimP ? claimP.address : $('#kAddr').value.trim(), hours: $('#kHours').value.trim(), desc: $('#kDesc').value.trim(),
        owner: $('#kOwner').value.trim(), nationalId: BK.toEn($('#kNid').value.trim()), licenseNo: $('#kLicNo').value.trim(), mobile, account: BK.user()?.mobile || mobile, ts: BK.nowFa(), status: 'pending', docs: ['کارت ملی', 'جواز کسب'], files: { card: files.card, lic: files.lic }, claimOf: claimP?.id };
      try { BK.store.set('bk-biz', [b, ...BK.store.get('bk-biz', [])]); } catch {}
      if (!BK.store.get('bk-biz', []).some(x => x.id === b.id)) { b.files = { card: files.card && { name: files.card.name }, lic: files.lic && { name: files.lic.name } }; BK.store.set('bk-biz', [b, ...BK.store.get('bk-biz', [])]); }
      if (!BK.user()) BK.login(mobile, b.owner);
      fill('#kycCard', success('درخواست شما ثبت شد', `مدارک «${BK.esc(b.name)}» در صف بررسی مدیر قرار گرفت. پس از تأیید، صفحه با نشان «تأییدشده» در سایت نمایش داده می‌شود و پیامک اطلاع‌رسانی دریافت می‌کنید.`, '<a class="btn btn--primary" href="profile.html#biz">پیگیری در پروفایل</a>'));
      BK.hydrateIcons($('#kycCard'));
    });
    document.addEventListener('click', e => { const b = e.target.closest('[data-plan]'); if (b) $('#kPlan').value = b.dataset.plan; });
    setMode(location.hash === '#claim' ? 'claim' : 'new'); go(0);
    if (location.hash) setTimeout(() => $(location.hash === '#claim' ? '#register' : location.hash)?.scrollIntoView(), 200);
    addEventListener('hashchange', () => { if (location.hash === '#claim') { setMode('claim'); $('#register').scrollIntoView(); } });
    const u = BK.user(); if (u) { $('#kMobile').value = u.mobile; }
  };

  /* =========================================================
     ADMIN PANEL (demo: client-side only)
     ========================================================= */
  R.admin = () => {
    const gate = $('#gate'), app = $('#adminApp');
    const enter = () => { gate.hidden = true; app.hidden = false; build(); };
    if (BK.store.sget('bk-admin', '') === '1') enter();
    $('#gateForm').addEventListener('submit', e => { e.preventDefault(); if ($('#gatePass').value === 'admin') { BK.store.sset('bk-admin', '1'); enter(); } else { $('#gateErr').hidden = false; $('#gatePass').focus(); } });
    function build() {
      const panels = { overview, biz, reviews, users, pages, cats };
      let cur = BK.hashTokens()[0] in panels ? BK.hashTokens()[0] : 'overview';
      const counts = () => {
        const nb = BK.registered().filter(b => BK.statusOf(b) === 'pending').length, nr = [...BK.seedPendingReviews, ...BK.userReviews()].filter(r => BK.statusOf(r) === 'pending').length;
        $('#cBiz').textContent = nb ? BK.fa(nb) : ''; $('#cBiz').dataset.n = nb; $('#cRev').textContent = nr ? BK.fa(nr) : ''; $('#cRev').dataset.n = nr; return { nb, nr };
      };
      const show = k => { cur = k; $$('#adminTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.p === k)); history.replaceState(null, '', '#' + k); fill('#adminBody', panels[k]()); BK.hydrateIcons($('#adminBody')); counts(); };
      $('#adminTabs').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (b) show(b.dataset.p); });
      $('#adminOut').onclick = () => { BK.store.sset('bk-admin', ''); location.reload(); };
      const allUsers = () => [...BK.store.get('bk-users', []).map(u => ({ ...u, reviews: BK.userReviews().filter(r => r.mobile === u.mobile).length })), ...BK.seedUsers];
      const allRev = () => [...BK.userReviews(), ...BK.seedPendingReviews];
      function overview() {
        const { nb, nr } = counts(), v = BK.views(), total = Object.values(v).reduce((a, b) => a + b, 0), us = allUsers();
        return `<div class="admin-head"><h1>نمای کلی</h1><span class="pill">${BK.nowFa()}</span></div><div class="kpis"><div class="kpi ${nb ? 'kpi--warn' : ''}"><small>${ico('store')}کسب‌وکار در انتظار</small><b>${BK.fa(nb)}</b><span class="delta">نیاز به بررسی مدارک</span></div>
          <div class="kpi ${nr ? 'kpi--warn' : ''}"><small>${ico('message')}نظر در انتظار</small><b>${BK.fa(nr)}</b><span class="delta">پیش از انتشار تأیید شود</span></div>
          <div class="kpi"><small>${ico('users')}کاربران جدید این هفته</small><b>${BK.fa(us.length)}</b><span class="delta">با شماره تأییدشده</span></div>
          <div class="kpi"><small>${ico('eye')}بازدید صفحات</small><b>${BK.fa(total)}</b><span class="delta">۳۰ روز اخیر</span></div></div>
          <div class="panel-grid"><div class="card"><h2>پربازدیدترین صفحات</h2>${barsHTML(5)}<button class="link" data-go="pages" style="margin-top:12px">گزارش کامل ${ico('arrow')}</button></div>
          <div class="card"><h2>کاربران جدید</h2>${usersTable(us.slice(0, 5), true)}<button class="link" data-go="users" style="margin-top:12px">همه کاربران ${ico('arrow')}</button></div></div>`;
      }
      function barsHTML(n) {
        const v = Object.entries(BK.views()).sort((a, b) => b[1] - a[1]).slice(0, n), max = v[0]?.[1] || 1;
        return `<div class="hbars">${v.map(([k, c]) => `<div class="hbar"><span>${BK.pageNames[k] || k}</span><span class="hbar__track"><i style="--w:${c / max * 100}"></i></span><b>${BK.fa(c)}</b></div>`).join('')}</div>`;
      }
      function usersTable(list, short) {
        return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>کاربر</th><th>موبایل</th><th>عضویت</th>${short ? '' : '<th>نظرها</th>'}</tr></thead><tbody>${list.map(u => `<tr><td><span class="who">${BK.avatar(u)}<b>${BK.esc(u.name)}</b></span></td><td dir="ltr" style="text-align:right">${BK.esc(u.mobile.replace(/(\d{4})\d{3}(\d{4})/, '$1***$2'))}</td><td>${u.since}</td>${short ? '' : `<td>${BK.fa(u.reviews || 0)}</td>`}</tr>`).join('')}</tbody></table></div>`;
      }
      function biz() {
        const list = BK.registered();
        if (!list.length) return `<div class="empty-state">${ico('store')}<h3>درخواستی نیست</h3></div>`;
        return `<div class="admin-head"><h1>تأیید کسب‌وکارها</h1></div><div class="queue">${list.map(b => { const st = BK.statusOf(b), c = BK.catById(b.cat), h = BK.hoodById(b.hood) || { name: '—' };
          const doc = (lbl, f) => `<div class="doc"><div class="doc__img">${f?.img ? `<img src="${f.img}" alt="${lbl}">` : ico('idcard')}</div><span>${lbl}${f?.name ? ' · ' + BK.esc(f.name) : ''}</span></div>`;
          return `<article class="qitem ${st !== 'pending' ? 'qitem--done' : ''}"><div class="qitem__head"><div><h3>${BK.esc(b.name)}</h3><small>${b.type === 'claim' ? 'درخواست احراز مالکیت' : 'ثبت کسب‌وکار جدید'} · ${b.ts}</small></div>${statusPill(st)}</div>
            <dl><div><dt>دسته / محله</dt><dd>${c.name} · ${h.name}</dd></div><div><dt>مالک</dt><dd>${BK.esc(b.owner)}</dd></div><div><dt>کد ملی</dt><dd dir="ltr" style="text-align:right">${BK.esc(b.nationalId)} ${BK.validNid(b.nationalId) ? '✓' : '(نامعتبر)'}</dd></div><div><dt>شماره جواز</dt><dd>${BK.esc(b.licenseNo)}</dd></div><div><dt>موبایل تأییدشده</dt><dd dir="ltr" style="text-align:right">${BK.esc(b.mobile)}</dd></div><div><dt>نشانی</dt><dd>${BK.esc(b.address)}</dd></div></dl>
            <div class="docs">${doc('کارت ملی', b.files?.card)}${doc('جواز کسب', b.files?.lic)}</div>
            <div class="qitem__actions">${st === 'pending' ? `<button class="btn btn--danger btn--sm" data-mod="${b.id}" data-st="rejected">${ico('x')}رد درخواست</button><button class="btn btn--primary btn--sm" data-mod="${b.id}" data-st="approved">${ico('check')}تأیید و انتشار</button>` : `<button class="btn btn--secondary btn--sm" data-mod="${b.id}" data-st="pending">بازگرداندن به صف</button>`}</div></article>`; }).join('')}</div>`;
      }
      function reviews() {
        const list = allRev();
        return `<div class="admin-head"><h1>تأیید نظرات</h1></div><div class="queue">${list.map(r => { const st = BK.statusOf(r), p = BK.placeById(r.pid);
          return `<article class="qitem ${st !== 'pending' ? 'qitem--done' : ''}"><div class="qitem__head"><div class="rcard__head" style="flex:1">${BK.avatar(r)}<div><b>${BK.esc(r.name)}</b><small>${p ? p.name : '—'} · ${r.ago || r.date || ''} · <bdi dir="ltr">${BK.esc((r.mobile || '').replace(/(\d{4})\d{3}(\d{4})/, '$1***$2'))}</bdi></small></div>${BK.stars(r.rating)}</div>${statusPill(st)}</div>
            <p>${BK.esc(r.text)}</p>
            <div class="qitem__actions">${st === 'pending' ? `<button class="btn btn--danger btn--sm" data-mod="${r.id}" data-st="rejected">${ico('x')}رد</button><button class="btn btn--primary btn--sm" data-mod="${r.id}" data-st="approved">${ico('check')}تأیید و انتشار</button>` : `<button class="btn btn--secondary btn--sm" data-mod="${r.id}" data-st="pending">بازگرداندن به صف</button>`}</div></article>`; }).join('')}</div>`;
      }
      function users() { const us = allUsers(); return `<div class="admin-head"><h1>کاربران جدید</h1><span class="pill">${BK.fa(us.length)} کاربر</span></div><div class="card">${usersTable(us)}</div>`; }
      function pages() { return `<div class="admin-head"><h1>پربازدیدترین صفحات</h1><span class="pill">۳۰ روز اخیر</span></div><div class="card">${barsHTML(20)}</div>`; }
      const ICONS = ['store', 'utensils', 'coffee', 'bed', 'landmark', 'stethoscope', 'scissors', 'bag', 'gift', 'dumbbell', 'graduation', 'car', 'wrench', 'book', 'camera', 'heart', 'pine', 'tag'];
      function cats() {
        const o = BK.store.get('bk-cats', { added: [], removed: [], names: {} });
        const all = [...BK.baseCats, ...o.added];
        return `<div class="admin-head"><h1>مدیریت دسته‌بندی‌ها</h1><span class="pill">${BK.fa(all.length - o.removed.length)} دسته فعال</span></div>
          <div class="panel-grid"><div class="card"><h2>دسته‌های فعلی</h2><p class="hint" style="margin-bottom:10px">نام را مستقیم ویرایش کنید و با خروج از کادر ذخیره می‌شود.</p><div class="cat-admin">${all.map(c => { const off = o.removed.includes(c.id); return `<div class="cat-admin__row" style="${off ? 'opacity:.5' : ''}">${ico(c.icon)}<input value="${BK.esc(o.names[c.id] || c.name)}" data-rename="${c.id}" aria-label="نام دسته ${BK.esc(c.name)}" ${off ? 'disabled' : ''}><small>${BK.fa(BK.places.filter(p => p.cat === c.id).length)} مکان</small>${off ? `<button class="btn btn--soft btn--sm" data-cat-on="${c.id}">${ico('plus')}فعال</button>` : `<button class="btn btn--danger btn--sm" data-cat-off="${c.id}" aria-label="حذف ${BK.esc(c.name)}">${ico('trash')}</button>`}</div>`; }).join('')}</div></div>
          <form class="card" id="catAdd" novalidate><h2>افزودن دسته جدید</h2><div class="form-grid"><div class="f full"><label for="ncName">نام دسته</label><input class="input" id="ncName" required placeholder="مثلاً قنادی و شیرینی"></div>
            <div class="f full"><span class="lbl">آیکون</span><div class="icon-pick" id="ncIcon" role="group" aria-label="انتخاب آیکون">${ICONS.map((i, n) => `<button type="button" data-i="${i}" aria-pressed="${n === 0}" aria-label="${i}">${ico(i)}</button>`).join('')}</div></div>
            <div class="f full"><label for="ncDesc">توضیح کوتاه</label><input class="input" id="ncDesc" placeholder="مثلاً شیرینی‌پزی، کیک و بستنی"></div></div>
            <button class="btn btn--primary" style="margin-top:16px">${ico('plus')}افزودن دسته</button></form></div>`;
      }
      const statusPill = st => st === 'approved' ? '<span class="pill pill--ok">تأیید شده</span>' : st === 'rejected' ? '<span class="pill pill--no">رد شده</span>' : '<span class="pill pill--pending">در انتظار بررسی</span>';
      $('#adminBody').addEventListener('click', e => {
        const go = e.target.closest('[data-go]'); if (go) return show(go.dataset.go);
        const m = e.target.closest('[data-mod]');
        if (m) { BK.setMod(m.dataset.mod, m.dataset.st); BK.toast(m.dataset.st === 'approved' ? 'تأیید شد و در سایت منتشر می‌شود.' : m.dataset.st === 'rejected' ? 'رد شد.' : 'به صف بررسی برگشت.'); show(cur); return; }
        const o = BK.store.get('bk-cats', { added: [], removed: [], names: {} });
        const off = e.target.closest('[data-cat-off]'); if (off) { o.removed.push(off.dataset.catOff); BK.store.set('bk-cats', o); BK.toast('دسته غیرفعال شد و از سایت حذف می‌شود.'); show('cats'); return; }
        const on = e.target.closest('[data-cat-on]'); if (on) { o.removed = o.removed.filter(x => x !== on.dataset.catOn); BK.store.set('bk-cats', o); BK.toast('دسته دوباره فعال شد.'); show('cats'); return; }
        const ic = e.target.closest('#ncIcon button'); if (ic) $$('#ncIcon button').forEach(b => b.setAttribute('aria-pressed', b === ic));
      });
      $('#adminBody').addEventListener('change', e => { const r = e.target.closest('[data-rename]'); if (!r || !r.value.trim()) return; const o = BK.store.get('bk-cats', { added: [], removed: [], names: {} }); o.names[r.dataset.rename] = r.value.trim(); BK.store.set('bk-cats', o); BK.toast('نام دسته ذخیره شد.'); });
      $('#adminBody').addEventListener('submit', e => {
        if (e.target.id !== 'catAdd') return; e.preventDefault(); if (!BK.validate(e.target)) return;
        const o = BK.store.get('bk-cats', { added: [], removed: [], names: {} });
        o.added.push({ id: 'c' + BK.uid(), name: $('#ncName').value.trim(), icon: $('#ncIcon [aria-pressed="true"]').dataset.i, count: 0, hue: 150, desc: $('#ncDesc').value.trim(), subs: [] });
        BK.store.set('bk-cats', o); BK.toast('دسته جدید اضافه شد و در سایت نمایش داده می‌شود.'); show('cats');
      });
      show(cur);
    }
  };

  /* =========================================================
     LOGIN / PROFILE
     ========================================================= */
  R.login = () => {
    if (BK.user()) { fill('#authBox', `<h1>شما وارد شده‌اید</h1><p class="muted">با حساب ${BK.esc(BK.user().name)} وارد شده‌اید.</p><a class="btn btn--primary" href="profile.html">رفتن به پروفایل</a>`); return; }
    const s1 = $('#step1'), s2 = $('#step2'); let mobile = '';
    const otp = BK.otp($('#lOtp'), () => $('#fullName').focus());
    s1.addEventListener('submit', e => { e.preventDefault(); if (!BK.validate(s1)) return; mobile = BK.toEn($('#mobile').value).replace(/[\s-]/g, ''); $('#sentTo').textContent = mobile; s1.hidden = true; s2.hidden = false; otp.focus(); });
    $('#editMobile').onclick = () => { s2.hidden = true; s1.hidden = false; $('#mobile').focus(); };
    s2.addEventListener('submit', e => {
      e.preventDefault();
      if (otp.value() !== '12345') { $('#otpErr').hidden = false; otp.clear(); return; }
      $('#otpErr').hidden = true; if (!BK.validate(s2)) return;
      BK.login(mobile, $('#fullName').value.trim()); BK.toast('خوش آمدید!'); setTimeout(() => location.href = 'profile.html', 500);
    });
  };
  R.profile = () => {
    const u = BK.user();
    fill('#pHead', u ? `<div class="profile-head"><div class="big-av">${BK.esc(u.name[0])}</div><div><h1>${BK.esc(u.name)}</h1><div class="profile-stats"><span><b>${BK.fa(BK.favs.size)}</b>علاقه‌مندی</span><span><b>${BK.fa(BK.userReviews().filter(r => r.mobile === u.mobile).length)}</b>نظر</span><span>${ico('badge')} شماره تأییدشده <bdi dir="ltr">${u.mobile.replace(/(\d{4})\d{3}(\d{4})/, '$1***$2')}</bdi></span></div></div></div>`
      : `<h1>پروفایل من</h1><p>برای نظر دادن و پیگیری درخواست‌ها، با شماره موبایل وارد شوید.</p><a class="btn btn--primary" href="login.html" style="margin-top:14px">${ico('user')}ورود یا ثبت‌نام</a>`);
    const st = s => s === 'approved' ? '<span class="pill pill--ok">منتشر شده</span>' : s === 'rejected' ? '<span class="pill pill--no">رد شده</span>' : '<span class="pill pill--pending">در انتظار تأیید</span>';
    const panels = {
      favs: () => { const ps = [...BK.favs].map(BK.placeById).filter(Boolean); return ps.length ? `<div class="place-grid">${ps.map(BK.pcard).join('')}</div>` : `<div class="empty-state">${ico('heart')}<h3>هنوز چیزی ذخیره نکرده‌اید</h3><p>روی قلب هر مکان بزنید تا اینجا بماند.</p><a class="btn btn--primary" href="search.html">کاوش مکان‌ها</a></div>`; },
      reviews: () => { const rs = u ? BK.userReviews().filter(r => r.mobile === u.mobile) : []; return rs.length ? `<div class="p-reviews">${rs.map(r => BK.rcard(r).replace('<p class="rcard__text">', `${st(BK.statusOf(r))}<p class="rcard__text">`).replace(/<span class="pending-note">.*?<\/span>/, '')).join('')}</div>` : `<div class="empty-state">${ico('message')}<h3>هنوز نظری ننوشته‌اید</h3><p>تجربه‌تان از یک کافه، رستوران یا پزشک را بنویسید.</p><button class="btn btn--primary" data-open-review>${ico('plus')}نوشتن نظر</button></div>`; },
      biz: () => { const bs = u ? BK.store.get('bk-biz', []).filter(b => b.mobile === u.mobile || b.account === u.mobile) : []; return bs.length ? `<div class="mybiz">${bs.map(b => `<div class="mybiz__row">${ico('store')}<b>${BK.esc(b.name)}</b><small class="muted">${b.type === 'claim' ? 'احراز مالکیت' : 'ثبت جدید'} · ${b.ts}</small>${st(BK.statusOf(b))}</div>`).join('')}</div>` : `<div class="empty-state">${ico('store')}<h3>کسب‌وکاری ثبت نکرده‌اید</h3><p>ثبت رایگان است؛ فقط کارت ملی، جواز کسب و شماره موبایل لازم است.</p><a class="btn btn--primary" href="business.html#register">ثبت کسب‌وکار</a></div>`; },
      settings: () => u ? `<form class="form-card" id="setForm" novalidate style="max-width:560px"><h2>تنظیمات حساب</h2><p>این اطلاعات در این نسخه نمایشی فقط در همین مرورگر ذخیره می‌شود.</p><div class="f"><label for="sName">نام نمایشی</label><input class="input" id="sName" required value="${BK.esc(u.name)}"></div><div class="form-actions"><button class="btn btn--primary">ذخیره</button><button type="button" class="btn btn--danger" id="logout">${ico('logout')}خروج از حساب</button></div></form>` : `<div class="empty-state">${ico('lock')}<h3>ابتدا وارد شوید</h3><a class="btn btn--primary" href="login.html">ورود</a></div>`
    };
    const show = k => {
      $$('#ptabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === k)); history.replaceState(null, '', '#' + k);
      fill('#ptab', panels[k]()); BK.hydrateIcons($('#ptab'));
      $('#setForm')?.addEventListener('submit', e => { e.preventDefault(); if (!BK.validate(e.target)) return; BK.login(u.mobile, $('#sName').value.trim()); BK.toast('ذخیره شد'); setTimeout(() => location.reload(), 400); });
      $('#logout')?.addEventListener('click', () => { BK.logout(); location.href = 'index.html'; });
    };
    $('#ptabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.t); });
    show(['favs', 'reviews', 'biz', 'settings'].includes(BK.hashTokens()[0]) ? BK.hashTokens()[0] : 'favs');
    document.addEventListener('bk:review', () => show('reviews'));
    document.addEventListener('bk:favs', () => { if ($('#ptabs [aria-selected="true"]').dataset.t === 'favs') setTimeout(() => show('favs'), 300); });
  };

  /* =========================================================
     BUSINESS DASHBOARD (demo)
     ========================================================= */
  R.dashboard = () => {
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'], v = [420, 510, 468, 602, 655, 810, 760];
    const W = 640, H = 240, pl = 44, pr = 16, pt = 16, pb = 32, max = 900, x = i => W - pr - i * ((W - pl - pr) / 6), y = n => pt + (1 - n / max) * (H - pt - pb);
    const path = v.map((n, i) => `${i ? 'L' : 'M'}${x(i)} ${y(n)}`).join(' ');
    fill('#chart', `${[0, 300, 600, 900].map(t => `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end">${BK.fa(t)}</text>`).join('')}${days.map((d, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${d}</text>`).join('')}<path class="ar" d="${path} L${x(6)} ${y(0)} L${x(0)} ${y(0)}Z"/><path class="ln" d="${path}"/>${v.map((n, i) => `<circle class="dot" cx="${x(i)}" cy="${y(n)}" r="${i === 5 ? 6 : 4}"><title>${days[i]}: ${BK.fa(n)} بازدید</title></circle>`).join('')}<text x="${x(5)}" y="${y(810) - 12}" text-anchor="middle" style="fill:var(--j-800);font-weight:800">${BK.fa(810)}</text>`);
    fill('#dReviews', BK.publicReviews(8).slice(0, 3).map(r => BK.rcard(r, { place: false })).join(''));
  };

  /* =========================================================
     ABOUT / CONTACT / CAREERS
     ========================================================= */
  R.about = () => fill('#team', BK.team.map(t => `<div class="member reveal"><img src="${BK.img(t.photo)}" alt="${t.name}" loading="lazy"><b>${t.name}</b><small>${t.role}</small></div>`).join(''));
  R.contact = () => {
    $('#contactForm').addEventListener('submit', e => { e.preventDefault(); if (!BK.validate(e.target)) return; fill('#contactCard', success('پیام شما رسید', 'معمولاً ظرف یک روز کاری پاسخ می‌دهیم.', '<a class="btn btn--secondary" href="index.html">بازگشت به خانه</a>')); BK.hydrateIcons($('#contactCard')); });
    fill('#cFaq', BK.faq.slice(0, 4).map(([q, a]) => `<details><summary>${q}${ico('chevron')}</summary><div class="faq__a">${a}</div></details>`).join(''));
  };
  R.careers = () => {
    fill('#jobs', BK.jobs.map((j, i) => `<details ${i ? '' : 'open'}><summary><span><b>${j.title}</b><br><small class="muted">${j.type} · ${j.place}</small></span>${ico('chevron')}</summary><div class="faq__a"><p>${j.desc}</p><ul>${j.req.map(r => `<li>${r}</li>`).join('')}</ul><a href="#apply" class="btn btn--primary btn--sm" data-job="${j.title}">درخواست برای این موقعیت</a></div></details>`).join(''));
    $('#aJob').innerHTML = BK.jobs.map(j => `<option>${j.title}</option>`).join('');
    document.addEventListener('click', e => { const b = e.target.closest('[data-job]'); if (b) $('#aJob').value = b.dataset.job; });
    $('#applyForm').addEventListener('submit', e => { e.preventDefault(); if (!BK.validate(e.target)) return; fill('#applyCard', success('درخواست شما ثبت شد', 'رزومه را بررسی می‌کنیم و در صورت هم‌خوانی برای مصاحبه تماس می‌گیریم.')); BK.hydrateIcons($('#applyCard')); });
  };

  (R[page] || (() => {}))();
  BK.boot();
})();
