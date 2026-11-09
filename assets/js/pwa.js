/* Pemasangan aplikasi (PWA): daftar service worker, tangkap tombol "pasang", petunjuk iOS.
 * Tombol pemasangan = elemen dengan class "pwa-install" (tersembunyi sampai pemasangan memungkinkan). */
(function () {
  var deferred = null;
  var inFrame = false; try { inFrame = window.top !== window.self; } catch (e) { inFrame = true; }
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* abaikan */ }); });
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; sync(); });
  window.addEventListener('appinstalled', function () { deferred = null; standalone = true; sync(); });

  function available() { return !inFrame && !standalone && (!!deferred || ios); }
  function sync() {
    var els = document.querySelectorAll('.pwa-install');
    for (var i = 0; i < els.length; i++) els[i].hidden = !available();
  }
  window.PWA = {
    sync: sync, available: available, isIOS: function () { return ios && !deferred; },
    install: function () { if (!deferred) return Promise.resolve('ios'); var d = deferred; deferred = null; d.prompt(); return d.userChoice.then(function (c) { sync(); return c.outcome; }); }
  };
})();
