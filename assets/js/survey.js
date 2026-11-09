/* Form survei publik — wizard 4 langkah, 5 bahasa, RTL untuk Arab. */
(function () {
  var SC = window.SCHEMA, UIS = window.UI, root = document.getElementById('app');
  var DRAFT_KEY = 'umb_survey_draft_v1';
  var S = { lang: pickLang(), cfg: null, step: 0, p: { countryCode: '', dial: '' }, a: {}, consentData: false, consentFollowUp: false,
            err: {}, started: Date.now(), busy: false, done: null, banner: '', geo: { provinces: [], cities: [], districts: [], loading: '' } };

  // ---------- util ----------
  function pickLang() {
    var q = new URLSearchParams(location.search).get('lang');
    var ok = function (c) { return SC.langs.some(function (l) { return l.code === c; }); };
    if (q && ok(q)) return q;
    var n = (navigator.language || 'en').toLowerCase().slice(0, 2);
    if (ok(n)) return n;
    return 'en';
  }
  function t(k) { var d = UIS[S.lang] || UIS.en; return d[k] !== undefined ? d[k] : UIS.en[k]; }
  function lbl(o) { return o[S.lang] || o.en; }
  function langInfo() { return SC.langs.filter(function (l) { return l.code === S.lang; })[0]; }
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled') { if (v) el[k] = true; }
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c === null || c === undefined) return; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function saveDraft() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ p: S.p, a: S.a, lang: S.lang, step: S.step })); } catch (e) { /* iframe/privasi */ }
  }
  function loadDraft() {
    try {
      var d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (d) { S.p = d.p || S.p; S.a = d.a || {}; S.step = Math.min(d.step || 0, 3); if (!new URLSearchParams(location.search).get('lang') && d.lang) S.lang = d.lang; }
    } catch (e) { /* abaikan */ }
  }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* abaikan */ } }
  function postHeight() {
    try { parent.postMessage({ type: 'umb-survey-height', height: document.documentElement.scrollHeight }, '*'); } catch (e) { /* abaikan */ }
  }
  function scrollTop() {
    window.scrollTo(0, 0);
    try { parent.postMessage({ type: 'umb-survey-scroll' }, '*'); } catch (e) { /* abaikan */ }
  }

  // ---------- komponen form ----------
  function field(key, label, input, o) {
    o = o || {};
    var cls = 'field' + (o.full ? ' full' : '') + (S.err[key] ? ' has-err' : '');
    var lab = h('label', { class: o.req ? 'req' : '', for: 'f_' + key }, [label]);
    if (o.optional) lab.appendChild(h('span', { class: 'opt', text: ' (' + t('optional') + ')' }));
    return h('div', { class: cls, id: 'fld_' + key }, [lab, input, o.hint ? h('div', { class: 'hint', text: o.hint }) : null, h('div', { class: 'err', text: S.err[key] || '' })]);
  }
  function textInput(key, type, extra) {
    return h('input', Object.assign({ type: type || 'text', id: 'f_' + key, value: S.p[key] || '', autocomplete: 'off', maxlength: 200,
      oninput: function (e) { S.p[key] = e.target.value; saveDraft(); } }, extra || {}));
  }
  function selectInput(key, options, onchange, includeBlank) {
    var sel = h('select', { id: 'f_' + key, onchange: function (e) { S.p[key] = e.target.value; saveDraft(); if (onchange) onchange(e.target.value); } });
    if (includeBlank !== false) sel.appendChild(h('option', { value: '', text: t('select') }));
    options.forEach(function (o) { sel.appendChild(h('option', { value: o.value, text: o.label, selected: S.p[key] === o.value })); });
    return sel;
  }
  function listOptions(list) { return list.map(function (o) { return { value: o.id, label: lbl(o.t) }; }); }
  function pills(id, from, to, o) {
    o = o || {};
    var group = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': o.aria || id });
    for (var v = from; v <= to; v++) {
      (function (val) {
        var title = o.labels ? o.labels[val - 1] : '';
        group.appendChild(h('label', { class: 'pill', title: title }, [
          h('input', { type: 'radio', name: 'q_' + id, value: String(val), checked: S.a[id] === val,
            onchange: function () { S.a[id] = val; delete S.err['q_' + id]; markOk(id); saveDraft(); updateAnswered(); } }),
          h('span', { text: String(val) })
        ]));
      })(v);
    }
    if (o.na) {
      group.appendChild(h('label', { class: 'pill na' }, [
        h('input', { type: 'radio', name: 'q_' + id, value: 'NA', checked: S.a[id] === 'NA',
          onchange: function () { S.a[id] = 'NA'; delete S.err['q_' + id]; markOk(id); saveDraft(); updateAnswered(); } }),
        h('span', { text: t('na') })
      ]));
    }
    return group;
  }
  function markOk(id) {
    var el = document.getElementById('item_' + id);
    if (el) { el.classList.remove('has-err'); var e = el.querySelector('.err'); if (e) e.textContent = ''; }
  }
  function updateAnswered() {
    var n = 0, tot = SC.itemIds.length - 3; // item dimensi saja
    SC.itemIds.forEach(function (id) { if (S.a[id] !== undefined && id !== 'OVR1' && id !== 'OVR2' && id !== 'NPS') n++; });
    var el = document.getElementById('answeredInfo');
    if (el) el.textContent = n + ' / ' + tot + ' ' + t('answered');
  }
  function checkGroup(key, list, store, other) {
    var wrap = h('div', { class: 'checks' });
    list.forEach(function (o) {
      var on = (store[key] || []).indexOf(o.id) >= 0;
      var box = h('input', { type: 'checkbox', value: o.id, checked: on, onchange: function (e) {
        var arr = store[key] || []; var i = arr.indexOf(o.id);
        if (e.target.checked && i < 0) arr.push(o.id); if (!e.target.checked && i >= 0) arr.splice(i, 1);
        store[key] = arr; e.target.closest('.check').classList.toggle('on', e.target.checked); saveDraft();
        if (other && o.id === 'other') { var oi = document.getElementById('fld_activityOther'); if (oi) oi.style.display = e.target.checked ? '' : 'none'; }
      } });
      wrap.appendChild(h('label', { class: 'check' + (on ? ' on' : '') }, [box, h('span', { text: lbl(o.t) })]));
    });
    return wrap;
  }

  // ---------- wilayah ----------
  function datalist(id, items) {
    var dl = document.getElementById(id); if (!dl) return;
    dl.innerHTML = '';
    items.forEach(function (x) { dl.appendChild(h('option', { value: x.name })); });
  }
  function byName(list, name) {
    name = String(name || '').trim().toLowerCase();
    for (var i = 0; i < list.length; i++) if (list[i].name.toLowerCase() === name) return list[i];
    return null;
  }
  function loadProvinces() {
    var cc = S.p.countryCode; if (!cc) return;
    S.geo.provinces = []; S.geo.cities = []; S.geo.districts = [];
    datalist('dl_province', []); datalist('dl_city', []); datalist('dl_district', []);
    var p = cc === 'ID' ? Geo.idProvinces() : Geo.worldStates(cc);
    p.then(function (list) { if (S.p.countryCode !== cc) return; S.geo.provinces = list; datalist('dl_province', list); if (S.p.province) loadCities(); });
  }
  function loadCities() {
    var cc = S.p.countryCode, prov = byName(S.geo.provinces, S.p.province);
    S.geo.cities = []; datalist('dl_city', []);
    if (!prov) return;
    var req = cc === 'ID' ? Geo.idRegencies(prov.id) : Geo.worldCities(cc, prov.id);
    req.then(function (list) { if (S.p.province !== prov.name && byName(S.geo.provinces, S.p.province) !== prov) return; S.geo.cities = list; datalist('dl_city', list); if (S.p.city) loadDistricts(); });
  }
  function loadDistricts() {
    S.geo.districts = []; datalist('dl_district', []);
    if (S.p.countryCode !== 'ID') return;
    var reg = byName(S.geo.cities, S.p.city);
    if (!reg) return;
    Geo.idDistricts(reg.id).then(function (list) { S.geo.districts = list; datalist('dl_district', list); });
  }
  function onCountry(code) {
    var c = Geo.countries(S.lang).filter(function (x) { return x.code === code; })[0];
    S.p.country = c ? Geo.englishName(code) : '';
    S.p.countryCode = code; S.p.dial = code ? '+' + Geo.dial(code) : '';
    S.p.province = ''; S.p.city = ''; S.p.district = '';
    ['province', 'city', 'district'].forEach(function (k) { var el = document.getElementById('f_' + k); if (el) el.value = ''; });
    var dial = document.getElementById('f_dial'); if (dial) dial.value = S.p.dial;
    saveDraft(); loadProvinces();
  }

  // isi otomatis dari daftar institusi mitra: negara, jenis institusi, provinsi, kota
  function applyPartner(name) {
    var key = String(name || '').trim().toLowerCase(); if (!key) return;
    var pt = (S.cfg.partners || []).filter(function (x) { return x.name.toLowerCase() === key; })[0];
    if (!pt) return;
    S.p.institution = pt.name;
    var inst = document.getElementById('f_institution'); if (inst) inst.value = pt.name;
    if (S.p.countryCode !== pt.countryCode) {
      var cs = document.getElementById('f_countryCode'); if (cs) cs.value = pt.countryCode;
      onCountry(pt.countryCode);
    }
    S.p.instType = pt.instType; var it = document.getElementById('f_instType'); if (it) it.value = pt.instType;
    S.p.province = pt.province; S.p.city = pt.city; S.p.district = '';
    [['province', pt.province], ['city', pt.city], ['district', '']].forEach(function (kv) { var el = document.getElementById('f_' + kv[0]); if (el) el.value = kv[1]; });
    saveDraft(); loadProvinces();
  }

  // ---------- langkah ----------
  function stepProfile() {
    var countries = Geo.countries(S.lang);
    var dialSel = h('select', { id: 'f_dial', 'aria-label': t('dialCode'), onchange: function (e) { S.p.dial = e.target.value; saveDraft(); } });
    dialSel.appendChild(h('option', { value: '', text: '+' }));
    countries.forEach(function (c) { dialSel.appendChild(h('option', { value: '+' + c.dial, text: '+' + c.dial + ' ' + c.code })); });
    dialSel.value = S.p.dial || '';
    var phoneBox = h('div', { class: 'phone' }, [dialSel, h('input', { type: 'tel', id: 'f_phone', inputmode: 'tel', autocomplete: 'tel-national', value: S.p.phone || '', maxlength: 20,
      oninput: function (e) { S.p.phone = e.target.value; saveDraft(); } })]);
    var countrySel = selectInput('countryCode', countries.map(function (c) { return { value: c.code, label: c.name }; }), onCountry);
    var geoInput = function (key, dl) { return textInput(key, 'text', { list: dl, autocomplete: 'off', onchange: function () { if (key === 'province') { S.p.city = ''; S.p.district = ''; document.getElementById('f_city').value = ''; document.getElementById('f_district').value = ''; loadCities(); } if (key === 'city') { S.p.district = ''; document.getElementById('f_district').value = ''; loadDistricts(); } } }); };
    return [
      h('h2', { text: t('steps')[0] }),
      h('div', { class: 'grid' }, [
        field('fullName', t('fullName'), textInput('fullName', 'text', { autocomplete: 'name' }), { req: true }),
        field('position', t('position'), textInput('position'), { req: true }),
        field('institution', t('institution'), textInput('institution', 'text', { autocomplete: 'off', list: 'dl_inst', onchange: function (e) { applyPartner(e.target.value); } }), { req: true, full: true }),
        field('instType', t('instType'), selectInput('instType', listOptions(SC.instTypes)), { req: true, full: true }),
        field('countryCode', t('country'), countrySel, { req: true, full: true }),
        field('province', t('province'), geoInput('province', 'dl_province'), { req: true }),
        field('city', t('city'), geoInput('city', 'dl_city'), { req: true }),
        field('district', t('district'), geoInput('district', 'dl_district'), { optional: true }),
        field('address', t('address'), h('textarea', { id: 'f_address', maxlength: 300, oninput: function (e) { S.p.address = e.target.value; saveDraft(); } }, [S.p.address || '']), { optional: true, hint: t('addressHint'), full: true }),
        field('email', t('email'), textInput('email', 'email', { inputmode: 'email', autocomplete: 'email', dir: 'ltr' }), { req: true }),
        field('phone', t('whatsapp'), phoneBox, { req: true })
      ]),
      h('datalist', { id: 'dl_province' }), h('datalist', { id: 'dl_city' }), h('datalist', { id: 'dl_district' }),
      h('datalist', { id: 'dl_inst' }, (S.cfg.partners || []).map(function (x) { return h('option', { value: x.name }); }))
    ];
  }

  function unitOptions() {
    var cat = S.p.unitCategory;
    var list = (S.cfg.units || []).filter(function (u) { return u.category === cat; }).map(function (u) {
      return { value: u.id, label: S.lang === 'id' ? u.nameId : (u.nameEn === u.nameId ? u.nameId : u.nameEn + ' — ' + u.nameId) };
    });
    list.push({ value: 'OTHER', label: t('umbUnitUnknown') });
    return list;
  }
  function stepCoop() {
    var unitSel = selectInput('unitId', unitOptions());
    unitSel.id = 'f_unitId';
    var catSel = selectInput('unitCategory', listOptions(SC.unitCategories), function () {
      S.p.unitId = ''; var u = document.getElementById('f_unitId'); u.innerHTML = '';
      u.appendChild(h('option', { value: '', text: t('select') }));
      unitOptions().forEach(function (o) { u.appendChild(h('option', { value: o.value, text: o.label })); });
    });
    var other = h('div', { class: 'field full', id: 'fld_activityOther', style: (S.p.activities || []).indexOf('other') >= 0 ? '' : 'display:none' }, [
      h('label', { for: 'f_activityOther', text: t('activityOther') }),
      textInput('activityOther'), h('div', { class: 'err' })
    ]);
    return [
      h('h2', { text: t('steps')[1] }),
      h('div', { class: 'grid' }, [
        field('unitCategory', t('umbCategory'), catSel, { req: true, full: true }),
        field('unitId', t('umbUnit'), unitSel, { req: true, full: true }),
        field('umbContact', t('umbContact'), textInput('umbContact'), { req: true, full: true, hint: t('umbContactHint') }),
        h('div', { class: 'field full' + (S.err.activities ? ' has-err' : ''), id: 'fld_activities' }, [
          h('div', { class: 'lab req', text: t('activities') }), h('div', { class: 'hint', text: t('activitiesHint') }),
          checkGroup('activities', SC.activities, S.p, true), h('div', { class: 'err', text: S.err.activities || '' })
        ]),
        other,
        field('duration', t('duration'), selectInput('duration', listOptions(SC.durations)), { req: true }),
        field('docStatus', t('docStatus'), selectInput('docStatus', listOptions(SC.docStatus)), { req: true })
      ])
    ];
  }

  function itemRow(it, scaleKey, na, extra) {
    var id = it.id;
    var labels = SC.scales[scaleKey || 'sat'][S.lang] || SC.scales[scaleKey || 'sat'].en;
    var row = h('div', { class: 'item' + (S.err['q_' + id] ? ' has-err' : ''), id: 'item_' + id }, [
      h('p', { class: 'q', id: 'q_lbl_' + id, text: lbl(it.t) }),
      pills(id, 1, 5, { na: na, labels: labels, aria: lbl(it.t) })
    ]);
    if (extra) row.appendChild(h('div', { class: 'scale-ends' }, [h('span', { text: '1 · ' + labels[0] }), h('span', { text: '5 · ' + labels[4] })]));
    row.appendChild(h('div', { class: 'err', text: S.err['q_' + id] || '' }));
    return row;
  }
  function stepRatings() {
    var out = [h('h2', { text: t('steps')[2] }), h('div', { class: 'legend', text: t('ratingIntro') }), h('div', { class: 'hint', id: 'answeredInfo', style: 'margin-bottom:8px' })];
    SC.dimensions.forEach(function (d) {
      var box = h('div', { class: 'dim' }, [h('h3', { text: lbl(d.name) })]);
      d.items.forEach(function (it) { box.appendChild(itemRow(it, 'sat', true, false)); });
      out.push(box);
    });
    setTimeout(updateAnswered, 0);
    return out;
  }
  function stepOverall() {
    var out = [h('h2', { text: t('overallTitle') })];
    SC.overall.forEach(function (it) { out.push(itemRow(it, it.scale, false, true)); });
    var nps = SC.nps;
    var npsRow = h('div', { class: 'item nps' + (S.err.q_NPS ? ' has-err' : ''), id: 'item_NPS' }, [
      h('p', { class: 'q', text: lbl(nps.t) }), pills('NPS', 0, 10, { aria: lbl(nps.t) }),
      h('div', { class: 'scale-ends' }, [h('span', { text: '0 · ' + lbl(nps.low) }), h('span', { text: '10 · ' + lbl(nps.high) })]),
      h('div', { class: 'err', text: S.err.q_NPS || '' })
    ]);
    out.push(npsRow);
    out.push(h('h2', { text: t('feedbackTitle'), style: 'margin-top:18px' }));
    [['openStrength'], ['openImprove'], ['openSuggest']].forEach(function (k) {
      out.push(h('div', { class: 'field', style: 'margin-bottom:10px' }, [
        h('label', { for: 'f_' + k[0] }, [t(k[0]), h('span', { class: 'opt', text: ' (' + t('optional') + ')' })]),
        h('textarea', { id: 'f_' + k[0], maxlength: 2000, oninput: function (e) { S.a[k[0]] = e.target.value; saveDraft(); } }, [S.a[k[0]] || ''])
      ]));
    });
    out.push(h('div', { class: 'field' }, [h('div', { class: 'lab', text: t('futureInterest') }), h('div', { class: 'hint', text: t('activitiesHint') }), checkGroup('futureInterest', SC.activities, S.p, false)]));
    out.push(h('div', { class: 'consent', id: 'fld_consent' }, [
      h('input', { type: 'checkbox', id: 'f_consent', checked: S.consentData, onchange: function (e) { S.consentData = e.target.checked; } }),
      h('label', { for: 'f_consent' }, [t('consentData'), h('div', { class: 'err', text: S.err.consent || '' })])
    ]));
    out.push(h('div', { class: 'consent' }, [
      h('input', { type: 'checkbox', id: 'f_follow', checked: S.consentFollowUp, onchange: function (e) { S.consentFollowUp = e.target.checked; } }),
      h('label', { for: 'f_follow', text: t('consentFollowUp') })
    ]));
    out.push(h('div', { class: 'hp', 'aria-hidden': 'true' }, [h('input', { type: 'text', id: 'f_hp', tabindex: '-1', autocomplete: 'off', name: 'website' })]));
    return out;
  }

  // ---------- validasi ----------
  function normalizePhone() {
    var raw = String(S.p.phone || '').trim();
    var dial = String(S.p.dial || '').replace(/\D/g, '');
    var digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (raw.charAt(0) === '+') return '+' + digits;
    if (digits.indexOf('00') === 0) return '+' + digits.slice(2);
    if (!dial) return '';
    digits = digits.replace(/^0+/, '');
    if (digits.indexOf(dial) === 0 && digits.length > dial.length + 6) return '+' + digits; // sudah memuat kode negara
    return '+' + dial + digits;
  }
  function validate(step) {
    var e = {}, p = S.p, req = t('errRequired');
    var need = function (k) { if (!String(p[k] || '').trim()) e[k] = req; };
    if (step === 0) {
      ['fullName', 'position', 'institution', 'instType', 'countryCode', 'province', 'city'].forEach(need);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(p.email || '').trim())) e.email = p.email ? t('errEmail') : req;
      var ph = normalizePhone();
      if (!/^\+\d{7,16}$/.test(ph)) e.phone = p.phone ? t('errPhone') : req;
    }
    if (step === 1) {
      ['unitCategory', 'unitId', 'umbContact', 'duration', 'docStatus'].forEach(need);
      if (!(p.activities || []).length) e.activities = req;
    }
    if (step === 2) {
      SC.dimensions.forEach(function (d) { d.items.forEach(function (it) { if (S.a[it.id] === undefined) e['q_' + it.id] = req; }); });
    }
    if (step === 3) {
      ['OVR1', 'OVR2', 'NPS'].forEach(function (id) { if (S.a[id] === undefined) e['q_' + id] = req; });
      if (!S.consentData) e.consent = t('errConsent');
    }
    return e;
  }
  function firstErrorEl(errs) {
    var keys = Object.keys(errs); if (!keys.length) return null;
    var k = keys[0];
    return document.getElementById(k.indexOf('q_') === 0 ? 'item_' + k.slice(2) : 'fld_' + k);
  }

  // ---------- kaki halaman: kredit pembuat + tombol pasang aplikasi ----------
  function footer() {
    var hint = h('div', { class: 'ioshint', hidden: true, text: t('iosHint') });
    var btn = h('button', { class: 'btn ghost sm pwa-install', type: 'button', hidden: true, text: '⬇ ' + t('installApp'), onclick: function () {
      if (!window.PWA) return;
      if (PWA.isIOS()) { hint.hidden = !hint.hidden; postHeight(); } else PWA.install();
    } });
    setTimeout(function () { if (window.PWA) PWA.sync(); }, 0);
    return h('div', { class: 'foot' }, [
      h('div', { text: t('footer') }),
      h('div', { class: 'credit' }, [t('madeBy') + ' ', h('a', { href: 'https://www.andiazhar.com', target: '_blank', rel: 'noopener', text: 'Andi Azhar' })]),
      btn, hint
    ]);
  }

  // ---------- render ----------
  function render() {
    var li = langInfo();
    document.documentElement.lang = li.locale; document.documentElement.dir = li.dir;
    document.title = t('title') + ' — UMB';
    root.innerHTML = '';
    var langSel = h('select', { 'aria-label': t('language'), onchange: function (e) { S.lang = e.target.value; saveDraft(); S.err = {}; render(); } },
      SC.langs.map(function (l) { return h('option', { value: l.code, text: l.name, selected: l.code === S.lang }); }));
    root.appendChild(h('div', { class: 'top' }, [
      h('div', { class: 'brand' }, [h('img', { class: 'logo', src: 'assets/img/logo-umb-128.png', alt: 'Logo Universitas Muhammadiyah Bengkulu', width: 56, height: 56 }),
        h('div', {}, [h('h1', { text: t('title') }), h('div', { class: 'org', text: t('org') })])]),
      h('div', { class: 'lang' }, [h('span', { text: t('language') + ':' }), langSel])
    ]));

    if (!S.cfg) { root.appendChild(h('div', { class: 'card center', text: t('loading') })); postHeight(); return; }
    if (S.cfg.error) { root.appendChild(h('div', { class: 'card' }, [h('div', { class: 'alert bad', text: t(S.cfg.error) })])); postHeight(); return; }
    if (!S.cfg.surveyOpen) { root.appendChild(h('div', { class: 'card center' }, [h('h2', { text: t('closedTitle') }), h('p', { text: t('closedBody') })])); postHeight(); return; }
    if (S.done) {
      root.appendChild(h('div', { class: 'card center' }, [h('div', { class: 'big', text: '✓' }), h('h2', { text: t('thanksTitle') }), h('p', { text: t('thanksBody') }),
        h('div', {}, [h('span', { text: t('thanksRef') + ': ' }), h('span', { class: 'ref', text: S.done })])]));
      root.appendChild(footer()); postHeight(); return;
    }

    if (S.step === 0) root.appendChild(h('p', { class: 'intro', text: t('intro') }));
    var pct = Math.round(((S.step + 1) / 4) * 100);
    root.appendChild(h('div', { class: 'progress' }, [
      h('div', { class: 'bar' }, [h('i', { style: 'width:' + pct + '%' })]),
      h('div', { class: 'lbl' }, [h('span', { text: t('stepOf').replace('{n}', S.step + 1).replace('{t}', 4) }), h('span', { text: t('steps')[S.step] })])
    ]));

    var card = h('div', { class: 'card' });
    if (S.banner) card.appendChild(h('div', { class: 'alert bad', role: 'alert', text: S.banner }));
    var steps = [stepProfile, stepCoop, stepRatings, stepOverall];
    steps[S.step]().forEach(function (n) { card.appendChild(n); });
    root.appendChild(card);

    var next = h('button', { class: 'btn', type: 'button', id: 'btnNext', disabled: S.busy, onclick: S.step === 3 ? submit : goNext, text: S.step === 3 ? (S.busy ? t('submitting') : t('submit')) : t('next') });
    var acts = h('div', { class: 'actions' }, [
      S.step > 0 ? h('button', { class: 'btn ghost', type: 'button', onclick: goBack, text: t('back') }) : h('span'), next
    ]);
    root.appendChild(acts);
    root.appendChild(footer());

    if (S.step === 0 && S.p.countryCode) { loadProvinces(); }
    postHeight();
  }
  function goNext() {
    var errs = validate(S.step); S.err = errs; S.banner = '';
    if (Object.keys(errs).length) { S.banner = t('errFix'); render(); var el = firstErrorEl(errs); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    S.step++; saveDraft(); render(); scrollTop();
  }
  function goBack() { S.step = Math.max(0, S.step - 1); S.err = {}; S.banner = ''; saveDraft(); render(); scrollTop(); }

  function submit() {
    if (S.busy) return;
    var errs = validate(3); S.err = errs; S.banner = '';
    if (Object.keys(errs).length) { S.banner = t('errFix'); render(); var el = firstErrorEl(errs); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    // validasi ulang semua langkah sebelumnya (jaga-jaga draft rusak)
    for (var s = 0; s < 3; s++) { var e2 = validate(s); if (Object.keys(e2).length) { S.step = s; S.err = e2; S.banner = t('errFix'); render(); scrollTop(); return; } }
    var hp = (document.getElementById('f_hp') || {}).value || '';
    var answers = {};
    SC.itemIds.forEach(function (id) { answers[id] = (S.a[id] === 'NA' || S.a[id] === undefined) ? null : S.a[id]; });
    ['openStrength', 'openImprove', 'openSuggest'].forEach(function (k) { answers[k] = S.a[k] || ''; });
    var p = S.p;
    var payload = {
      lang: S.lang, hp: hp, elapsedMs: Date.now() - S.started, consentData: true, consentFollowUp: !!S.consentFollowUp,
      profile: {
        fullName: p.fullName, position: p.position, institution: p.institution, instType: p.instType,
        countryCode: p.countryCode, country: p.country || Geo.englishName(p.countryCode), province: p.province, city: p.city, district: p.district || '', address: p.address || '',
        email: p.email, whatsapp: normalizePhone(),
        unitCategory: p.unitCategory, unitId: p.unitId, umbContact: p.umbContact,
        activities: p.activities || [], activityOther: p.activityOther || '', duration: p.duration, docStatus: p.docStatus,
        futureInterest: p.futureInterest || []
      },
      answers: answers
    };
    S.busy = true; render();
    API.post('submit', payload).then(function (d) { S.done = d.id; S.busy = false; clearDraft(); render(); scrollTop(); })
      .catch(function (err) {
        S.busy = false;
        S.banner = err.code === 'duplicate' ? t('errDuplicate') : err.code === 'network' ? t('errNetwork') : err.code === 'closed' ? t('closedBody') : (err.code === 'invalid' ? t('errGeneric') + ' (' + err.message + ')' : t('errGeneric'));
        render(); scrollTop();
      });
  }

  // ---------- init ----------
  loadDraft();
  render();
  if (!API.configured()) { S.cfg = { error: 'errGeneric' }; render(); console.error('APP_CONFIG.API_URL belum diisi'); }
  else {
    API.get('config').then(function (c) { S.cfg = c; render(); })
      .catch(function () { S.cfg = { error: 'errNetwork' }; render(); });
  }
  if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.body);
})();
