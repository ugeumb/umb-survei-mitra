/* Dashboard admin: login (superadmin/admin), filter, infografis, analisis statistik, AI, laporan PDF, user & pengaturan. */
(function () {
  var SC = window.SCHEMA, ST = window.Stats, N = window.Narrative, TOKEN_KEY = 'umb_dash_token';
  var $ = function (id) { return document.getElementById(id); };
  var S = { token: null, user: null, raw: [], data: [], periods: [], settings: {}, filters: { period: '', country: '', unitCategory: '', unitId: '', instType: '', activity: '' },
            filtered: [], tab: 'overview', segKey: 'unit', reportLang: 'id', aiList: [], aiSel: '', aiUse: true, units: [], users: [], busy: false, notice: null, preview: null, cmtType: '', cmtQ: '', respQ: '' };
  var cache = {};

  // ---------- util ----------
  function store(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { cache[k] = v; } }
  function load(k) { try { return sessionStorage.getItem(k); } catch (e) { return cache[k] || null; } }
  var ERR = { bad_credentials: 'Email atau password salah.', locked: 'Terlalu banyak percobaan gagal. Coba lagi 15 menit lagi.', network: 'Tidak bisa terhubung ke server. Periksa koneksi.', forbidden: 'Anda tidak punya hak akses untuk tindakan ini.',
    ai_not_configured: 'OPENAI_API_KEY belum diisi di Script Properties GAS.', weak_password: 'Password minimal 10 karakter dan harus berisi huruf dan angka.' };
  function errText(e) { return ERR[e.code] || e.message || 'Terjadi kesalahan.'; }
  function call(action, body, ms) {
    return API.post(action, Object.assign({ token: S.token }, body || {}), ms).catch(function (e) {
      if (e.code === 'unauthorized') { doLogout(true); }
      throw e;
    });
  }
  function toast(kind, text) { S.notice = { kind: kind, text: text }; var el = $('noticeBox'); if (el) { el.innerHTML = ''; el.appendChild(H('div', { class: 'msg ' + kind, text: text })); setTimeout(function () { if (S.notice && S.notice.text === text) { el.innerHTML = ''; S.notice = null; } }, 7000); } }
  function isSuper() { return S.user && S.user.role === 'superadmin'; }
  function lab(list, id, lang) { return SC.label(list, id, lang || 'id'); }
  function dateStr(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function modal(content) {
    var root = $('modalRoot'); root.innerHTML = '';
    var bg = H('div', { class: 'modal-bg', onclick: function (e) { if (e.target === bg) closeModal(); } }, [H('div', { class: 'modal', role: 'dialog' }, content)]);
    root.appendChild(bg);
  }
  function closeModal() { $('modalRoot').innerHTML = ''; }

  // ---------- login ----------
  function showLogin(msg) {
    $('shell').classList.add('hidden'); var v = $('loginView'); v.classList.remove('hidden'); v.innerHTML = '';
    var em = H('input', { type: 'email', id: 'lg_email', autocomplete: 'username', required: true }), pw = H('input', { type: 'password', id: 'lg_pw', autocomplete: 'current-password', required: true });
    var err = H('div', { id: 'lg_err' }); if (msg) err.appendChild(H('div', { class: 'msg bad', text: msg }));
    var btn = H('button', { class: 'btn', type: 'submit', text: 'Masuk' });
    var form = H('form', { onsubmit: function (e) {
      e.preventDefault(); btn.disabled = true; btn.textContent = 'Memeriksa…'; err.innerHTML = '';
      API.post('login', { email: em.value.trim(), password: pw.value }).then(function (d) { S.token = d.token; S.user = d.user; store(TOKEN_KEY, d.token); boot(); })
        .catch(function (ex) { btn.disabled = false; btn.textContent = 'Masuk'; err.appendChild(H('div', { class: 'msg bad', text: errText(ex) })); });
    } }, [H('div', { class: 'fld' }, [H('label', { for: 'lg_email', text: 'Email' }), em]), H('div', { class: 'fld' }, [H('label', { for: 'lg_pw', text: 'Password' }), pw]), err, btn]);
    v.appendChild(H('div', { class: 'login' }, [H('img', { class: 'logo', src: 'assets/img/logo-umb.png', alt: 'Logo Universitas Muhammadiyah Bengkulu', width: 84, height: 84 }), H('h1', { text: 'Dashboard Survei Mitra UMB' }), H('p', { text: 'UMB Global Engagement (UGE) — khusus Superadmin dan Admin.' }), form]));
  }
  function doLogout(silent) {
    if (S.token) API.post('logout', { token: S.token }).catch(function () { /* abaikan */ });
    S.token = null; S.user = null; store(TOKEN_KEY, null); Charts.clear('main'); showLogin(silent ? 'Sesi berakhir. Silakan masuk kembali.' : '');
  }

  // ---------- data ----------
  function loadData() {
    S.busy = true; renderShell();
    return call('responses', {}, 60000).then(function (d) {
      S.raw = d.rows; S.data = ST.normalize(d.rows); S.periods = d.periods; S.settings = d.settings; S.busy = false;
      if (!S.periodInit) { S.periodInit = true; S.filters.period = d.periods.indexOf(d.settings.activePeriod) >= 0 ? d.settings.activePeriod : ''; }
      applyFilters(); return call('aiList', {}).then(function (a) { S.aiList = a.reports; S.aiSel = S.aiList.length ? S.aiList[0].meta.id : ''; }).catch(function () { S.aiList = []; });
    }).then(function () { renderShell(); }).catch(function (e) { S.busy = false; renderShell(); toast('bad', errText(e)); });
  }
  function applyFilters() {
    var f = S.filters;
    S.filtered = S.data.filter(function (r) {
      return (!f.period || r.period === f.period) && (!f.country || r.countryCode === f.country) && (!f.unitCategory || r.unitCategory === f.unitCategory) && (!f.unitId || r.unitId === f.unitId)
        && (!f.instType || r.instType === f.instType) && (!f.activity || r.activities.indexOf(f.activity) >= 0);
    });
    S.statsCache = {};
  }
  function stats(lang) {
    lang = lang || 'id'; S.statsCache = S.statsCache || {};
    if (!S.statsCache[lang]) S.statsCache[lang] = ST.analyze(S.filtered, { targetIndex: S.settings.targetIndex || 80, lang: lang });
    return S.statsCache[lang];
  }
  function filterLabel() {
    var f = S.filters, p = [];
    if (f.country) { var c = S.data.filter(function (r) { return r.countryCode === f.country; })[0]; p.push('Negara: ' + (c ? c.country : f.country)); }
    if (f.unitCategory) p.push('Jenis unit: ' + lab(SC.unitCategories, f.unitCategory));
    if (f.unitId) { var u = S.data.filter(function (r) { return r.unitId === f.unitId; })[0]; p.push('Unit: ' + (u ? u.unitName : f.unitId)); }
    if (f.instType) p.push('Jenis institusi: ' + lab(SC.instTypes, f.instType));
    if (f.activity) p.push('Kegiatan: ' + lab(SC.activities, f.activity));
    return p.join('; ');
  }

  // ---------- shell ----------
  var TABS = [['overview', 'Ringkasan'], ['dims', 'Dimensi & Statistik'], ['seg', 'Segmentasi'], ['comments', 'Masukan Terbuka'], ['responses', 'Data Respons'], ['report', 'Analisis AI & Laporan'], ['users', 'Pengguna', true], ['settings', 'Pengaturan', true]];
  function pwaButton() {
    var b = H('button', { class: 'btn ghost sm pwa-install', hidden: true, text: '⬇ Pasang aplikasi', onclick: function () {
      if (window.PWA && PWA.isIOS()) alert('Di iPhone: ketuk tombol Bagikan, lalu pilih “Tambah ke Layar Utama”.'); else if (window.PWA) PWA.install();
    } });
    setTimeout(function () { if (window.PWA) PWA.sync(); }, 0);
    return b;
  }
  function renderShell() {
    var sh = $('shell'); $('loginView').classList.add('hidden'); sh.classList.remove('hidden'); sh.innerHTML = '';
    sh.appendChild(H('div', { class: 'hdr' }, [
      H('div', { class: 'brandrow' }, [H('img', { class: 'logo', src: 'assets/img/logo-umb-128.png', alt: 'Logo UMB', width: 46, height: 46 }),
        H('div', {}, [H('h1', { text: 'Dashboard Survei Kepuasan Mitra UMB' }), H('div', { class: 'sub', text: 'UMB Global Engagement (UGE)' + (S.settings.activePeriod ? ' · Periode aktif: ' + S.settings.activePeriod : '') })])]),
      H('div', { class: 'who' }, [pwaButton(), H('span', { text: S.user.name || S.user.email }), H('span', { class: 'role', text: S.user.role === 'superadmin' ? 'Superadmin' : 'Admin' }),
        H('button', { class: 'btn ghost sm', onclick: changePasswordModal, text: 'Ganti password' }), H('button', { class: 'btn ghost sm', onclick: function () { doLogout(false); }, text: 'Keluar' })])
    ]));
    sh.appendChild(H('div', { id: 'noticeBox' }));
    sh.appendChild(H('div', { class: 'tabs', role: 'tablist' }, TABS.filter(function (t) { return !t[2] || isSuper(); }).map(function (t) {
      return H('button', { class: 'tab' + (S.tab === t[0] ? ' on' : ''), role: 'tab', onclick: function () { S.tab = t[0]; renderShell(); }, text: t[1] });
    })));
    if (['overview', 'dims', 'seg', 'comments', 'responses', 'report'].indexOf(S.tab) >= 0) sh.appendChild(filterBar());
    var body = H('div', { id: 'tabBody' }); sh.appendChild(body);
    Charts.clear('main');
    if (S.busy) { body.appendChild(H('div', { class: 'card', text: 'Memuat data…' })); return; }
    var fn = { overview: tabOverview, dims: tabDims, seg: tabSeg, comments: tabComments, responses: tabResponses, report: tabReport, users: tabUsers, settings: tabSettings }[S.tab];
    fn(body);
    if (S.notice) toast(S.notice.kind, S.notice.text);
  }

  function filterBar() {
    var d = S.data, f = S.filters;
    function opts(vals, labelFn) { return vals.map(function (v) { return { v: v, l: labelFn(v) }; }); }
    function uniq(fn) { var m = {}; d.forEach(function (r) { var v = fn(r); (Array.isArray(v) ? v : [v]).forEach(function (x) { if (x) m[x] = 1; }); }); return Object.keys(m); }
    function sel(key, label, options, all) {
      var s = H('select', { id: 'flt_' + key, onchange: function (e) {
                S.filters[key] = e.target.value; if (key === 'unitCategory') S.filters.unitId = ''; applyFilters(); renderShell();
      } }, [H('option', { value: '', text: all })].concat(options.map(function (o) { return H('option', { value: o.v, text: o.l, selected: String(f[key]) === String(o.v) }); })));
      return H('div', { class: 'f' }, [H('label', { for: 'flt_' + key, text: label }), s]);
    }
    var countries = uniq(function (r) { return r.countryCode; }).map(function (c) { var r = d.filter(function (x) { return x.countryCode === c; })[0]; return { v: c, l: r.country }; }).sort(function (a, b) { return a.l.localeCompare(b.l); });
    var units = uniq(function (r) { return r.unitId; }).map(function (u) { var r = d.filter(function (x) { return x.unitId === u && (!f.unitCategory || x.unitCategory === f.unitCategory); })[0]; return r ? { v: u, l: r.unitName } : null; }).filter(Boolean).sort(function (a, b) { return a.l.localeCompare(b.l); });
    return H('div', { class: 'filters' }, [
      sel('period', 'Periode', S.periods.map(function (p) { return { v: p, l: p }; }), 'Semua periode'),
      sel('country', 'Negara mitra', countries, 'Semua'),
      sel('unitCategory', 'Jenis unit UMB', opts(uniq(function (r) { return r.unitCategory; }), function (v) { return lab(SC.unitCategories, v); }), 'Semua'),
      sel('unitId', 'Unit UMB', units, 'Semua'),
      sel('instType', 'Jenis institusi', opts(uniq(function (r) { return r.instType; }), function (v) { return lab(SC.instTypes, v); }), 'Semua'),
      sel('activity', 'Kegiatan', opts(uniq(function (r) { return r.activities; }), function (v) { return lab(SC.activities, v); }), 'Semua'),
      H('button', { class: 'btn ghost sm', onclick: function () { var p = S.filters.period; S.filters = { period: p, country: '', unitCategory: '', unitId: '', instType: '', activity: '' }; applyFilters(); renderShell(); }, text: 'Reset' }),
      H('div', { class: 'note', style: 'align-self:center' }, [S.filtered.length + ' dari ' + S.data.length + ' respons'])
    ]);
  }
  function emptyMsg(body) { body.appendChild(H('div', { class: 'card' }, [H('p', { text: S.data.length ? 'Tidak ada respons yang cocok dengan filter.' : 'Belum ada respons pada periode ini. Sebarkan tautan survei ke mitra.' })])); }

  // ---------- tab: ringkasan ----------
  function kpi(label, value, sub, cls) { return H('div', { class: 'card kpi' }, [H('div', { class: 'kl', text: label }), H('div', { class: 'kv ' + (cls || ''), text: value }), H('div', { class: 'ks', text: sub || '' })]); }
  function chartCard(title, h, draw, extra) {
    var cv = H('canvas', {}), box = H('div', { class: 'card' }, [H('h3', { text: title }), H('div', { class: 'chartbox ' + (h || '') }, [cv]), extra || null]);
    setTimeout(function () { draw(cv); }, 0); return box;
  }
  function tabOverview(body) {
    if (!S.filtered.length) return emptyMsg(body);
    var st = stats('id'), f = function (v, d) { return fmt(v, d); }, met = st.composite.index >= st.target;
    body.appendChild(H('div', { class: 'grid g4' }, [
      kpi('Responden', String(st.n), st.institutions + ' institusi · ' + st.countries + ' negara · ' + st.units + ' unit UMB'),
      kpi('Skor kepuasan gabungan (1–5)', f(st.composite.mean), N.RS.id.cat[st.composite.category] + (st.composite.ci ? ' · IK95% ' + f(st.composite.ci[0]) + '–' + f(st.composite.ci[1]) : '')),
      kpi('Indeks kepuasan', f(st.composite.index, 1) + '%', 'Target ≥ ' + st.target + '% · ' + (met ? 'tercapai' : 'belum tercapai'), met ? 'goodc' : 'bad'),
      kpi('Net Promoter Score', f(st.nps.nps, 0), 'Promoter ' + f(st.nps.promoters, 0) + '% · Detractor ' + f(st.nps.detractors, 0) + '%'),
      kpi('Kepuasan keseluruhan (1–5)', f(st.overall.mean), 'Puas+Sangat puas: ' + f(st.overall.top2, 1) + '%'),
      kpi('Niat melanjutkan kerja sama (1–5)', f(st.cont.mean), 'n = ' + st.cont.n),
      kpi('Reliabilitas butir (α)', st.reliability.alpha === null ? '–' : f(st.reliability.alpha), st.reliability.alpha === null ? 'Data lengkap belum cukup' : (st.reliability.alpha >= 0.7 ? 'Memadai (≥ 0,70)' : 'Perlu kehati-hatian')),
      kpi('Bersedia ditindaklanjuti', String(st.followUp), 'responden mengizinkan dihubungi')
    ]));
    if (st.lowSample) body.appendChild(H('div', { class: 'msg info', style: 'margin-top:12px', text: N.RS.id.lowSample }));
    body.appendChild(H('div', { class: 'grid g2', style: 'margin-top:12px' }, [
      chartCard('Indeks kepuasan per dimensi (oranye = di bawah target)', '', function (cv) {
        Charts.bar(cv, st.dims.map(function (d) { return d.name.id; }), st.dims.map(function (d) { return d.index === null ? null : Math.round(d.index * 10) / 10; }), { horizontal: true, max: 100, target: st.target, targetLabel: 'Target ' + st.target + '%', fmt: function (v) { return fmt(v, 1) + '%'; }, colors: st.dims.map(function (d) { return d.belowTarget ? Charts.C.orange : Charts.C.blue; }) });
      }),
      chartCard('Profil dimensi (radar)', '', function (cv) { Charts.radar(cv, st.dims.map(function (d) { return d.name.id; }), st.dims.map(function (d) { return d.index === null ? 0 : Math.round(d.index * 10) / 10; }), st.target); })
    ]));
    body.appendChild(H('div', { class: 'grid g3', style: 'margin-top:12px' }, [
      chartCard('Distribusi kepuasan keseluruhan (1–5)', 'short', function (cv) { Charts.likert(cv, st.overall.dist); }),
      chartCard('Komposisi NPS', 'short', function (cv) { Charts.nps(cv, st.nps, { labels: ['Detractor (0–6)', 'Passive (7–8)', 'Promoter (9–10)'] }); }),
      chartCard('Tren bulanan indeks kepuasan', 'short', function (cv) { Charts.line(cv, st.trend.map(function (t) { return t.month; }), st.trend.map(function (t) { return Math.round(t.index * 10) / 10; }), { target: st.target, targetLabel: st.target + '%' }); })
    ]));
    body.appendChild(H('div', { class: 'grid g2', style: 'margin-top:12px' }, [
      chartCard('Responden per negara (10 teratas)', '', function (cv) { var g = st.segments.country.slice(0, 10); Charts.bar(cv, g.map(function (x) { return x.label; }), g.map(function (x) { return x.n; }), { horizontal: true }); }),
      chartCard('Indeks kepuasan per unit UMB (n ≥ 1)', '', function (cv) { var g = st.segments.unit.slice(0, 10); Charts.bar(cv, g.map(function (x) { return x.label + ' (n=' + x.n + ')'; }), g.map(function (x) { return Math.round(x.index * 10) / 10; }), { horizontal: true, max: 100, target: st.target, targetLabel: st.target + '%', fmt: function (v) { return fmt(v, 1) + '%'; }, maxLabel: 40 }); })
    ]));
    var auto = N.build(st, 'id');
    body.appendChild(H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'Kesimpulan otomatis (berbasis aturan, tanpa AI)' })].concat(auto.paragraphs.map(function (p) { return H('p', { text: p }); }), auto.concerns.length ? [H('h4', { text: 'Area perbaikan (di bawah target)' }), H('ul', {}, auto.concerns.map(function (c) { return H('li', { text: c }); }))] : [])));
  }

  // ---------- tab: dimensi ----------
  function tabDims(body) {
    if (!S.filtered.length) return emptyMsg(body);
    var st = stats('id'), rows = [];
    st.dims.forEach(function (d) {
      rows.push(H('tr', { class: 'grp' + (d.belowTarget ? ' warn' : '') }, [H('td', { text: d.id + ' — ' + d.name.id }), H('td', { class: 'num', text: String(d.nResp) }), H('td', { class: 'num', text: fmt(d.mean) }), H('td', { class: 'num', text: fmt(d.sd) }), H('td', { class: 'num', text: d.ci ? fmt(d.ci[0]) + '–' + fmt(d.ci[1]) : '–' }), H('td', { class: 'num', text: fmt(d.index, 1) }), H('td', { class: 'num', text: fmt(d.top2, 1) }), H('td', { class: 'num', text: fmt(d.alpha) }), H('td', {}, [H('span', { class: 'pill ' + (d.belowTarget ? 'warn' : 'ok'), text: d.belowTarget ? 'Di bawah target' : 'Memenuhi' })])]));
      d.items.forEach(function (i) {
        rows.push(H('tr', { class: i.belowTarget ? 'warn' : '' }, [H('td', { text: i.id + '. ' + i.t.id }), H('td', { class: 'num', text: String(i.n) }), H('td', { class: 'num', text: fmt(i.mean) }), H('td', { class: 'num', text: fmt(i.sd) }), H('td', { class: 'num', text: i.ci ? fmt(i.ci[0]) + '–' + fmt(i.ci[1]) : '–' }), H('td', { class: 'num', text: fmt(i.index, 1) }), H('td', { class: 'num', text: fmt(i.top2, 1) }), H('td', {}), H('td', {})]));
      });
    });
    body.appendChild(H('div', { class: 'card' }, [H('h3', { text: 'Statistik per dimensi dan butir' }),
      H('div', { class: 'scroll' }, [H('table', { class: 'dt' }, [H('thead', {}, [H('tr', {}, ['Dimensi / butir', 'n', 'Rata-rata', 'SD', 'IK 95%', 'Indeks (%)', 'Puas (%)', 'α', 'Status'].map(function (h, i) { return H('th', { class: i > 0 && i < 8 ? 'num' : '', text: h }); }))]), H('tbody', {}, rows)])]),
      H('p', { class: 'note', text: 'Puas (%) = proporsi nilai 4–5. α = Cronbach (listwise). Baris bertanda oranye berada di bawah target ' + st.target + '%.' })]));
    body.appendChild(H('div', { class: 'grid g2', style: 'margin-top:12px' }, [
      chartCard('Faktor penentu: korelasi dimensi dengan kepuasan keseluruhan (r)', '', function (cv) { var d = st.drivers.filter(function (x) { return x.r !== null; }); Charts.bar(cv, d.map(function (x) { return x.name.id; }), d.map(function (x) { return Math.round(x.r * 100) / 100; }), { horizontal: true, min: Math.min(0, Math.min.apply(null, d.map(function (x) { return x.r; }))), max: 1, fmt: function (v) { return fmt(v, 2); } }); }),
      H('div', { class: 'card' }, [H('h3', { text: 'Analisis faktor penentu (Pearson)' }), H('table', { class: 'dt' }, [H('thead', {}, [H('tr', {}, ['Dimensi', 'n', 'r', 'p', 'Kekuatan'].map(function (h) { return H('th', { text: h }); }))]), H('tbody', {}, st.drivers.map(function (d) { return H('tr', {}, [H('td', { text: d.name.id }), H('td', { class: 'num', text: String(d.n) }), H('td', { class: 'num', text: fmt(d.r) }), H('td', { class: 'num', text: fmtP(d.p) }), H('td', { text: d.strength ? N.RS.id.st[d.strength] : '–' })]); }))]),
        H('p', { class: 'note', text: 'Korelasi bukan sebab-akibat. Dimensi dengan r tinggi sekaligus di bawah target adalah prioritas perbaikan.' })])
    ]));
    body.appendChild(H('div', { class: 'grid g2', style: 'margin-top:12px' }, [
      H('div', { class: 'card' }, [H('h3', { text: '5 butir nilai terendah' }), H('table', { class: 'dt' }, [H('tbody', {}, st.lowestItems.map(function (i) { return H('tr', {}, [H('td', { text: i.id + '. ' + i.t.id }), H('td', { class: 'num', text: fmt(i.mean) })]); }))])]),
      H('div', { class: 'card' }, [H('h3', { text: '5 butir nilai tertinggi' }), H('table', { class: 'dt' }, [H('tbody', {}, st.highestItems.map(function (i) { return H('tr', {}, [H('td', { text: i.id + '. ' + i.t.id }), H('td', { class: 'num', text: fmt(i.mean) })]); }))])])
    ]));
  }

  // ---------- tab: segmentasi ----------
  function tabSeg(body) {
    if (!S.filtered.length) return emptyMsg(body);
    var st = stats('id'), keys = [['unit', 'Unit UMB'], ['unitCategory', 'Jenis unit UMB'], ['country', 'Negara mitra'], ['instType', 'Jenis institusi'], ['activity', 'Jenis kegiatan'], ['duration', 'Lama kerja sama'], ['docStatus', 'Status dokumen']];
    var sel = H('select', { onchange: function (e) { S.segKey = e.target.value; renderShell(); } }, keys.map(function (k) { return H('option', { value: k[0], text: k[1], selected: S.segKey === k[0] }); }));
    var g = st.segments[S.segKey], an = st.anova[S.segKey];
    var anTxt = an ? 'ANOVA skor gabungan: F(' + an.df1 + ', ' + an.df2 + ') = ' + (an.F === null ? '–' : fmt(an.F)) + ', p = ' + fmtP(an.p) + ', η² = ' + fmt(an.eta2, 3) + ' → ' + (an.p < 0.05 ? 'ada perbedaan signifikan antar kelompok.' : 'tidak ada perbedaan signifikan antar kelompok.') + (an.k < g.length ? ' (kelompok n < 2 dikecualikan)' : '') : 'ANOVA tidak tersedia untuk pengelompokan ini (kelompok bersifat tumpang-tindih atau n per kelompok < 2).';
    body.appendChild(H('div', { class: 'card' }, [H('div', { class: 'row' }, [H('h3', { text: 'Segmentasi berdasarkan', style: 'margin:0' }), sel]),
      H('div', { class: 'scroll', style: 'margin-top:10px' }, [H('table', { class: 'dt' }, [H('thead', {}, [H('tr', {}, ['Kelompok', 'n', 'Skor gabungan', 'Indeks (%)', 'Kepuasan keseluruhan', 'NPS'].map(function (h, i) { return H('th', { class: i ? 'num' : '', text: h }); }))]), H('tbody', {}, g.map(function (x) { return H('tr', { class: x.index !== null && x.index < st.target ? 'warn' : '' }, [H('td', { text: x.label }), H('td', { class: 'num', text: String(x.n) }), H('td', { class: 'num', text: fmt(x.composite) }), H('td', { class: 'num', text: fmt(x.index, 1) }), H('td', { class: 'num', text: fmt(x.overall) }), H('td', { class: 'num', text: fmt(x.nps, 0) })]); }))])]),
      H('p', { class: 'note', text: anTxt + ' Kelompok kecil (n < 5) hanya bersifat indikatif.' })]));
    var top = g.slice(0, 12);
    body.appendChild(H('div', { style: 'margin-top:12px' }, [chartCard('Indeks kepuasan per kelompok (maks. 12 kelompok terbesar)', 'tall', function (cv) {
      Charts.bar(cv, top.map(function (x) { return x.label + ' (n=' + x.n + ')'; }), top.map(function (x) { return x.index === null ? null : Math.round(x.index * 10) / 10; }), { horizontal: true, max: 100, target: st.target, targetLabel: 'Target ' + st.target + '%', fmt: function (v) { return fmt(v, 1) + '%'; }, maxLabel: 46, colors: top.map(function (x) { return x.index !== null && x.index < st.target ? Charts.C.orange : Charts.C.blue; }) });
    })]));
  }

  // ---------- tab: komentar ----------
  function tabComments(body) {
    var types = [['', 'Semua'], ['openStrength', 'Yang dihargai'], ['openImprove', 'Perlu diperbaiki'], ['openSuggest', 'Saran']];
    var list = [];
    S.filtered.forEach(function (r) { types.slice(1).forEach(function (t) { var tx = (r[t[0]] || '').trim(); if (tx && (!S.cmtType || S.cmtType === t[0])) list.push({ t: t, r: r, tx: tx }); }); });
    var q = S.cmtQ.toLowerCase(); if (q) list = list.filter(function (x) { return x.tx.toLowerCase().indexOf(q) >= 0 || x.r.unitName.toLowerCase().indexOf(q) >= 0 || x.r.institution.toLowerCase().indexOf(q) >= 0; });
    var ts = H('select', { onchange: function (e) { S.cmtType = e.target.value; renderShell(); } }, types.map(function (t) { return H('option', { value: t[0], text: t[1], selected: S.cmtType === t[0] }); }));
    var qi = H('input', { type: 'text', placeholder: 'Cari kata / institusi / unit…', value: S.cmtQ, onchange: function (e) { S.cmtQ = e.target.value; renderShell(); } });
    body.appendChild(H('div', { class: 'card' }, [H('div', { class: 'row' }, [H('h3', { text: list.length + ' masukan', style: 'margin:0' }), ts, H('div', { class: 'grow' }, [qi])]),
      H('p', { class: 'note', text: 'Komentar ditampilkan dalam bahasa asli responden. Gunakan Analisis AI untuk ringkasan tema terjemahan.' }),
      H('div', { style: 'margin-top:8px' }, list.slice(0, 200).map(function (x) {
        return H('div', { class: 'cmt', dir: x.r.lang === 'ar' ? 'rtl' : 'auto' }, [H('div', { text: x.tx }), H('div', { class: 'meta', dir: 'ltr', text: x.t[1] + ' · ' + x.r.lang.toUpperCase() + ' · ' + x.r.institution + ' · ' + x.r.country + ' → ' + x.r.unitName })]);
      })), list.length > 200 ? H('p', { class: 'note', text: 'Menampilkan 200 pertama.' }) : null]));
  }

  // ---------- tab: respons ----------
  function csvCell(v) {
    v = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
    return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function downloadCsv() {
    var head = ['ResponseID', 'Tanggal', 'Periode', 'Bahasa', 'Nama', 'Jabatan', 'Institusi', 'Jenis institusi', 'Negara', 'Provinsi', 'Kota', 'Kecamatan', 'Email', 'WhatsApp', 'Jenis unit', 'Unit UMB', 'Kontak di UMB', 'Kegiatan', 'Lama', 'Status dokumen']
      .concat(SC.itemIds, ['Skor gabungan', 'Yang dihargai', 'Perlu diperbaiki', 'Saran', 'Bersedia dihubungi']);
    var rows = S.filtered.map(function (r) {
      return [r.id, r.ts, r.period, r.lang, r.name, r.position, r.institution, lab(SC.instTypes, r.instType), r.country, r.province, r.city, r.district, r.email, r.whatsapp, lab(SC.unitCategories, r.unitCategory), r.unitName, r.umbContact, r.activities.map(function (a) { return lab(SC.activities, a); }).join('; '), lab(SC.durations, r.duration), lab(SC.docStatus, r.docStatus)]
        .concat(SC.itemIds.map(function (id) { return r.s[id] === null ? '' : r.s[id]; }), [r.composite === null ? '' : r.composite.toFixed(3), r.openStrength, r.openImprove, r.openSuggest, r.followUp ? 'Ya' : 'Tidak']);
    });
    var csv = '﻿' + [head].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    var a = H('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: 'survei-mitra-umb-' + (S.filters.period || 'semua') + '.csv' });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function respDetail(r) {
    var kv = [['ID', r.id], ['Tanggal', r.ts], ['Bahasa', r.lang], ['Nama', r.name], ['Jabatan', r.position], ['Institusi', r.institution + ' (' + lab(SC.instTypes, r.instType) + ')'],
      ['Lokasi', [r.district, r.city, r.province, r.country].filter(Boolean).join(', ')], ['Alamat', r.address], ['Email', r.email], ['WhatsApp', r.whatsapp],
      ['Unit UMB', lab(SC.unitCategories, r.unitCategory) + ' — ' + r.unitName], ['Kontak di UMB', r.umbContact], ['Kegiatan', r.activities.map(function (a) { return lab(SC.activities, a); }).join('; ') + (r.activityOther ? ' (' + r.activityOther + ')' : '')],
      ['Lama / dokumen', lab(SC.durations, r.duration) + ' / ' + lab(SC.docStatus, r.docStatus)], ['Bersedia dihubungi', r.followUp ? 'Ya' : 'Tidak']];
    var kids = [H('h3', { text: 'Detail respons' }), H('div', { class: 'kv2' }, [].concat.apply([], kv.map(function (x) { return [H('b', { text: x[0] }), H('span', { text: x[1] || '–' })]; })))];
    kids.push(H('h4', { text: 'Skor' }));
    kids.push(H('table', { class: 'dt' }, [H('tbody', {}, SC.dimensions.map(function (d) { return H('tr', {}, [H('td', { text: d.name.id }), H('td', { class: 'num', text: d.items.map(function (i) { return r.s[i.id] === null ? 'N/A' : r.s[i.id]; }).join(' · ') }), H('td', { class: 'num', text: fmt(r.dim[d.id]) })]); }).concat([H('tr', { class: 'grp' }, [H('td', { text: 'Keseluruhan / Lanjut / NPS' }), H('td', { class: 'num', text: [r.s.OVR1, r.s.OVR2, r.s.NPS].join(' · ') }), H('td', { class: 'num', text: fmt(r.composite) })])]))]));
    [['Yang dihargai', r.openStrength], ['Perlu diperbaiki', r.openImprove], ['Saran', r.openSuggest]].forEach(function (c) { if (c[1]) { kids.push(H('h4', { text: c[0] })); kids.push(H('div', { class: 'cmt', dir: r.lang === 'ar' ? 'rtl' : 'auto', text: c[1] })); } });
    kids.push(H('div', { class: 'row', style: 'margin-top:12px;justify-content:flex-end' }, [
      isSuper() ? H('button', { class: 'btn danger sm', onclick: function () { if (!confirm('Hapus respons ' + r.id + ' secara permanen?')) return; call('deleteResponse', { id: r.id }).then(function () { closeModal(); toast('ok', 'Respons dihapus.'); loadData(); }).catch(function (e) { toast('bad', errText(e)); }); }, text: 'Hapus respons' }) : null,
      H('button', { class: 'btn ghost sm', onclick: closeModal, text: 'Tutup' })]));
    modal(kids);
  }
  function tabResponses(body) {
    var q = S.respQ.toLowerCase(), list = S.filtered.filter(function (r) { return !q || (r.institution + r.name + r.email + r.unitName + r.country + r.id).toLowerCase().indexOf(q) >= 0; });
    var qi = H('input', { type: 'text', placeholder: 'Cari institusi / nama / email / unit…', value: S.respQ, onchange: function (e) { S.respQ = e.target.value; renderShell(); } });
    body.appendChild(H('div', { class: 'card' }, [H('div', { class: 'row' }, [H('h3', { text: list.length + ' respons', style: 'margin:0' }), H('div', { class: 'grow' }, [qi]), H('button', { class: 'btn sm', onclick: downloadCsv, text: 'Unduh CSV (sesuai filter)' })]),
      H('div', { class: 'scroll', style: 'margin-top:10px' }, [H('table', { class: 'dt' }, [H('thead', {}, [H('tr', {}, ['Tanggal', 'Institusi', 'Negara', 'Unit UMB', 'Bhs', 'Gabungan', 'Keseluruhan', 'NPS'].map(function (h, i) { return H('th', { class: i > 4 ? 'num' : '', text: h }); }))]),
        H('tbody', {}, list.slice(0, 300).map(function (r) { return H('tr', { class: 'click', onclick: function () { respDetail(r); } }, [H('td', { text: dateStr(r.ts) }), H('td', { text: r.institution }), H('td', { text: r.country }), H('td', { text: r.unitName }), H('td', { text: r.lang }), H('td', { class: 'num', text: fmt(r.composite) }), H('td', { class: 'num', text: r.s.OVR1 === null ? '–' : r.s.OVR1 }), H('td', { class: 'num', text: r.s.NPS === null ? '–' : r.s.NPS })]); }))])]),
      list.length > 300 ? H('p', { class: 'note', text: 'Menampilkan 300 pertama; unduh CSV untuk data lengkap.' }) : null,
      H('p', { class: 'note', text: 'Data berisi kontak responden — jaga kerahasiaan sesuai kebijakan data pribadi.' })]));
  }

  // ---------- AI + laporan ----------
  function aiPayload(st, data) {
    var seg = function (k, n) { return st.segments[k].slice(0, n).map(function (g) { return { label: g.label, n: g.n, index: ST.round(g.index, 1), nps: ST.round(g.nps, 0) }; }); };
    var p = { period: S.filters.period || 'all', scope: filterLabel() || 'all data', n: st.n, qualityTargetIndex: st.target,
      composite: { mean: ST.round(st.composite.mean), index: ST.round(st.composite.index, 1), category: st.composite.category },
      overall: { mean: ST.round(st.overall.mean), satisfiedPct: ST.round(st.overall.top2, 1) }, continueIntentMean: ST.round(st.cont.mean),
      nps: { value: ST.round(st.nps.nps, 0), promotersPct: ST.round(st.nps.promoters, 0), detractorsPct: ST.round(st.nps.detractors, 0) }, reliabilityAlpha: ST.round(st.reliability.alpha),
      dimensions: st.dims.map(function (d) { return { id: d.id, name: d.name.id, mean: ST.round(d.mean), index: ST.round(d.index, 1), belowTarget: d.belowTarget, items: d.items.map(function (i) { return { id: i.id, text: i.t.id, mean: ST.round(i.mean), n: i.n }; }) }; }),
      keyDrivers: st.drivers.map(function (d) { return { dimension: d.name.id, r: ST.round(d.r), p: ST.round(d.p, 4) }; }),
      segments: { unit: seg('unit', 15), unitCategory: seg('unitCategory', 6), country: seg('country', 12), instType: seg('instType', 10), activity: seg('activity', 10), duration: seg('duration', 4) },
      anova: Object.keys(st.anova).reduce(function (o, k) { var a = st.anova[k]; o[k] = { F: ST.round(a.F), df1: a.df1, df2: a.df2, p: ST.round(a.p, 4) }; return o; }, {}),
      futureInterest: st.futureInterest.slice(0, 8).map(function (x) { return { area: x.label, n: x.n }; }), comments: [] };
    var types = [['openStrength', 'valued'], ['openImprove', 'improve'], ['openSuggest', 'suggestion']];
    types.forEach(function (t) { data.forEach(function (r) { var tx = (r[t[0]] || '').trim(); if (tx && p.comments.length < 360) p.comments.push({ type: t[1], lang: r.lang, unit: r.unitName, country: r.country, text: tx.slice(0, 350) }); }); });
    while (JSON.stringify(p).length > 85000 && p.comments.length) p.comments.length = Math.floor(p.comments.length * 0.8);
    return p;
  }
  function selectedAi() { return S.aiList.filter(function (a) { return a.meta.id === S.aiSel; })[0] || null; }
  function aiMatches(a) { return a && a.meta.n === S.filtered.length && String(a.meta.period) === String(S.filters.period || 'Semua') && (a.meta.filterLabel || '') === filterLabel() && a.meta.lang === S.reportLang; }
  function runAi(btn) {
    var st = stats(S.reportLang); if (!st.n) return toast('bad', 'Tidak ada data untuk dianalisis.');
    if (!confirm('Kirim ringkasan statistik dan komentar (tanpa nama/kontak) ke OpenAI untuk dianalisis?')) return;
    btn.disabled = true; btn.textContent = 'Menganalisis… (bisa 30–90 detik)';
    call('aiAnalyze', { lang: S.reportLang, period: S.filters.period || 'Semua', filterLabel: filterLabel(), n: st.n, payload: aiPayload(st, S.filtered) }, 170000).then(function (res) {
      S.aiList.unshift(res); S.aiSel = res.meta.id; S.aiUse = true; toast('ok', 'Analisis AI selesai dan disimpan.'); renderShell();
    }).catch(function (e) { btn.disabled = false; btn.textContent = 'Buat analisis AI'; toast('bad', errText(e)); });
  }
  function aiView(a) {
    var A = a.analysis, box = H('div', { class: 'aibox' });
    function list(title, arr) { if (arr && arr.length) { box.appendChild(H('h4', { text: title })); box.appendChild(H('ul', {}, arr.map(function (x) { return H('li', { text: x }); }))); } }
    if (A.executive_summary) { box.appendChild(H('h4', { text: 'Ringkasan eksekutif' })); box.appendChild(H('p', { text: A.executive_summary })); }
    list('Temuan utama', A.key_findings); list('Kekuatan', A.strengths); list('Kelemahan', A.weaknesses);
    if ((A.comment_themes || []).length) { box.appendChild(H('h4', { text: 'Tema masukan' })); box.appendChild(H('table', { class: 'dt' }, [H('tbody', {}, A.comment_themes.map(function (t) { return H('tr', {}, [H('td', { text: t.theme || '' }), H('td', { text: t.sentiment || '' }), H('td', { class: 'num', text: t.count === undefined ? '' : t.count }), H('td', { text: t.example || '' })]); }))])); }
    if ((A.recommendations || []).length) { box.appendChild(H('h4', { text: 'Rekomendasi' })); box.appendChild(H('table', { class: 'dt' }, [H('tbody', {}, A.recommendations.map(function (r) { return H('tr', {}, [H('td', {}, [H('span', { class: 'pill ' + (r.priority === 'high' ? 'bad' : r.priority === 'medium' ? 'warn' : ''), text: r.priority || '' })]), H('td', { text: r.action || '' }), H('td', { text: r.owner || '' }), H('td', { text: r.timeline || '' })]); }))])); }
    list('Risiko & keterbatasan', A.risks_limitations);
    if (A.conclusion) { box.appendChild(H('h4', { text: 'Kesimpulan' })); box.appendChild(H('p', { text: A.conclusion })); }
    return box;
  }
  function reportCtx(mode, scope) {
    var st = stats(S.reportLang), a = selectedAi();
    return { stats: st, data: S.filtered, lang: S.reportLang, mode: mode, scope: scope, ai: S.aiUse && a && aiMatches(a) ? a : null,
      meta: { period: S.filters.period || (S.reportLang === 'id' ? 'Semua periode' : 'All periods'), filterLabel: filterLabel(), date: new Date().toLocaleDateString(S.reportLang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), user: S.user.name } };
  }
  function printReport(mode) {
    if (!S.filtered.length) return toast('bad', 'Tidak ada data pada filter ini.');
    var pr = $('printRoot'); Charts.clear('print'); Report.render(pr, reportCtx(mode, 'print'));
    var oldTitle = document.title; document.title = 'Laporan-Kepuasan-Mitra-UMB-' + (S.filters.period || 'semua') + (mode === 'summary' ? '-Ringkasan' : '-Lengkap');
    setTimeout(function () {
      document.body.classList.add('printing');
      var done = function () { document.body.classList.remove('printing'); document.title = oldTitle; pr.innerHTML = ''; Charts.clear('print'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done); window.print();
    }, 900);
  }
  function previewReport(mode) {
    var box = $('previewBox'); if (!box) return; if (!S.filtered.length) return toast('bad', 'Tidak ada data pada filter ini.');
    Report.render(box, reportCtx(mode, 'preview')); box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function tabReport(body) {
    var a = selectedAi(), match = aiMatches(a);
    var langSel = H('select', { onchange: function (e) { S.reportLang = e.target.value; renderShell(); } }, [H('option', { value: 'id', text: 'Bahasa Indonesia', selected: S.reportLang === 'id' }), H('option', { value: 'en', text: 'English', selected: S.reportLang === 'en' })]);
    var aiBtn = H('button', { class: 'btn', text: 'Buat analisis AI', onclick: function () { runAi(aiBtn); } });
    var aiSel = S.aiList.length ? H('select', { onchange: function (e) { S.aiSel = e.target.value; renderShell(); } }, S.aiList.map(function (x) { return H('option', { value: x.meta.id, selected: x.meta.id === S.aiSel, text: dateStr(x.meta.createdAt) + ' · ' + x.meta.lang + ' · n=' + x.meta.n + (x.meta.filterLabel ? ' · ' + x.meta.filterLabel : '') + ' · ' + x.meta.createdBy }); })) : null;
    body.appendChild(H('div', { class: 'card' }, [H('h3', { text: 'Pengaturan laporan' }), H('div', { class: 'row' }, [H('label', { text: 'Bahasa laporan & analisis AI:' }), langSel]),
      H('p', { class: 'note', text: 'Cakupan data: ' + (filterLabel() || 'seluruh data periode') + ' — ' + S.filtered.length + ' responden. Ubah cakupan lewat filter di atas.' })]));
    body.appendChild(H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'Analisis AI (ChatGPT)' }),
      !S.settings.aiConfigured ? H('div', { class: 'msg info', text: 'OPENAI_API_KEY belum diisi. Isi di Apps Script → Project Settings → Script Properties. Laporan tetap bisa dibuat dengan kesimpulan otomatis berbasis aturan.' }) : null,
      H('div', { class: 'row' }, [aiBtn, aiSel ? H('div', { class: 'grow' }, [aiSel]) : null]),
      H('p', { class: 'note', text: 'Yang dikirim ke OpenAI: ringkasan statistik + komentar terbuka tanpa nama, email, WhatsApp, dan institusi. Hasil AI wajib diverifikasi tim UGE.' }),
      a ? H('div', { style: 'margin-top:8px' }, [
        !match ? H('div', { class: 'msg info', text: 'Analisis terpilih dibuat untuk cakupan/bahasa/jumlah data yang berbeda dari tampilan sekarang, sehingga TIDAK disertakan di laporan. Buat analisis baru untuk cakupan ini.' }) : H('label', { class: 'row' }, [H('input', { type: 'checkbox', checked: S.aiUse, onchange: function (e) { S.aiUse = e.target.checked; } }), 'Sertakan analisis AI ini di laporan']),
        aiView(a)]) : null]));
    body.appendChild(H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'Laporan' }),
      H('div', { class: 'row' }, [
        H('button', { class: 'btn', onclick: function () { printReport('summary'); }, text: 'Unduh PDF Ringkasan (kesimpulan)' }),
        H('button', { class: 'btn', onclick: function () { printReport('full'); }, text: 'Unduh PDF Laporan Lengkap' }),
        H('button', { class: 'btn ghost', onclick: function () { previewReport('summary'); }, text: 'Pratinjau ringkasan' }),
        H('button', { class: 'btn ghost', onclick: function () { previewReport('full'); }, text: 'Pratinjau lengkap' }),
        H('button', { class: 'btn ghost', onclick: downloadCsv, text: 'Unduh data CSV' })]),
      H('p', { class: 'note', text: 'Tombol PDF membuka dialog cetak browser: pilih “Simpan sebagai PDF”, kertas A4, dan aktifkan “Grafik latar belakang”. Nama file sudah diisi otomatis.' }),
      H('div', { id: 'previewBox', class: 'preview', style: 'margin-top:10px' }, [H('div', { class: 'note', text: 'Pratinjau laporan akan muncul di sini.' })])]));
  }

  // ---------- pengguna ----------
  function tabUsers(body) {
    body.appendChild(H('div', { class: 'card' }, [H('div', { class: 'row' }, [H('h3', { text: 'Pengguna dashboard', style: 'margin:0' }), H('div', { class: 'grow' }), H('button', { class: 'btn sm', onclick: function () { userModal(null); }, text: '+ Tambah pengguna' })]), H('div', { id: 'usersBox', style: 'margin-top:8px' }, [H('div', { class: 'note', text: 'Memuat…' })]),
      H('p', { class: 'note', text: 'Superadmin: kelola pengguna, unit, pengaturan, hapus respons. Admin (Tim UGE): lihat dashboard, AI, dan unduh laporan.' })]));
    call('usersList').then(function (d) {
      S.users = d.users; var box = $('usersBox'); if (!box) return; box.innerHTML = '';
      box.appendChild(H('table', { class: 'dt' }, [H('thead', {}, [H('tr', {}, ['Nama', 'Email', 'Role', 'Status', 'Login terakhir', ''].map(function (h) { return H('th', { text: h }); }))]),
        H('tbody', {}, d.users.map(function (u) { return H('tr', {}, [H('td', { text: u.name }), H('td', { text: u.email }), H('td', { text: u.role === 'superadmin' ? 'Superadmin' : 'Admin' }), H('td', {}, [H('span', { class: 'pill ' + (u.active ? 'ok' : 'bad'), text: u.active ? 'Aktif' : 'Nonaktif' })]), H('td', { text: u.lastLogin ? dateStr(u.lastLogin) : '–' }),
          H('td', {}, [H('button', { class: 'btn ghost sm', onclick: function () { userModal(u); }, text: 'Ubah' }), ' ', u.email.toLowerCase() === S.user.email.toLowerCase() ? null : H('button', { class: 'btn danger sm', onclick: function () { if (!confirm('Hapus pengguna ' + u.email + '?')) return; call('userDelete', { email: u.email }).then(function () { toast('ok', 'Pengguna dihapus.'); renderShell(); }).catch(function (e) { toast('bad', errText(e)); }); }, text: 'Hapus' })])]); }))]));
    }).catch(function (e) { var box = $('usersBox'); if (box) { box.innerHTML = ''; box.appendChild(H('div', { class: 'msg bad', text: errText(e) })); } });
  }
  function userModal(u) {
    var f = { email: H('input', { type: 'email', value: u ? u.email : '', disabled: !!u }), name: H('input', { type: 'text', value: u ? u.name : '' }), role: H('select', {}, [H('option', { value: 'admin', text: 'Admin (Tim UGE)', selected: !u || u.role === 'admin' }), H('option', { value: 'superadmin', text: 'Superadmin (Kepala UGE)', selected: u && u.role === 'superadmin' })]),
      active: H('input', { type: 'checkbox', checked: u ? u.active : true }), pw: H('input', { type: 'password', autocomplete: 'new-password', placeholder: u ? 'Kosongkan jika tidak diganti' : 'Min. 10 karakter, huruf + angka' }) };
    var err = H('div');
    modal([H('h3', { text: u ? 'Ubah pengguna' : 'Tambah pengguna' }), err,
      H('div', { class: 'fld' }, [H('label', { text: 'Email' }), f.email]), H('div', { class: 'fld' }, [H('label', { text: 'Nama' }), f.name]), H('div', { class: 'fld' }, [H('label', { text: 'Role' }), f.role]),
      H('div', { class: 'fld' }, [H('label', { text: 'Password' }), f.pw]), H('label', { class: 'row' }, [f.active, 'Akun aktif']),
      H('div', { class: 'row', style: 'justify-content:flex-end;margin-top:12px' }, [H('button', { class: 'btn ghost', onclick: closeModal, text: 'Batal' }), H('button', { class: 'btn', text: 'Simpan', onclick: function () {
        call('userSave', { user: { email: f.email.value, name: f.name.value, role: f.role.value, active: f.active.checked, password: f.pw.value } }).then(function () { closeModal(); toast('ok', 'Pengguna disimpan.'); renderShell(); })
          .catch(function (e) { err.innerHTML = ''; err.appendChild(H('div', { class: 'msg bad', text: errText(e) })); });
      } })])]);
  }
  function changePasswordModal() {
    var o = H('input', { type: 'password', autocomplete: 'current-password' }), n = H('input', { type: 'password', autocomplete: 'new-password' }), err = H('div');
    modal([H('h3', { text: 'Ganti password' }), err, H('div', { class: 'fld' }, [H('label', { text: 'Password lama' }), o]), H('div', { class: 'fld' }, [H('label', { text: 'Password baru (min. 10 karakter, huruf + angka)' }), n]),
      H('div', { class: 'row', style: 'justify-content:flex-end' }, [H('button', { class: 'btn ghost', onclick: closeModal, text: 'Batal' }), H('button', { class: 'btn', text: 'Simpan', onclick: function () {
        call('changePassword', { oldPassword: o.value, newPassword: n.value }).then(function () { closeModal(); toast('ok', 'Password diganti.'); }).catch(function (e) { err.innerHTML = ''; err.appendChild(H('div', { class: 'msg bad', text: errText(e) })); });
      } })])]);
  }

  // ---------- pengaturan ----------
  function surveyBase() { return location.href.replace(/dashboard\.html.*$/, '') + 'index.html'; }
  function tabSettings(body) {
    var s = S.settings, f = { period: H('input', { type: 'text', value: s.activePeriod }), open: H('input', { type: 'checkbox', checked: s.surveyOpen }), target: H('input', { type: 'number', min: 20, max: 100, value: s.targetIndex }), org: H('input', { type: 'text', value: s.orgName }), model: H('input', { type: 'text', value: s.openaiModel }) };
    body.appendChild(H('div', { class: 'card' }, [H('h3', { text: 'Pengaturan survei' }),
      H('div', { class: 'grid g2' }, [H('div', { class: 'fld' }, [H('label', { text: 'Periode survei aktif (mis. 2026 atau 2026-S1)' }), f.period]), H('div', { class: 'fld' }, [H('label', { text: 'Target indeks kepuasan (%) — sasaran mutu' }), f.target]),
        H('div', { class: 'fld' }, [H('label', { text: 'Nama institusi (di laporan)' }), f.org]), H('div', { class: 'fld' }, [H('label', { text: 'Model OpenAI' }), f.model])]),
      H('label', { class: 'row' }, [f.open, 'Survei dibuka (menerima jawaban)']),
      H('p', { class: 'note', text: 'Ganti periode setiap siklus survei agar tren tahunan terbaca; responden yang sama boleh mengisi lagi di periode baru.' }),
      H('button', { class: 'btn', text: 'Simpan pengaturan', onclick: function () {
        call('settingsSave', { settings: { activePeriod: f.period.value, surveyOpen: f.open.checked, targetIndex: f.target.value, orgName: f.org.value, openaiModel: f.model.value } }).then(function (r) { S.settings = r; toast('ok', 'Pengaturan disimpan.'); renderShell(); }).catch(function (e) { toast('bad', errText(e)); });
      } })]));
    var keyIn = H('input', { type: 'password', autocomplete: 'new-password', placeholder: 'sk-...', style: 'max-width:420px' });
    body.appendChild(H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'API key ChatGPT (OpenAI)' }),
      H('p', { class: 'note', text: s.aiConfigured ? 'Status: sudah terisi. Key tidak pernah ditampilkan kembali; isi ulang di bawah untuk menggantinya.' : 'Status: BELUM terisi. Analisis AI tidak aktif, tetapi kesimpulan otomatis tetap bisa dipakai.' }),
      H('div', { class: 'row' }, [keyIn,
        H('button', { class: 'btn sm', text: 'Simpan key', onclick: function () {
          if (!keyIn.value.trim()) return toast('bad', 'Isi API key terlebih dahulu.');
          call('settingsSave', { settings: { openaiKey: keyIn.value } }).then(function (r) { keyIn.value = ''; S.settings = r; toast('ok', 'API key disimpan di server (Script Properties).'); renderShell(); }).catch(function (e) { toast('bad', errText(e)); });
        } }),
        s.aiConfigured ? H('button', { class: 'btn danger sm', text: 'Hapus key', onclick: function () {
          if (!confirm('Hapus API key dari server?')) return;
          call('settingsSave', { settings: { clearOpenaiKey: true } }).then(function (r) { S.settings = r; toast('ok', 'API key dihapus.'); renderShell(); }).catch(function (e) { toast('bad', errText(e)); });
        } }) : null]),
      H('p', { class: 'note', text: 'Key disimpan di Script Properties Google Apps Script, hanya dibaca server saat analisis AI, dan tidak pernah dikirim ke browser. Gunakan key khusus proyek ini dan pasang batas pengeluaran di akun OpenAI.' })]));
    if (s.hasInitialData) {
      body.appendChild(H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'Data awal' }),
        H('p', { class: 'note', text: 'Dashboard saat ini memuat 10 respons awal agar tampilan dan laporan bisa dilihat. Hapus sebelum survei asli disebar dan sebelum audit ISO, supaya statistik hanya berisi jawaban mitra yang sebenarnya.' }),
        H('button', { class: 'btn danger sm', text: 'Hapus data awal', onclick: function () {
          if (!confirm('Hapus 10 respons awal dari sheet? Respons mitra yang sebenarnya tidak terpengaruh.')) return;
          call('removeInitialData').then(function (r) { toast('ok', r.removed + ' respons awal dihapus.'); S.settings.hasInitialData = false; loadData(); }).catch(function (e) { toast('bad', errText(e)); });
        } })]));
    }
    var base = surveyBase();
    var embed = '<iframe id="umb-survey" src="' + base + '" style="width:100%;border:0;min-height:900px" loading="lazy" title="Survei Kepuasan Mitra UMB"></iframe>\n<script>\nwindow.addEventListener("message",function(e){var f=document.getElementById("umb-survey");if(!f||e.source!==f.contentWindow)return;\n if(e.data&&e.data.type==="umb-survey-height")f.style.height=(e.data.height+20)+"px";\n if(e.data&&e.data.type==="umb-survey-scroll")f.scrollIntoView({behavior:"smooth",block:"start"});});\n<\/script>';
    body.appendChild(H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'Tautan survei & kode sematan Blogger' }),
      H('div', { class: 'kv2' }, SC.langs.map(function (l) { return [H('b', { text: l.name }), H('span', { text: base + '?lang=' + l.code })]; }).reduce(function (a, b) { return a.concat(b); }, [])),
      H('h4', { text: 'Kode HTML untuk halaman Blogger (mode HTML)' }), H('div', { class: 'code', text: embed }), H('button', { class: 'btn ghost sm', style: 'margin-top:6px', text: 'Salin kode', onclick: function () { if (navigator.clipboard) navigator.clipboard.writeText(embed).then(function () { toast('ok', 'Kode disalin.'); }); } })]));
    var uCard = H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'Daftar unit UMB (pilihan mitra di form survei)' }), H('div', { id: 'unitsBox', class: 'note', text: 'Memuat…' })]);
    body.appendChild(uCard);
    call('unitsGet').then(function (d) { S.units = d.units; renderUnits(); }).catch(function (e) { $('unitsBox').textContent = errText(e); });
    body.appendChild(H('div', { class: 'card', style: 'margin-top:12px' }, [H('h3', { text: 'Daftar institusi mitra (mengisi otomatis negara, jenis, provinsi, kota di form survei)' }), H('div', { id: 'partnersBox', class: 'note', text: 'Memuat…' })]));
    call('partnersGet').then(function (d) { S.partners = d.partners; renderPartners(); }).catch(function (e) { $('partnersBox').textContent = errText(e); });
  }
  function renderUnits() {
    var box = $('unitsBox'); if (!box) return; box.innerHTML = ''; box.className = '';
    var rows = S.units.map(function (u, i) {
      var cat = H('select', { onchange: function (e) { u.category = e.target.value; } }, SC.unitCategories.map(function (c) { return H('option', { value: c.id, text: c.t.id, selected: c.id === u.category }); }));
      return H('tr', {}, [H('td', {}, [cat]), H('td', {}, [H('input', { type: 'text', value: u.id, style: 'min-width:100px', onchange: function (e) { u.id = e.target.value; } })]), H('td', {}, [H('input', { type: 'text', value: u.nameId, style: 'min-width:220px', onchange: function (e) { u.nameId = e.target.value; } })]),
        H('td', {}, [H('input', { type: 'text', value: u.nameEn, style: 'min-width:220px', onchange: function (e) { u.nameEn = e.target.value; } })]), H('td', {}, [H('input', { type: 'checkbox', checked: u.active, onchange: function (e) { u.active = e.target.checked; } })]),
        H('td', {}, [H('button', { class: 'btn danger sm', text: '×', onclick: function () { S.units.splice(i, 1); renderUnits(); } })])]);
    });
    box.appendChild(H('div', { class: 'scroll' }, [H('table', { class: 'dt' }, [H('thead', {}, [H('tr', {}, ['Jenis', 'Kode unik', 'Nama (Indonesia)', 'Nama (Inggris)', 'Aktif', ''].map(function (h) { return H('th', { text: h }); }))]), H('tbody', {}, rows)])]));
    box.appendChild(H('div', { class: 'row', style: 'margin-top:8px' }, [
      H('button', { class: 'btn ghost sm', text: '+ Tambah unit', onclick: function () { S.units.push({ category: 'faculty', id: 'UNIT-' + (S.units.length + 1), nameId: '', nameEn: '', active: true }); renderUnits(); } }),
      H('button', { class: 'btn sm', text: 'Simpan daftar unit', onclick: function () { call('unitsSave', { units: S.units }).then(function (r) { toast('ok', r.count + ' unit disimpan.'); }).catch(function (e) { toast('bad', errText(e)); }); } })]));
    box.appendChild(H('p', { class: 'note', text: 'Kode unik dipakai untuk analisis; jangan diubah untuk unit yang sudah punya respons. Sesuaikan nama dan struktur dengan data resmi UMB.' }));
  }

  function renderPartners() {
    var box = $('partnersBox'); if (!box) return; box.innerHTML = ''; box.className = '';
    var rows = S.partners.map(function (x, i) {
      var inp = function (k, w, ph) { return H('td', {}, [H('input', { type: 'text', value: x[k] || '', placeholder: ph || '', style: 'min-width:' + w + 'px', onchange: function (e) { x[k] = e.target.value; } })]); };
      return H('tr', {}, [inp('name', 240), inp('countryCode', 50, 'TW'),
        H('td', {}, [H('select', { onchange: function (e) { x.instType = e.target.value; } }, SC.instTypes.map(function (c) { return H('option', { value: c.id, text: c.t.id, selected: c.id === x.instType }); }))]),
        inp('province', 130), inp('city', 120),
        H('td', {}, [H('input', { type: 'checkbox', checked: x.active, onchange: function (e) { x.active = e.target.checked; } })]),
        H('td', {}, [H('button', { class: 'btn danger sm', text: '×', onclick: function () { S.partners.splice(i, 1); renderPartners(); } })])]);
    });
    box.appendChild(H('div', { class: 'scroll' }, [H('table', { class: 'dt' }, [H('thead', {}, [H('tr', {}, ['Nama institusi', 'Kode negara (2 huruf)', 'Jenis', 'Provinsi / wilayah', 'Kota', 'Aktif', ''].map(function (h) { return H('th', { text: h }); }))]), H('tbody', {}, rows)])]));
    box.appendChild(H('div', { class: 'row', style: 'margin-top:8px' }, [
      H('button', { class: 'btn ghost sm', text: '+ Tambah institusi', onclick: function () { S.partners.push({ name: '', countryCode: '', instType: 'university', province: '', city: '', active: true }); renderPartners(); } }),
      H('button', { class: 'btn sm', text: 'Simpan daftar institusi', onclick: function () { call('partnersSave', { partners: S.partners }).then(function (r) { toast('ok', r.count + ' institusi disimpan.'); }).catch(function (e) { toast('bad', errText(e)); }); } })]));
    box.appendChild(H('p', { class: 'note', text: 'Mitra yang tidak ada di daftar tetap bisa mengetik nama institusinya sendiri. Nama provinsi/kota sebaiknya sama dengan ejaan di daftar wilayah form agar pilihan kota ikut terisi.' }));
  }

  // ---------- boot ----------
  function boot() { renderShell(); loadData(); }
  function init() {
    if (!API.configured()) { $('loginView').classList.remove('hidden'); $('loginView').appendChild(H('div', { class: 'login' }, [H('div', { class: 'msg bad', text: 'APP_CONFIG.API_URL belum diisi di assets/js/config.js.' })])); return; }
    var t = load(TOKEN_KEY);
    if (!t) return showLogin();
    S.token = t;
    API.post('me', { token: t }).then(function (d) { S.user = d.user; boot(); }).catch(function () { store(TOKEN_KEY, null); showLogin(); });
  }
  init();
})();
