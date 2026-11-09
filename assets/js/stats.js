/* Analisis statistik survei kepuasan (murni fungsi, tanpa DOM; bisa diuji di Node).
 * Skala: 1-5 (kepuasan), NPS 0-10. Indeks = rata-rata / 5 x 100. */
(function () {
  var SC = (typeof module !== 'undefined' && module.exports) ? require('./schema.js') : window.SCHEMA;

  // ---------- dasar ----------
  function nums(a) { return a.filter(function (v) { return typeof v === 'number' && isFinite(v); }); }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a) { a = nums(a); return a.length ? sum(a) / a.length : null; }
  function sd(a) {
    a = nums(a); if (a.length < 2) return null;
    var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / (a.length - 1));
  }
  function variance(a) { var s = sd(a); return s === null ? null : s * s; }
  function median(a) {
    a = nums(a).slice().sort(function (x, y) { return x - y; }); if (!a.length) return null;
    var m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  var T975 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
  function tcrit(df) { if (df < 1) return null; if (df <= 30) return T975[df - 1]; if (df <= 40) return 2.021; if (df <= 60) return 2.000; if (df <= 120) return 1.980; return 1.960; }
  function ci95(a) {
    a = nums(a); if (a.length < 2) return null;
    var se = sd(a) / Math.sqrt(a.length), t = tcrit(a.length - 1), m = mean(a);
    return [m - t * se, m + t * se];
  }
  function pct(k, n) { return n ? (k / n) * 100 : null; }
  function dist(a, lo, hi) {
    var d = []; for (var v = lo; v <= hi; v++) d.push(0);
    nums(a).forEach(function (x) { if (x >= lo && x <= hi && x === Math.floor(x)) d[x - lo]++; });
    return d;
  }
  function round(v, d) { if (v === null || v === undefined || !isFinite(v)) return null; var f = Math.pow(10, d === undefined ? 2 : d); return Math.round(v * f) / f; }

  // ---------- distribusi (p-value) ----------
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015; for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pFromT(t, df) { return ibeta(df / (df + t * t), df / 2, 0.5); }           // dua sisi
  function pFromF(F, d1, d2) { return ibeta(d2 / (d2 + d1 * F), d2 / 2, d1 / 2); }   // satu sisi atas

  // ---------- uji ----------
  function pearson(x, y) {
    var px = [], py = [];
    for (var i = 0; i < x.length; i++) if (typeof x[i] === 'number' && typeof y[i] === 'number') { px.push(x[i]); py.push(y[i]); }
    var n = px.length; if (n < 4) return { r: null, p: null, n: n };
    var mx = mean(px), my = mean(py), sxy = 0, sxx = 0, syy = 0;
    for (var j = 0; j < n; j++) { sxy += (px[j] - mx) * (py[j] - my); sxx += (px[j] - mx) * (px[j] - mx); syy += (py[j] - my) * (py[j] - my); }
    if (sxx === 0 || syy === 0) return { r: null, p: null, n: n };
    var r = sxy / Math.sqrt(sxx * syy);
    if (Math.abs(r) >= 1) return { r: r, p: 0, n: n };
    var t = r * Math.sqrt((n - 2) / (1 - r * r));
    return { r: r, p: pFromT(t, n - 2), n: n };
  }
  /** ANOVA satu arah; groups = [[nilai...], ...]; grup n<2 diabaikan. */
  function anova(groups) {
    groups = groups.map(nums).filter(function (g) { return g.length >= 2; });
    var k = groups.length; if (k < 2) return null;
    var N = 0, all = []; groups.forEach(function (g) { N += g.length; all = all.concat(g); });
    if (N <= k) return null;
    var gm = mean(all), ssb = 0, ssw = 0;
    groups.forEach(function (g) {
      var m = mean(g); ssb += g.length * (m - gm) * (m - gm);
      g.forEach(function (v) { ssw += (v - m) * (v - m); });
    });
    var df1 = k - 1, df2 = N - k;
    if (ssw === 0) return { F: null, df1: df1, df2: df2, p: ssb === 0 ? 1 : 0, eta2: ssb === 0 ? 0 : 1, k: k, N: N };
    var F = (ssb / df1) / (ssw / df2);
    return { F: F, df1: df1, df2: df2, p: pFromF(F, df1, df2), eta2: ssb / (ssb + ssw), k: k, N: N };
  }
  /** Cronbach's alpha, listwise; matrix = baris responden x kolom item */
  function cronbach(matrix) {
    var rows = matrix.filter(function (r) { return r.every(function (v) { return typeof v === 'number'; }); });
    var k = rows.length ? rows[0].length : 0;
    if (k < 2 || rows.length < 3) return { alpha: null, n: rows.length, k: k };
    var itemVars = 0;
    for (var j = 0; j < k; j++) itemVars += variance(rows.map(function (r) { return r[j]; }));
    var totals = rows.map(sum), vt = variance(totals);
    if (!vt) return { alpha: null, n: rows.length, k: k };
    return { alpha: (k / (k - 1)) * (1 - itemVars / vt), n: rows.length, k: k };
  }
  function npsCalc(vals) {
    vals = nums(vals); var n = vals.length;
    if (!n) return { n: 0, promoters: null, passives: null, detractors: null, nps: null, dist: dist([], 0, 10) };
    var pr = vals.filter(function (v) { return v >= 9; }).length, de = vals.filter(function (v) { return v <= 6; }).length;
    return { n: n, promoters: pct(pr, n), passives: pct(n - pr - de, n), detractors: pct(de, n), nps: pct(pr, n) - pct(de, n), dist: dist(vals, 0, 10) };
  }

  // ---------- interpretasi ----------
  function category(m) {
    if (m === null || m === undefined) return null;
    if (m >= 4.21) return 'veryHigh'; if (m >= 3.41) return 'high'; if (m >= 2.61) return 'medium'; if (m >= 1.81) return 'low'; return 'veryLow';
  }
  function index(m) { return m === null || m === undefined ? null : (m / 5) * 100; }
  function strength(r) { var a = Math.abs(r); return a >= 0.7 ? 'strong' : a >= 0.4 ? 'moderate' : a >= 0.2 ? 'weak' : 'negligible'; }

  // ---------- normalisasi data dari Sheet ----------
  function num(v) { if (v === '' || v === null || v === undefined) return null; var n = Number(v); return isFinite(n) ? n : null; }
  function normalize(rows) {
    return rows.map(function (r) {
      var o = {
        id: r.ResponseID, ts: r.Timestamp, period: String(r.Period), lang: r.Lang, name: r.FullName, position: r.Position, institution: r.Institution,
        instType: r.InstType, countryCode: r.CountryCode, country: r.Country, province: r.Province, city: r.City, district: r.District, address: r.Address,
        email: r.Email, whatsapp: r.WhatsApp, unitCategory: r.UnitCategory, unitId: r.UnitID, unitName: r.UnitName, umbContact: r.UmbContact,
        activities: r.Activities ? String(r.Activities).split(';').filter(Boolean) : [], activityOther: r.ActivitiesOther,
        duration: r.Duration, docStatus: r.DocStatus,
        openStrength: r.OpenStrength || '', openImprove: r.OpenImprove || '', openSuggest: r.OpenSuggest || '',
        future: r.FutureInterest ? String(r.FutureInterest).split(';').filter(Boolean) : [], followUp: String(r.ConsentFollowUp).toUpperCase() === 'TRUE',
        s: {}
      };
      SC.itemIds.forEach(function (id) { o.s[id] = num(r[id]); });
      var d = new Date(o.ts); o.month = isNaN(d) ? '' : d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
      // skor turunan per responden
      o.dim = {};
      SC.dimensions.forEach(function (dm) { o.dim[dm.id] = mean(dm.items.map(function (it) { return o.s[it.id]; })); });
      var dv = SC.dimensions.map(function (dm) { return o.dim[dm.id]; }).filter(function (v) { return v !== null; });
      o.composite = dv.length >= 3 ? mean(dv) : null;
      return o;
    });
  }

  // ---------- analisis utama ----------
  function uniq(list) { var m = {}; list.forEach(function (x) { if (x) m[String(x).trim().toLowerCase()] = 1; }); return Object.keys(m).length; }

  function itemStats(vals) {
    var v = nums(vals), n = v.length, c = ci95(v), d = dist(v, 1, 5);
    return { n: n, mean: mean(v), sd: sd(v), median: median(v), ci: c, dist: d, top2: pct(d[3] + d[4], n), bottom2: pct(d[0] + d[1], n), index: index(mean(v)) };
  }
  function groupBy(data, keyFn, labelFn) {
    var map = {};
    data.forEach(function (r) {
      var keys = keyFn(r); if (!Array.isArray(keys)) keys = [keys];
      keys.forEach(function (k) { if (k === '' || k === null || k === undefined) return; (map[k] = map[k] || []).push(r); });
    });
    return Object.keys(map).map(function (k) {
      var rs = map[k];
      var ov = rs.map(function (r) { return r.s.OVR1; }), comp = rs.map(function (r) { return r.composite; });
      return {
        key: k, label: labelFn ? labelFn(k, rs) : k, n: rs.length,
        overall: mean(ov), composite: mean(comp), index: index(mean(comp)), indexOverall: index(mean(ov)),
        nps: npsCalc(rs.map(function (r) { return r.s.NPS; })).nps,
        compositeValues: nums(comp)
      };
    }).sort(function (a, b) { return b.n - a.n || String(a.label).localeCompare(String(b.label)); });
  }

  function analyze(data, opts) {
    opts = opts || {};
    var lang = opts.lang === 'en' ? 'en' : 'id';
    var target = Number(opts.targetIndex) || 80;
    var out = { n: data.length, target: target, lang: lang };
    out.institutions = uniq(data.map(function (r) { return r.institution; }));
    out.countries = uniq(data.map(function (r) { return r.countryCode; }));
    out.units = uniq(data.map(function (r) { return r.unitId; }));

    var ov = itemStats(data.map(function (r) { return r.s.OVR1; }));
    out.overall = ov;
    var comp = nums(data.map(function (r) { return r.composite; }));
    out.composite = { n: comp.length, mean: mean(comp), sd: sd(comp), ci: ci95(comp), index: index(mean(comp)), category: category(mean(comp)) };
    out.cont = itemStats(data.map(function (r) { return r.s.OVR2; }));
    out.nps = npsCalc(data.map(function (r) { return r.s.NPS; }));

    // dimensi + item
    out.dims = SC.dimensions.map(function (dm) {
      var vals = data.map(function (r) { return r.dim[dm.id]; });
      var vv = nums(vals), st = { n: vv.length, mean: mean(vv), sd: sd(vv), ci: ci95(vv) };
      // dist berdasar nilai item (bukan rata-rata responden) untuk top2 yang jujur
      var itemVals = []; data.forEach(function (r) { dm.items.forEach(function (it) { if (r.s[it.id] !== null) itemVals.push(r.s[it.id]); }); });
      var ist = itemStats(itemVals);
      var matrix = data.map(function (r) { return dm.items.map(function (it) { return r.s[it.id]; }); });
      var a = cronbach(matrix);
      return {
        id: dm.id, name: dm.name, nResp: st.n, nRatings: ist.n, mean: st.mean, sd: st.sd, ci: st.ci, index: index(st.mean),
        top2: ist.top2, bottom2: ist.bottom2, dist: ist.dist, alpha: a.alpha, alphaN: a.n, category: category(st.mean),
        belowTarget: st.mean !== null && index(st.mean) < target,
        items: dm.items.map(function (it) { var s = itemStats(data.map(function (r) { return r.s[it.id]; })); s.id = it.id; s.t = it.t; s.belowTarget = s.mean !== null && s.index < target; return s; })
      };
    });
    var allItems = []; SC.dimensions.forEach(function (d) { d.items.forEach(function (i) { allItems.push(i.id); }); });
    out.reliability = cronbach(data.map(function (r) { return allItems.map(function (id) { return r.s[id]; }); }));

    // key driver
    var ovVals = data.map(function (r) { return r.s.OVR1; });
    out.drivers = SC.dimensions.map(function (dm) {
      var c = pearson(data.map(function (r) { return r.dim[dm.id]; }), ovVals);
      return { id: dm.id, name: dm.name, r: c.r, p: c.p, n: c.n, strength: c.r === null ? null : strength(c.r) };
    }).sort(function (a, b) { return (b.r === null ? -2 : b.r) - (a.r === null ? -2 : a.r); });
    var cc = pearson(data.map(function (r) { return r.composite; }), data.map(function (r) { return r.s.NPS; }));
    out.compositeVsNps = cc;

    // segmen
    var L = SC.label;
    out.segments = {
      unit: groupBy(data, function (r) { return r.unitId; }, function (k, rs) { return rs[0].unitName; }),
      unitCategory: groupBy(data, function (r) { return r.unitCategory; }, function (k) { return L(SC.unitCategories, k, lang); }),
      country: groupBy(data, function (r) { return r.countryCode; }, function (k, rs) { return rs[0].country; }),
      instType: groupBy(data, function (r) { return r.instType; }, function (k) { return L(SC.instTypes, k, lang); }),
      activity: groupBy(data, function (r) { return r.activities; }, function (k) { return L(SC.activities, k, lang); }),
      duration: groupBy(data, function (r) { return r.duration; }, function (k) { return L(SC.durations, k, lang); }),
      docStatus: groupBy(data, function (r) { return r.docStatus; }, function (k) { return L(SC.docStatus, k, lang); })
    };
    out.anova = {};
    ['unit', 'unitCategory', 'country', 'instType', 'duration'].forEach(function (k) {
      var a = anova(out.segments[k].map(function (g) { return g.compositeValues; }));
      if (a) out.anova[k] = a;
    });
    out.segments && Object.keys(out.segments).forEach(function (k) { out.segments[k].forEach(function (g) { delete g.compositeValues; }); });

    // tren bulanan
    var months = groupBy(data, function (r) { return r.month; }, function (k) { return k; }).sort(function (a, b) { return a.key.localeCompare(b.key); });
    out.trend = months.map(function (m) { return { month: m.key, n: m.n, composite: m.composite, index: m.index }; });

    // aktivitas & minat
    out.futureInterest = SC.activities.map(function (a) { return { id: a.id, label: a.t[lang], n: data.filter(function (r) { return r.future.indexOf(a.id) >= 0; }).length }; })
      .filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n; });
    out.followUp = data.filter(function (r) { return r.followUp; }).length;
    out.comments = {
      strength: data.filter(function (r) { return r.openStrength.trim(); }).length,
      improve: data.filter(function (r) { return r.openImprove.trim(); }).length,
      suggest: data.filter(function (r) { return r.openSuggest.trim(); }).length
    };
    out.lowSample = data.length < 30;

    // prioritas perbaikan: dimensi di bawah target, urut selisih terbesar
    out.priorities = out.dims.filter(function (d) { return d.belowTarget; })
      .map(function (d) { var dr = out.drivers.filter(function (x) { return x.id === d.id; })[0]; return { id: d.id, name: d.name, index: d.index, gap: target - d.index, r: dr ? dr.r : null }; })
      .sort(function (a, b) { return b.gap - a.gap; });
    out.lowestItems = [].concat.apply([], out.dims.map(function (d) { return d.items.filter(function (i) { return i.n > 0; }); }))
      .sort(function (a, b) { return a.mean - b.mean; }).slice(0, 5);
    out.highestItems = [].concat.apply([], out.dims.map(function (d) { return d.items.filter(function (i) { return i.n > 0; }); }))
      .sort(function (a, b) { return b.mean - a.mean; }).slice(0, 5);
    return out;
  }

  var API = { mean: mean, sd: sd, median: median, ci95: ci95, tcrit: tcrit, dist: dist, round: round, pct: pct, ibeta: ibeta, pFromT: pFromT, pFromF: pFromF,
    pearson: pearson, anova: anova, cronbach: cronbach, npsCalc: npsCalc, category: category, index: index, strength: strength, normalize: normalize, analyze: analyze, groupBy: groupBy };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else window.Stats = API;
})();
