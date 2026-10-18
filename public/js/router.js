/* ===== Router: Beranda / Berita / Galeri + transisi tirai ===== */
(() => {
  const HASH_B = "#halaman-berita", HASH_G = "#halaman-galeri", HASH_S = "#halaman-siswa", FOKUS = "berita-fokus";
  const body = document.body, pageB = $("berita-page"), pageG = $("galeri-page"), pageS = $("siswa-page"), tirai = $("tirai");
  const gridB = $("b-grid"), gridG = $("g-grid"), gridS = $("s-grid");
  if (!pageB || !pageG || !pageS || !tirai || !gridB || !gridG || !gridS) return;
  const judulAsli = document.title;
  const gerak = () => !!window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mode = "home", akhir = "home", tl = null, posHome = 0, tujuan = null, io = null, putar = null, kartu = [];

  [..."Berita", "\u00a0", ...CONFIG.KELAS].forEach(c => $("b-judul").append(el("span", "hr", c)));
  $("b-judul").setAttribute("aria-label", "Berita " + CONFIG.KELAS);
  [..."Galeri", "\u00a0", ...CONFIG.KELAS].forEach(c => $("g-judul").append(el("span", "hr", c)));
  $("g-judul").setAttribute("aria-label", "Galeri " + CONFIG.KELAS);
  [..."Warga", "\u00a0", ...CONFIG.KELAS].forEach(c => $("s-judul").append(el("span", "hr", c)));
  $("s-judul").setAttribute("aria-label", "Warga Kelas " + CONFIG.KELAS);
  if ($("sinar")) {
    if ($("b-putar")) $("b-putar").innerHTML = $("sinar").innerHTML;
    if ($("g-putar")) $("g-putar").innerHTML = $("sinar").innerHTML;
    if ($("s-putar")) $("s-putar").innerHTML = $("sinar").innerHTML;
  }

  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); };
  const ke = (t) => {
    if (window.gLenis) { gLenis.resize && gLenis.resize(); gLenis.scrollTo(t, { immediate: true, force: true, offset: typeof t === "number" ? 0 : -70 }); }
    else if (typeof t === "number") scrollTo(0, t); else if (t) t.scrollIntoView();
  };

  function renderBerita(q) {
    const semua = loadNews().map((n, i) => ({ ...n, i }));
    const kata = (q || "").trim().toLowerCase();
    const hasil = kata ? semua.filter(n => (n.judul + " " + (n.isi || "")).toLowerCase().includes(kata)) : semua;
    gridB.textContent = "";
    $("b-hitung").textContent = hasil.length + " dari " + semua.length + " berita";
    if (!hasil.length) { gridB.append(el("p", "kosong", kata ? "Tidak ada berita yang cocok." : "Belum ada berita.")); return []; }
    hasil.forEach((n, pos) => {
      const utama = pos === 0 && !kata;
      const a = el("article", "b-kartu" + (utama ? " utama" : ""));
      a.dataset.idx = n.i;
      const th = el("div", "thumb");
      if (n.img) {
        const im = el("img"); im.src = n.img; im.alt = n.judul; im.loading = "lazy";
        im.onerror = () => { im.remove(); th.textContent = "Foto"; };
        th.append(im);
      } else th.textContent = "Foto";
      const tb = el("div", "tubuh");
      if (utama) tb.append(el("span", "b-label", "Terbaru"));
      const t = fmt(n.tgl);
      if (t) { const tm = el("time", null, t); tm.dateTime = n.tgl; tb.append(tm); }
      tb.append(el("h3", null, n.judul));
      if (n.isi) tb.append(el("p", null, n.isi));
      a.append(th, tb); gridB.append(a);
    });
    return [...gridB.children];
  }

  /* Klik folder siswa: foto naik sedikit dari folder, lalu terbang ke tengah layar dengan latar blur */
  let stageS = null, stageKartu = null, tlS = null, tengahS = null;
  const rectFoto = (a) => {                                   // area gambar yang benar-benar terlihat di folder
    const im = a.querySelector(".folder-photo img");
    if (!im) return a.getBoundingClientRect();
    const b = im.getBoundingClientRect(), nw = im.naturalWidth, nh = im.naturalHeight;
    if (!nw || !nh || !b.width) return b;
    const k = Math.min(b.width / nw, b.height / nh), w = nw * k, h = nh * k;
    return { left: b.left + (b.width - w) / 2, top: b.top, width: w, height: h };
  };
  const dariFolder = (a) => {                                 // transform awal: foto pas di posisi folder
    const r = rectFoto(a), fr = a.querySelector(".folder-front"), T = tengahS;
    const tertutup = fr ? Math.min(1, Math.max(0, (r.top + r.height - fr.getBoundingClientRect().top) / r.height)) : 0;
    return { x: r.left + r.width / 2 - T.cx, y: r.top + r.height / 2 - T.cy, s: r.width / T.w, naik: Math.min(70, r.height * 0.3), clip: `inset(0% 0% ${(tertutup * 100).toFixed(1)}% 0%)` };
  };
  function tutupSiswa() {
    if (!stageS) return;
    const s2 = stageS, a = stageKartu; stageS = null; stageKartu = null;
    const fig = s2.firstChild, im = fig.children[0], fo = fig.children[1], hint = fig.children[2];
    const selesai = () => { tlS = null; s2.remove(); if (a) a.classList.remove("open"); };
    if (tlS) { tlS.kill(); tlS = null; }
    if (!gerak() || !a || !a.isConnected || !tengahS) { selesai(); return; }
    const g = dariFolder(a);
    s2.classList.remove("show");
    gsap.to([fo, hint], { autoAlpha: 0, duration: 0.18, overwrite: true });
    tlS = gsap.timeline({ onComplete: selesai })
      .to(im, { x: g.x, y: g.y - g.naik, scale: g.s, duration: 0.65, ease: "power3.inOut" })
      .to(im, { y: g.y, clipPath: g.clip, duration: 0.3, ease: "power2.in" });
  }
  function bukaSiswa(a, nama, src, no) {
    if (stageS) { tutupSiswa(); return; }
    const s2 = el("div", "siswa-stage"); s2.setAttribute("role", "dialog"); s2.setAttribute("aria-label", "Foto " + nama); s2.setAttribute("data-lenis-prevent", "");
    const fig = el("div", "sf");
    const kosong = () => el("div", "sf-foto sf-kosong", nama.charAt(0).toUpperCase());
    const im = src ? el("img", "sf-foto") : kosong();
    if (src) { im.alt = nama; im.src = src; }
    const fo = el("div", "sf-folder"); fo.append(el("strong", null, nama), el("span", null, typeof no === "number" ? String(no).padStart(2, "0") : no));
    fig.append(im, fo, el("small", "sf-hint", "Klik lagi untuk menutup"));
    s2.append(fig); document.body.append(s2);
    stageS = s2; stageKartu = a; s2.onclick = tutupSiswa;
    if (!gerak()) { a.classList.add("open"); s2.classList.add("show"); return; }
    const hint = fig.children[2];
    gsap.set([fo, hint], { autoAlpha: 0 });
    const mulai = () => {
      if (stageS !== s2) return;
      const foto = fig.children[0], f = foto.getBoundingClientRect();
      tengahS = { cx: f.left + f.width / 2, cy: f.top + f.height / 2, w: f.width };
      const g = dariFolder(a);
      a.classList.add("open");
      gsap.set(foto, { x: g.x, y: g.y, scale: g.s, clipPath: g.clip, transformOrigin: "50% 50%" });
      tlS = gsap.timeline({ onComplete: () => { tlS = null; } })
        .to(foto, { y: g.y - g.naik, clipPath: "inset(0% 0% 0% 0%)", duration: 0.38, ease: "back.out(1.7)" })
        .addLabel("terbang", "+=0.05")
        .add(() => s2.classList.add("show"), "terbang")
        .to(foto, { x: 0, y: 0, scale: 1, duration: 0.85, ease: "power3.inOut" }, "terbang")
        .to([fo, hint], { autoAlpha: 1, duration: 0.35, stagger: 0.08, ease: "power2.out" }, "terbang+=0.55");
    };
    if (!src) mulai();
    else if (im.complete && im.naturalWidth) mulai();
    else { im.onload = mulai; im.onerror = () => { const k = kosong(); im.replaceWith(k); mulai(); }; }
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") tutupSiswa(); });
  window.addEventListener("hashchange", tutupSiswa);
  { let w0 = innerWidth; addEventListener("resize", () => { if (innerWidth !== w0) { w0 = innerWidth; tutupSiswa(); } }); }   // abaikan resize karena bilah alamat/keyboard HP

  let kat = "murid";
  function ubahKat(k) { kat = k; document.querySelectorAll(".s-tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.k === k))); }
  function renderSiswa(q) {
    const FOTO = {
      "Nadhif":"siswa/orang_01.png","Azka P":"siswa/orang_02.png","Nouval":"siswa/orang_03.png",
      "Juna":"siswa/orang_04.png","Nino":"siswa/orang_05.png","Neymar":"siswa/orang_06.png",
      "Kenzie":"siswa/orang_07.png","Javier":"siswa/orang_08.png","Kido":"siswa/orang_09.png",
      "Alfon":"siswa/orang_10.png","Ahsan":"siswa/orang_11.png","Restu":"siswa/orang_12.png",
      "Xeon":"siswa/orang_13.png","Radit":"siswa/orang_14.png","Azzam":"siswa/orang_15.png",
      "Zhafran":"siswa/orang_16.png","Rafif":"siswa/orang_17.png","Yusuf":"siswa/orang_18.png",
      "Celo":"siswa/orang_19.png","Anggoro":"siswa/orang_20.png","Nando":"siswa/orang_21.png",
      "Fadhil":"siswa/orang_22.png","Zidan":"siswa/orang_23.png","Fattah":"siswa/orang_24.png",
      "Agha":"siswa/orang_25.png","Jazin":"siswa/orang_26.png","Kevin":"siswa/orang_27.png",
      "Sakha":"siswa/orang_29.png","Bima":"siswa/sample_cutout.png"
    };
    const SISWA = [
      { nama: "Alfon", icon: '<svg viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 10l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5z"/></svg>' },
      { nama: "Juna", icon: '<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-6 6c0 4 6 12 6 12s6-8 6-12a6 6 0 0 0-6-6z"/><circle cx="12" cy="9" r="2"/></svg>' },
      { nama: "Sakha", icon: '<svg viewBox="0 0 24 24"><path d="M12 22c4-4 6-8 6-12a6 6 0 0 0-12 0c0 4 2 8 6 12z"/><path d="M12 10v6M9 13h6"/></svg>' },
      { nama: "Agha", icon: '<svg viewBox="0 0 24 24"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6z"/></svg>' },
      { nama: "Bima", icon: '<svg viewBox="0 0 24 24"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg>' },
      { nama: "Restu", icon: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-4.5-6-9a4 4 0 0 1 6-3.5A4 4 0 0 1 18 12c0 4.5-6 9-6 9z"/></svg>' },
      { nama: "Nando", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17"/></svg>' },
      { nama: "Azka P", icon: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.5.7-1 1.5-1 2.5H9c0-1-.5-1.8-1-2.5A6 6 0 0 1 12 3z"/></svg>' },
      { nama: "Radit", icon: '<svg viewBox="0 0 24 24"><path d="M4 12h16M12 4v16"/><circle cx="12" cy="12" r="3"/><path d="M7 7l10 10M17 7L7 17"/></svg>' },
      { nama: "Azzam", icon: '<svg viewBox="0 0 24 24"><path d="M4 19V5l8 7 8-7v14"/><path d="M4 19h16"/></svg>' },
      { nama: "Anggoro", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>' },
      { nama: "Jazin", icon: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' },
      { nama: "Kenzie", icon: '<svg viewBox="0 0 24 24"><path d="M3 20l9-16 9 16"/><path d="M8 14h8"/></svg>' },
      { nama: "Celo", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>' },
      { nama: "Kevin", icon: '<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M12 15h8l2-3-2-3h-5"/></svg>' },
      { nama: "Ahsan", icon: '<svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>' },
      { nama: "Fadhil", icon: '<svg viewBox="0 0 24 24"><path d="M12 20h9M4 20l6-16h4l6 16"/><path d="M8 14h8"/></svg>' },
      { nama: "Fattah", icon: '<svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/><path d="M6 6l12 12M18 6L6 18"/></svg>' },
      { nama: "Zhafran", icon: '<svg viewBox="0 0 24 24"><path d="M13 2L3 14h8l-1 8 10-12h-8z"/></svg>' },
      { nama: "Yusuf", icon: '<svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M6 19h14"/></svg>' },
      { nama: "Nadhif", icon: '<svg viewBox="0 0 24 24"><path d="M12 3l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/><circle cx="12" cy="18" r="2"/></svg>' },
      { nama: "Nino", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>' },
      { nama: "Neymar", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3c2 3 2 15 0 18M3 12c3-2 15-2 18 0"/></svg>' },
      { nama: "Nouval", icon: '<svg viewBox="0 0 24 24"><path d="M2 12c2-4 6-4 8 0s6 4 8 0 6-4 8 0"/><path d="M2 18c2-4 6-4 8 0s6 4 8 0 6-4 8 0"/></svg>' },
      { nama: "Rafif", icon: '<svg viewBox="0 0 24 24"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>' },
      { nama: "Zidan", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>' },
      { nama: "Kido", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="5"/><path d="M8 21v-2a4 4 0 0 1 8 0v2"/></svg>' },
      { nama: "Xeon", icon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>' },
      { nama: "Javier", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>' }
    ];
    const GURU = WALI.map(w => ({ nama: w.nama, peran: w.peran })), gf = {};
    WALI.forEach(w => { gf[w.nama] = Array.isArray(w.foto) ? w.foto[0] : w.foto; });
    $("st-murid").textContent = SISWA.length; $("st-guru").textContent = GURU.length;
    const DAFTAR = kat === "guru" ? GURU : SISWA, satuan = kat === "guru" ? "guru" : "siswa";
    const kata = (q || "").trim().toLowerCase();
    const hasil = kata ? DAFTAR.filter(s => s.nama.toLowerCase().includes(kata)) : DAFTAR;
    gridS.textContent = "";
    $("s-hitung").textContent = hasil.length + " dari " + DAFTAR.length + " " + satuan;
    if (!hasil.length) { gridS.append(el("p", "kosong", kata ? "Tidak ada " + satuan + " yang cocok." : "Belum ada data.")); return []; }
    hasil.forEach((s) => {
      const no = kat === "guru" ? s.peran : DAFTAR.findIndex(x => x.nama === s.nama) + 1, fotoS = kat === "guru" ? (gf[s.nama] || "") : (FOTO[s.nama] || "");
      const a = el("article", "siswa-kartu");
      a.tabIndex = 0; a.setAttribute("role", "button"); a.setAttribute("aria-label", "Lihat foto " + s.nama);
      a.onclick = () => bukaSiswa(a, s.nama, fotoS, no);
      a.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bukaSiswa(a, s.nama, fotoS, no); } };
      const wrap = el("div", "folder-wrap");
      wrap.append(el("div", "folder-tab"));
      wrap.append(el("div", "folder-back"));
      const photo = el("div", "folder-photo");
      const img = el("img");
      img.src = fotoS;
      img.alt = s.nama;
      img.loading = "lazy";
      photo.append(img);
      wrap.append(photo);
      const front = el("div", "folder-front");
      front.append(el("strong", null, s.nama));
      front.append(el("span", null, typeof no === "number" ? String(no).padStart(2, "0") : no));
      wrap.append(front);
      a.append(wrap);
      gridS.append(a);
    });
    return [...gridS.children];
  }

  function renderGaleriPage(q) {
    const semua = GALERI.concat(loadGaleri()).map((g, i) => ({ ...g, i }));
    const kata = (q || "").trim().toLowerCase();
    const hasil = kata ? semua.filter(g => ((g.cap || "") + " " + (g.alt || "")).toLowerCase().includes(kata)) : semua;
    gridG.textContent = "";
    $("g-hitung").textContent = hasil.length + " dari " + semua.length + " foto";
    if (!hasil.length) { gridG.append(el("p", "kosong", kata ? "Tidak ada foto yang cocok." : "Belum ada foto di galeri.")); return []; }
    hasil.forEach(g => {
      const a = el("article", "b-kartu g-kartu");
      const th = el("button", "thumb");
      th.type = "button";
      th.setAttribute("aria-label", "Perbesar foto: " + (g.cap || "foto"));
      th.style.aspectRatio = g.rasio || "4/3";
      if (g.src) {
        const im = el("img"); im.src = g.src; im.alt = g.alt || g.cap || ""; im.loading = "lazy";
        im.onerror = () => { im.remove(); th.append(el("span", null, "Foto tidak dapat dimuat")); };
        th.append(im);
      } else th.append(el("span", null, "Foto"));
      th.onclick = () => {
        $("lb-img").src = g.src || "";
        $("lb-img").alt = g.alt || g.cap || "";
        $("lb-cap").textContent = g.cap || "";
        lb.showModal();
      };
      const tb = el("div", "tubuh");
      tb.append(el("h3", null, g.cap || "Tanpa keterangan"));
      if (g.alt && g.alt !== g.cap) tb.append(el("p", null, g.alt));
      a.append(th, tb); gridG.append(a);
    });
    return [...gridG.children];
  }
  window.renderGaleriJikaAktif = () => {
    if (mode !== "galeri") return;
    if (io) { io.disconnect(); io = null; }
    kartu = renderGaleriPage($("g-cari").value);
  };

  function bersih() {
    if (io) { io.disconnect(); io = null; }
    if (!window.gsap) return;
    if (putar) { putar.kill(); putar = null; }
    gsap.killTweensOf("#berita-page #b-judul .hr,#galeri-page #g-judul .hr,#berita-page .b-hero .chip,#berita-page .b-hero .lead,#berita-page .b-hero .aksi,#b-sun,#galeri-page .g-hero .chip,#galeri-page .g-hero .lead,#galeri-page .g-hero .aksi,#g-sun");
    gsap.killTweensOf(kartu);
    gsap.set("#b-judul .hr,#g-judul .hr", { clearProps: "opacity,transform,visibility" });
    gsap.set(kartu, { clearProps: "opacity,transform" });
  }

  function masukPage(want) {
    const judul = want === "berita" ? "b-judul" : want === "galeri" ? "g-judul" : "s-judul";
    const sun = want === "berita" ? "b-sun" : want === "galeri" ? "g-sun" : "s-sun";
    const putarId = want === "berita" ? "b-putar" : want === "galeri" ? "g-putar" : "s-putar";
    const hero = want === "berita" ? ".b-hero" : want === "galeri" ? ".g-hero" : ".s-hero";
    $(judul).focus({ preventScroll: true });
    if (want === "galeri" && location.hash === "#wall") {
      setTimeout(() => { const w = $("wall"); if (w) ke(w); }, gerak() ? 650 : 40);
    }
    if (gerak()) {
      const root = want === "berita" ? "#berita-page" : want === "galeri" ? "#galeri-page" : "#siswa-page";
      gsap.from(root + " #" + judul + " .hr", { yPercent: 140, rotate: 14, duration: 1, ease: "back.out(1.6)", stagger: 0.06, clearProps: "transform" });
      gsap.from(root + " " + hero + " .chip," + root + " " + hero + " .lead," + root + " " + hero + " .aksi", { y: 30, opacity: 0, duration: 0.7, delay: 0.25, stagger: 0.1, ease: "power3.out", clearProps: "opacity,transform" });
      gsap.from("#" + sun, { scale: 0.4, opacity: 0, duration: 1.2, ease: "power3.out", clearProps: "opacity,transform" });
      putar = gsap.to("#" + putarId, { rotation: 360, svgOrigin: "0 0", duration: 70, ease: "none", repeat: -1 });
      gsap.set(kartu, { opacity: 0, y: 50 });
      io = new IntersectionObserver((es) => {
        const m = es.filter(e => e.isIntersecting).map(e => e.target);
        if (!m.length) return;
        m.forEach(t => io.unobserve(t));
        gsap.to(m, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.09, clearProps: "opacity,transform" });
      }, { rootMargin: "0px 0px -8% 0px" });
      kartu.forEach(c => io.observe(c));
    }
    if (want !== "berita") return;
    let k = null; try { k = sessionStorage.getItem(FOKUS); sessionStorage.removeItem(FOKUS); } catch {}
    const c = k != null && kartu.find(x => x.dataset.idx === String(k));
    if (c) setTimeout(() => {
      window.gLenis ? gLenis.scrollTo(c, { offset: -130 }) : c.scrollIntoView({ block: "center", behavior: "smooth" });
      c.classList.add("fokus"); setTimeout(() => c.classList.remove("fokus"), 2200);
    }, gerak() ? 1000 : 60);
  }

  function masukHome() {
    if (!gerak()) return;
    gsap.from("main .huruf", { yPercent: 140, rotate: 18, duration: 1, ease: "back.out(1.6)", stagger: 0.1, clearProps: "transform" });
    gsap.from("main .hero .sekolah, main .hero .lead, main .hero .aksi, main .polaroid", { opacity: 0, y: 30, duration: 0.8, delay: 0.2, stagger: 0.1, ease: "power3.out", clearProps: "opacity,transform" });
  }

  const dalamMain = (t) => t.trigger && t.trigger.closest && t.trigger.closest("main");

  function terapkan(want) {
    if (mode === "home") posHome = window.scrollY;
    mode = want;
    bersih();
    body.classList.remove("mode-berita", "mode-galeri", "mode-siswa");
    if (want === "berita" || want === "galeri" || want === "siswa") {
      if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(t => { if (dalamMain(t)) t.disable(); });
      if (want === "berita") {
        $("b-cari").value = "";
        body.classList.add("mode-berita");
        document.title = "Berita — Kelas " + CONFIG.KELAS;
        kartu = renderBerita("");
      } else if (want === "galeri") {
        $("g-cari").value = "";
        body.classList.add("mode-galeri");
        document.title = "Galeri — Kelas " + CONFIG.KELAS;
        kartu = renderGaleriPage("");
      } else {
        $("s-cari").value = ""; ubahKat("murid");
        body.classList.add("mode-siswa");
        document.title = "Warga Kelas — Kelas " + CONFIG.KELAS;
        kartu = renderSiswa("");
      }
      ke(0);
    } else {
      document.title = judulAsli;
      if (window.ScrollTrigger) { ScrollTrigger.getAll().forEach(t => { if (dalamMain(t)) t.enable(false, false); }); ScrollTrigger.refresh(); }
      let t = null;
      if (tujuan) { try { t = document.querySelector(tujuan); } catch {} }
      tujuan = null;
      ke(t || posHome);
    }
    document.querySelectorAll("nav a[data-route]").forEach(a => {
      if (a.dataset.route === want) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    const cur = document.querySelector("nav a[aria-current=page]"), nv = document.querySelector("header nav");   // di HP menu bisa digeser: bawa tombol aktif ke tengah
    if (cur && nv && nv.scrollWidth > nv.clientWidth + 2) nv.scrollTo({ left: cur.getBoundingClientRect().left - nv.getBoundingClientRect().left + nv.scrollLeft - (nv.clientWidth - cur.offsetWidth) / 2, behavior: "smooth" });
  }
  const lanjut = (want) => want === "home" ? masukHome() : masukPage(want);
  const label = (want) => want === "berita" ? "Berita Kelas " + CONFIG.KELAS : want === "galeri" ? "Galeri Kelas " + CONFIG.KELAS : want === "siswa" ? "Warga Kelas " + CONFIG.KELAS : "Beranda";

  let jagaTirai = 0;
  const aman = (fn) => { try { fn(); } catch (e) { console.error(e); } };   // error di satu langkah tidak boleh membuat animasi macet
  function pindah(want, instan) {
    if (tl) {
      clearTimeout(jagaTirai); tl.kill(); tl = null; tirai.classList.remove("on");
      if (mode !== want) terapkan(want);
      lanjut(want); return;
    }
    if (mode === want) return;
    if (instan || !gerak()) { terapkan(want); lanjut(want); return; }
    $("tirai-label").textContent = label(want);
    tirai.classList.add("on");
    clearTimeout(jagaTirai);
    // jaring pengaman: apa pun yang terjadi, tirai tidak boleh menutupi layar lebih dari 4 detik
    jagaTirai = setTimeout(() => {
      if (tl) { tl.kill(); tl = null; }
      tirai.classList.remove("on"); gsap.set(tirai, { clearProps: "transform" });
      if (mode !== want) { aman(() => terapkan(want)); aman(() => lanjut(want)); }
    }, 4000);
    tl = gsap.timeline({ onComplete: () => { clearTimeout(jagaTirai); tirai.classList.remove("on"); tl = null; } });
    tl.fromTo(tirai, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: "power3.inOut" })
      .add(() => aman(() => terapkan(want)))
      .to(tirai, { yPercent: -100, duration: 0.55, ease: "power3.inOut" }, "+=0.15")
      .add(() => aman(() => lanjut(want)), "-=0.3");
  }

  function sinkron(instan) {
    const h = location.hash;
    const want = h === HASH_B ? "berita" : (h === HASH_G || h === "#wall") ? "galeri" : h === HASH_S ? "siswa" : h === "#owner" ? akhir : "home";
    if (want === akhir) return;
    akhir = want; pindah(want, instan);
  }

  document.addEventListener("click", (e) => {
    const k = e.target.closest && e.target.closest(".news-item");
    if (k) { try { sessionStorage.setItem(FOKUS, k.dataset.idx); } catch {} }
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || mode === "home") return;
    const h = a.getAttribute("href");
    if (h === HASH_B || h === HASH_G || h === HASH_S || h === "#wall" || h === "#" || h === "#owner") return;
    e.preventDefault(); e.stopPropagation();
    tujuan = h; location.hash = h;
  }, true);

  $("b-cari").addEventListener("input", (e) => {
    if (io) { io.disconnect(); io = null; }
    kartu = renderBerita(e.target.value);
    if (gerak() && kartu.length) gsap.from(kartu, { opacity: 0, y: 24, duration: 0.4, stagger: 0.04, ease: "power2.out", clearProps: "opacity,transform" });
  });
  $("g-cari").addEventListener("input", (e) => {
    if (io) { io.disconnect(); io = null; }
    kartu = renderGaleriPage(e.target.value);
    if (gerak() && kartu.length) gsap.from(kartu, { opacity: 0, y: 24, duration: 0.4, stagger: 0.04, ease: "power2.out", clearProps: "opacity,transform" });
  });
  document.querySelector(".s-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b || b.dataset.k === kat) return;
    if (io) { io.disconnect(); io = null; }
    tutupSiswa(); ubahKat(b.dataset.k);
    kartu = renderSiswa($("s-cari").value);
    if (gerak() && kartu.length) gsap.from(kartu, { opacity: 0, y: 24, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "opacity,transform" });
  });
  $("s-cari").addEventListener("input", (e) => {
    if (io) { io.disconnect(); io = null; }
    kartu = renderSiswa(e.target.value);
    if (gerak() && kartu.length) gsap.from(kartu, { opacity: 0, y: 24, duration: 0.4, stagger: 0.04, ease: "power2.out", clearProps: "opacity,transform" });
  });

  addEventListener("hashchange", () => sinkron(false));
  sinkron(true);
})();

/* Outline progres scroll di sekeliling floating island */
(() => {
  const hd = document.querySelector("body > header, header:not(.owner-top)"); if (!hd) return;
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), path = document.createElementNS(NS, "path");
  const bawah = document.createElementNS(NS, "path"); bawah.setAttribute("class", "u");   // garis gelap di bawah garis kuning agar kontras di latar terang
  svg.setAttribute("class", "nav-ring"); svg.setAttribute("aria-hidden", "true"); svg.append(bawah, path); hd.append(svg);
  [path, bawah].forEach(x => x.setAttribute("pathLength", "1"));
  const halo = document.createElement("div"); halo.className = "nav-halo"; halo.setAttribute("aria-hidden", "true"); document.body.append(halo);
  const O = 8, SW = 3, st = { v: 0 };
  const hitung = () => { const m = document.documentElement.scrollHeight - innerHeight; return 0.015 + 0.985 * (m > 0 ? Math.min(1, Math.max(0, scrollY / m)) : 0); };
  const tulis = () => [path, bawah].forEach(x => x.setAttribute("stroke-dasharray", st.v.toFixed(4) + " 1"));
  const bentuk = () => {                                    // ikuti ukuran pill (menu bisa berubah)
    const W = hd.offsetWidth + O * 2, H = hd.offsetHeight + O * 2, a = SW / 2, R = (H - SW) / 2;
    svg.style.cssText = `left:${-(O + hd.clientLeft)}px;top:${-(O + hd.clientTop)}px;width:${W}px;height:${H}px`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const r = hd.getBoundingClientRect(), P = O + 6;          // kartu transparan di belakang outline
    halo.style.cssText = `left:${r.left - P}px;top:${r.top - P}px;width:${r.width + P * 2}px;height:${r.height + P * 2}px`;
    [path, bawah].forEach(x => x.setAttribute("d", `M${W / 2} ${a}H${W - a - R}A${R} ${R} 0 0 1 ${W - a - R} ${H - a}H${a + R}A${R} ${R} 0 0 1 ${a + R} ${a}H${W / 2}`));
  };
  const perbarui = () => {
    const t = hitung();
    if (window.gsap && !diam) gsap.to(st, { v: t, duration: 0.5, ease: "power2.out", overwrite: true, onUpdate: tulis });
    else { st.v = t; tulis(); }
  };
  bentuk(); st.v = hitung(); tulis();
  new ResizeObserver(() => { bentuk(); perbarui(); }).observe(hd);
  let tj = 0;                                               // halo ikut pill lewat event (bukan loop tiap frame)
  const jadwalBentuk = () => { cancelAnimationFrame(tj); tj = requestAnimationFrame(() => { bentuk(); perbarui(); }); };
  addEventListener("resize", jadwalBentuk, { passive: true }); addEventListener("orientationchange", jadwalBentuk); addEventListener("load", jadwalBentuk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(jadwalBentuk);
  new ResizeObserver(perbarui).observe(document.body);      // tinggi halaman berubah (galeri, berita, dll.)
  addEventListener("scroll", perbarui, { passive: true });
})();
sbMuat();
