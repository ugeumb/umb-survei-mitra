/* Helper DOM kecil: H(tag, attrs, children) */
(function () {
  function H(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled') { if (v) el[k] = true; }
      else el.setAttribute(k, v === true ? '' : v);
    });
    (function add(list) {
      (list || []).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        if (Array.isArray(c)) return add(c);
        el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    })(kids);
    return el;
  }
  function fmt(v, d) { return v === null || v === undefined || !isFinite(v) ? '–' : Number(v).toLocaleString('id-ID', { minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d }); }
  function fmtP(p) { return p === null || p === undefined ? '–' : (p < 0.001 ? '< 0,001' : fmt(p, 3)); }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.H = H; window.fmt = fmt; window.fmtP = fmtP; window.esc = esc;
})();
