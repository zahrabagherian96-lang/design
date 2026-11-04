/* ROZA (وردپرس) — حساب کاربری مشتری
   ورود با موبایل و کد یک‌بارمصرف (/otp/send، /otp/verify)، نوبت‌های من (/me)،
   لغو (/me/cancel)، ویرایش اطلاعات (POST /me) و خروج (/logout). */
(function () {
  'use strict';
  var R = window.ROZA, U = R.ui, J = R.J;
  var root, state = { step: 'mobile', mobile: '', timer: null, left: 0, tab: 'upcoming', me: null, demoCode: null };

  function url(base, params) {
    var u = new URL(base, location.href);
    Object.keys(params).forEach(function (k) { if (params[k]) u.searchParams.set(k, params[k]); });
    return u.toString();
  }
  function setAuthDot(on) { document.querySelectorAll('.hdr__acc').forEach(function (a) { a.classList.toggle('is-auth', on); }); }

  function render() {
    var head = document.getElementById('accHead');
    if (head) {
      var crumbs = head.querySelector('.crumbs');
      head.innerHTML = (crumbs ? crumbs.outerHTML : '') + (state.me ? headIn(state.me) : headOut());
    }
    root.innerHTML = state.me ? dashboard(state.me) : login();
    bind();
  }
  function headOut() { return '<h1>ورود به حساب</h1><p>با شماره موبایل وارد شوید تا نوبت‌هایتان را ببینید، تغییر دهید یا لغو کنید.</p>'; }
  function headIn(u) {
    return '<div class="acc-head"><div class="acc-head__avatar" aria-hidden="true">' + U.esc((u.name || 'م').trim().charAt(0)) + '</div>' +
      '<div><h1 tabindex="-1">' + (u.name ? 'سلام، ' + U.esc(u.name.split(' ')[0]) : 'حساب من') + '</h1><p dir="ltr" class="acc-head__mobile">' + U.fa(u.mobile) + '</p></div>' +
      '<button type="button" class="btn btn--ghost btn--sm acc-head__out" data-logout>خروج از حساب</button></div>';
  }

  /* ---------- ورود ---------- */
  function login() {
    var html = '<div class="auth">';
    if (state.step === 'mobile') {
      html += '<form class="form auth__form" id="authMobile" novalidate>' +
        '<div class="auth__ico">' + U.icon('user') + '</div><h2>شماره موبایل</h2><p class="auth__sub">کد تأیید به این شماره ارسال می‌شود.</p>' +
        '<div class="field"><label for="a-mobile">شماره موبایل</label>' +
        '<input id="a-mobile" name="mobile" type="tel" inputmode="numeric" autocomplete="tel" dir="ltr" maxlength="13" placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰" value="' + U.esc(state.mobile) + '" aria-describedby="e-a-mobile" required>' +
        '<p class="field__err" id="e-a-mobile" hidden></p></div>' +
        '<button class="btn btn--primary btn--block" type="submit" id="sendBtn">دریافت کد تأیید</button></form>';
    } else {
      html += '<form class="form auth__form" id="authCode" novalidate>' +
        '<div class="auth__ico">' + U.icon('shield') + '</div><h2>کد تأیید</h2>' +
        '<p class="auth__sub">کد ۵ رقمی ارسال‌شده به <span dir="ltr">' + U.fa(state.mobile) + '</span> را وارد کنید. <button type="button" class="btn btn--link btn--inline" data-edit-mobile>ویرایش شماره</button></p>' +
        (state.demoCode ? '<div class="demo-code" role="note">' + U.icon('info') + '<span>حالت نمایشی پیامک فعال است؛ کد: <strong dir="ltr">' + U.fa(state.demoCode) + '</strong></span></div>' : '') +
        '<div class="field"><label for="a-code">کد تأیید</label>' +
        '<input id="a-code" name="code" class="otp" type="text" inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="5" placeholder="- - - - -" aria-describedby="e-a-code" required>' +
        '<p class="field__err" id="e-a-code" hidden></p></div>' +
        '<button class="btn btn--primary btn--block" type="submit" id="verifyBtn">ورود</button>' +
        '<p class="auth__resend" aria-live="polite">' + resendHtml() + '</p></form>';
    }
    return html + '</div>';
  }
  function resendHtml() {
    return state.left > 0 ? 'ارسال دوباره کد تا ' + U.fa(Math.floor(state.left / 60) + ':' + (state.left % 60 < 10 ? '0' : '') + (state.left % 60)) + ' دیگر'
      : '<button type="button" class="btn btn--link btn--inline" data-resend>ارسال دوباره کد</button>';
  }
  function startTimer(sec) {
    clearInterval(state.timer); state.left = sec || 60;
    state.timer = setInterval(function () {
      state.left--; var el = root.querySelector('.auth__resend'); if (el) el.innerHTML = resendHtml();
      if (state.left <= 0) clearInterval(state.timer);
    }, 1000);
  }
  function fieldErr(id, msg) {
    var input = document.getElementById(id), e = document.getElementById('e-' + id);
    if (!input) return;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    input.closest('.field').classList.toggle('is-invalid', !!msg);
    e.hidden = !msg; e.innerHTML = msg ? U.icon('alert') + '<span>' + U.esc(msg) + '</span>' : '';
    if (msg) input.focus();
  }
  function busy(btn, on, label) {
    if (!btn) return;
    btn.disabled = on; btn.classList.toggle('is-loading', on);
    if (on) { btn.dataset.label = btn.textContent; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + label; }
    else btn.textContent = btn.dataset.label || btn.textContent;
  }
  function sendCode(mobile, btn) {
    busy(btn, true, 'در حال ارسال…');
    return U.api('otp/send', { method: 'POST', body: { mobile: mobile } }).then(function (r) {
      state.mobile = mobile; state.step = 'code'; state.demoCode = r.demoCode || null;
      startTimer(r.wait); render(); document.getElementById('a-code').focus();
    }, function (err) {
      busy(btn, false);
      if (state.step === 'mobile') fieldErr('a-mobile', err.message); else fieldErr('a-code', err.message);
    });
  }

  /* ---------- داشبورد ---------- */
  function dashboard(u) {
    var now = [], past = [];
    (u.bookings || []).forEach(function (b) { ((b.status === 'pending' || b.status === 'confirmed') && b.hoursUntil > 0 ? now : past).push(b); });
    past.reverse();
    var tabs = [['upcoming', 'نوبت‌های پیش رو', now.length], ['past', 'گذشته و لغوشده', past.length], ['info', 'اطلاعات من', null]];
    return '<div class="acc">' +
      '<div class="tabs" role="tablist" aria-label="بخش‌های حساب">' + tabs.map(function (t) {
        var on = state.tab === t[0];
        return '<button type="button" role="tab" class="tab" id="tab-' + t[0] + '" aria-controls="panel-' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' + t[1] + (t[2] != null ? '<span class="tab__n">' + U.fa(t[2]) + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      panel('upcoming', now.length ? '<div class="bkc-list">' + now.map(card).join('') + '</div>' : empty('هنوز نوبت پیش رویی ندارید.', 'زمان مناسب را انتخاب کنید؛ نوبت‌های شما اینجا نمایش داده می‌شوند.')) +
      panel('past', past.length ? '<div class="bkc-list">' + past.map(card).join('') + '</div>' : empty('نوبت گذشته‌ای ثبت نشده است.', 'پس از مراجعه، سابقه نوبت‌ها اینجا می‌ماند.')) +
      panel('info', infoForm(u)) +
      '</div>' + dialog();
  }
  function panel(id, html) { return '<section class="tabpanel" role="tabpanel" id="panel-' + id + '" aria-labelledby="tab-' + id + '"' + (state.tab === id ? '' : ' hidden') + '>' + html + '</section>'; }
  function empty(t, s) { return '<div class="acc-empty">' + U.icon('calendar') + '<h2>' + t + '</h2><p>' + s + '</p><a class="btn btn--primary" href="' + U.esc(R.urls.booking) + '">رزرو نوبت</a></div>'; }
  var STATUS = { pending: ['در انتظار تأیید سالن', 'badge--est'], confirmed: ['تأیید شده', 'badge--ok'], done: ['انجام شده', 'badge--muted'], cancelled: ['لغو شده', 'badge--muted'], rescheduled: ['جابه‌جا شده', 'badge--muted'], no_show: ['مراجعه نشد', 'badge--muted'], past: ['گذشته', 'badge--muted'] };
  function card(b) {
    var d = U.fromKey(b.date), j = J.toJalali(d);
    var st = (b.status === 'pending' || b.status === 'confirmed') && b.hoursUntil <= 0 ? 'past' : b.status;
    var active = (b.status === 'pending' || b.status === 'confirmed') && b.hoursUntil > 0;
    var lab = STATUS[st] || [st, 'badge--muted'];
    return '<article class="bkc' + (active ? '' : ' is-inactive') + '">' +
      '<div class="bkc__date" aria-hidden="true"><span class="bkc__wd">' + J.weekdays[J.weekday(d)] + '</span><strong>' + U.fa(j.jd) + '</strong><span>' + J.months[j.jm - 1] + '</span></div>' +
      '<div class="bkc__body"><div class="bkc__top"><h3>' + U.esc(b.serviceName) + '</h3><span class="badge ' + lab[1] + '">' + lab[0] + '</span></div>' +
      '<p class="bkc__meta"><span>' + U.icon('calendar') + U.longDate(d) + '، ساعت ' + U.time(b.time) + '</span>' +
      '<span>' + U.icon('user') + U.esc(b.specialistName) + (b.specialist === 'any' ? ' (اولین متخصص آزاد)' : '') + '</span>' +
      '<span>' + U.icon('clock') + U.duration(b.duration) + '</span></p>' +
      '<p class="bkc__price"><span>' + (b.priceType === 'estimate' ? 'برآورد اولیه: از ' : 'هزینه: ') + U.price(b.price) + '</span><span>بیعانه: ' + (b.deposit ? U.price(b.deposit) : 'ندارد') + '</span><span>کد پیگیری: <strong dir="ltr">' + U.esc(b.code) + '</strong></span></p>' +
      (b.status === 'rescheduled' && b.newCode ? '<p class="bkc__note">زمان جدید با کد <strong dir="ltr">' + U.esc(b.newCode) + '</strong> ثبت شد.</p>' : '') +
      (b.status === 'cancelled' && b.cancelNote ? '<p class="bkc__note">' + U.esc(b.cancelNote) + '</p>' : '') +
      (active ? '<div class="bkc__actions"><a class="btn btn--soft btn--sm" href="' + U.esc(url(R.urls.booking, { service: b.service, specialist: b.specialist, reschedule: b.code })) + '">تغییر زمان</a><button type="button" class="btn btn--ghost btn--sm" data-cancel="' + U.esc(b.code) + '">لغو نوبت</button></div>'
        : (st === 'past' || st === 'done' ? '<div class="bkc__actions"><a class="btn btn--soft btn--sm" href="' + U.esc(url(R.urls.booking, { service: b.service })) + '">رزرو دوباره</a></div>' : '')) +
      '</div></article>';
  }
  function infoForm(u) {
    return '<form class="form acc-info" id="infoForm" novalidate>' +
      '<div class="field"><label for="i-name">نام و نام خانوادگی</label><input id="i-name" name="name" type="text" autocomplete="name" value="' + U.esc(u.name || '') + '" aria-describedby="e-i-name" required><p class="field__err" id="e-i-name" hidden></p></div>' +
      '<div class="field"><label for="i-mobile">شماره موبایل</label><input id="i-mobile" type="tel" dir="ltr" value="' + U.fa(u.mobile) + '" readonly aria-describedby="h-i-mobile"><p class="field__help" id="h-i-mobile">برای تغییر شماره، از حساب خارج شوید و با شماره جدید وارد شوید.</p></div>' +
      '<div class="field"><label for="i-notes">نکات مهم برای سالن <span class="opt-label">(اختیاری)</span></label><textarea id="i-notes" name="notes" rows="3" placeholder="مثلاً حساسیت پوستی، رنگ موی قبلی یا ترجیحات">' + U.esc(u.notes || '') + '</textarea><p class="field__help">این نکات هنگام رزرو به‌طور خودکار در توضیحات قرار می‌گیرد.</p></div>' +
      '<div class="field field--check"><label class="check"><input type="checkbox" name="remind" id="i-remind"' + (u.remind !== false ? ' checked' : '') + '><span class="check__box" aria-hidden="true">' + U.icon('check') + '</span><span>یادآوری پیامکی یک روز قبل از نوبت</span></label></div>' +
      '<div class="acc-info__foot"><button class="btn btn--primary" type="submit" id="saveBtn">ذخیره تغییرات</button><p class="acc-info__saved" id="savedMsg" role="status" aria-live="polite"></p></div></form>';
  }
  function dialog() {
    return '<div class="dlg" id="cancelDlg" hidden data-lenis-prevent><div class="dlg__backdrop" data-dlg-close></div>' +
      '<div class="dlg__box" role="dialog" aria-modal="true" aria-labelledby="dlgTitle" aria-describedby="dlgBody"><h2 id="dlgTitle">لغو نوبت</h2><div id="dlgBody"></div>' +
      '<p class="field__err" id="dlgErr" hidden></p>' +
      '<div class="dlg__actions"><button type="button" class="btn btn--ghost" data-dlg-close>منصرف شدم</button><button type="button" class="btn btn--primary" id="dlgConfirm">لغو نوبت</button></div></div></div>';
  }

  /* ---------- رویدادها ---------- */
  var lastFocus = null, cancelCode = null;
  function bind() {
    var fm = document.getElementById('authMobile');
    if (fm) fm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = U.toEn(fm.mobile.value).replace(/[\s\-()]/g, '').replace(/^\+98/, '0');
      if (!v) return fieldErr('a-mobile', 'لطفاً شماره موبایل را وارد کنید.');
      if (!/^09\d{9}$/.test(v)) return fieldErr('a-mobile', 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.');
      sendCode(v, document.getElementById('sendBtn'));
    });
    var fc = document.getElementById('authCode');
    if (fc) {
      var code = fc.code, sending = false;
      code.addEventListener('input', function () { var en = U.toEn(code.value).replace(/\D/g, '').slice(0, 5); if (en !== code.value) code.value = en; if (en.length === 5 && fc.requestSubmit && !sending) fc.requestSubmit(); });
      fc.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = U.toEn(code.value);
        if (v.length !== 5) return fieldErr('a-code', 'کد تأیید ۵ رقم است.');
        var btn = document.getElementById('verifyBtn'); sending = true; busy(btn, true, 'در حال ورود…');
        U.api('otp/verify', { method: 'POST', body: { mobile: state.mobile, code: v } }).then(function (me) {
          clearInterval(state.timer); state.me = me; state.step = 'mobile'; state.tab = 'upcoming'; setAuthDot(true); render();
          var h = document.querySelector('#accHead h1'); if (h) h.focus();
        }, function (err) { sending = false; busy(btn, false); fieldErr('a-code', err.message); code.select(); });
      });
    }
    var info = document.getElementById('infoForm');
    if (info) info.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = info.name.value.trim();
      if (name.length < 3) return fieldErr('i-name', 'نام باید دست‌کم ۳ حرف باشد.');
      fieldErr('i-name', '');
      var btn = document.getElementById('saveBtn'); busy(btn, true, 'در حال ذخیره…');
      U.api('me', { method: 'POST', body: { name: name, notes: info.notes.value.trim(), remind: info.remind.checked } }).then(function (me) {
        busy(btn, false); state.me = me;
        document.getElementById('savedMsg').innerHTML = U.icon('check') + 'تغییرات ذخیره شد.';
        var head = document.getElementById('accHead'), crumbs = head.querySelector('.crumbs'); head.innerHTML = (crumbs ? crumbs.outerHTML : '') + headIn(me);
      }, function (err) { busy(btn, false); document.getElementById('savedMsg').textContent = err.message; });
    });
  }
  function onClick(e) {
    var b;
    if (e.target.closest('[data-edit-mobile]')) { state.step = 'mobile'; clearInterval(state.timer); render(); document.getElementById('a-mobile').focus(); return; }
    if (e.target.closest('[data-resend]')) { sendCode(state.mobile); return; }
    if ((b = e.target.closest('[role="tab"]'))) { selectTab(b.id.replace('tab-', ''), true); return; }
    if ((b = e.target.closest('[data-cancel]'))) { openCancel(b.dataset.cancel); return; }
    if (e.target.closest('[data-dlg-close]')) { closeCancel(); return; }
    if (e.target.closest('#dlgConfirm')) { confirmCancel(); }
  }
  function onDocClick(e) {
    if (!e.target.closest('[data-logout]')) return;
    U.api('logout', { method: 'POST' }).then(null, function () { /* */ }).then(function () {
      state.me = null; state.step = 'mobile'; state.mobile = ''; setAuthDot(false); render();
      var m = document.getElementById('a-mobile'); if (m) m.focus();
    });
  }
  function selectTab(id, focus) {
    state.tab = id;
    root.querySelectorAll('[role="tab"]').forEach(function (t) { var on = t.id === 'tab-' + id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    root.querySelectorAll('[role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== 'panel-' + id; });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  function onKey(e) {
    var t = e.target.closest && e.target.closest('[role="tab"]');
    if (t) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]')), i = tabs.indexOf(t), n = tabs.length;
      var next = e.key === 'ArrowLeft' ? i + 1 : e.key === 'ArrowRight' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
      if (next !== null) { e.preventDefault(); selectTab(tabs[(next + n) % n].id.replace('tab-', ''), true); }
    }
    var dlg = document.getElementById('cancelDlg');
    if (dlg && !dlg.hidden) { if (e.key === 'Escape') closeCancel(); else U.trap(dlg.querySelector('.dlg__box'), e); }
  }
  function findBooking(code) { return (state.me.bookings || []).filter(function (b) { return b.code === code; })[0]; }
  function openCancel(code) {
    var b = findBooking(code); if (!b) return;
    cancelCode = code; lastFocus = document.activeElement;
    var free = b.hoursUntil >= R.policy.freeCancelHours, h = U.fa(R.policy.freeCancelHours);
    document.getElementById('dlgBody').innerHTML = '<p><strong>' + U.esc(b.serviceName) + '</strong> · ' + U.longDate(U.fromKey(b.date)) + '، ساعت ' + U.time(b.time) + '</p>' +
      '<p class="dlg__policy ' + (free ? 'is-free' : 'is-fee') + '">' + U.icon(free ? 'check' : 'alert') + '<span>' +
      (free ? 'بیش از ' + h + ' ساعت به نوبت مانده؛ لغو بدون هزینه است' + (b.deposit ? ' و بیعانه بازگردانده می‌شود.' : '.') : 'کمتر از ' + h + ' ساعت به نوبت مانده؛ طبق قوانین سالن' + (b.deposit ? ' بیعانه (' + U.price(b.deposit) + ') بازگردانده نمی‌شود.' : ' لغو ثبت می‌شود.')) + '</span></p>';
    document.getElementById('dlgErr').hidden = true;
    var d = document.getElementById('cancelDlg'); d.hidden = false; document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { d.classList.add('is-open'); d.querySelector('.dlg__actions [data-dlg-close]').focus(); });
  }
  function closeCancel() {
    var d = document.getElementById('cancelDlg'); if (!d || d.hidden) return;
    d.classList.remove('is-open'); document.body.classList.remove('no-scroll');
    setTimeout(function () { d.hidden = true; }, 200);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function confirmCancel() {
    var btn = document.getElementById('dlgConfirm'); busy(btn, true, 'در حال لغو…');
    U.api('me/cancel', { method: 'POST', body: { code: cancelCode } }).then(function (r) {
      document.body.classList.remove('no-scroll');
      state.me = r.me; state.tab = 'past'; render();
      var live = document.getElementById('accLive'); if (live) live.textContent = 'نوبت لغو شد. ' + r.note;
      var t = document.getElementById('tab-past'); if (t) t.focus();
    }, function (err) {
      busy(btn, false); var e = document.getElementById('dlgErr'); e.hidden = false; e.innerHTML = U.icon('alert') + '<span>' + U.esc(err.message) + '</span>';
    });
  }

  R.pages = R.pages || {};
  R.pages.profile = function () {
    root = document.getElementById('account');
    if (!root) return;
    root.addEventListener('click', onClick);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    if (document.cookie.indexOf('roza_cust=1') !== -1) {
      U.api('me').then(function (me) { state.me = me; setAuthDot(true); render(); }, function () { setAuthDot(false); render(); });
    } else render();
  };
})();
