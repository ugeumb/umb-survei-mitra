/* Penyusun laporan (pratinjau layar + cetak PDF). Report.render(container, ctx)
 * ctx: { stats, data, lang:'id'|'en', mode:'summary'|'full', meta:{period, filterLabel, user, orgName, date}, ai:{meta,analysis}|null } */
(function () {
  var SC = window.SCHEMA, N = window.Narrative;

  function render(container, ctx) {
    var st = ctx.stats, lang = ctx.lang === 'en' ? 'en' : 'id', R = N.RS[lang], full = ctx.mode === 'full', meta = ctx.meta || {};
    var f = function (v, d) { return N.nf(v, d === undefined ? 2 : d, lang); };
    var auto = N.build(st, lang), ai = ctx.ai && ctx.ai.analysis ? ctx.ai : null;
    var sc = ctx.scope || 'report', chartCount = 0;
    Charts.clear(sc); container.innerHTML = '';
    var root = H('div', { class: 'report rpt-' + ctx.mode, lang: lang });
    container.appendChild(root);

    // ---------- helper ----------
    function sec(title, kids, brk) { return H('section', { class: 'rsec' + (brk ? ' pb' : '') }, [H('h2', { text: title })].concat(kids || [])); }
    function para(t) { return H('p', { text: t }); }
    function table(head, rows, cls) {
      return H('table', { class: 'rt ' + (cls || '') }, [
        H('thead', {}, [H('tr', {}, head.map(function (x) { return H('th', { text: x }); }))]),
        H('tbody', {}, rows.map(function (r) { return H('tr', { class: r.cls || '' }, (r.cells || r).map(function (c, i) { return H('td', { class: i > 0 && typeof c === 'string' && /^[-–\d<]/.test(c) ? 'num' : '', text: c }); })); }))
      ]);
    }
    function fig(title, w, h, draw) {
      var cv = H('canvas', {}); chartCount++;
      var box = H('figure', { class: 'rfig' }, [cv, H('figcaption', { text: title })]);
      setTimeout(function () { draw(cv, { w: w || 680, h: h || 280 }); }, 0);
      return box;
    }
    function bullets(list) { return list && list.length ? H('ul', {}, list.map(function (x) { return H('li', { text: x }); })) : null; }
    function badge(idx) { return idx === null ? '–' : (idx >= st.target ? '✔ ' : '▼ ') + (idx >= st.target ? R.met : R.below); }

    // ---------- sampul ----------
    root.appendChild(H('header', { class: 'rcover' }, [
      H('img', { class: 'rlogo', src: 'assets/img/logo-umb.png', alt: 'Logo UMB' }),
      H('div', { class: 'org', text: R.org }),
      H('h1', { text: full ? R.reportTitle : R.summaryTitle }),
      H('div', { class: 'rmeta' }, [
        H('div', {}, [H('b', { text: R.period + ': ' }), meta.period || '–']),
        H('div', {}, [H('b', { text: R.filters + ': ' }), meta.filterLabel || R.allData]),
        H('div', {}, [H('b', { text: R.printed + ': ' }), meta.date || '']),
        H('div', { text: R.by })
      ])
    ]));
    if (!st.n) { root.appendChild(para(R.noData)); return; }

    // ---------- 1. ringkasan eksekutif ----------
    var kpis = [
      [R.respondents, String(st.n), st.institutions + ' ' + R.institutions.toLowerCase() + ' · ' + st.countries + ' ' + R.countries.toLowerCase()],
      [R.composite, f(st.composite.mean, 2), R.cat[st.composite.category] + (st.composite.ci ? ' · ' + R.cols.ci + ' ' + f(st.composite.ci[0]) + '–' + f(st.composite.ci[1]) : '')],
      [R.index, f(st.composite.index, 1) + '%', R.target + ' ≥ ' + st.target + '% · ' + (st.composite.index >= st.target ? R.met : R.notMet)],
      [R.overallSat, f(st.overall.mean, 2), R.top2 + ': ' + f(st.overall.top2, 1) + '%'],
      [R.nps, f(st.nps.nps, 0), R.npsCat[N.npsBand(st.nps.nps)] || '–'],
      [R.cont, f(st.cont.mean, 2), R.alpha + ' = ' + (st.reliability.alpha === null ? '–' : f(st.reliability.alpha, 2))]
    ];
    var s1 = sec(R.s1, [
      H('div', { class: 'kpis' }, kpis.map(function (k) { return H('div', { class: 'kpi' }, [H('div', { class: 'kl', text: k[0] }), H('div', { class: 'kv', text: k[1] }), H('div', { class: 'ks', text: k[2] })]); })),
      fig(R.f42, 680, 300, function (cv, fx) {
        Charts.bar(cv, st.dims.map(function (d) { return d.name[lang]; }), st.dims.map(function (d) { return d.index === null ? null : Math.round(d.index * 10) / 10; }),
          { horizontal: true, max: 100, fixed: fx, scope: sc, target: st.target, targetLabel: R.target + ' ' + st.target + '%', fmt: function (v) { return f(v, 1) + '%'; },
            colors: st.dims.map(function (d) { return d.belowTarget ? Charts.C.orange : Charts.C.blue; }) });
      })
    ]);
    root.appendChild(s1);
    var concl = H('div', { class: 'rsec' }, [H('h3', { text: R.concl })].concat(auto.paragraphs.map(para)));
    root.appendChild(concl);
    if (auto.concerns.length) root.appendChild(H('div', {}, [H('h3', { text: R.weakT }), bullets(auto.concerns)]));
    if (auto.strengths.length) root.appendChild(H('div', {}, [H('h3', { text: R.strengthsT }), bullets(auto.strengths)]));
    auto.caveats.forEach(function (c) { root.appendChild(H('p', { class: 'note', text: c })); });

    // ---------- ringkasan: rekomendasi singkat lalu selesai ----------
    function recTable() {
      var rows = auto.recommendations.map(function (r) { return [r.name || '–', R.prio[r.priority], r.text]; });
      return table([R.cols.dim, (lang === 'id' ? 'Prioritas' : 'Priority'), R.recs], rows, 'wide');
    }
    if (!full) {
      root.appendChild(sec(R.recs, [recTable()]));
      if (ai && ai.analysis.executive_summary) root.appendChild(sec(lang === 'id' ? 'Ringkasan Analisis AI' : 'AI Analysis Summary', [para(ai.analysis.executive_summary), H('p', { class: 'note', text: N.fill(R.aiNote, { M: ai.meta.model }) })]));
      root.appendChild(signatures());
      return;
    }

    // ---------- 2. metodologi ----------
    root.appendChild(sec(R.s2, [para(R.m.p1), para(R.m.p2), para(R.m.p3), para(N.fill(R.m.p4, { T: st.target })), para(R.m.p5), para(R.m.p6)], true));

    // ---------- 3. profil responden ----------
    function shareTable(key, title) {
      var rows = (st.segments[key] || []).map(function (g) { return [g.label, String(g.n), f((g.n / st.n) * 100, 1)]; });
      return H('div', { class: 'half' }, [H('h3', { text: title }), table([R.cols.group, R.cols.count, R.cols.share], rows)]);
    }
    var prof = [
      H('div', { class: 'twocol' }, [
        fig(R.profile.country, 330, 260, function (cv, fx) { var g = st.segments.country.slice(0, 8); Charts.bar(cv, g.map(function (x) { return x.label; }), g.map(function (x) { return x.n; }), { horizontal: true, fixed: fx, scope: sc, maxLabel: 18 }); }),
        fig(R.profile.instType, 330, 260, function (cv, fx) { var g = st.segments.instType; Charts.doughnut(cv, g.map(function (x) { return x.label; }), g.map(function (x) { return x.n; }), { fixed: fx, scope: sc, otherLabel: lang === 'id' ? 'Lainnya' : 'Other' }); })
      ]),
      shareTable('country', R.profile.country), shareTable('instType', R.profile.instType), shareTable('unitCategory', R.profile.unitCategory),
      shareTable('activity', R.profile.activity), shareTable('duration', R.profile.duration), shareTable('docStatus', R.profile.docStatus)
    ];
    root.appendChild(sec(R.s3, prof, true));

    // ---------- 4. hasil ----------
    var ovSec = [
      H('div', { class: 'twocol' }, [
        fig(R.f41, 330, 240, function (cv, fx) { Charts.likert(cv, st.overall.dist, { fixed: fx, scope: sc }); }),
        fig(R.f44, 330, 240, function (cv, fx) { Charts.nps(cv, st.nps, { fixed: fx, scope: sc, labels: lang === 'id' ? ['Detractor (0–6)', 'Passive (7–8)', 'Promoter (9–10)'] : ['Detractors (0–6)', 'Passives (7–8)', 'Promoters (9–10)'] }); })
      ]),
      para((lang === 'id' ? 'Kepuasan keseluruhan: n = ' : 'Overall satisfaction: n = ') + st.overall.n + ', ' + R.cols.mean.toLowerCase() + ' ' + f(st.overall.mean) + ', SD ' + f(st.overall.sd) + ', ' + R.cols.ci + ' ' + (st.overall.ci ? f(st.overall.ci[0]) + '–' + f(st.overall.ci[1]) : '–') + '. NPS = ' + f(st.nps.nps, 0) + ' (n = ' + st.nps.n + ').'),
      H('div', { class: 'twocol' }, [
        fig(R.f43, 330, 300, function (cv, fx) { Charts.radar(cv, st.dims.map(function (d) { return d.name[lang]; }), st.dims.map(function (d) { return d.index === null ? 0 : Math.round(d.index * 10) / 10; }), st.target, { fixed: fx, scope: sc, valueLabel: R.index, targetLabel: R.target }); }),
        st.trend.length > 1 ? fig(R.f45, 330, 300, function (cv, fx) { Charts.line(cv, st.trend.map(function (t) { return t.month; }), st.trend.map(function (t) { return Math.round(t.index * 10) / 10; }), { fixed: fx, scope: sc, target: st.target, targetLabel: st.target + '%' }); }) : null
      ]),
      H('h3', { text: R.t42 }),
      table([R.cols.dim, R.cols.n, R.cols.mean, R.cols.sd, R.cols.ci, R.cols.idx, R.cols.top2, 'α', R.cols.status],
        st.dims.map(function (d) { return { cls: d.belowTarget ? 'warn' : '', cells: [d.name[lang], String(d.nResp), f(d.mean), f(d.sd), d.ci ? f(d.ci[0]) + '–' + f(d.ci[1]) : '–', f(d.index, 1), f(d.top2, 1), f(d.alpha), badge(d.index)] }; })),
      H('h3', { text: R.t43 })
    ];
    var itemRows = [];
    st.dims.forEach(function (d) {
      itemRows.push({ cls: 'grp', cells: [d.id + ' — ' + d.name[lang], '', '', '', '', '', '', '', ''] });
      d.items.forEach(function (i) { itemRows.push({ cls: i.belowTarget ? 'warn' : '', cells: [i.id + '. ' + i.t[lang], String(i.n), f(i.mean), f(i.sd), f(i.median, 1), f(i.index, 1), f(i.top2, 1), f(i.bottom2, 1), i.n ? badge(i.index) : '–'] }); });
    });
    ovSec.push(table([R.cols.item, R.cols.n, R.cols.mean, R.cols.sd, R.cols.median, R.cols.idx, R.cols.top2, R.cols.bottom2, R.cols.status], itemRows, 'items'));
    ovSec.push(H('div', { class: 'twocol' }, [
      H('div', {}, [H('h3', { text: R.lowestItems }), table([R.cols.item, R.cols.mean], st.lowestItems.map(function (i) { return [i.id + '. ' + i.t[lang], f(i.mean)]; }))]),
      H('div', {}, [H('h3', { text: R.highestItems }), table([R.cols.item, R.cols.mean], st.highestItems.map(function (i) { return [i.id + '. ' + i.t[lang], f(i.mean)]; }))])
    ]));
    ovSec.push(H('h3', { text: R.t44 }));
    ovSec.push(para(N.fill(R.reliab, { a: st.reliability.alpha === null ? '–' : f(st.reliability.alpha, 2), n: st.reliability.n, i: st.reliability.alpha === null ? R.relNA : (st.reliability.alpha >= 0.7 ? R.relOk : R.relLow) })));
    root.appendChild(sec(R.s4, ovSec, true));

    // ---------- 5. analisis lanjutan ----------
    var adv = [H('h3', { text: R.t51 }),
      fig(R.f46, 680, 260, function (cv, fx) {
        var d = st.drivers.filter(function (x) { return x.r !== null; });
        Charts.bar(cv, d.map(function (x) { return x.name[lang]; }), d.map(function (x) { return Math.round(x.r * 100) / 100; }), { horizontal: true, min: Math.min(0, Math.min.apply(null, d.map(function (x) { return x.r; }))), max: 1, fixed: fx, scope: sc, fmt: function (v) { return f(v, 2); } });
      }),
      table([R.cols.dim, R.cols.n, R.cols.r, R.cols.p, R.cols.strength], st.drivers.map(function (d) { return [d.name[lang], String(d.n), f(d.r), N.pv(d.p, lang), d.strength ? R.st[d.strength] : '–']; }))];
    var segDefs = [['unit', R.profile.unit], ['unitCategory', R.profile.unitCategory], ['country', R.profile.country], ['instType', R.profile.instType], ['activity', R.profile.activity], ['duration', R.profile.duration]];
    adv.push(H('h3', { text: R.t52 }));
    segDefs.forEach(function (sd) {
      var g = st.segments[sd[0]].slice(0, 15); if (!g.length) return;
      adv.push(H('h4', { text: sd[1] }));
      adv.push(table([R.cols.group, R.cols.n, R.cols.comp, R.cols.idx, R.cols.ov, R.cols.nps], g.map(function (x) { return { cls: x.index !== null && x.index < st.target ? 'warn' : '', cells: [x.label, String(x.n), f(x.composite), f(x.index, 1), f(x.overall), f(x.nps, 0)] }; })));
      var a = st.anova[sd[0]];
      if (a) adv.push(H('p', { class: 'note', text: 'ANOVA — ' + N.fill(R.anovaNote, { d1: a.df1, d2: a.df2, F: a.F === null ? '–' : f(a.F), p: N.pv(a.p, lang), e: f(a.eta2, 3), sig: a.p < 0.05 ? R.sigYes : R.sigNo }) + (a.k < st.segments[sd[0]].length ? (lang === 'id' ? ' (kelompok n < 2 dikecualikan)' : ' (groups with n < 2 excluded)') : '') }));
    });
    root.appendChild(sec(R.s5, adv, true));

    // ---------- 6. masukan terbuka ----------
    var cm = [table([R.comments, R.cols.count], [[R.cStrength, String(st.comments.strength)], [R.cImprove, String(st.comments.improve)], [R.cSuggest, String(st.comments.suggest)]])];
    if (ai) {
      var A = ai.analysis;
      cm.push(H('p', { class: 'note', text: N.fill(R.aiNote, { M: ai.meta.model }) }));
      if ((A.comment_themes || []).length) {
        cm.push(H('h3', { text: R.themes }));
        cm.push(table([R.themes, lang === 'id' ? 'Sentimen' : 'Sentiment', R.cols.count, lang === 'id' ? 'Contoh' : 'Example'], A.comment_themes.map(function (t) { return [t.theme || '', R.sentiment[t.sentiment] || t.sentiment || '', t.count === undefined ? '–' : String(t.count), t.example || '']; }), 'wide'));
      }
    } else {
      cm.push(H('p', { class: 'note', text: R.aiNone }));
      [['openStrength', R.cStrength], ['openImprove', R.cImprove], ['openSuggest', R.cSuggest]].forEach(function (k) {
        var items = ctx.data.map(function (r) { return r[k[0]]; }).filter(function (x) { return x && x.trim(); }).slice(0, 6);
        if (items.length) { cm.push(H('h4', { text: k[1] })); cm.push(bullets(items.map(function (x) { return x.length > 260 ? x.slice(0, 257) + '…' : x; }))); }
      });
    }
    root.appendChild(sec(R.s6, cm, true));

    // ---------- 7. kesimpulan & rekomendasi ----------
    var fin = [];
    if (ai) {
      var A2 = ai.analysis;
      fin.push(H('p', { class: 'note', text: N.fill(R.aiNote, { M: ai.meta.model }) }));
      if (A2.executive_summary) fin.push(para(A2.executive_summary));
      [[R.findingsT, A2.key_findings], [R.strengthsT, A2.strengths], [R.weakT, A2.weaknesses], [R.limitT, A2.risks_limitations]].forEach(function (b) { if (b[1] && b[1].length) { fin.push(H('h3', { text: b[0] })); fin.push(bullets(b[1])); } });
      if ((A2.segment_insights || []).length) { fin.push(H('h3', { text: R.segT })); fin.push(bullets(A2.segment_insights.map(function (s) { return (s.segment ? s.segment + ': ' : '') + (s.insight || ''); }))); }
      if (A2.conclusion) { fin.push(H('h3', { text: R.concl + ' (AI)' })); fin.push(para(A2.conclusion)); }
    }
    fin.push(H('h3', { text: R.recs }));
    fin.push(recTable());
    if (ai && (ai.analysis.recommendations || []).length) {
      fin.push(H('h4', { text: lang === 'id' ? 'Rekomendasi tambahan dari analisis AI' : 'Additional recommendations from the AI analysis' }));
      fin.push(table([R.recs, lang === 'id' ? 'Prioritas' : 'Priority', R.owner, R.timeline, R.rationale], ai.analysis.recommendations.map(function (r) { return [r.action || '', R.prio[r.priority] || r.priority || '', r.owner || '', r.timeline || '', r.rationale || '']; }), 'wide'));
    }
    fin.push(H('h3', { text: R.actionPlan }));
    var blank = []; for (var b = 0; b < Math.max(4, st.priorities.length + 1); b++) blank.push(['', '', '', '']);
    if (st.priorities.length) st.priorities.forEach(function (p, i) { blank[i][0] = p.name[lang]; });
    fin.push(table([R.ap.action, R.ap.pic, R.ap.due, R.ap.status], blank, 'plan'));
    root.appendChild(sec(R.s7, fin, true));
    root.appendChild(signatures());

    // ---------- lampiran ----------
    var qRows = [];
    SC.dimensions.forEach(function (d) { qRows.push({ cls: 'grp', cells: [d.id, d.name[lang]] }); d.items.forEach(function (i) { qRows.push([i.id, i.t[lang]]); }); });
    SC.overall.concat([SC.nps]).forEach(function (i) { qRows.push([i.id, i.t[lang]]); });
    root.appendChild(sec(R.s8, [H('h3', { text: R.appQ }), table(['ID', R.cols.item], qRows, 'wide'), H('h3', { text: R.appSeg }), table([R.cols.group, R.cols.n, R.cols.comp, R.cols.idx, R.cols.ov, R.cols.nps], st.segments.unit.map(function (x) { return [x.label, String(x.n), f(x.composite), f(x.index, 1), f(x.overall), f(x.nps, 0)]; }))], true));

    function signatures() {
      return H('div', { class: 'sigs' }, R.sign.map(function (s, i) { return H('div', { class: 'sig' }, [H('div', { text: s }), H('div', { class: 'line' }), H('div', { class: 'sr', text: R.signRole[i] })]); }));
    }
  }

  window.Report = { render: render };
})();
