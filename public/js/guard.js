/* Jaring pengaman anti-freeze + mode debug untuk HP.
   - Jika ada error JavaScript, tirai transisi yang macet langsung dilepas.
   - Watchdog: tirai tidak boleh menutupi layar lebih dari 4,5 detik.
   - Tambahkan ?debug ke alamat (mis. situs.vercel.app/?debug) untuk melihat error dan tugas lambat di layar HP. */
(() => {
  const tirai = () => document.getElementById("tirai");
  const lepas = () => { const t = tirai(); if (t && t.classList.contains("on")) { t.classList.remove("on"); t.style.transform = ""; } };
  let sejak = 0;
  setInterval(() => {
    const t = tirai();
    if (t && t.classList.contains("on")) { if (!sejak) sejak = Date.now(); else if (Date.now() - sejak > 4500) { lepas(); sejak = 0; } }
    else sejak = 0;
  }, 1000);

  let log = null;
  const tulis = (teks) => {
    if (!/[?&]debug\b/.test(location.search)) return;
    if (!log) {
      log = document.createElement("pre");
      log.style.cssText = "position:fixed;left:0;right:0;bottom:0;max-height:38vh;overflow:auto;margin:0;padding:.5rem .6rem;background:rgba(0,0,0,.88);color:#8f8;font:11px/1.4 monospace;z-index:2147483647;white-space:pre-wrap;word-break:break-all;pointer-events:auto";
      log.textContent = "MODE DEBUG (ketuk untuk menutup)\n"; log.onclick = () => log.remove();
      document.body.append(log);
    }
    log.append(new Date().toLocaleTimeString("id-ID") + "  " + teks + "\n"); log.scrollTop = log.scrollHeight;
  };
  addEventListener("error", (e) => { lepas(); tulis("ERROR: " + e.message + " (" + (e.filename || "").split("/").pop() + ":" + e.lineno + ")"); });
  addEventListener("unhandledrejection", (e) => { lepas(); tulis("PROMISE: " + (e.reason && e.reason.message || e.reason)); });
  try { new PerformanceObserver((l) => l.getEntries().forEach(x => tulis("TUGAS LAMBAT " + Math.round(x.duration) + " ms"))).observe({ entryTypes: ["longtask"] }); } catch (_) {}
  if (/[?&]debug\b/.test(location.search)) addEventListener("DOMContentLoaded", () => tulis("layar " + innerWidth + "x" + innerHeight + ", dpr " + devicePixelRatio + ", sentuh: " + matchMedia("(pointer: coarse)").matches));
})();
