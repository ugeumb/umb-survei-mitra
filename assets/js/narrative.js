/* Kamus laporan (Indonesia/Inggris) + penyusun kesimpulan otomatis berbasis aturan (tanpa AI). */
(function () {
  var SC = (typeof module !== 'undefined' && module.exports) ? require('./schema.js') : window.SCHEMA;

  function nf(v, d, lang) {
    if (v === null || v === undefined || !isFinite(v)) return '–';
    return Number(v).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function pv(p, lang) { return p === null || p === undefined ? '–' : (p < 0.001 ? '< 0.001'.replace('.', lang === 'en' ? '.' : ',') : nf(p, 3, lang)); }

  var RS = {
    id: {
      reportTitle: 'Laporan Hasil Survei Kepuasan Mitra Kerja Sama', summaryTitle: 'Ringkasan Hasil Survei Kepuasan Mitra Kerja Sama',
      org: 'Universitas Muhammadiyah Bengkulu', by: 'Disusun oleh UMB Global Engagement (UGE)', period: 'Periode survei', printed: 'Tanggal laporan', filters: 'Cakupan data', allData: 'Seluruh data periode',
      s1: '1. Ringkasan Eksekutif', s2: '2. Metodologi', s3: '3. Profil Responden', s4: '4. Hasil Kepuasan', s5: '5. Analisis Lanjutan', s6: '6. Analisis Masukan Terbuka', s7: '7. Kesimpulan dan Rekomendasi', s8: 'Lampiran',
      respondents: 'Responden', institutions: 'Institusi mitra', countries: 'Negara', unitsInvolved: 'Unit UMB terlibat', composite: 'Skor kepuasan gabungan (1–5)', index: 'Indeks kepuasan', overallSat: 'Kepuasan keseluruhan (1–5)',
      top2: 'Puas + Sangat puas', nps: 'Net Promoter Score', cont: 'Niat melanjutkan kerja sama (1–5)', alpha: 'Reliabilitas (α)', target: 'Target mutu', met: 'Target tercapai', notMet: 'Belum mencapai target', below: 'Di bawah target',
      cat: { veryHigh: 'Sangat puas', high: 'Puas', medium: 'Cukup puas', low: 'Kurang puas', veryLow: 'Tidak puas' },
      npsCat: ['perlu perbaikan', 'baik', 'sangat baik', 'unggul'],
      m: { p1: 'Survei dilaksanakan secara daring menggunakan kuesioner terstruktur dalam lima bahasa (Indonesia, Inggris, Mandarin, Arab, dan Thailand) yang disebarkan kepada mitra kerja sama UMB di dalam dan luar negeri.',
        p2: 'Instrumen memuat 23 butir penilaian dalam tujuh dimensi (komunikasi dan responsivitas; administrasi dan dokumen kerja sama; pelaksanaan dan mutu program; SDM dan profesionalisme; fasilitas dan layanan pendukung; manfaat dan dampak; evaluasi dan tindak lanjut) berskala 1–5, tiga butir penilaian keseluruhan (kepuasan umum, niat melanjutkan kerja sama, dan kesediaan merekomendasikan pada skala 0–10), serta pertanyaan terbuka.',
        p3: 'Skor dimensi adalah rata-rata butir yang dijawab responden; skor gabungan adalah rata-rata skor dimensi (responden dengan minimal tiga dimensi terisi). Jawaban “tidak berlaku” dikeluarkan dari perhitungan.',
        p4: 'Indeks kepuasan = rata-rata ÷ 5 × 100. Interpretasi rata-rata: 4,21–5,00 sangat puas; 3,41–4,20 puas; 2,61–3,40 cukup puas; 1,81–2,60 kurang puas; 1,00–1,80 tidak puas. Target mutu pada periode ini adalah indeks ≥ {T}%.',
        p5: 'Analisis statistik meliputi statistik deskriptif (n, rata-rata, simpangan baku, median, interval kepercayaan 95%, proporsi puas/sangat puas), reliabilitas Cronbach’s alpha (α ≥ 0,70 dianggap memadai), korelasi Pearson antara skor dimensi dan kepuasan keseluruhan untuk mengidentifikasi faktor penentu, uji ANOVA satu arah untuk membandingkan skor gabungan antar kelompok (α = 0,05), serta Net Promoter Score (persentase promoter 9–10 dikurangi detractor 0–6).',
        p6: 'Keterbatasan: data bersifat swa-lapor dan hanya mencerminkan mitra yang merespons; kelompok dengan responden sedikit (n < 5) tidak dapat diuji secara statistik dan hanya dilaporkan secara deskriptif; korelasi tidak menunjukkan hubungan sebab-akibat.' },
      kpiNote: 'Interval kepercayaan 95% rata-rata gabungan', cols: { n: 'n', mean: 'Rata-rata', sd: 'SD', median: 'Median', ci: 'IK 95%', idx: 'Indeks (%)', top2: 'Puas (%)', bottom2: 'Tidak puas (%)', status: 'Status', dim: 'Dimensi', item: 'Butir', group: 'Kelompok', comp: 'Gabungan', ov: 'Keseluruhan', nps: 'NPS', r: 'r', p: 'p', strength: 'Kekuatan', share: 'Porsi (%)', count: 'Jumlah' },
      st: { strong: 'kuat', moderate: 'sedang', weak: 'lemah', negligible: 'sangat lemah' },
      profile: { country: 'Negara asal mitra', instType: 'Jenis institusi mitra', unitCategory: 'Jenis unit UMB mitra', activity: 'Jenis kegiatan kerja sama', duration: 'Lama kerja sama', docStatus: 'Status dokumen kerja sama', unit: 'Unit UMB' },
      f41: 'Distribusi kepuasan keseluruhan', f42: 'Indeks kepuasan per dimensi terhadap target', f43: 'Profil kepuasan per dimensi (radar)', f44: 'Komposisi Net Promoter Score', f45: 'Tren bulanan indeks kepuasan', f46: 'Faktor penentu kepuasan keseluruhan (korelasi Pearson)',
      t42: 'Statistik per dimensi', t43: 'Statistik per butir penilaian', t44: 'Reliabilitas internal', t51: 'Analisis faktor penentu', t52: 'Perbandingan antar kelompok', t53: 'Uji ANOVA skor gabungan',
      anovaNote: 'F({d1}, {d2}) = {F}; p = {p}; η² = {e}. {sig}', sigYes: 'Terdapat perbedaan yang signifikan secara statistik.', sigNo: 'Tidak ada perbedaan yang signifikan secara statistik.',
      reliab: 'Cronbach’s α seluruh butir dimensi = {a} (n lengkap = {n}). {i}', relOk: 'Konsistensi internal memadai.', relLow: 'Konsistensi internal belum memadai; interpretasi skor gabungan perlu hati-hati.', relNA: 'Belum dapat dihitung (data lengkap belum cukup).',
      comments: 'Jumlah masukan terbuka', cStrength: 'Hal yang dihargai', cImprove: 'Hal yang perlu diperbaiki', cSuggest: 'Saran', aiNote: 'Bagian ini disusun dengan bantuan AI (model {M}) dari ringkasan statistik dan komentar tanpa identitas responden; wajib diverifikasi tim UGE sebelum dipakai sebagai catatan resmi.', aiNone: 'Analisis AI belum dibuat untuk cakupan data ini.',
      themes: 'Tema masukan', sentiment: { positive: 'positif', negative: 'negatif', mixed: 'campuran' },
      concl: 'Kesimpulan', recs: 'Rekomendasi tindak lanjut', actionPlan: 'Rencana tindak lanjut (diisi unit terkait)', ap: { action: 'Tindakan perbaikan', pic: 'Penanggung jawab', due: 'Target waktu', status: 'Status' },
      prio: { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' }, owner: 'Penanggung jawab', timeline: 'Waktu', rationale: 'Dasar',
      strengthsT: 'Kekuatan', weakT: 'Area perbaikan', findingsT: 'Temuan utama', limitT: 'Keterbatasan', segT: 'Temuan per segmen',
      lowSample: 'Perhatian: jumlah responden masih di bawah 30 sehingga hasil bersifat indikatif dan interval kepercayaan lebar.',
      sign: ['Disiapkan oleh', 'Diperiksa oleh', 'Disetujui oleh'], signRole: ['Tim UGE', 'Kepala UGE', 'Pimpinan Universitas'],
      appQ: 'Lampiran A. Daftar butir pertanyaan', appSeg: 'Lampiran B. Hasil per unit UMB', noData: 'Belum ada data pada cakupan ini.',
      lowestItems: 'Lima butir dengan nilai terendah', highestItems: 'Lima butir dengan nilai tertinggi',
      actions: { COM: 'Tetapkan standar waktu respons (mis. maksimal 2 hari kerja), satu pintu kontak mitra di UGE, dan templat informasi kerja sama yang jelas.', ADM: 'Sederhanakan dan publikasikan SOP penyusunan MoU/MoA/IA beserta estimasi waktu; sediakan templat dan pelacak status dokumen.', IMP: 'Susun rencana kerja bersama per kegiatan dengan jadwal dan titik pemeriksaan; lakukan evaluasi hasil bersama mitra setelah kegiatan.', STF: 'Selenggarakan pelatihan layanan mitra dan komunikasi lintas budaya bagi dosen dan tenaga kependidikan yang menangani kerja sama.', FAC: 'Audit fasilitas dan layanan penerimaan tamu (penyambutan, akomodasi, transportasi, bantuan administrasi) serta siapkan paket layanan standar.', BEN: 'Tinjau tujuan dan indikator manfaat tiap kerja sama bersama mitra; prioritaskan kegiatan berdampak (publikasi, program lanjutan, jejaring).', FUP: 'Lakukan pemantauan dan evaluasi berkala terdokumentasi, sediakan kanal keluhan dengan batas waktu tindak lanjut, dan kirim laporan hasil kepada mitra.' }
    },
    en: {
      reportTitle: 'Partner Satisfaction Survey Report', summaryTitle: 'Partner Satisfaction Survey — Summary',
      org: 'Universitas Muhammadiyah Bengkulu', by: 'Prepared by UMB Global Engagement (UGE)', period: 'Survey period', printed: 'Report date', filters: 'Data scope', allData: 'All data in the period',
      s1: '1. Executive Summary', s2: '2. Methodology', s3: '3. Respondent Profile', s4: '4. Satisfaction Results', s5: '5. Further Analysis', s6: '6. Open-ended Feedback', s7: '7. Conclusions and Recommendations', s8: 'Appendices',
      respondents: 'Respondents', institutions: 'Partner institutions', countries: 'Countries', unitsInvolved: 'UMB units involved', composite: 'Composite satisfaction score (1–5)', index: 'Satisfaction index', overallSat: 'Overall satisfaction (1–5)',
      top2: 'Satisfied + Very satisfied', nps: 'Net Promoter Score', cont: 'Intent to continue cooperation (1–5)', alpha: 'Reliability (α)', target: 'Quality target', met: 'Target met', notMet: 'Target not yet met', below: 'Below target',
      cat: { veryHigh: 'Very satisfied', high: 'Satisfied', medium: 'Moderately satisfied', low: 'Less satisfied', veryLow: 'Dissatisfied' },
      npsCat: ['needs improvement', 'good', 'very good', 'excellent'],
      m: { p1: 'The survey was administered online with a structured questionnaire in five languages (Indonesian, English, Chinese, Arabic and Thai) and distributed to UMB’s domestic and international cooperation partners.',
        p2: 'The instrument contains 23 rated items in seven dimensions (communication and responsiveness; administration and cooperation documents; implementation and programme quality; people and professionalism; facilities and support services; benefits and impact; evaluation and follow-up) on a 1–5 scale, three overall items (overall satisfaction, intent to continue, and likelihood to recommend on a 0–10 scale), and open-ended questions.',
        p3: 'A dimension score is the mean of the items a respondent answered; the composite score is the mean of dimension scores (respondents with at least three dimensions answered). “Not applicable” answers are excluded.',
        p4: 'Satisfaction index = mean ÷ 5 × 100. Mean interpretation: 4.21–5.00 very satisfied; 3.41–4.20 satisfied; 2.61–3.40 moderately satisfied; 1.81–2.60 less satisfied; 1.00–1.80 dissatisfied. The quality target for this period is an index ≥ {T}%.',
        p5: 'Statistical analysis comprises descriptive statistics (n, mean, standard deviation, median, 95% confidence interval, share satisfied/very satisfied), Cronbach’s alpha reliability (α ≥ 0.70 considered adequate), Pearson correlation between dimension scores and overall satisfaction to identify key drivers, one-way ANOVA comparing composite scores across groups (α = 0.05), and the Net Promoter Score (% promoters 9–10 minus % detractors 0–6).',
        p6: 'Limitations: data are self-reported and reflect only partners who responded; groups with few respondents (n < 5) cannot be tested and are reported descriptively; correlation does not imply causation.' },
      kpiNote: '95% confidence interval of the composite mean', cols: { n: 'n', mean: 'Mean', sd: 'SD', median: 'Median', ci: '95% CI', idx: 'Index (%)', top2: 'Satisfied (%)', bottom2: 'Dissatisfied (%)', status: 'Status', dim: 'Dimension', item: 'Item', group: 'Group', comp: 'Composite', ov: 'Overall', nps: 'NPS', r: 'r', p: 'p', strength: 'Strength', share: 'Share (%)', count: 'Count' },
      st: { strong: 'strong', moderate: 'moderate', weak: 'weak', negligible: 'negligible' },
      profile: { country: 'Partner country', instType: 'Partner institution type', unitCategory: 'UMB unit type', activity: 'Cooperation activities', duration: 'Duration of cooperation', docStatus: 'Cooperation document status', unit: 'UMB unit' },
      f41: 'Distribution of overall satisfaction', f42: 'Satisfaction index by dimension against target', f43: 'Satisfaction profile by dimension (radar)', f44: 'Net Promoter Score composition', f45: 'Monthly trend of satisfaction index', f46: 'Drivers of overall satisfaction (Pearson correlation)',
      t42: 'Statistics by dimension', t43: 'Statistics by item', t44: 'Internal reliability', t51: 'Key driver analysis', t52: 'Comparison across groups', t53: 'ANOVA of composite scores',
      anovaNote: 'F({d1}, {d2}) = {F}; p = {p}; η² = {e}. {sig}', sigYes: 'The difference is statistically significant.', sigNo: 'No statistically significant difference.',
      reliab: 'Cronbach’s α across all dimension items = {a} (complete cases = {n}). {i}', relOk: 'Internal consistency is adequate.', relLow: 'Internal consistency is not yet adequate; interpret the composite score with care.', relNA: 'Cannot be computed yet (not enough complete cases).',
      comments: 'Open-ended comments received', cStrength: 'What is valued', cImprove: 'What to improve', cSuggest: 'Suggestions', aiNote: 'This section was prepared with AI assistance (model {M}) from statistical summaries and comments stripped of respondent identity; the UGE team must verify it before it is used as an official record.', aiNone: 'No AI analysis has been generated for this data scope.',
      themes: 'Feedback themes', sentiment: { positive: 'positive', negative: 'negative', mixed: 'mixed' },
      concl: 'Conclusion', recs: 'Recommended follow-up actions', actionPlan: 'Action plan (to be completed by the responsible units)', ap: { action: 'Improvement action', pic: 'Person in charge', due: 'Target date', status: 'Status' },
      prio: { high: 'High', medium: 'Medium', low: 'Low' }, owner: 'Owner', timeline: 'Timeline', rationale: 'Rationale',
      strengthsT: 'Strengths', weakT: 'Areas for improvement', findingsT: 'Key findings', limitT: 'Limitations', segT: 'Segment insights',
      lowSample: 'Note: fewer than 30 respondents, so results are indicative and confidence intervals are wide.',
      sign: ['Prepared by', 'Reviewed by', 'Approved by'], signRole: ['UGE Team', 'Head of UGE', 'University Leadership'],
      appQ: 'Appendix A. Questionnaire items', appSeg: 'Appendix B. Results by UMB unit', noData: 'No data in this scope yet.',
      lowestItems: 'Five lowest-rated items', highestItems: 'Five highest-rated items',
      actions: { COM: 'Set response-time standards (e.g., within 2 working days), a single partner contact point at UGE, and clear cooperation information templates.', ADM: 'Simplify and publish the MoU/MoA/IA procedure with estimated timelines; provide templates and a document status tracker.', IMP: 'Agree a joint work plan for each activity with schedule and checkpoints; review results with the partner after each activity.', STF: 'Provide partner-service and cross-cultural communication training for lecturers and staff handling cooperation.', FAC: 'Audit facilities and guest-hosting services (reception, accommodation, transport, administrative help) and prepare a standard service package.', BEN: 'Review goals and benefit indicators of each cooperation with the partner; prioritise high-impact activities (publications, follow-up programmes, networks).', FUP: 'Run documented periodic monitoring and evaluation, provide a complaint channel with follow-up deadlines, and send outcome reports to partners.' }
    }
  };

  function npsBand(v) { return v === null ? null : v < 0 ? 0 : v < 30 ? 1 : v < 50 ? 2 : 3; }
  function dname(d, lang) { return d.name[lang]; }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }

  /** Kesimpulan otomatis dari statistik (tanpa AI). */
  function build(st, lang) {
    lang = lang === 'en' ? 'en' : 'id';
    var R = RS[lang], out = { paragraphs: [], strengths: [], concerns: [], recommendations: [], caveats: [] };
    if (!st.n) return out;
    var id = lang === 'id', cm = st.composite;
    var met = cm.index !== null && cm.index >= st.target;
    out.paragraphs.push(id
      ? 'Survei diikuti oleh ' + st.n + ' responden dari ' + st.institutions + ' institusi di ' + st.countries + ' negara, yang bekerja sama dengan ' + st.units + ' unit UMB. Skor kepuasan gabungan adalah ' + nf(cm.mean, 2, lang) + ' dari 5 (indeks ' + nf(cm.index, 1, lang) + '%, kategori “' + R.cat[cm.category] + '”). ' + (met ? 'Capaian ini memenuhi' : 'Capaian ini belum memenuhi') + ' target mutu indeks ≥ ' + st.target + '%.'
      : st.n + ' respondents from ' + st.institutions + ' institutions in ' + st.countries + ' countries, cooperating with ' + st.units + ' UMB units, took part. The composite satisfaction score is ' + nf(cm.mean, 2, lang) + ' out of 5 (index ' + nf(cm.index, 1, lang) + '%, “' + R.cat[cm.category] + '”). This ' + (met ? 'meets' : 'does not yet meet') + ' the quality target of an index ≥ ' + st.target + '%.');
    var ov = st.overall;
    if (ov.n) out.paragraphs.push(id
      ? 'Pada penilaian langsung, kepuasan keseluruhan bernilai ' + nf(ov.mean, 2, lang) + ' dengan ' + nf(ov.top2, 1, lang) + '% responden menyatakan puas atau sangat puas. Niat melanjutkan kerja sama bernilai ' + nf(st.cont.mean, 2, lang) + ' dari 5.'
      : 'On the direct question, overall satisfaction is ' + nf(ov.mean, 2, lang) + ', with ' + nf(ov.top2, 1, lang) + '% of respondents satisfied or very satisfied. Intent to continue cooperation is ' + nf(st.cont.mean, 2, lang) + ' out of 5.');
    if (st.nps.n) {
      var band = R.npsCat[npsBand(st.nps.nps)];
      out.paragraphs.push(id
        ? 'Net Promoter Score adalah ' + nf(st.nps.nps, 0, lang) + ' (promoter ' + nf(st.nps.promoters, 0, lang) + '%, detractor ' + nf(st.nps.detractors, 0, lang) + '%), tergolong ' + band + '.'
        : 'The Net Promoter Score is ' + nf(st.nps.nps, 0, lang) + ' (promoters ' + nf(st.nps.promoters, 0, lang) + '%, detractors ' + nf(st.nps.detractors, 0, lang) + '%), which is ' + band + '.');
    }
    var ranked = st.dims.filter(function (d) { return d.mean !== null; }).sort(function (a, b) { return b.mean - a.mean; });
    if (ranked.length >= 2) {
      var hi = ranked[0], lo = ranked[ranked.length - 1];
      out.paragraphs.push(id
        ? 'Dimensi dengan nilai tertinggi adalah “' + dname(hi, lang) + '” (' + nf(hi.mean, 2, lang) + '), sedangkan yang terendah adalah “' + dname(lo, lang) + '” (' + nf(lo.mean, 2, lang) + ').'
        : 'The highest-rated dimension is “' + dname(hi, lang) + '” (' + nf(hi.mean, 2, lang) + '); the lowest is “' + dname(lo, lang) + '” (' + nf(lo.mean, 2, lang) + ').');
      out.strengths = ranked.filter(function (d) { return !d.belowTarget; }).slice(0, 3).map(function (d) { return dname(d, lang) + ' (' + nf(d.index, 1, lang) + '%)'; });
    }
    out.concerns = st.priorities.map(function (p) { return dname(p, lang) + ' (' + nf(p.index, 1, lang) + '%, ' + (id ? 'selisih ' : 'gap ') + nf(p.gap, 1, lang) + ' ' + (id ? 'poin' : 'pts') + ')'; });
    var drv = st.drivers.filter(function (d) { return d.r !== null && d.p < 0.05; })[0];
    if (drv) out.paragraphs.push(id
      ? 'Analisis faktor penentu menunjukkan dimensi “' + dname(drv, lang) + '” paling kuat berkorelasi dengan kepuasan keseluruhan (r = ' + nf(drv.r, 2, lang) + ', p ' + (drv.p < 0.001 ? '< 0,001' : '= ' + nf(drv.p, 3, lang)) + ', ' + R.st[drv.strength] + '). Perbaikan pada dimensi ini diperkirakan paling berpengaruh.'
      : 'Key-driver analysis shows “' + dname(drv, lang) + '” correlates most strongly with overall satisfaction (r = ' + nf(drv.r, 2, lang) + ', p ' + (drv.p < 0.001 ? '< 0.001' : '= ' + nf(drv.p, 3, lang)) + ', ' + R.st[drv.strength] + '), so improvements there are likely to matter most.');
    var an = st.anova.unit;
    if (an && an.p !== null) out.paragraphs.push(id
      ? 'Perbandingan skor gabungan antar unit UMB ' + (an.p < 0.05 ? 'menunjukkan perbedaan yang signifikan secara statistik' : 'tidak menunjukkan perbedaan yang signifikan secara statistik') + ' (F(' + an.df1 + ', ' + an.df2 + ') = ' + nf(an.F, 2, lang) + ', p = ' + pv(an.p, lang) + ').'
      : 'Composite scores ' + (an.p < 0.05 ? 'differ significantly' : 'do not differ significantly') + ' across UMB units (F(' + an.df1 + ', ' + an.df2 + ') = ' + nf(an.F, 2, lang) + ', p = ' + pv(an.p, lang) + ').');
    st.priorities.forEach(function (p, i) {
      out.recommendations.push({ dim: p.id, priority: i < 2 ? 'high' : 'medium', text: R.actions[p.id], name: dname(p, lang) });
    });
    if (!out.recommendations.length) out.recommendations.push({ dim: '', priority: 'low', name: '', text: id ? 'Pertahankan praktik terbaik pada seluruh dimensi dan lakukan pemantauan berkala untuk menjaga capaian di atas target.' : 'Maintain good practice across all dimensions and keep monitoring periodically to stay above target.' });
    if (st.lowSample) out.caveats.push(R.lowSample);
    if (st.reliability.alpha !== null && st.reliability.alpha < 0.7) out.caveats.push(R.relLow);
    return out;
  }

  var API = { RS: RS, build: build, nf: nf, pv: pv, fill: fill, npsBand: npsBand };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else window.Narrative = API;
})();
