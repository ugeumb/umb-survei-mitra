/* Pembungkus fetch ke Google Apps Script Web App.
 * Memakai Content-Type text/plain supaya browser tidak mengirim preflight CORS (GAS tidak mendukung OPTIONS). */
(function () {
  var CFG = window.APP_CONFIG || {};

  function timeout(ms) {
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c.signal;
  }

  function parse(res) {
    return res.text().then(function (txt) {
      var j;
      try { j = JSON.parse(txt); } catch (e) { var er = new Error('bad_response'); er.code = 'bad_response'; throw er; }
      if (!j.ok) { var err = new Error(j.message || j.error); err.code = j.error; throw err; }
      return j.data;
    });
  }

  function wrapNet(p) {
    return p.catch(function (e) {
      if (e && e.code) throw e;
      var er = new Error('network'); er.code = 'network'; throw er;
    });
  }

  window.API = {
    get: function (action) {
      var url = CFG.API_URL + (CFG.API_URL.indexOf('?') >= 0 ? '&' : '?') + 'action=' + encodeURIComponent(action);
      return wrapNet(fetch(url, { signal: timeout(25000) }).then(parse));
    },
    post: function (action, body, ms) {
      var payload = Object.assign({ action: action }, body || {});
      return wrapNet(fetch(CFG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: timeout(ms || 45000)
      }).then(parse));
    },
    configured: function () { return CFG.API_URL && CFG.API_URL.indexOf('PASTE_') !== 0 && (/^https:\/\//.test(CFG.API_URL) || /^http:\/\/localhost/.test(CFG.API_URL)); }
  };
})();
