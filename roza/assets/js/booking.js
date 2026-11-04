/* ROZA — جریان رزرو مرحله‌ای (نسخه نمایشی؛ بدون بک‌اند)
   خدمت ← متخصص ← روز و ساعت ← اطلاعات تماس و تأیید
   زمان‌های پر به‌صورت قطعی (deterministic) شبیه‌سازی می‌شوند تا هر بار یکسان دیده شوند.
   برای اتصال واقعی، تابع availability را با پاسخ API جایگزین کنید. */
(function () {
  'use strict';
  var R = window.ROZA, U = R.ui, J = R.J;
  var KEY = 'roza-booking';
  var STEPS = ['انتخاب خدمت', 'انتخاب متخصص', 'روز و ساعت', 'اطلاعات و تأیید'];

  /* ---------- ذخیره وضعیت (حفظ انتخاب‌ها هنگام برگشت/بارگذاری مجدد) ---------- */
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* حالت خصوصی */ } }
  var S = load();
  S.step = S.step || 0;

  /* ---------- شبیه‌سازی زمان‌های آزاد ---------- */
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function today0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  /* سلول‌های ۳۰ دقیقه‌ای پر برای یک متخصص در یک روز */
  function busyCells(spId, date) {
    var key = spId + '|' + U.dateKey(date), r = rng(hash(key)), h = hash(key + 'd');
    var full = h % 9 === 0;            // بعضی روزها کاملاً پر
    var density = full ? 1 : 0.12 + (h % 20) / 100;
    var cells = {};
    for (var m = 0; m < 24 * 60; m += R.policy.slotStep) {
      if (full || r() < density) { cells[m] = true; if (r() < 0.3) cells[m + R.policy.slotStep] = true; }
    }
    return cells;
  }
  /* زمان‌های شروع ممکن برای خدمت + متخصص در یک روز */
  function slotsFor(svc, sp, date) {
    var wd = J.weekday(date), hours = R.salon.openHours[wd];
    var res = { status: 'ok', all: [] };
    if (!hours) { res.status = 'closed'; return res; }
    if (sp.days.indexOf(wd) === -1) { res.status = 'off'; return res; }
    var busy = busyCells(sp.id, date), step = R.policy.slotStep;
    var now = new Date(), isToday = U.dateKey(now) === U.dateKey(date), nowMin = now.getHours() * 60 + now.getMinutes() + 60;
    for (var t = hours[0] * 60; t + svc.duration <= hours[1] * 60; t += step) {
      var free = true;
      for (var c = t; c < t + svc.duration; c += step) if (busy[c]) { free = false; break; }
      var past = isToday && t < nowMin;
      res.all.push({ t: t, state: past ? 'past' : free ? 'free' : 'booked', sp: sp.id });
    }
    return res;
  }
  function eligible(svc) { return R.specialists.filter(function (p) { return p.services.indexOf(svc.id) !== -1; }); }
  /* ادغام برای «اولین متخصص آزاد» */
  function availability(svcId, spId, date) {
    var svc = U.byId(R.services, svcId);
    if (!svc) return { status: 'ok', all: [] };
    if (spId && spId !== 'any') return slotsFor(svc, U.byId(R.specialists, spId), date);
    var list = eligible(svc).map(function (p) { return slotsFor(svc, p, date); });
    if (!R.salon.openHours[J.weekday(date)]) return { status: 'closed', all: [] };
    var map = {};
    list.forEach(function (r) {
      r.all.forEach(function (s) {
        var cur = map[s.t];
        if (!cur || (cur.state !== 'free' && s.state === 'free') || (cur.state === 'booked' && s.state === 'past')) map[s.t] = s;
      });
    });
    var all = Object.keys(map).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return map[k]; });
    return { status: all.length ? 'ok' : 'off', all: all };
  }
  function freeCount(a) { return a.all.filter(function (s) { return s.state === 'free'; }).length; }
  function inWindow(d) { var t = today0(); return d >= t && d <= addDays(t, R.policy.bookingWindowDays); }
  function nextFree(svcId, spId, from) {
    for (var i = 0; i <= R.policy.bookingWindowDays; i++) {
      var d = addDays(from, i);
      if (!inWindow(d)) continue;
      var a = availability(svcId, spId, d), f = a.all.filter(function (s) { return s.state === 'free'; })[0];
      if (f) return { date: d, slot: f };
    }
    return null;
  }

  /* ---------- مقادیر مشتق ---------- */
  function svc() { return U.byId(R.services, S.service); }
  function spName(id) { if (id === 'any') return 'اولین متخصص آزاد'; var p = U.byId(R.specialists, id); return p ? p.name : ''; }
  function deposit(s) { return s && s.deposit ? Math.round(s.price * R.policy.depositPercent / 100 / 1000) * 1000 : 0; }
  function stepDone(i) {
    if (i === 0) return !!svc();
    if (i === 1) return !!S.specialist;
    if (i === 2) return !!(S.date && S.time != null);
    return false;
  }

  /* ---------- رندر ---------- */
  var root, live;
  function render() {
    save();
    root.innerHTML =
      stepperHtml() +
      '<div class="bk"><section class="bk__panel" aria-labelledby="stepTitle">' + panel() + foot() + '</section>' +
      '<aside class="bk__aside" aria-label="خلاصه رزرو">' + summary(true) + '</aside></div>';
    bind();
  }
  function canReach(i) { for (var k = 0; k < i; k++) if (!stepDone(k)) return false; return true; }

  function head(n, title, sub) {
    return (S.reschedule ? '<p class="bk__resched">' + U.icon('calendar') + '<span>در حال تغییر زمان نوبت <strong dir="ltr">' + S.reschedule + '</strong>؛ پس از تأیید، نوبت قبلی جابه‌جا شده ثبت می‌شود.</span></p>' : '') + '<header class="bk__head"><p class="bk__count">مرحله ' + U.fa(n + 1) + ' از ' + U.fa(4) + '</p>' +
      '<h2 id="stepTitle" tabindex="-1">' + title + '</h2>' + (sub ? '<p class="bk__sub">' + sub + '</p>' : '') + '</header>';
  }
  function priceLine(s) {
    return '<span class="opt__price">' + (s.priceType === 'estimate' ? 'از ' : '') + U.price(s.price) + '</span>' +
      (s.priceType === 'estimate' ? '<span class="badge badge--est">برآورد اولیه</span>' : '');
  }

  function panel() {
    var s = svc(), pref = S.prefSpecialist ? U.byId(R.specialists, S.prefSpecialist) : null;
    if (S.step === 0) {
      return head(0, 'چه خدمتی می‌خواهید؟', 'مدت و هزینه هر خدمت پیش از ادامه نمایش داده می‌شود.') +
        (pref ? '<div class="bk__pref">' + U.icon('user') + '<span>خدمات ' + pref.name + '</span><button type="button" class="btn btn--link" data-allsvc>نمایش همه خدمات</button></div>' : '') +
        '<div class="opts" role="radiogroup" aria-labelledby="stepTitle">' + R.services.filter(function (x) { return !pref || pref.services.indexOf(x.id) !== -1; }).map(function (x) {
          var on = S.service === x.id;
          return '<label class="opt opt--svc' + (on ? ' is-selected' : '') + '">' +
            '<input type="radio" name="service" value="' + x.id + '"' + (on ? ' checked' : '') + '>' +
            '<span class="media opt__img">' + U.img(x.photo, { widths: [240, 480], w: 240, sizes: '96px', width: 240, height: 240 }) + '</span>' +
            '<span class="opt__body"><span class="opt__title">' + x.name + '</span><span class="opt__desc">' + x.short + '</span>' +
            '<span class="opt__meta"><span>' + U.icon('clock') + 'حدود ' + U.duration(x.duration) + '</span>' + priceLine(x) +
            (x.deposit ? '<span class="opt__dep">' + U.icon('tag') + 'بیعانه ' + U.fa(R.policy.depositPercent) + '٪</span>' : '') + '</span></span>' +
            '<span class="opt__check" aria-hidden="true">' + U.icon('check') + '</span></label>';
        }).join('') + '</div>' +
        (s && s.priceType === 'estimate' ? '<p class="note bk__note">' + U.icon('info') + '<span>' + R.policy.priceText + '</span></p>' : '');
    }
    if (S.step === 1) {
      var list = eligible(s), today = today0();
      var anyNext = nextFree(s.id, 'any', today);
      var opts = [{ id: 'any', name: 'اولین متخصص آزاد', role: 'زودترین زمان ممکن، با هر متخصصی که آزاد باشد', next: anyNext }]
        .concat(list.map(function (p) { return { id: p.id, name: p.name, role: p.role, photo: p.photo, next: nextFree(s.id, p.id, today) }; }));
      return head(1, 'با کدام متخصص؟', 'برای «' + s.name + '» این متخصصان در دسترس‌اند.') +
        '<div class="opts opts--pro" role="radiogroup" aria-labelledby="stepTitle">' + opts.map(function (o) {
          var on = S.specialist === o.id, nx = o.next;
          return '<label class="opt opt--pro' + (on ? ' is-selected' : '') + (nx ? '' : ' is-disabled') + '">' +
            '<input type="radio" name="specialist" value="' + o.id + '"' + (on ? ' checked' : '') + (nx ? '' : ' disabled') + '>' +
            (o.photo ? '<span class="media opt__avatar">' + U.img(o.photo, { widths: [160, 320], w: 160, sizes: '64px', width: 160, height: 160, alt: '' }) + '</span>'
              : '<span class="opt__avatar opt__avatar--any">' + U.icon('users') + '</span>') +
            '<span class="opt__body"><span class="opt__title">' + o.name + '</span><span class="opt__desc">' + o.role + '</span>' +
            '<span class="opt__next">' + (nx ? U.icon('calendar') + 'اولین زمان آزاد: ' + shortDate(nx.date) + '، ساعت ' + U.time(nx.slot.t) : 'تا ' + U.fa(R.policy.bookingWindowDays) + ' روز آینده زمان آزاد ندارد') + '</span></span>' +
            '<span class="opt__check" aria-hidden="true">' + U.icon('check') + '</span></label>';
        }).join('') + '</div>';
    }
    if (S.step === 2) {
      return head(2, 'چه روز و ساعتی؟', 'زمان‌ها بر اساس مدت خدمت (' + U.duration(s.duration) + ') و برنامه ' + (S.specialist === 'any' ? 'همه متخصصان' : spName(S.specialist)) + ' محاسبه شده‌اند.') +
        '<div class="sched"><div class="cal" id="cal">' + calendar() + '</div><div class="slots" id="slots" aria-live="polite">' + slots() + '</div></div>';
    }
    /* مرحله ۴ */
    var f = S.form || {};
    return head(3, 'اطلاعات تماس و تأیید', 'برای هماهنگی و ارسال تأیید نوبت، نام و شماره موبایل لازم است.') +
      '<form class="form" id="bkForm" novalidate>' +
      '<div class="err-summary" id="errSummary" role="alert" tabindex="-1" hidden></div>' +
      field('name', 'نام و نام خانوادگی', 'text', f.name, 'autocomplete="name"', 'مثلاً: سارا محمدی') +
      field('mobile', 'شماره موبایل', 'tel', f.mobile, 'autocomplete="tel" inputmode="numeric" dir="ltr" maxlength="13"', '۰۹۱۲ ۰۰۰ ۰۰۰۰', 'شماره ۱۱ رقمی که با ۰۹ شروع می‌شود.') +
      '<div class="field"><label for="f-note">توضیحات <span class="opt-label">(اختیاری)</span></label>' +
      '<textarea id="f-note" name="note" rows="3" placeholder="مثلاً حساسیت پوستی یا مدل موردنظر">' + U.esc(f.note || '') + '</textarea></div>' +
      '<div class="review-box">' + summary(false) + '</div>' +
      '<div class="policy"><h3>' + U.icon('shield') + 'قوانین لغو و تغییر</h3><p>' + R.policy.cancelText + '</p></div>' +
      '<div class="field field--check"><label class="check"><input type="checkbox" name="agree" id="f-agree"' + (f.agree ? ' checked' : '') + ' aria-describedby="e-agree">' +
      '<span class="check__box" aria-hidden="true">' + U.icon('check') + '</span><span>قوانین لغو و تغییر نوبت را خواندم و می‌پذیرم.</span></label>' +
      '<p class="field__err" id="e-agree" hidden></p></div>' +
      '<p class="demo-note">' + U.icon('info') + '<span>این نسخه آزمایشی است: با تأیید، نوبتی در سالن ثبت نمی‌شود، پیامکی ارسال نمی‌شود و پرداختی انجام نمی‌شود.</span></p>' +
      '</form>';
  }
  function field(name, label, type, val, attrs, ph, help) {
    return '<div class="field"><label for="f-' + name + '">' + label + '</label>' +
      '<input id="f-' + name + '" name="' + name + '" type="' + type + '" value="' + U.esc(val || '') + '" ' + attrs + ' placeholder="' + ph + '" aria-describedby="' + (help ? 'h-' + name + ' ' : '') + 'e-' + name + '" required>' +
      (help ? '<p class="field__help" id="h-' + name + '">' + help + '</p>' : '') +
      '<p class="field__err" id="e-' + name + '" hidden></p></div>';
  }
  function shortDate(d) { var j = J.toJalali(d); return J.weekdays[J.weekday(d)] + ' ' + U.fa(j.jd) + ' ' + J.months[j.jm - 1]; }

  /* ---------- تقویم شمسی ---------- */
  var view = null; // {jy, jm}
  function calendar() {
    var t = today0(), tj = J.toJalali(t), end = addDays(t, R.policy.bookingWindowDays), ej = J.toJalali(end);
    if (!view) { var sel = S.date ? J.toJalali(U.fromKey(S.date)) : tj; view = { jy: sel.jy, jm: sel.jm }; }
    var first = J.toDate(view.jy, view.jm, 1), lead = J.weekday(first), len = J.monthLength(view.jy, view.jm);
    var atStart = view.jy === tj.jy && view.jm === tj.jm, atEnd = view.jy === ej.jy && view.jm === ej.jm;
    var cells = '';
    for (var i = 0; i < lead; i++) cells += '<span class="cal__blank" aria-hidden="true"></span>';
    for (var d = 1; d <= len; d++) {
      var date = J.toDate(view.jy, view.jm, d), key = U.dateKey(date), ok = inWindow(date), cls = 'cal__day', label = U.longDate(date), dis = !ok, mark = '';
      if (ok) {
        var a = availability(S.service, S.specialist, date), n = freeCount(a);
        if (a.status === 'closed') { dis = true; cls += ' is-closed'; label += '، تعطیل'; }
        else if (!n) { cls += ' is-full'; label += '، بدون زمان آزاد'; mark = '<span class="cal__mark">تکمیل</span>'; }
        else { label += '، ' + U.fa(n) + ' زمان آزاد'; mark = '<span class="cal__dot" aria-hidden="true"></span>'; }
      } else cls += ' is-out';
      if (key === U.dateKey(t)) cls += ' is-today';
      if (S.date === key) cls += ' is-selected';
      cells += '<button type="button" class="' + cls + '" data-date="' + key + '"' + (dis ? ' disabled' : '') + ' aria-pressed="' + (S.date === key) + '" aria-label="' + label + '">' +
        '<span>' + U.fa(d) + '</span>' + mark + '</button>';
    }
    return '<div class="cal__head"><button type="button" class="icon-btn" data-cal="-1" aria-label="ماه قبل"' + (atStart ? ' disabled' : '') + '>' + U.icon('chev-right') + '</button>' +
      '<h3 class="cal__title" aria-live="polite">' + J.months[view.jm - 1] + ' ' + U.fa(view.jy) + '</h3>' +
      '<button type="button" class="icon-btn" data-cal="1" aria-label="ماه بعد"' + (atEnd ? ' disabled' : '') + '>' + U.icon('chev-left') + '</button></div>' +
      '<div class="cal__grid cal__wd" aria-hidden="true">' + J.weekdaysShort.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
      '<div class="cal__grid">' + cells + '</div>' +
      '<div class="cal__legend"><span><i class="lg lg--free"></i>زمان آزاد دارد</span><span><i class="lg lg--full"></i>تکمیل</span><span><i class="lg lg--off"></i>تعطیل یا خارج از بازه</span></div>';
  }
  var loadingSlots = false;
  function slots() {
    if (!S.date) return '<div class="slots__empty">' + U.icon('calendar') + '<p>ابتدا یک روز را از تقویم انتخاب کنید.</p></div>';
    if (loadingSlots) return '<div class="slots__head"><span class="skel skel--t"></span></div><div class="slots__grid">' + new Array(9).join('<span class="skel skel--slot"></span>') + '</div>';
    var date = U.fromKey(S.date), a = availability(S.service, S.specialist, date);
    var html = '<div class="slots__head"><h3>' + U.longDate(date) + '</h3></div>';
    if (!freeCount(a)) {
      var nx = nextFree(S.service, S.specialist, addDays(date, 1));
      var why = a.status === 'off' ? 'این روز روز کاری متخصص انتخاب‌شده نیست.' : 'همه زمان‌های این روز تکمیل شده است.';
      return html + '<div class="slots__empty">' + U.icon('calendar') + '<p><strong>زمان آزادی در این روز نیست.</strong> ' + why + '</p>' +
        (nx ? '<button type="button" class="btn btn--soft" data-jump="' + U.dateKey(nx.date) + '|' + nx.slot.t + '">اولین زمان آزاد بعدی: ' + shortDate(nx.date) + '، ساعت ' + U.time(nx.slot.t) + '</button>'
          : '<p>در بازه رزرو آنلاین زمان آزادی نیست؛ لطفاً با سالن تماس بگیرید.</p>') + '</div>';
    }
    var groups = [['صبح', 0, 12 * 60], ['ظهر و بعدازظهر', 12 * 60, 16 * 60], ['عصر', 16 * 60, 24 * 60]];
    groups.forEach(function (g) {
      var items = a.all.filter(function (s) { return s.t >= g[1] && s.t < g[2]; });
      if (!items.length) return;
      html += '<div class="slots__group"><h4>' + g[0] + '</h4><div class="slots__grid">' + items.map(function (s) {
        var on = S.time === s.t, lab = s.state === 'past' ? 'گذشته' : s.state === 'booked' ? 'تکمیل' : '';
        return '<button type="button" class="slot' + (on ? ' is-selected' : '') + ' is-' + s.state + '" data-time="' + s.t + '" data-sp="' + s.sp + '"' +
          (s.state !== 'free' ? ' disabled' : '') + ' aria-pressed="' + on + '" aria-label="ساعت ' + U.time(s.t) + (lab ? '، ' + lab : '') + '">' + U.time(s.t) +
          (lab ? '<small>' + lab + '</small>' : '') + '</button>';
      }).join('') + '</div></div>';
    });
    return html;
  }

  /* ---------- خلاصه ---------- */
  function summary(aside) {
    var s = svc();
    if (!s) return aside ? '<div class="sum"><h2 class="sum__h">خلاصه رزرو</h2><p class="sum__empty">هنوز خدمتی انتخاب نشده است.</p></div>' : '';
    var rows = [
      ['خدمت', s.name],
      ['مدت تقریبی', U.duration(s.duration)],
      ['متخصص', S.specialist ? spName(S.specialist) + (S.specialist === 'any' && S.assigned && S.time != null ? '، ' + spName(S.assigned) : '') : '—'],
      ['زمان', S.date && S.time != null ? U.longDate(U.fromKey(S.date)) + '، ساعت ' + U.time(S.time) : '—']
    ];
    var dep = deposit(s);
    return '<div class="sum">' + (aside ? '<h2 class="sum__h">خلاصه رزرو</h2>' : '<h3 class="sum__h">خلاصه نوبت</h3>') +
      '<dl class="sum__list">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="sum__price"><div><span>' + (s.priceType === 'estimate' ? 'هزینه (برآورد اولیه)' : 'هزینه') + '</span><strong>' + (s.priceType === 'estimate' ? 'از ' : '') + U.price(s.price) + '</strong></div>' +
      (dep ? '<div><span>بیعانه (' + U.fa(R.policy.depositPercent) + '٪)</span><strong>' + U.price(dep) + '</strong></div>' : '<div><span>بیعانه</span><strong>ندارد</strong></div>') + '</div>' +
      (s.priceType === 'estimate' ? '<p class="note">' + U.icon('info') + '<span>قیمت نهایی پس از مشاوره حضوری و بر اساس شرایط مو یا پوست مشخص می‌شود.</span></p>' : '') +
      '</div>';
  }
  function foot() {
    var s = svc(), ok = stepDone(S.step), last = S.step === 3;
    var compact = s ? '<button type="button" class="bk-foot__sum" id="sumToggle" aria-expanded="false" aria-controls="sumSheet">' +
      '<span><strong>' + s.name + '</strong><small>' + (S.date && S.time != null ? shortDate(U.fromKey(S.date)) + ' · ' + U.time(S.time) : U.duration(s.duration)) + ' · ' + (s.priceType === 'estimate' ? 'از ' : '') + U.price(s.price) + '</small></span>' +
      U.icon('chev-down', 'bk-foot__chev') + '</button><div class="bk-foot__sheet" id="sumSheet" hidden>' + summary(false) + '</div>' : '';
    return '<div class="bk-foot">' + compact + '<div class="bk-foot__btns">' +
      (S.step > 0 ? '<button type="button" class="btn btn--ghost" data-back>' + U.icon('arrow-right') + 'قبلی</button>' : '<a class="btn btn--ghost" href="services.html">' + U.icon('arrow-right') + 'خدمات</a>') +
      (last ? '<button type="submit" form="bkForm" class="btn btn--primary bk-foot__next" id="submitBtn">تأیید رزرو آزمایشی</button>'
        : '<button type="button" class="btn btn--primary bk-foot__next" data-next' + (ok ? '' : ' disabled aria-disabled="true"') + '>ادامه' + U.icon('arrow-left') + '</button>') +
      '</div>' + (!ok && !last ? '<p class="bk-foot__hint">' + ['برای ادامه یک خدمت انتخاب کنید.', 'برای ادامه یک متخصص یا «اولین متخصص آزاد» را انتخاب کنید.', 'برای ادامه روز و ساعت را انتخاب کنید.'][S.step] + '</p>' : '') + '</div>';
  }

  /* ---------- رویدادها ---------- */
  function go(step, focus) {
    S.step = step; render();
    if (focus !== false) {
      var h = document.getElementById('stepTitle');
      var top = root.getBoundingClientRect().top + window.scrollY - 88;
      if (window.scrollY > top) { if (R.lenis) R.lenis.scrollTo(top); else window.scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
      if (h) h.focus({ preventScroll: true });
    }
  }
  function bindFoot() {
    var t = document.getElementById('sumToggle');
    if (t) t.addEventListener('click', function () {
      var sh = document.getElementById('sumSheet'), open = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', String(!open)); sh.hidden = open;
    });
  }
  function bind() {
    bindFoot();
    root.querySelectorAll('input[name="service"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (S.service !== r.value) {
          S.service = r.value;
          var s = svc();
          if (S.specialist && S.specialist !== 'any' && eligible(s).every(function (p) { return p.id !== S.specialist; })) S.specialist = null;
          S.time = null; S.assigned = null;
        }
        render(); var el = root.querySelector('input[name="service"]:checked'); if (el) el.focus();
      });
    });
    root.querySelectorAll('input[name="specialist"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (S.specialist !== r.value) { S.specialist = r.value; S.time = null; S.assigned = null; }
        render(); var el = root.querySelector('input[name="specialist"]:checked'); if (el) el.focus();
      });
    });
    var form = document.getElementById('bkForm');
    if (form) bindForm(form);
  }
  function onClick(e) {
    var b;
    if ((b = e.target.closest('[data-next]')) && !b.disabled) { go(S.step + 1); return; }
    if (e.target.closest('[data-back]')) { go(S.step - 1); return; }
    if (e.target.closest('[data-allsvc]')) { S.prefSpecialist = null; S.specialist = null; render(); var h = document.getElementById('stepTitle'); if (h) h.focus(); return; }
    if ((b = e.target.closest('[data-goto]')) && !b.disabled) { go(+b.dataset.goto); return; }
    if ((b = e.target.closest('[data-cal]')) && !b.disabled) {
      var m = view.jm + (+b.dataset.cal), y = view.jy;
      if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
      view = { jy: y, jm: m };
      document.getElementById('cal').innerHTML = calendar();
      var same = root.querySelector('[data-cal="' + b.dataset.cal + '"]');
      (same && !same.disabled ? same : root.querySelector('[data-cal]:not([disabled])')).focus();
      return;
    }
    if ((b = e.target.closest('[data-date]')) && !b.disabled) {
      if (S.date !== b.dataset.date) { S.date = b.dataset.date; S.time = null; S.assigned = null; }
      loadingSlots = true; save();
      document.getElementById('cal').innerHTML = calendar();
      document.getElementById('slots').innerHTML = slots();
      root.querySelector('[data-date="' + S.date + '"]').focus();
      setTimeout(function () { loadingSlots = false; partial(); }, 260);
      return;
    }
    if ((b = e.target.closest('[data-time]')) && !b.disabled) {
      S.time = +b.dataset.time; S.assigned = b.dataset.sp; partial('[data-time="' + S.time + '"]');
      return;
    }
    if ((b = e.target.closest('[data-jump]'))) {
      var p = b.dataset.jump.split('|'), d = U.fromKey(p[0]), j = J.toJalali(d);
      S.date = p[0]; view = { jy: j.jy, jm: j.jm };
      var a = availability(S.service, S.specialist, d), sl = a.all.filter(function (s) { return s.t === +p[1]; })[0];
      S.time = +p[1]; S.assigned = sl ? sl.sp : null;
      partial('[data-time="' + S.time + '"]');
      live.textContent = 'اولین زمان آزاد انتخاب شد: ' + U.longDate(d) + '، ساعت ' + U.time(S.time);
    }
  }
  /* به‌روزرسانی بخشی بدون از دست رفتن فوکوس */
  function partial(focusSel) {
    save();
    document.getElementById('cal').innerHTML = calendar();
    document.getElementById('slots').innerHTML = slots();
    root.querySelector('.bk__aside').innerHTML = summary(true);
    var f = root.querySelector('.bk-foot'); f.outerHTML = foot(); bindFoot();
    root.querySelector('.stepper').outerHTML = stepperHtml();
    if (focusSel) { var el = root.querySelector(focusSel); if (el) el.focus(); }
  }
  function stepperHtml() {
    return '<ol class="stepper" aria-label="مراحل رزرو">' + STEPS.map(function (t, i) {
      var done = i < S.step && stepDone(i), cur = i === S.step, can = i < S.step || (i > S.step && canReach(i));
      return '<li class="stepper__item' + (cur ? ' is-current' : '') + (done ? ' is-done' : '') + '">' +
        '<button type="button" data-goto="' + i + '"' + (cur ? ' aria-current="step"' : '') + (can && !cur ? '' : ' disabled') + '>' +
        '<span class="stepper__n">' + (done ? U.icon('check') : U.fa(i + 1)) + '</span><span class="stepper__t">' + t + '</span></button></li>';
    }).join('') + '</ol>';
  }

  /* ---------- فرم و اعتبارسنجی ---------- */
  function normMobile(v) { return U.toEn(v).replace(/[\s\-()]/g, '').replace(/^\+98/, '0').replace(/^0098/, '0'); }
  function validate(name, v) {
    if (name === 'name') { v = v.trim(); if (!v) return 'لطفاً نام خود را وارد کنید.'; if (v.length < 3) return 'نام باید دست‌کم ۳ حرف باشد.'; return ''; }
    if (name === 'mobile') { var m = normMobile(v); if (!m) return 'لطفاً شماره موبایل را وارد کنید.'; if (!/^09\d{9}$/.test(m)) return 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود؛ مثل ۰۹۱۲۳۴۵۶۷۸۹.'; return ''; }
    if (name === 'agree') return v ? '' : 'برای ثبت نوبت، پذیرش قوانین لغو لازم است.';
    return '';
  }
  function showErr(form, name, msg) {
    var input = form.querySelector('[name="' + name + '"]'), e = document.getElementById('e-' + name);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    e.hidden = !msg; e.innerHTML = msg ? U.icon('alert') + '<span>' + msg + '</span>' : '';
    input.closest('.field').classList.toggle('is-invalid', !!msg);
    input.closest('.field').classList.toggle('is-valid', !msg && name !== 'agree' && input.value.trim() !== '');
  }
  function bindForm(form) {
    S.form = S.form || {};
    var touched = {};
    ['name', 'mobile'].forEach(function (n) {
      var el = form.querySelector('[name="' + n + '"]');
      el.addEventListener('blur', function () { touched[n] = true; if (el.value.trim()) showErr(form, n, validate(n, el.value)); });
      el.addEventListener('input', function () {
        if (n === 'mobile') { var cur = el.value, en = U.toEn(cur); if (en !== cur) el.value = en; }
        S.form[n] = el.value; save();
        if (touched[n] || el.getAttribute('aria-invalid') === 'true') showErr(form, n, validate(n, el.value));
      });
    });
    form.querySelector('[name="note"]').addEventListener('input', function (e) { S.form.note = e.target.value; save(); });
    form.querySelector('[name="agree"]').addEventListener('change', function (e) { S.form.agree = e.target.checked; save(); showErr(form, 'agree', validate('agree', e.target.checked)); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errs = [];
      [['name', form.name.value], ['mobile', form.mobile.value], ['agree', form.agree.checked]].forEach(function (p) {
        var m = validate(p[0], p[1]); showErr(form, p[0], m); if (m) errs.push([p[0], m]);
      });
      var sum = document.getElementById('errSummary');
      if (errs.length) {
        sum.hidden = false;
        sum.innerHTML = '<p>' + U.icon('alert') + '<strong>لطفاً ' + U.fa(errs.length) + ' مورد را اصلاح کنید:</strong></p><ul>' +
          errs.map(function (x) { return '<li><a href="#f-' + x[0] + '">' + x[1] + '</a></li>'; }).join('') + '</ul>';
        document.getElementById('f-' + errs[0][0]).focus();
        return;
      }
      sum.hidden = true;
      submit(form);
    });
  }
  function submit(form) {
    var btn = document.getElementById('submitBtn');
    btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>در حال ثبت آزمایشی…';
    setTimeout(function () {
      /* حالت خطا: اگر اتصال اینترنت قطع باشد (در نسخه واقعی: خطای API) */
      if (navigator.onLine === false) {
        btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); btn.textContent = 'تلاش دوباره';
        var sum = document.getElementById('errSummary'); sum.hidden = false;
        sum.innerHTML = '<p>' + U.icon('alert') + '<strong>ثبت انجام نشد.</strong> اتصال اینترنت را بررسی کنید و دوباره تلاش کنید. اطلاعات شما حفظ شده است.</p>';
        sum.focus();
        return;
      }
      var s = svc(), code = 'RZ-' + Math.random().toString(36).slice(2, 6).toUpperCase() + (Date.now() % 1000);
      var booking = {
        code: code, service: s.id, specialist: S.specialist, assigned: S.specialist === 'any' ? S.assigned : S.specialist,
        date: S.date, time: S.time, name: S.form.name.trim(), mobile: normMobile(S.form.mobile), note: (S.form.note || '').trim(),
        price: s.price, priceType: s.priceType, deposit: deposit(s), created: Date.now(), demo: true, status: 'pending'
      };
      try { localStorage.setItem('roza-booking-' + code, JSON.stringify(booking)); } catch (e) { /* ignore */ }
      /* تغییر زمان: نوبت قبلی جابه‌جاشده علامت می‌خورد */
      if (S.reschedule && R.account) { var old = R.account.get(S.reschedule); if (old) { old.status = 'rescheduled'; old.newCode = code; R.account.saveBooking(old); } }
      try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      location.href = 'booking-result.html?code=' + encodeURIComponent(code);
    }, 900);
  }

  /* ---------- شروع ---------- */
  function init() {
    var rs = U.qs('reschedule');
    if (rs && R.account && R.account.get(rs)) S.reschedule = rs; else if (U.qs('service') || U.qs('specialist')) S.reschedule = null;
    var u = R.account && R.account.user();
    if (u && (!S.form || !S.form.mobile)) S.form = { name: u.name || '', mobile: U.fa(u.mobile), note: u.notes || '', agree: false };
    root = document.getElementById('booking');
    if (!root) return;
    live = document.getElementById('bkLive');
    var ps = U.qs('service'), pp = U.qs('specialist');
    if (ps && U.byId(R.services, ps)) {
      if (S.service !== ps) { S.service = ps; S.time = null; S.assigned = null; if (S.specialist && S.specialist !== 'any' && !eligible(svc()).some(function (p) { return p.id === S.specialist; })) S.specialist = null; }
      S.step = 1;
      if (pp && (pp === 'any' || eligible(svc()).some(function (p) { return p.id === pp; }))) { S.specialist = pp; S.step = 2; }
      history.replaceState(null, '', 'booking.html');
    } else if (pp && U.byId(R.specialists, pp)) {
      var p = U.byId(R.specialists, pp);
      S.specialist = pp; S.prefSpecialist = pp; S.time = null; S.assigned = null;
      if (S.service && p.services.indexOf(S.service) === -1) S.service = null;
      S.step = 0;
      history.replaceState(null, '', 'booking.html');
    }
    /* اعتبارسنجی وضعیت ذخیره‌شده */
    if (S.date && !inWindow(U.fromKey(S.date))) { S.date = null; S.time = null; }
    while (S.step > 0 && !canReach(S.step)) S.step--;
    root.addEventListener('click', onClick);
    render();
  }
  R.booking = { init: init, availability: availability };
})();
