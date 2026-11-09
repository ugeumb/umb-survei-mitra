/* Pembungkus Chart.js dengan palet tervalidasi (dataviz): satu hue untuk magnitudo, status khusus untuk NPS. */
(function () {
  var C = { blue: '#2a78d6', blueD: '#256abf', orange: '#eb6834', gray: '#c3c2b7', ink: '#0b0b0b', ink2: '#52514e', muted: '#898781', grid: '#e1e0d9',
    good: '#0ca30c', crit: '#d03b3b', likert: ['#d03b3b', '#eca09a', '#d9d8d2', '#6da7ec', '#256abf'] };
  if (window.Chart) {
    Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", "Noto Sans", sans-serif';
    Chart.defaults.font.size = 11; Chart.defaults.color = C.ink2;
  }
  var reg = {};
  function track(scope, ch) { (reg[scope] = reg[scope] || []).push(ch); return ch; }
  function clear(scope) { (reg[scope] || []).forEach(function (c) { try { c.destroy(); } catch (e) { /* abaikan */ } }); reg[scope] = []; }

  // plugin: label nilai di ujung batang + garis target
  var valueLabels = { id: 'valueLabels', afterDatasetsDraw: function (chart, args, o) {
    if (!o || !o.show) return;
    var ctx = chart.ctx, horiz = chart.options.indexAxis === 'y';
    chart.getDatasetMeta(0).data.forEach(function (bar, i) {
      var v = chart.data.datasets[0].data[i]; if (v === null || v === undefined) return;
      ctx.save(); ctx.fillStyle = C.ink2; ctx.font = '600 10px system-ui, sans-serif';
      var txt = o.format ? o.format(v) : String(v);
      if (horiz) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, bar.x + 4, bar.y); }
      else { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(txt, bar.x, bar.y - 3); }
      ctx.restore();
    });
  } };
  var targetLine = { id: 'targetLine', afterDatasetsDraw: function (chart, args, o) {
    if (!o || o.value === undefined || o.value === null) return;
    var horiz = chart.options.indexAxis === 'y', sc = horiz ? chart.scales.x : chart.scales.y, ar = chart.chartArea, ctx = chart.ctx;
    var pos = sc.getPixelForValue(o.value);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2; ctx.beginPath();
    if (horiz) { ctx.moveTo(pos, ar.top); ctx.lineTo(pos, ar.bottom); } else { ctx.moveTo(ar.left, pos); ctx.lineTo(ar.right, pos); }
    ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = C.ink; ctx.font = '600 10px system-ui, sans-serif';
    var label = o.label || '';
    if (horiz) { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(label, pos, ar.top - 2); }
    else { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(label, ar.right, pos - 2); }
    ctx.restore();
  } };
  if (window.Chart) Chart.register(valueLabels, targetLine);

  function prep(canvas, fixed) {
    if (fixed) { canvas.width = fixed.w; canvas.height = fixed.h; canvas.style.maxWidth = '100%'; canvas.style.height = 'auto'; }
    return { responsive: !fixed, maintainAspectRatio: !!fixed ? true : false, animation: false, devicePixelRatio: 2 };
  }
  function short(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /** Batang tunggal. o: {horizontal, max, min, colors[], color, target, targetLabel, fmt, fixed, scope, wrap} */
  function bar(canvas, labels, values, o) {
    o = o || {};
    var base = prep(canvas, o.fixed), horiz = !!o.horizontal;
    var colors = o.colors || values.map(function () { return o.color || C.blue; });
    var cfg = { type: 'bar', data: { labels: labels.map(function (l) { return short(l, o.maxLabel || 34); }), datasets: [{ data: values, backgroundColor: colors, borderRadius: 4, borderSkipped: false, maxBarThickness: horiz ? 22 : 38 }] },
      options: Object.assign(base, { indexAxis: horiz ? 'y' : 'x', layout: { padding: { right: horiz ? 40 : 4, top: horiz ? 14 : 16 } },
        plugins: { legend: { display: false }, valueLabels: { show: o.labels !== false, format: o.fmt }, targetLine: { value: o.target, label: o.targetLabel },
          tooltip: { callbacks: { title: function (it) { return labels[it[0].dataIndex]; }, label: function (it) { return (o.tipLabel || '') + (o.fmt ? o.fmt(it.parsed[horiz ? 'x' : 'y']) : it.parsed[horiz ? 'x' : 'y']); } } } },
        scales: (function () {
          var val = { min: o.min === undefined ? 0 : o.min, max: o.max, grid: { color: C.grid }, border: { display: false }, ticks: { color: C.muted, precision: o.max === undefined ? 0 : undefined } };
          var cat = { grid: { display: false }, border: { color: C.gray }, ticks: { color: C.ink2, autoSkip: false } };
          return horiz ? { x: val, y: cat } : { x: cat, y: val };
        })() }) };
    return track(o.scope || 'main', new Chart(canvas, cfg));
  }
  function radar(canvas, labels, values, target, o) {
    o = o || {};
    var cfg = { type: 'radar', data: { labels: labels.map(function (l) { return short(l, 22); }), datasets: [
      { label: o.valueLabel || 'Indeks', data: values, borderColor: C.blueD, backgroundColor: 'rgba(42,120,214,.18)', pointBackgroundColor: C.blueD, pointRadius: 3, borderWidth: 2 },
      { label: o.targetLabel || 'Target', data: labels.map(function () { return target; }), borderColor: C.ink, borderDash: [5, 4], pointRadius: 0, borderWidth: 1.2, backgroundColor: 'transparent' }] },
      options: Object.assign(prep(canvas, o.fixed), { plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12 } } },
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 20, backdropColor: 'transparent', color: C.muted }, grid: { color: C.grid }, angleLines: { color: C.grid }, pointLabels: { color: C.ink2, font: { size: 10 } } } } }) };
    return track(o.scope || 'main', new Chart(canvas, cfg));
  }
  /** Donat NPS dengan warna status + legenda */
  function nps(canvas, nps, o) {
    o = o || {}; var lab = o.labels || ['Detractor', 'Passive', 'Promoter'];
    var cfg = { type: 'doughnut', data: { labels: lab, datasets: [{ data: [nps.detractors || 0, nps.passives || 0, nps.promoters || 0], backgroundColor: [C.crit, C.gray, C.good], borderColor: '#fcfcfb', borderWidth: 2 }] },
      options: Object.assign(prep(canvas, o.fixed), { cutout: '62%', plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12 } },
        tooltip: { callbacks: { label: function (it) { return it.label + ': ' + it.parsed.toFixed(1) + '%'; } } } } }) };
    return track(o.scope || 'main', new Chart(canvas, cfg));
  }
  function doughnut(canvas, labels, values, o) {
    o = o || {};
    var pal = [C.blue, C.orange, '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
    var data = values.slice(), lab = labels.slice();
    if (labels.length > 8) { var rest = values.slice(7).reduce(function (a, b) { return a + b; }, 0); data = values.slice(0, 7).concat([rest]); lab = labels.slice(0, 7).concat([o.otherLabel || 'Lainnya']); }
    var cfg = { type: 'doughnut', data: { labels: lab.map(function (l) { return short(l, 28); }), datasets: [{ data: data, backgroundColor: data.map(function (_, i) { return i === 7 ? C.gray : pal[i]; }), borderColor: '#fcfcfb', borderWidth: 2 }] },
      options: Object.assign(prep(canvas, o.fixed), { cutout: '55%', plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } }) };
    return track(o.scope || 'main', new Chart(canvas, cfg));
  }
  /** Distribusi 1..5 (warna divergen merah-abu-biru) */
  function likert(canvas, dist, o) {
    o = o || {};
    return bar(canvas, ['1', '2', '3', '4', '5'], dist, Object.assign({ colors: C.likert, fmt: function (v) { return String(v); } }, o));
  }
  function line(canvas, labels, values, o) {
    o = o || {};
    var cfg = { type: 'line', data: { labels: labels, datasets: [{ data: values, borderColor: C.blueD, backgroundColor: C.blueD, pointRadius: 4, pointBackgroundColor: C.blueD, pointBorderColor: '#fcfcfb', pointBorderWidth: 2, borderWidth: 2, tension: 0.25 }] },
      options: Object.assign(prep(canvas, o.fixed), { plugins: { legend: { display: false }, targetLine: { value: o.target, label: o.targetLabel } },
        scales: { y: { min: o.min === undefined ? 0 : o.min, max: o.max === undefined ? 100 : o.max, grid: { color: C.grid }, border: { display: false } }, x: { grid: { display: false } } } }) };
    return track(o.scope || 'main', new Chart(canvas, cfg));
  }

  window.Charts = { C: C, clear: clear, bar: bar, radar: radar, nps: nps, doughnut: doughnut, likert: likert, line: line };
})();
