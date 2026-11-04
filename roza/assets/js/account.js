/* ROZA — حساب کاربری مشتری (نسخه نمایشی)
   ورود با موبایل و کد آزمایشی، نوبت‌های پیش رو و گذشته، لغو و تغییر زمان، ویرایش اطلاعات.
   همه‌چیز فقط در مرورگر همین دستگاه ذخیره می‌شود. در نسخه واقعی، ارسال و بررسی کد،
   نشست کاربر و فهرست نوبت‌ها باید سمت سرور انجام شود. */
(function () {
  'use strict';
  var R = window.ROZA, U = R.ui, J = R.J;
  var USER_KEY = 'roza-user', DEMO_CODE = '12345', RESEND = 60;

  function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function normMobile(v) { return U.toEn(v || '').replace(/[\s\-()]/g, '').replace(/^\+98/, '0').replace(/^0098/, '0'); }
  function validMobile(v) { return /^09\d{9}$/.test(normMobile(v)); }

  function bookingTime(b) { var d = U.fromKey(b.date); d.setMinutes(b.time); return d; }
  function hoursUntil(b) { return (bookingTime(b) - Date.now()) / 36e5; }
  function bookings(mobile) {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('roza-booking-') === 0) { var b = get(k); if (b && b.mobile === mobile) out.push(b); }
      }
    } catch (e) { /* ذخیره‌سازی در دسترس نیست */ }
    return out.sort(function (a, b) { return bookingTime(a) - bookingTime(b); });
  }
  function saveBooking(b) { return put('roza-booking-' + b.code, b); }

  var A = R.account = {
    user: function () { return get(USER_KEY); },
    save: function (u) { return put(USER_KEY, u); },
    logout: function () { try { localStorage.removeItem(USER_KEY); } catch (e) { /* */ } },
    bookings: bookings, saveBooking: saveBooking, hoursUntil: hoursUntil, normMobile: normMobile,
    get: function (code) { return get('roza-booking-' + code); }
  };

  /* ---------- صفحه حساب ---------- */
  var root, state = { step: 'mobile', mobile: '', timer: null, left: 0, tab: 'upcoming' };

  function render() {
    var u = A.user();
    var head = document.getElementById('accHead');
    if (head) head.innerHTML = u ? headIn(u) : headOut();
    root.innerHTML = u ? dashboard(u) : login();
    bind();
    if (R.ui.initReveal && !R.motionOn) R.ui.initReveal();
  }
  function headOut() {
    return '<nav class="crumbs" aria-label="مسیر صفحه"><a href="index.html">خانه</a>' + U.icon('chev-left') + '<span aria-current="page">حساب من</span></nav>' +
      '<h1>ورود به حساب</h1><p>با شماره موبایل وارد شوید تا نوبت‌هایتان را ببینید، تغییر دهید یا لغو کنید.</p>';
  }
  function headIn(u) {
    return '<nav class="crumbs" aria-label="مسیر صفحه"><a href="index.html">خانه</a>' + U.icon('chev-left') + '<span aria-current="page">حساب من</span></nav>' +
      '<div class="acc-head"><div class="acc-head__avatar" aria-hidden="true">' + U.esc((u.name || 'م').trim().charAt(0)) + '</div>' +
      '<div><h1>' + (u.name ? 'سلام، ' + U.esc(u.name.split(' ')[0]) : 'حساب من') + '</h1><p dir="ltr" class="acc-head__mobile">' + U.fa(u.mobile) + '</p></div>' +
      '<button type="button" class="btn btn--ghost btn--sm acc-head__out" data-logout>خروج از حساب</button></div>';
  }

  /* ورود */
  function login() {
    var html = '<div class="auth" data-reveal>';
    if (state.step === 'mobile') {
      html += '<form class="form auth__form" id="authMobile" novalidate>' +
        '<div class="auth__ico">' + U.icon('user') + '</div><h2>شماره موبایل</h2>' +
        '<p class="auth__sub">کد تأیید به این شماره ارسال می‌شود.</p>' +
        '<div class="field"><label for="a-mobile">شماره موبایل</label>' +
        '<input id="a-mobile" name="mobile" type="tel" inputmode="numeric" autocomplete="tel" dir="ltr" maxlength="13" placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰" value="' + U.esc(state.mobile) + '" aria-describedby="e-a-mobile" required>' +
        '<p class="field__err" id="e-a-mobile" hidden></p></div>' +
        '<button class="btn btn--primary btn--block" type="submit">دریافت کد تأیید</button>' +
        '<p class="demo-note">' + U.icon('info') + '<span>نسخه نمایشی: پیامکی ارسال نمی‌شود و کد آزمایشی در مرحله بعد نمایش داده می‌شود.</span></p></form>';
    } else {
      html += '<form class="form auth__form" id="authCode" novalidate>' +
        '<div class="auth__ico">' + U.icon('shield') + '</div><h2>کد تأیید</h2>' +
        '<p class="auth__sub">کد ۵ رقمی ارسال‌شده به <span dir="ltr">' + U.fa(state.mobile) + '</span> را وارد کنید. ' +
        '<button type="button" class="btn btn--link btn--inline" data-edit-mobile>ویرایش شماره</button></p>' +
        '<div class="demo-code" role="note">' + U.icon('info') + '<span>نسخه نمایشی؛ کد آزمایشی: <strong dir="ltr">' + U.fa(DEMO_CODE) + '</strong></span></div>' +
        '<div class="field"><label for="a-code">کد تأیید</label>' +
        '<input id="a-code" name="code" class="otp" type="text" inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="5" placeholder="- - - - -" aria-describedby="e-a-code" required>' +
        '<p class="field__err" id="e-a-code" hidden></p></div>' +
        '<button class="btn btn--primary btn--block" type="submit" id="verifyBtn">ورود</button>' +
        '<p class="auth__resend" aria-live="polite">' + resendHtml() + '</p></form>';
    }
    return html + '</div>';
  }
  function resendHtml() {
    return state.left > 0 ? 'ارسال دوباره کد تا ' + U.fa(Math.floor(state.left / 60) + ':' + ((state.left % 60) < 10 ? '0' : '') + (state.left % 60)) + ' دیگر'
      : '<button type="button" class="btn btn--link btn--inline" data-resend>ارسال دوباره کد</button>';
  }
  function startTimer() {
    clearInterval(state.timer); state.left = RESEND;
    state.timer = setInterval(function () {
      state.left--; var el = root.querySelector('.auth__resend');
      if (el) el.innerHTML = resendHtml();
      if (state.left <= 0) clearInterval(state.timer);
    }, 1000);
  }
  function fieldErr(id, msg) {
    var input = document.getElementById(id), e = document.getElementById('e-' + id);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    input.closest('.field').classList.toggle('is-invalid', !!msg);
    e.hidden = !msg; e.innerHTML = msg ? U.icon('alert') + '<span>' + msg + '</span>' : '';
    if (msg) input.focus();
  }

  /* داشبورد */
  function dashboard(u) {
    var all = bookings(u.mobile), now = [], past = [];
    all.forEach(function (b) { (b.status !== 'cancelled' && b.status !== 'rescheduled' && hoursUntil(b) > 0 ? now : past).push(b); });
    past.reverse();
    var tabs = [['upcoming', 'نوبت‌های پیش رو', now.length], ['past', 'گذشته و لغوشده', past.length], ['info', 'اطلاعات من', null]];
    return '<div class="acc">' +
      '<div class="tabs" role="tablist" aria-label="بخش‌های حساب">' + tabs.map(function (t) {
        var on = state.tab === t[0];
        return '<button type="button" role="tab" class="tab" id="tab-' + t[0] + '" aria-controls="panel-' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' +
          t[1] + (t[2] != null ? '<span class="tab__n">' + U.fa(t[2]) + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<section class="tabpanel" role="tabpanel" id="panel-upcoming" aria-labelledby="tab-upcoming"' + (state.tab === 'upcoming' ? '' : ' hidden') + '>' +
      (now.length ? '<div class="bkc-list">' + now.map(card).join('') + '</div>' : empty('هنوز نوبت پیش رویی ندارید.', 'زمان مناسب را انتخاب کنید؛ نوبت‌های شما اینجا نمایش داده می‌شوند.')) + '</section>' +
      '<section class="tabpanel" role="tabpanel" id="panel-past" aria-labelledby="tab-past"' + (state.tab === 'past' ? '' : ' hidden') + '>' +
      (past.length ? '<div class="bkc-list">' + past.map(card).join('') + '</div>' : empty('نوبت گذشته‌ای ثبت نشده است.', 'پس از مراجعه، سابقه نوبت‌ها اینجا می‌ماند.')) + '</section>' +
      '<section class="tabpanel" role="tabpanel" id="panel-info" aria-labelledby="tab-info"' + (state.tab === 'info' ? '' : ' hidden') + '>' + infoForm(u) + '</section>' +
      '<p class="demo-note acc__demo">' + U.icon('info') + '<span>نسخه نمایشی: نوبت‌ها و اطلاعات حساب فقط در مرورگر همین دستگاه ذخیره می‌شوند و به سالن ارسال نمی‌شوند.</span></p>' +
      '</div>' + dialog();
  }
  function empty(t, s) {
    return '<div class="acc-empty" data-reveal>' + U.icon('calendar') + '<h2>' + t + '</h2><p>' + s + '</p><a class="btn btn--primary" href="booking.html">رزرو نوبت</a></div>';
  }
  var STATUS = {
    pending: ['در انتظار تأیید سالن', 'badge--est'],
    cancelled: ['لغو شده', 'badge--muted'],
    rescheduled: ['جابه‌جا شده', 'badge--muted'],
    past: ['گذشته', 'badge--muted']
  };
  function card(b) {
    var s = U.byId(R.services, b.service), sp = U.byId(R.specialists, b.assigned), d = U.fromKey(b.date), j = J.toJalali(d);
    var st = b.status === 'cancelled' || b.status === 'rescheduled' ? b.status : hoursUntil(b) <= 0 ? 'past' : 'pending';
    var active = st === 'pending';
    return '<article class="bkc' + (active ? '' : ' is-inactive') + '" data-reveal>' +
      '<div class="bkc__date" aria-hidden="true"><span class="bkc__wd">' + J.weekdays[J.weekday(d)] + '</span><strong>' + U.fa(j.jd) + '</strong><span>' + J.months[j.jm - 1] + '</span></div>' +
      '<div class="bkc__body"><div class="bkc__top"><h3>' + (s ? s.name : '') + '</h3><span class="badge ' + STATUS[st][1] + '">' + STATUS[st][0] + '</span></div>' +
      '<p class="bkc__meta"><span>' + U.icon('calendar') + U.longDate(d) + '، ساعت ' + U.time(b.time) + '</span>' +
      '<span>' + U.icon('user') + (sp ? sp.name : '') + (b.specialist === 'any' ? ' (اولین متخصص آزاد)' : '') + '</span>' +
      '<span>' + U.icon('clock') + (s ? U.duration(s.duration) : '') + '</span></p>' +
      '<p class="bkc__price"><span>' + (b.priceType === 'estimate' ? 'برآورد اولیه: از ' : 'هزینه: ') + U.price(b.price) + '</span>' +
      '<span>بیعانه: ' + (b.deposit ? U.price(b.deposit) : 'ندارد') + '</span>' +
      '<span>کد پیگیری: <strong dir="ltr">' + b.code + '</strong></span></p>' +
      (b.status === 'rescheduled' && b.newCode ? '<p class="bkc__note">زمان جدید با کد <strong dir="ltr">' + b.newCode + '</strong> ثبت شد.</p>' : '') +
      (b.status === 'cancelled' && b.cancelNote ? '<p class="bkc__note">' + b.cancelNote + '</p>' : '') +
      (active ? '<div class="bkc__actions"><a class="btn btn--soft btn--sm" href="booking.html?service=' + b.service + '&specialist=' + b.specialist + '&reschedule=' + b.code + '">تغییر زمان</a>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-cancel="' + b.code + '">لغو نوبت</button></div>'
        : (st === 'past' ? '<div class="bkc__actions"><a class="btn btn--soft btn--sm" href="booking.html?service=' + b.service + '">رزرو دوباره</a></div>' : '')) +
      '</div></article>';
  }
  function infoForm(u) {
    return '<form class="form acc-info" id="infoForm" novalidate>' +
      '<div class="field"><label for="i-name">نام و نام خانوادگی</label><input id="i-name" name="name" type="text" autocomplete="name" value="' + U.esc(u.name || '') + '" aria-describedby="e-i-name" required><p class="field__err" id="e-i-name" hidden></p></div>' +
      '<div class="field"><label for="i-mobile">شماره موبایل</label><input id="i-mobile" type="tel" dir="ltr" value="' + U.fa(u.mobile) + '" readonly aria-describedby="h-i-mobile"><p class="field__help" id="h-i-mobile">برای تغییر شماره، از حساب خارج شوید و با شماره جدید وارد شوید.</p></div>' +
      '<div class="field"><label for="i-notes">نکات مهم برای سالن <span class="opt-label">(اختیاری)</span></label><textarea id="i-notes" name="notes" rows="3" placeholder="مثلاً حساسیت پوستی، رنگ موی قبلی یا ترجیحات">' + U.esc(u.notes || '') + '</textarea><p class="field__help">این نکات هنگام رزرو به‌طور خودکار در توضیحات قرار می‌گیرد.</p></div>' +
      '<div class="field field--check"><label class="check"><input type="checkbox" name="remind" id="i-remind"' + (u.remind !== false ? ' checked' : '') + '><span class="check__box" aria-hidden="true">' + U.icon('check') + '</span><span>یادآوری پیامکی یک روز قبل از نوبت <span class="opt-label">(در نسخه واقعی)</span></span></label></div>' +
      '<div class="acc-info__foot"><button class="btn btn--primary" type="submit">ذخیره تغییرات</button><p class="acc-info__saved" id="savedMsg" role="status" aria-live="polite"></p></div></form>';
  }
  function dialog() {
    return '<div class="dlg" id="cancelDlg" hidden><div class="dlg__backdrop" data-dlg-close></div>' +
      '<div class="dlg__box" role="dialog" aria-modal="true" aria-labelledby="dlgTitle" aria-describedby="dlgBody">' +
      '<h2 id="dlgTitle">لغو نوبت</h2><div id="dlgBody"></div>' +
      '<div class="dlg__actions"><button type="button" class="btn btn--ghost" data-dlg-close>منصرف شدم</button><button type="button" class="btn btn--primary" id="dlgConfirm">لغو نوبت</button></div></div></div>';
  }

  /* ---------- رویدادها ---------- */
  var lastFocus = null, cancelCode = null;
  function bind() {
    var fm = document.getElementById('authMobile');
    if (fm) fm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = fm.mobile.value;
      if (!normMobile(v)) return fieldErr('a-mobile', 'لطفاً شماره موبایل را وارد کنید.');
      if (!validMobile(v)) return fieldErr('a-mobile', 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.');
      state.mobile = normMobile(v); state.step = 'code'; startTimer(); render();
      document.getElementById('a-code').focus();
    });
    var fc = document.getElementById('authCode');
    if (fc) {
      var code = fc.code;
      code.addEventListener('input', function () { var en = U.toEn(code.value).replace(/\D/g, '').slice(0, 5); if (en !== code.value) code.value = en; if (en.length === 5) fc.requestSubmit ? fc.requestSubmit() : null; });
      fc.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = U.toEn(code.value);
        if (v.length !== 5) return fieldErr('a-code', 'کد تأیید ۵ رقم است.');
        if (v !== DEMO_CODE) return fieldErr('a-code', 'کد واردشده درست نیست. کد آزمایشی را دوباره وارد کنید.');
        var btn = document.getElementById('verifyBtn');
        btn.classList.add('is-loading'); btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>در حال ورود…';
        setTimeout(function () {
          var list = bookings(state.mobile), last = list[list.length - 1];
          A.save({ mobile: state.mobile, name: last ? last.name : '', notes: '', remind: true, since: Date.now() });
          clearInterval(state.timer); state.step = 'mobile'; state.tab = 'upcoming';
          render(); updateHeader();
          var h = document.querySelector('#accHead h1'); if (h) { h.tabIndex = -1; h.focus(); }
        }, 600);
      });
    }
    var info = document.getElementById('infoForm');
    if (info) info.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = info.name.value.trim();
      if (name.length < 3) return fieldErr('i-name', 'نام باید دست‌کم ۳ حرف باشد.');
      fieldErr('i-name', '');
      var u = A.user(); u.name = name; u.notes = info.notes.value.trim(); u.remind = info.remind.checked;
      var ok = A.save(u);
      document.getElementById('savedMsg').innerHTML = ok ? U.icon('check') + 'تغییرات ذخیره شد.' : 'ذخیره انجام نشد؛ ذخیره‌سازی مرورگر در دسترس نیست.';
      var head = document.getElementById('accHead'); if (head) head.innerHTML = headIn(u);
      updateHeader();
    });
  }
  function onClick(e) {
    var b;
    if (e.target.closest('[data-edit-mobile]')) { state.step = 'mobile'; clearInterval(state.timer); render(); document.getElementById('a-mobile').focus(); return; }
    if (e.target.closest('[data-resend]')) { startTimer(); var el = root.querySelector('.auth__resend'); if (el) el.innerHTML = resendHtml(); document.getElementById('a-code').focus(); return; }
    if (e.target.closest('[data-logout]')) { A.logout(); state.step = 'mobile'; state.mobile = ''; render(); updateHeader(); document.getElementById('a-mobile').focus(); return; }
    if ((b = e.target.closest('[role="tab"]'))) { selectTab(b.id.replace('tab-', ''), true); return; }
    if ((b = e.target.closest('[data-cancel]'))) { openCancel(b.dataset.cancel); return; }
    if (e.target.closest('[data-dlg-close]')) { closeCancel(); return; }
    if (e.target.closest('#dlgConfirm')) { confirmCancel(); }
  }
  function selectTab(id, focus) {
    state.tab = id;
    root.querySelectorAll('[role="tab"]').forEach(function (t) {
      var on = t.id === 'tab-' + id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus();
    });
    root.querySelectorAll('[role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== 'panel-' + id; });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  function onKey(e) {
    var t = e.target.closest('[role="tab"]');
    if (t) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]')), i = tabs.indexOf(t), n = tabs.length;
      var next = e.key === 'ArrowLeft' ? i + 1 : e.key === 'ArrowRight' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null; // RTL
      if (next !== null) { e.preventDefault(); selectTab(tabs[(next + n) % n].id.replace('tab-', ''), true); }
    }
    var dlg = document.getElementById('cancelDlg');
    if (dlg && !dlg.hidden) { if (e.key === 'Escape') closeCancel(); else U.trap(dlg.querySelector('.dlg__box'), e); }
  }
  function openCancel(code) {
    var b = A.get(code); if (!b) return;
    cancelCode = code; lastFocus = document.activeElement;
    var s = U.byId(R.services, b.service), h = hoursUntil(b), free = h >= R.policy.freeCancelHours;
    document.getElementById('dlgBody').innerHTML =
      '<p><strong>' + (s ? s.name : '') + '</strong> · ' + U.longDate(U.fromKey(b.date)) + '، ساعت ' + U.time(b.time) + '</p>' +
      '<p class="dlg__policy ' + (free ? 'is-free' : 'is-fee') + '">' + U.icon(free ? 'check' : 'alert') + '<span>' +
      (free ? 'بیش از ' + U.fa(R.policy.freeCancelHours) + ' ساعت به نوبت مانده؛ لغو بدون هزینه است' + (b.deposit ? ' و بیعانه بازگردانده می‌شود.' : '.')
        : 'کمتر از ' + U.fa(R.policy.freeCancelHours) + ' ساعت به نوبت مانده؛ طبق قوانین سالن' + (b.deposit ? ' بیعانه (' + U.price(b.deposit) + ') بازگردانده نمی‌شود.' : ' لغو ثبت می‌شود.')) + '</span></p>' +
      '<p class="dlg__demo">نسخه نمایشی: لغو فقط در همین مرورگر ثبت می‌شود و به سالن اطلاع داده نمی‌شود.</p>';
    var d = document.getElementById('cancelDlg'); d.hidden = false; document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { d.classList.add('is-open'); d.querySelector('[data-dlg-close].btn').focus(); });
  }
  function closeCancel() {
    var d = document.getElementById('cancelDlg'); if (!d) return;
    d.classList.remove('is-open'); document.body.classList.remove('no-scroll');
    setTimeout(function () { d.hidden = true; }, 200);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function confirmCancel() {
    var b = A.get(cancelCode); if (!b) return closeCancel();
    var free = hoursUntil(b) >= R.policy.freeCancelHours;
    b.status = 'cancelled'; b.cancelledAt = Date.now();
    b.cancelNote = free ? 'لغو بدون هزینه' + (b.deposit ? '؛ بیعانه قابل بازگشت.' : '.') : (b.deposit ? 'لغو کمتر از ' + U.fa(R.policy.freeCancelHours) + ' ساعت مانده؛ بیعانه بازگردانده نمی‌شود.' : 'لغو شد.');
    saveBooking(b);
    document.body.classList.remove('no-scroll');
    state.tab = 'past'; render();
    var live = document.getElementById('accLive'); if (live) live.textContent = 'نوبت لغو شد.';
    var t = document.getElementById('tab-past'); if (t) t.focus();
  }

  /* نشانگر ورود در هدر */
  function updateHeader() {
    var u = A.user();
    document.querySelectorAll('.hdr__acc').forEach(function (a) {
      a.classList.toggle('is-auth', !!u);
      a.setAttribute('aria-label', u ? 'حساب من' + (u.name ? '، ' + u.name : '') : 'ورود به حساب');
    });
  }
  R.account.updateHeader = updateHeader;

  R.extraPages = R.extraPages || {};
  R.extraPages.profile = function () {
    root = document.getElementById('account');
    if (!root) return;
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    render();
  };
})();
