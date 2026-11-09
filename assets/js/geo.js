/* Data negara & wilayah.
 * - Negara + kode telepon : lokal (countries.js) + Intl.DisplayNames (nama sesuai bahasa)
 * - Indonesia             : provinsi > kabupaten/kota > kecamatan (emsifa api-wilayah-indonesia)
 * - Negara lain           : provinsi/negara bagian > kota (countriesnow.space)
 * Semua pemanggilan jaringan gagal-aman: bila gagal, daftar kosong dan pengguna mengetik manual. */
(function () {
  var CFG = window.APP_CONFIG || {};
  var cache = {};

  function title(s) {
    return String(s).toLowerCase().replace(/(^|[\s\-/(])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); })
      .replace(/\b(Dki|Di)\b/g, function (m) { return m.toUpperCase(); });
  }

  function fetchJson(url, opts, ms) {
    var c = new AbortController();
    var timer = setTimeout(function () { c.abort(); }, ms || 9000);
    opts = Object.assign({ signal: c.signal }, opts || {});
    return fetch(url, opts).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).catch(function (e) { clearTimeout(timer); throw e; });
  }

  function memo(key, fn) {
    if (cache[key]) return cache[key];
    cache[key] = fn().catch(function () { delete cache[key]; return []; });
    return cache[key];
  }

  function postWorld(path, body) {
    return fetchJson(CFG.GEO_WORLD_BASE + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
  }

  var Geo = {
    countries: function (lang) {
      var locale = lang === 'zh' ? 'zh-CN' : lang;
      var dn, coll;
      try { dn = new Intl.DisplayNames([locale], { type: 'region' }); } catch (e) { dn = null; }
      try { coll = new Intl.Collator(locale); } catch (e2) { coll = new Intl.Collator('en'); }
      var list = Object.keys(window.COUNTRY_DIAL || {}).map(function (code) {
        var name = code;
        try { name = (dn && dn.of(code)) || code; } catch (e3) { /* pakai kode */ }
        return { code: code, name: name, dial: window.COUNTRY_DIAL[code] };
      });
      list.sort(function (a, b) {
        if (a.code === 'ID') return -1;
        if (b.code === 'ID') return 1;
        return coll.compare(a.name, b.name);
      });
      return list;
    },
    englishName: function (code) {
      try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch (e) { return code; }
    },
    dial: function (code) { return (window.COUNTRY_DIAL || {})[code] || ''; },

    // Indonesia: id wilayah dipakai untuk level berikutnya
    idProvinces: function () {
      return memo('id:prov', function () {
        return fetchJson(CFG.GEO_ID_BASE + '/provinces.json').then(function (a) { return a.map(function (x) { return { id: x.id, name: title(x.name) }; }); });
      });
    },
    idRegencies: function (provId) {
      return memo('id:reg:' + provId, function () {
        return fetchJson(CFG.GEO_ID_BASE + '/regencies/' + provId + '.json').then(function (a) { return a.map(function (x) { return { id: x.id, name: title(x.name) }; }); });
      });
    },
    idDistricts: function (regId) {
      return memo('id:dist:' + regId, function () {
        return fetchJson(CFG.GEO_ID_BASE + '/districts/' + regId + '.json').then(function (a) { return a.map(function (x) { return { id: x.id, name: title(x.name) }; }); });
      });
    },

    // Negara lain
    worldStates: function (code) {
      var en = Geo.englishName(code);
      return memo('w:st:' + code, function () {
        return postWorld('/countries/states', { country: en }).then(function (j) {
          var st = (j && j.data && j.data.states) || [];
          return st.map(function (s) { return { id: s.name, name: s.name }; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
        });
      });
    },
    worldCities: function (code, state) {
      var en = Geo.englishName(code);
      return memo('w:ct:' + code + ':' + state, function () {
        return postWorld('/countries/state/cities', { country: en, state: state }).then(function (j) {
          var ct = (j && j.data) || [];
          return ct.map(function (c) { return { id: c, name: c }; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
        });
      });
    }
  };

  window.Geo = Geo;
})();
