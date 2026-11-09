/* Service worker: membuat aplikasi bisa dipasang dan membuka kerangka tampilan saat sinyal buruk.
 * Strategi: jaringan dulu, cache sebagai cadangan. Data survei/dashboard (GAS) tidak pernah di-cache.
 * Setiap kali berkas web diubah, naikkan VERSI agar cache lama dibuang. */
var VERSI = 'umb-survei-v1';
var INTI = [
  './', 'index.html', 'dashboard.html', 'manifest-survey.webmanifest', 'manifest-dashboard.webmanifest',
  'assets/css/survey.css', 'assets/css/dash.css',
  'assets/js/config.js', 'assets/js/pwa.js', 'assets/js/schema.js', 'assets/js/i18n.js', 'assets/js/api.js', 'assets/js/geo.js', 'assets/js/survey.js',
  'assets/js/dom.js', 'assets/js/charts.js', 'assets/js/stats.js', 'assets/js/narrative.js', 'assets/js/report.js', 'assets/js/dashboard.js',
  'assets/js/vendor/chart.umd.js', 'assets/data/countries.js',
  'assets/img/logo-umb.png', 'assets/img/logo-umb-128.png',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png', 'assets/icons/favicon-48.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) {
    return Promise.all(INTI.map(function (u) { return c.add(u).catch(function () { /* berkas opsional */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSI; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;            // API GAS, data wilayah, dll. langsung ke jaringan
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && res.type === 'basic') { var cp = res.clone(); caches.open(VERSI).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) { return m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()); });
  }));
});
