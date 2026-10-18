const $ = (id) => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

/* Ukuran layar: HP/tablet sentuh dianggap "kecil" (hemat animasi & render) */
const layarKecil = () => matchMedia("(max-width: 820px), (pointer: coarse)").matches;
/* Jalankan fn hanya jika LEBAR berubah. Di HP, bilah alamat dan keyboard hanya mengubah TINGGI (event resize);
   itu dulu memicu bangun-ulang galeri/ticker berulang kali saat scroll atau mengetik = penyebab freeze. */
function saatLebarBerubah(fn, ms) {
  let w = innerWidth, t = 0;
  addEventListener("resize", () => { if (innerWidth === w) return; w = innerWidth; clearTimeout(t); t = setTimeout(fn, ms || 250); });
}

/* Teks dasar */
document.querySelectorAll(".kls").forEach(e => e.textContent = CONFIG.KELAS);
document.querySelectorAll(".ta").forEach(e => e.textContent = CONFIG.TAHUN_AJARAN);
$("sekolah").textContent = CONFIG.NAMA_SEKOLAH;
$("tahun").textContent = new Date().getFullYear();
document.title = `Kelas ${CONFIG.KELAS} — ${CONFIG.NAMA_SEKOLAH}`;
const h1 = $("nama-kelas"); h1.setAttribute("aria-label", "Kelas " + CONFIG.KELAS); h1.textContent = "";
[...CONFIG.KELAS].forEach(c => { const s = el("span", "huruf", c); s.setAttribute("aria-hidden", "true"); h1.append(s); });
const p = $("pernyataan");
p.textContent = p.textContent.replace("Kelas 8E", "Kelas " + CONFIG.KELAS);
p.setAttribute("aria-label", p.textContent);
const kata = p.textContent.split(" ");
p.textContent = "";
kata.forEach((k, i) => { const s = el("span", "kata", k); s.setAttribute("aria-hidden", "true"); p.append(s, i < kata.length - 1 ? " " : ""); });

/* Sinar matahari */
const NS = "http://www.w3.org/2000/svg";
for (let i = 0; i < 16; i++) {
  const r = document.createElementNS(NS, "path");
  r.setAttribute("d", "M-7 -50 L0 -96 L7 -50Z"); r.setAttribute("class", "sinar");
  r.setAttribute("transform", `rotate(${i * 22.5})`); $("sinar").append(r);
}

/* Kartu pelajar */
const inisial = (n) => n.trim().charAt(0).toUpperCase();
function avatar(nama, foto) {
  if (foto) {
    const i = el("img", "avatar"); i.src = foto; i.alt = nama; i.loading = "lazy";
    i.onerror = () => i.replaceWith(el("div", "avatar", inisial(nama))); return i;
  }
  return el("div", "avatar", inisial(nama));
}
function kartu(peran, nama, fotoList, guru) {
  const k = el("article", "kartu" + (guru ? " guru" : ""));
  const av = el("div", "avatar-row");
  const fotos = Array.isArray(fotoList) ? fotoList : (fotoList ? [fotoList] : []);
  if (fotos.length) {
    fotos.forEach((f, i) => av.append(avatar(nama[i] || nama[0], f)));
  } else {
    av.append(avatar(nama[0], null));
  }
  k.append(av, el("div", "peran", peran), el("h3", null, nama.join(" & ")));
  return k;
}
WALI.forEach(w => $("pembina").append(kartu(w.peran, [w.nama], w.foto, true)));
PENGURUS.forEach(x => $("pengurus").append(kartu(x.peran, x.nama, x.foto, false)));

/* Pengumuman dan jadwal */
function tampil(id, ada) { $(id).hidden = !ada; const li = document.querySelector(`[data-bagian="${id}"]`); if (li) li.hidden = !ada; }
tampil("pengumuman", PENGUMUMAN.length > 0);
PENGUMUMAN.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)).forEach(x => {
  const li = el("li"), t = el("time", null, new Date(x.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
  t.dateTime = x.tanggal; li.append(t, el("h3", null, x.judul), el("p", null, x.isi)); $("daftar-pengumuman").append(li);
});
function tabel(id, blok, data) {
  $(blok).hidden = !data.length;
  data.forEach(r => { const tr = el("tr"); tr.append(el("th", null, r.hari), el("td", null, r.isi.join(", "))); $(id).append(tr); });
}
tampil("jadwal", JADWAL_PELAJARAN.length + JADWAL_PIKET.length > 0);
tabel("tabel-pelajaran", "blok-pelajaran", JADWAL_PELAJARAN);
tabel("tabel-piket", "blok-piket", JADWAL_PIKET);

/* Galeri + lightbox */
const lb = $("lightbox");
function loadGaleri() { try { return JSON.parse(localStorage.getItem("kelas8e-galeri") || "[]"); } catch (_) { return []; } }
function bangunGaleri() {
  const jl = $("jalur"), data = GALERI.concat(loadGaleri());
  if (!jl) return;
  jl.innerHTML = ""; jl.classList.remove("jalan"); jl.style.removeProperty("--dur");
  const set = (klon) => data.forEach((g, n) => {
    const b = el("button"); b.type = "button"; b.setAttribute("aria-label", "Perbesar foto: " + g.cap);
    if (klon) { b.setAttribute("aria-hidden", "true"); b.tabIndex = -1; }
    b.style.setProperty("--r", n % 2 ? "2.5deg" : "-2deg");
    const f = el("figure"), i = el("img"); i.src = g.src; i.alt = klon ? "" : g.alt; i.loading = "lazy"; if (g.rasio) i.style.aspectRatio = g.rasio;
    f.append(i, el("figcaption", null, g.cap)); b.append(f);
    b.onclick = () => { $("lb-img").src = g.src; $("lb-img").alt = g.alt; $("lb-cap").textContent = g.cap; $("jalur").classList.add("jeda"); lb.showModal(); };
    jl.append(b);
  });
  set(false);
  if (!data.length) return;
  if (layarKecil()) return;                                  // HP: geser manual (swipe), tanpa klon foto & animasi otomatis yang berat
  const lebarSet = jl.scrollWidth, per = Math.max(1, Math.ceil(innerWidth / lebarSet));
  for (let k = 1; k < per * 2; k++) set(true);              // dua setengah identik -> loop mulus
  jl.style.setProperty("--dur", Math.max(25, lebarSet * per / 55) + "s");
  jl.classList.add("jalan");
}
bangunGaleri();
saatLebarBerubah(bangunGaleri, 300);
if (!GALERI.length) $("jalur").replaceWith(el("p", "kosong", "Foto kegiatan akan ditambahkan di sini."));
$("tutup").onclick = () => lb.close();
lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
lb.addEventListener("close", () => {            // galeri lanjut jalan setelah foto ditutup
  $("jalur").classList.remove("jeda");
  const a = document.activeElement; if (a && a.closest && a.closest("#jalur")) a.blur();
});

/* Kontak */
const box = $("kotak-kontak");
const peta = CONFIG.MAPS_URL || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.NAMA_SEKOLAH);
const amanUrl = (u) => { try { const x = new URL(String(u), location.href); return ["http:", "https:", "mailto:", "tel:"].includes(x.protocol) ? x.href : ""; } catch (_) { return ""; } };
function kotak(judul, teks, label, href) {
  const d = el("div"); d.append(el("h3", null, judul), el("p", null, teks));
  if (href) { const a = el("a", "btn", label); a.href = amanUrl(href) || "#"; a.target = "_blank"; a.rel = "noopener noreferrer"; d.append(a); }
  box.append(d);
}
kotak("Sekolah", CONFIG.NAMA_SEKOLAH + (CONFIG.ALAMAT ? ". " + CONFIG.ALAMAT : ""), "Buka di Google Maps", peta);
if (CONFIG.WA_NOMOR) kotak("WhatsApp", "Kirim pesan langsung ke wali kelas.", "Chat lewat WhatsApp",
  "https://wa.me/" + CONFIG.WA_NOMOR + "?text=" + encodeURIComponent(CONFIG.WA_PESAN));

{
  const d = el("div"), g = el("div", "orang-grid"); d.append(el("h3", null, "Hubungi langsung"), g);
  [["Ustadzah Fida", "+62 813-2856-2169", "6281328562169"], ["Ustadz Imam", "+62 858-6920-8683", "6285869208683"]].forEach(([nama, tampil, wa]) => {
    const r = el("div", "orang"), info = el("div", "orang-info", null);
    info.append(el("strong", null, nama), el("span", null, tampil));
    const aksi = el("div", "aksi-kontak");
    const w = el("a", "btn", "WhatsApp"); w.href = "https://wa.me/" + String(wa).replace(/\D/g, ""); w.target = "_blank"; w.rel = "noopener noreferrer";
    const t = el("a", "btn putih", "Telepon"); t.href = "tel:+" + String(wa).replace(/\D/g, "");
    aksi.append(w, t); r.append(info, aksi); g.append(r);
  });
  box.append(d);
}

/* Biner nama kelas */
$("biner").textContent = CONFIG.KELAS + " dalam biner: " + [...CONFIG.KELAS].map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");

/* Editor kode */
const kode = $("kode");
const ln = (...p) => { const li = el("li"), s = el("span"); p.forEach(([t, c]) => s.append(el("span", c, t))); li.append(s); kode.append(li); };
ln(["const ", "k"], ["belajar = [", ""]);
BELAJAR.forEach(b => ln(["  ", ""], ['"' + b + '"', "s"], [",", ""]));
ln(["];", ""]);

/* Terminal */
const out = $("ter-out"), inp = $("ter-in"), riwayat = []; let ri = 0;
const baris = (t, c) => { out.append(el("div", c, t)); out.scrollTop = out.scrollHeight; };
const buka = (h) => window.gLenis ? gLenis.scrollTo(h, { offset: -70 }) : document.querySelector(h).scrollIntoView();
const PERINTAH = {
  help: () => ["Perintah yang tersedia:", "whoami, wali, pengurus, belajar, blok, html, galeri, kontak, date, clear"],
  whoami: () => [`Kelas ${CONFIG.KELAS}, ${CONFIG.NAMA_SEKOLAH}.`, `Kelas Informatika, tahun ajaran ${CONFIG.TAHUN_AJARAN}.`],
  wali: () => WALI.map(w => `${w.peran}: ${w.nama}`),
  pengurus: () => PENGURUS.map(x => `${x.peran}: ${x.nama.join(" & ")}`),
  belajar: () => BELAJAR.map(b => "- " + b),
  galeri: () => { buka("#galeri"); return ["Membuka galeri..."]; },
  kontak: () => { buka("#kontak"); return ["Membuka kontak..."]; },
  date: () => [new Date().toLocaleString("id-ID")],
  blok: () => { pilih("blok"); buka("#lab"); return ["Membuka editor blok..."]; },
  html: () => { pilih("html"); buka("#lab"); return ["Membuka playground HTML..."]; },
  clear: () => { out.textContent = ""; return []; }
};
function jalankan(raw) {
  riwayat.push(raw); ri = riwayat.length;
  baris("$ " + raw, "cmd");
  const nama = raw.split(/\s+/)[0].toLowerCase(), fn = PERINTAH[nama];
  (nama === "sudo" ? ["Nice try. Akses ditolak, kamu bukan admin kelas."] : fn ? fn() : [`perintah tidak dikenal: ${nama}. Ketik help.`]).forEach(t => baris(t));
}
$("ter-form").addEventListener("submit", (e) => { e.preventDefault(); const v = inp.value.trim(); inp.value = ""; if (v) jalankan(v); });
inp.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" && ri > 0) { inp.value = riwayat[--ri]; e.preventDefault(); }
  if (e.key === "ArrowDown") { inp.value = riwayat[++ri] || ""; ri = Math.min(ri, riwayat.length); e.preventDefault(); }
});
$("ter").addEventListener("click", (e) => { if (!e.target.closest("button")) inp.focus({ preventScroll: true }); });
["help", "whoami", "pengurus", "belajar"].forEach(c => { const b = el("button", null, c); b.type = "button"; b.onclick = () => jalankan(c); $("cepat").append(b); });
baris("Selamat datang di Coding Lab Kelas " + CONFIG.KELAS + ".");
baris("Ketik help, atau scroll ke bawah untuk playground kode.");

/* Latar biner bergerak (canvas) di bagian gelap, berhenti saat tidak terlihat */
const diam = matchMedia("(prefers-reduced-motion: reduce)").matches;
function latarBiner(sec) {
  const c = el("canvas", "biner-bg"), g = c.getContext && c.getContext("2d");
  if (!g) return;
  c.setAttribute("aria-hidden", "true"); sec.prepend(c);
  const U = 22, font = getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace";
  let w, h, dpr, raf = 0;
  const gambar = (t) => {
    g.clearRect(0, 0, w, h);
    g.font = `700 ${U * 0.75}px ${font}`; g.textAlign = "center";
    for (let k = 0; k < w / U; k++) {
      if ((k * 37) % 5 > 1) continue;
      const v = 14 + (k * 13) % 17, len = 7, y = (t * v / 1000 + ((k * 97) % 1000) / 1000 * h) % (h + len * U);
      for (let j = 0; j < len; j++) {
        const yy = y - j * U; if (yy < 0 || yy > h) continue;
        const r = Math.floor(yy / U), ch = (k * 31 + r * 17) % 7 < 3 ? "1" : "0";
        g.fillStyle = j ? `rgba(255,255,255,${0.085 * (1 - j / len)})` : "rgba(255,194,26,.28)";
        g.fillText(ch, k * U + U / 2, yy);
      }
    }
  };
  let lastB = 0;
  const loop = (t) => { raf = requestAnimationFrame(loop); if (t - lastB < 33) return; lastB = t; gambar(t); };
  const atur = () => {
    dpr = 1; w = sec.clientWidth; h = sec.clientHeight;
    c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (diam || !raf) gambar(diam ? 4000 : 0);
  };
  new ResizeObserver(atur).observe(sec); atur();
  if (!diam) new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); } else { cancelAnimationFrame(raf); raf = 0; }
  }).observe(sec);
}
document.querySelectorAll(".hero, .galeri, .kontak").forEach(latarBiner);

/* Playground: Blok + HTML (dengan 20 preset game) */
const BAHASA = {
  html: { berkas: "index.html", kode: '<h1 style="font-family:sans-serif">Halo, Kelas 8E!</h1>\n<button onclick="this.textContent=\'Diklik!\'">Klik aku</button>\n<p id="jam"></p>\n<script>\n  document.getElementById("jam").textContent = new Date().toLocaleTimeString("id-ID");\n<\/script>' }
};
const PRESET = [
  { nama: "Halo & Jam", kode: BAHASA.html.kode },
  { nama: "Penghitung Klik", kode: '<h2>Penghitung</h2><p id="n">0</p><button onclick="document.getElementById(\'n\').textContent = +document.getElementById(\'n\').textContent + 1">Tambah</button>' },
  { nama: "Ubah Warna", kode: '<button onclick="document.body.style.background=\'hsl(\'+Math.random()*360+\',70%,70%)\'">Ganti warna</button>' },
  { nama: "Kuis Sederhana", kode: '<p>Ibu kota Indonesia?</p><button onclick="alert(\'Benar!\')">Jakarta</button><button onclick="alert(\'Coba lagi\')">Bandung</button>' },
  { nama: "Tebak Angka", kode: '<input id="tebak" type="number"><button onclick="const j=Math.floor(Math.random()*10)+1; alert(+document.getElementById(\'tebak\').value===j?\'Benar! \'+j:\'Salah, jawaban \'+j)">Tebak 1-10</button>' },
  { nama: "Dadu", kode: '<button onclick="this.textContent=\'🎲 \'+ (Math.floor(Math.random()*6)+1)">Lempar dadu</button>' },
  { nama: "Timer", kode: '<p id="t">0</p><script>let s=0;setInterval(()=>{document.getElementById(\'t\').textContent=++s},1000)<\/script>' },
  { nama: "Kalkulator Mini", kode: '<input id="a" type="number"> + <input id="b" type="number"><button onclick="alert(+a.value + +b.value)">Hitung</button>' },
  { nama: "Tic Tac Toe Sederhana", kode: '<div id="board" style="display:grid;grid-template-columns:repeat(3,60px);gap:4px"></div><script>let p="X";const b=document.getElementById("board");for(let i=0;i<9;i++){const c=document.createElement("button");c.style.height="60px";c.onclick=()=>{if(!c.textContent){c.textContent=p;p=p==="X"?"O":"X"}};b.append(c)}<\/script>' },
  { nama: "Batu Gunting Kertas", kode: '<button onclick="main(\'batu\')">Batu</button><button onclick="main(\'gunting\')">Gunting</button><button onclick="main(\'kertas\')">Kertas</button><p id="h"></p><script>function main(p){const k=["batu","gunting","kertas"][Math.floor(Math.random()*3)];document.getElementById("h").textContent="Kamu: "+p+" | Komputer: "+k+" | "+(p===k?"Seri":(p==="batu"&&k==="gunting"||p==="gunting"&&k==="kertas"||p==="kertas"&&k==="batu"?"Menang":"Kalah"))}<\/script>' },
  { nama: "Snake Mini", kode: '<canvas id="c" width="200" height="200" style="border:1px solid #000"></canvas><script>const ctx=document.getElementById("c").getContext("2d");let s=[{x:10,y:10}],d={x:1,y:0},f={x:5,y:5};setInterval(()=>{const h={x:s[0].x+d.x,y:s[0].y+d.y};s.unshift(h);if(h.x===f.x&&h.y===f.y)f={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};else s.pop();ctx.fillStyle="#fff";ctx.fillRect(0,0,200,200);ctx.fillStyle="#0E5A3A";s.forEach(p=>ctx.fillRect(p.x*10,p.y*10,9,9));ctx.fillStyle="#FFC21A";ctx.fillRect(f.x*10,f.y*10,9,9)},200);addEventListener("keydown",e=>{if(e.key==="ArrowUp")d={x:0,y:-1};if(e.key==="ArrowDown")d={x:0,y:1};if(e.key==="ArrowLeft")d={x:-1,y:0};if(e.key==="ArrowRight")d={x:1,y:0}})<\/script>' },
  { nama: "Pong", kode: '<canvas id="c" width="300" height="150" style="border:1px solid"></canvas><script>const c=document.getElementById("c"),x=c.getContext("2d");let p1=60,p2=60,bx=150,by=75,vx=2,vy=1;addEventListener("keydown",e=>{if(e.key==="w")p1=Math.max(0,p1-10);if(e.key==="s")p1=Math.min(120,p1+10);if(e.key==="ArrowUp")p2=Math.max(0,p2-10);if(e.key==="ArrowDown")p2=Math.min(120,p2+10)});setInterval(()=>{bx+=vx;by+=vy;if(by<0||by>140)vy=-vy;if(bx<20&&by>p1&&by<p1+30)vx=2;if(bx>270&&by>p2&&by<p2+30)vx=-2;if(bx<0||bx>300){bx=150;by=75}x.fillStyle="#fff";x.fillRect(0,0,300,150);x.fillStyle="#0E5A3A";x.fillRect(10,p1,10,30);x.fillRect(280,p2,10,30);x.fillRect(bx,by,8,8)},16)<\/script>' },
  { nama: "Flappy Sederhana", kode: '<canvas id="c" width="200" height="300" style="border:1px solid"></canvas><script>const ctx=document.getElementById("c").getContext("2d");let y=150,v=0,p=[{x:200,g:100}];addEventListener("click",()=>v=-4);setInterval(()=>{v+=0.2;y+=v;p.forEach(o=>o.x-=2);if(p[0].x<-30)p.shift();if(p[p.length-1].x<120)p.push({x:200,g:50+Math.random()*150});ctx.fillStyle="#87CEEB";ctx.fillRect(0,0,200,300);ctx.fillStyle="#0E5A3A";p.forEach(o=>{ctx.fillRect(o.x,0,30,o.g);ctx.fillRect(o.x,o.g+80,30,300)});ctx.fillStyle="#FFC21A";ctx.fillRect(40,y,20,20)},30)<\/script>' },
  { nama: "Memory Cards", kode: '<div id="m" style="display:grid;grid-template-columns:repeat(4,60px);gap:8px"></div><script>const em=["🍎","🍌","🍇","🍉","🍎","🍌","🍇","🍉"].sort(()=>Math.random()-0.5);let open=[];document.getElementById("m").innerHTML=em.map((e,i)=>`<button data-i="${i}" style="height:60px;font-size:1.5rem">?</button>`).join("");document.getElementById("m").onclick=e=>{const b=e.target.closest("button");if(!b||b.textContent!=="?")return;b.textContent=em[b.dataset.i];open.push(b);if(open.length===2){setTimeout(()=>{if(open[0].textContent!==open[1].textContent)open.forEach(x=>x.textContent="?");open=[];},600)}}<\/script>' },
  { nama: "Reaction Time", kode: '<p id="msg">Tunggu warna hijau lalu klik!</p><div id="box" style="width:200px;height:100px;background:#ccc"></div><script>let t;function mulai(){document.getElementById("box").style.background="#ccc";document.getElementById("msg").textContent="Tunggu...";setTimeout(()=>{document.getElementById("box").style.background="#0E5A3A";t=Date.now();document.getElementById("msg").textContent="Klik sekarang!"},1000+Math.random()*2000)}document.getElementById("box").onclick=()=>{if(document.getElementById("box").style.background==="rgb(14, 90, 58)"){alert("Waktu: "+(Date.now()-t)+" ms");mulai()}};mulai()<\/script>' },
  { nama: "Drawing Pad", kode: '<canvas id="c" width="300" height="200" style="border:1px solid;touch-action:none"></canvas><script>const c=document.getElementById("c"),x=c.getContext("2d");let draw=false;c.onpointerdown=()=>draw=true;c.onpointerup=()=>draw=false;c.onpointermove=e=>{if(!draw)return;const r=c.getBoundingClientRect();x.fillStyle="#0E5A3A";x.fillRect(e.clientX-r.left-2,e.clientY-r.top-2,4,4)}<\/script>' },
  { nama: "Math Game", kode: '<p id="q"></p><input id="j"><button onclick="cek()">Jawab</button><p id="s">Skor: 0</p><script>let sk=0;function baru(){const a=Math.floor(Math.random()*10)+1,b=Math.floor(Math.random()*10)+1;document.getElementById("q").textContent=a+" + "+b+" = ?";document.getElementById("q").dataset.j=a+b}function cek(){if(+document.getElementById("j").value===+document.getElementById("q").dataset.j){sk++;document.getElementById("s").textContent="Skor: "+sk}document.getElementById("j").value="";baru()}baru()<\/script>' },
  { nama: "Word Scramble", kode: '<p id="w"></p><input id="in"><button onclick="cek()">Cek</button><script>const kata=["kelas","sekolah","belajar","informatika"];let k=kata[Math.floor(Math.random()*kata.length)];document.getElementById("w").textContent=k.split("").sort(()=>Math.random()-0.5).join("");function cek(){alert(document.getElementById("in").value.toLowerCase()===k?"Benar!":"Coba lagi")}<\/script>' },
  { nama: "Breakout", kode: '<canvas id="c" width="300" height="200" style="border:1px solid"></canvas><script>const ctx=document.getElementById("c").getContext("2d");let px=130,bx=150,by=180,vx=2,vy=-2,bricks=[];for(let i=0;i<5;i++)for(let j=0;j<8;j++)bricks.push({x:j*36+5,y:i*20+10,w:34,h:16,on:true});addEventListener("mousemove",e=>{const r=document.getElementById("c").getBoundingClientRect();px=Math.max(0,Math.min(260,e.clientX-r.left-20))});setInterval(()=>{bx+=vx;by+=vy;if(bx<0||bx>292)vx=-vx;if(by<0)vy=-vy;if(by>190){bx=150;by=100}if(by>170&&bx>px&&bx<px+40)vy=-2;bricks.forEach(b=>{if(b.on&&bx>b.x&&bx<b.x+b.w&&by>b.y&&by<b.y+b.h){b.on=false;vy=-vy}});ctx.fillStyle="#fff";ctx.fillRect(0,0,300,200);ctx.fillStyle="#0E5A3A";ctx.fillRect(px,185,40,8);ctx.fillStyle="#FFC21A";ctx.fillRect(bx,by,8,8);bricks.forEach(b=>{if(b.on){ctx.fillStyle="#1B7A50";ctx.fillRect(b.x,b.y,b.w,b.h)}})},16)<\/script>' },
  { nama: "Quiz Kelas", kode: '<div id="q"></div><script>const soal=[{t:"Siapa ketua kelas?",o:["Alfon","Kido"],j:0},{t:"Mata pelajaran favorit?",o:["Informatika","Olahraga"],j:0}];let i=0;function tampil(){if(i>=soal.length){document.getElementById("q").innerHTML="<p>Selesai!</p>";return}const s=soal[i];document.getElementById("q").innerHTML=`<p>${s.t}</p>`+s.o.map((o,k)=>`<button onclick="jawab(${k})">${o}</button>`).join(" ")}function jawab(k){if(k===soal[i].j)alert("Benar!");else alert("Coba lagi");i++;tampil()}tampil()<\/script>' }
];
/* Tab baru: kode dijalankan di iframe sandbox (origin terpisah) agar tidak bisa membaca data situs/sesi admin */
const urlTabBaru = (kode) => {
  const esc = String(kode).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const h = '<!doctype html><meta charset="utf-8"><title>Pratinjau</title><style>html,body{margin:0;height:100%}iframe{display:block;border:0;width:100%;height:100%}</style><iframe sandbox="allow-scripts allow-modals" srcdoc="' + esc + '"></iframe>';
  return URL.createObjectURL(new Blob([h], { type: "text/html" }));
};
/* Pratinjau tahan banting: srcdoc -> blob -> tombol tab baru */
const PROBE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>try{parent.postMessage({k8e:"ok"},"*")}catch(e){}<\/script><script>onerror=function(m){try{parent.postMessage({k8e:"err",m:String(m)},"*")}catch(e){}};addEventListener("load",function(){try{parent.postMessage({k8e:"len",n:(document.body?document.body.innerText.length+document.body.children.length:0)},"*")}catch(e){}})<\/script>';
let pvTimer = 0, pvStage = 0, pvKode = "", pvBlob = "";
function pvInfo(teks, tabBaru) {
  let n = $("pv-info");
  if (!n) { n = el("div"); n.id = "pv-info"; n.style.cssText = "padding:.5rem .8rem;font:700 .85rem var(--mono);background:#fff3cd;color:#5c4400;border-top:3px solid var(--ht)"; pf.parentNode.append(n); }
  n.textContent = teks + " "; n.hidden = !teks;
  if (teks && tabBaru) { const b = el("button", "btn putih", "Buka di tab baru"); b.type = "button"; b.style.padding = ".2rem .7rem"; b.onclick = () => { open(urlTabBaru(pvKode), "_blank", "noopener"); }; n.append(b); }
}
function pvBaru() {
  const n = document.createElement("iframe");
  n.id = "pg-frame"; n.title = "Pratinjau HTML";
  n.setAttribute("sandbox", "allow-scripts allow-modals");
  pf.replaceWith(n); pf = n;
}
function pvTampil(kode) {
  pvKode = kode; pvStage = 0; clearTimeout(pvTimer); pvInfo("");
  if (pvBlob) { URL.revokeObjectURL(pvBlob); pvBlob = ""; }
  if ($("panel-teks").hidden) return;   // jangan muat iframe saat tersembunyi (bug iframe kosong)
  pvBaru(); pf.srcdoc = PROBE + kode;
  pvTimer = setTimeout(pvCoba, 1200);
}
function pvCoba() {
  if (pvStage === 0) { pvStage = 1; pvBaru(); pvBlob = URL.createObjectURL(new Blob([PROBE + pvKode], { type: "text/html" })); pf.src = pvBlob; pvTimer = setTimeout(pvCoba, 1200); }
  else if (pvStage === 1) { pvStage = 2; pvInfo("Pratinjau tertahan oleh lingkungan ini.", true); }
}
addEventListener("message", (e) => {
  if (!e.data || !e.data.k8e || !pf || e.source !== pf.contentWindow) return;
  if (e.data.k8e === "ok") { clearTimeout(pvTimer); pvStage = 3; pvInfo(""); }
  else if (e.data.k8e === "err") pvInfo("Error di kode: " + e.data.m);
  else if (e.data.k8e === "len" && e.data.n === 0 && pvKode.trim()) pvInfo("Pratinjau terbuka tapi isinya kosong.", true);
});
const ta = $("pg-kode"), po = $("pg-out"), tombol = $("pg-jalan");
let pf = $("pg-frame");
let bhs = "blok", simpan = {}, sibuk = false, tabAktif = true;
const selesai = () => { sibuk = false; tombol.disabled = false; };
function pilih(b) {
  if (sibuk) return;
  if (bhs !== "blok") simpan[bhs] = ta.value;
  bhs = b;
  document.querySelectorAll("#lab [role=tab]").forEach(t => t.setAttribute("aria-selected", t.dataset.b === b));
  $("panel-blok").hidden = b !== "blok"; $("panel-teks").hidden = b === "blok";
  if (b === "blok") { siapkanBlok(); return; }
  ta.value = simpan[b] ?? BAHASA[b].kode;
  $("pg-nama").textContent = BAHASA[b].berkas;
  po.hidden = true;
  pvTampil(ta.value);
}
function jalan() {
  if (bhs !== "html") return;
  simpan[bhs] = ta.value;
  pvTampil(ta.value);
  localStorage.setItem("kelas8e-html", ta.value);
}
tombol.onclick = jalan;
$("pg-tab").onclick = () => { const w = open(urlTabBaru(PROBE + ta.value), "_blank"); if (!w) alert("Pop-up diblokir. Izinkan pop-up untuk situs ini lalu coba lagi."); };
$("pg-clear").onclick = () => { ta.value = ""; pvTampil(""); localStorage.removeItem("kelas8e-html"); };
document.querySelectorAll("#lab [role=tab]").forEach(t => t.onclick = () => pilih(t.dataset.b));
ta.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); jalan(); }
  else if (e.key === "Escape") { $("saran").style.display = "none"; tabAktif = false; }
  else if (e.key === "Tab" && !e.shiftKey && tabAktif) { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); }
});
ta.addEventListener("blur", () => { tabAktif = true; setTimeout(() => $("saran").style.display = "none", 200); });
ta.addEventListener("input", () => {
  localStorage.setItem("kelas8e-html-draft", ta.value);
  const pos = ta.selectionStart, text = ta.value.slice(0, pos), match = text.match(/<([a-zA-Z]*)$/);
  const saran = $("saran");
  if (match) {
    const tags = ["div","span","p","h1","h2","button","canvas","script","style","input","img","a","ul","li","br","hr"];
    const sug = tags.filter(t => t.startsWith(match[1].toLowerCase()));
    if (sug.length) {
      saran.innerHTML = sug.map(s => `<button type="button" data-s="${s}"><${s}></button>`).join("");
      saran.style.display = "block";
      saran.querySelectorAll("button").forEach(b => b.onclick = () => {
        const insert = b.dataset.s + ">";
        ta.setRangeText(insert, pos - match[1].length, pos, "end");
        saran.style.display = "none";
        ta.focus();
      });
      return;
    }
  }
  saran.style.display = "none";
});
const sel = $("preset-select");
PRESET.forEach((p, i) => { const o = el("option", null, p.nama); o.value = i; sel.append(o); });
sel.onchange = () => { if (sel.value !== "") { ta.value = PRESET[sel.value].kode; pvTampil(ta.value); localStorage.setItem("kelas8e-html", ta.value); } };
if (localStorage.getItem("kelas8e-html")) { ta.value = localStorage.getItem("kelas8e-html"); simpan.html = ta.value; }
$("asisten-toggle").onclick = () => {
  alert("Tips asisten:\n• Ketik < lalu huruf untuk saran tag\n• Ctrl+Enter untuk jalankan\n• Pilih preset game di atas\n• Kode tersimpan otomatis\n• Coba contoh: button, canvas, script");
};
ta.value = BAHASA.html.kode;


/* ===== Editor blok (Blockly, gaya Scratch) ===== */
const BLOCKLY = "/vendor/blockly/";
const SIMPAN_BLOK = "kelas8e-blok";
const nb = (v) => ({ shadow: { type: "math_number", fields: { NUM: v } } });
const CONTOH = { blocks: { languageVersion: 0, blocks: [{ type: "controls_repeat_ext", x: 24, y: 24,
  inputs: { TIMES: nb(5), DO: { block: { type: "maju", inputs: { N: nb(120) },
    next: { block: { type: "putar_kanan", inputs: { N: nb(144) } } } } } } }] } };
const SUMBER_BLOK = `
const C=[];
const A=(...x)=>{C.push(x);if(C.length>20000)throw new Error("Terlalu banyak perintah gambar (maksimal 20000).")};
const n=(v)=>Number(v)||0;
const maju=(v)=>A("f",n(v)),mundur=(v)=>A("b",n(v)),kanan=(v)=>A("r",n(v)),kiri=(v)=>A("l",n(v));
const pergiKe=(x,y)=>A("go",n(x),n(y)),keTengah=()=>A("home"),pena=(b)=>A("pen",!!b),warna=(c)=>A("c",String(c)),tebal=(v)=>A("w",Math.max(1,n(v))),bersih=()=>A("clr");
const f=(v)=>{if(typeof v==="string")return v;try{const j=JSON.stringify(v);return j===undefined?String(v):j}catch(e){return String(v)}};
const cetak=(...a)=>postMessage({t:"out",v:a.map(f).join(" ")});
onmessage=(e)=>{try{new Function(e.data)()}catch(x){postMessage({t:"err",v:String(x)})}postMessage({t:"cmds",v:C})};`;

/* Definisi blok + generator kode (dipisah supaya bisa diuji tanpa tampilan) */
function daftarBlok() {
  const B = Blockly, JS = B.JavaScript, PY = B.Python, biru = "#4C97FF", hijau = "#0FBD8C";
  const lanjut = { previousStatement: null, nextStatement: null };
  const masuk = (name) => ({ type: "input_value", name, check: "Number" });
  B.common.defineBlocksWithJsonArray([
    ...[["maju", "maju %1 langkah"], ["mundur", "mundur %1 langkah"], ["putar_kanan", "putar kanan %1 derajat"], ["putar_kiri", "putar kiri %1 derajat"]]
      .map(([type, message0]) => ({ type, message0, args0: [masuk("N")], ...lanjut, colour: biru })),
    { type: "pergi_ke", message0: "pergi ke x %1 y %2", args0: [masuk("X"), masuk("Y")], ...lanjut, colour: biru },
    { type: "ke_tengah", message0: "kembali ke tengah", ...lanjut, colour: biru },
    { type: "pena", message0: "%1 pena", args0: [{ type: "field_dropdown", name: "S", options: [["turunkan", "1"], ["angkat", "0"]] }], ...lanjut, colour: hijau },
    { type: "warna_pena", message0: "warna pena %1", args0: [{ type: "field_colour", name: "C", colour: "#e63946" }], ...lanjut, colour: hijau },
    { type: "tebal_pena", message0: "tebal pena %1", args0: [masuk("N")], ...lanjut, colour: hijau },
    { type: "bersih", message0: "bersihkan layar", ...lanjut, colour: hijau }
  ]);
  const v = (g, b, nama, d) => g.valueToCode(b, nama, g.ORDER_NONE) || d;
  const def = (t, js, py) => { JS.forBlock[t] = (b, g) => js(b, g) + ";\n"; PY.forBlock[t] = (b, g) => py(b, g) + "\n"; };
  Object.entries({ maju: "maju", mundur: "mundur", putar_kanan: "kanan", putar_kiri: "kiri", tebal_pena: "tebal" })
    .forEach(([t, f]) => { const e = (b, g) => `${f}(${v(g, b, "N", "0")})`; def(t, e, e); });
  def("pergi_ke", (b, g) => `pergiKe(${v(g, b, "X", "0")}, ${v(g, b, "Y", "0")})`, (b, g) => `pergi_ke(${v(g, b, "X", "0")}, ${v(g, b, "Y", "0")})`);
  def("ke_tengah", () => "keTengah()", () => "ke_tengah()");
  def("pena", (b) => `pena(${b.getFieldValue("S") === "1"})`, (b) => `pena(${b.getFieldValue("S") === "1" ? "True" : "False"})`);
  def("warna_pena", (b) => `warna("${b.getFieldValue("C")}")`, (b) => `warna("${b.getFieldValue("C")}")`);
  def("bersih", () => "bersih()", () => "bersih()");
  JS.forBlock.text_print = (b, g) => `cetak(${v(g, b, "TEXT", "''")});\n`;
  JS.addReservedWords("maju,mundur,kanan,kiri,pergiKe,keTengah,pena,warna,tebal,bersih,cetak");
  PY.addReservedWords("maju,mundur,kanan,kiri,pergi_ke,ke_tengah,pena,warna,tebal,bersih");

  const t = (x) => ({ shadow: { type: "text", fields: { TEXT: x } } });
  const k = (type, inputs) => ({ kind: "block", type, ...(inputs ? { inputs } : {}) });
  return { kind: "categoryToolbox", contents: [
    { kind: "category", name: "Gerak", colour: biru, contents: [k("maju", { N: nb(50) }), k("mundur", { N: nb(50) }), k("putar_kanan", { N: nb(90) }), k("putar_kiri", { N: nb(90) }), k("pergi_ke", { X: nb(0), Y: nb(0) }), k("ke_tengah")] },
    { kind: "category", name: "Pena", colour: hijau, contents: [k("pena"), k("warna_pena"), k("tebal_pena", { N: nb(3) }), k("bersih")] },
    { kind: "category", name: "Kontrol", colour: "#FFAB19", contents: [k("controls_repeat_ext", { TIMES: nb(10) }), k("controls_whileUntil"), k("controls_for", { FROM: nb(1), TO: nb(10), BY: nb(1) }), k("controls_if"), k("controls_flow_statements")] },
    { kind: "category", name: "Logika", colour: "#5CB1D6", contents: [k("logic_compare"), k("logic_operation"), k("logic_negate"), k("logic_boolean")] },
    { kind: "category", name: "Angka", colour: "#59C059", contents: [k("math_number"), k("math_arithmetic", { A: nb(1), B: nb(1) }), k("math_modulo", { DIVIDEND: nb(10), DIVISOR: nb(3) }), k("math_random_int", { FROM: nb(1), TO: nb(100) }), k("math_round", { NUM: nb(3.7) })] },
    { kind: "category", name: "Teks", colour: "#9966FF", contents: [k("text_print", { TEXT: t("Halo!") }), k("text"), k("text_join"), k("text_length", { VALUE: t("abc") })] },
    { kind: "category", name: "Daftar", colour: "#FF661A", contents: [k("lists_create_with"), k("lists_length"), k("lists_getIndex"), k("lists_setIndex")] },
    { kind: "sep" },
    { kind: "category", name: "Variabel", colour: "#FF8C1A", custom: "VARIABLE" },
    { kind: "category", name: "Fungsi", colour: "#FF6680", custom: "PROCEDURE" }
  ] };
}

let ws = null, memuat = null, bahasaKode = "js", bw = null, btimer = 0, raf2 = 0, cmds = [], ci = 0, sisa = null;
const muatSkrip = (u) => new Promise((ok, gagal) => {
  const e = document.createElement("script");
  e.src = u;
  e.onload = () => ok();
  e.onerror = () => gagal(new Error("Gagal memuat: " + u));
  document.head.append(e);
});
function siapkanBlok() {
  if (ws) { Blockly.svgResize(ws); return Promise.resolve(); }
  if (!memuat) memuat = (async () => {
    try {
      await muatSkrip(BLOCKLY + "blockly_compressed.js");
      await Promise.all(["blocks_compressed.js", "javascript_compressed.js", "python_compressed.js"].map(f => muatSkrip(BLOCKLY + f)));
      await muatSkrip(BLOCKLY + "msg/id.js");
      buatEditor();
    } catch (err) {
      memuat = null;
      const m = $("bk-muat");
      if (m) m.textContent = "Editor blok gagal dimuat: " + err.message + ". Periksa koneksi atau refresh halaman.";
      console.error(err);
    }
  })();
  return memuat;
}
function kodeBlok() {
  const g = bahasaKode === "js" ? Blockly.JavaScript : Blockly.Python;
  return g.workspaceToCode(ws) || (bahasaKode === "js" ? "// " : "# ") + "Seret blok ke area kerja.";
}
function buatEditor() {
  const B = Blockly, toolbox = daftarBlok(), K = (o) => ({ colourPrimary: o });
  const tema = B.Theme.defineTheme("kelas8e", { name: "kelas8e", base: B.Themes.Classic,
    componentStyles: { workspaceBackgroundColour: "#F4F9FC", toolboxBackgroundColour: "#0E4A86", toolboxForegroundColour: "#FFFFFF", flyoutBackgroundColour: "#E7F3FB", flyoutForegroundColour: "#06182C", flyoutOpacity: 1, scrollbarColour: "#0E4A86", insertionMarkerColour: "#06182C" },
    blockStyles: { loop_blocks: K("#FFAB19"), logic_blocks: K("#5CB1D6"), math_blocks: K("#59C059"), text_blocks: K("#9966FF"), list_blocks: K("#FF661A"), variable_blocks: K("#FF8C1A"), variable_dynamic_blocks: K("#FF8C1A"), procedure_blocks: K("#FF6680") } });
  $("bk-muat").remove();
  ws = B.inject($("bk-ws"), { toolbox, theme: tema, renderer: "zelos", media: BLOCKLY + "media/", sounds: false, trashcan: true,
    grid: { spacing: 24, length: 3, colour: "#CFE0D4", snap: true },
    zoom: { controls: true, wheel: false, startScale: 0.9, minScale: 0.5, maxScale: 1.6 },
    move: { scrollbars: true, drag: true, wheel: false } });
  let awal = null; try { awal = JSON.parse(localStorage.getItem(SIMPAN_BLOK)); } catch (e) {}
  try { B.serialization.workspaces.load(awal || CONTOH, ws); } catch (e) { B.serialization.workspaces.load(CONTOH, ws); }
  const segarkan = () => { $("bk-kode").textContent = kodeBlok(); };
  let tm; ws.addChangeListener((e) => {
    if (e.isUiEvent) return;
    clearTimeout(tm); tm = setTimeout(() => { segarkan(); try { localStorage.setItem(SIMPAN_BLOK, JSON.stringify(B.serialization.workspaces.save(ws))); } catch (x) {} }, 250);
  });
  segarkan();
  $("bk-jalan").onclick = jalanBlok;
  $("bk-stop").onclick = () => { hentikanBlok(); cetakBlok("Dihentikan.", "info"); };
  $("bk-contoh").onclick = () => { if (ws.getAllBlocks(false).length && !confirm("Ganti isi editor dengan contoh?")) return; B.serialization.workspaces.load(CONTOH, ws); resetKura(); };
  $("bk-hapus").onclick = () => { if (ws.getAllBlocks(false).length && !confirm("Hapus semua blok?")) return; ws.clear(); resetKura(); };
  document.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
    bahasaKode = b.dataset.k;
    document.querySelectorAll("[data-k]").forEach(x => x.setAttribute("aria-pressed", x === b)); segarkan();
  });
  $("bk-salin").onclick = async () => {
    try { await navigator.clipboard.writeText($("bk-kode").textContent); $("bk-salin").textContent = "Tersalin"; } catch (e) { $("bk-salin").textContent = "Gagal"; }
    setTimeout(() => { $("bk-salin").textContent = "Salin"; }, 1400);
  };
}

/* Panggung kura-kura */
const SW = 480, SH = 360, gj = $("bk-jejak").getContext("2d"), gk = $("bk-kura").getContext("2d");
let kura = {};
function resetKura() {
  kura = { x: 0, y: 0, a: 0, tulis: true, warna: "#0E5A3A", tebal: 2 };
  gj.clearRect(0, 0, SW, SH); gambarKura();
}
function gambarKura() {
  gk.clearRect(0, 0, SW, SH); gk.save(); gk.translate(SW / 2 + kura.x, SH / 2 - kura.y); gk.rotate(kura.a * Math.PI / 180);
  gk.fillStyle = "#E0A31C"; gk.strokeStyle = "#06182C"; gk.lineWidth = 2; gk.beginPath();
  gk.moveTo(0, -13); gk.lineTo(10, 11); gk.lineTo(0, 6); gk.lineTo(-10, 11); gk.closePath(); gk.fill(); gk.stroke(); gk.restore();
}
function geser(dx, dy) {
  const x2 = kura.x + dx, y2 = kura.y + dy;
  if (kura.tulis) { gj.strokeStyle = kura.warna; gj.lineWidth = kura.tebal; gj.lineCap = "round"; gj.beginPath(); gj.moveTo(SW / 2 + kura.x, SH / 2 - kura.y); gj.lineTo(SW / 2 + x2, SH / 2 - y2); gj.stroke(); }
  kura.x = x2; kura.y = y2;
}
function cetakBlok(t, c) { const h = $("bk-hasil"); h.append(el("span", c, t + "\n")); h.scrollTop = h.scrollHeight; }
function hentikanBlok() {
  cancelAnimationFrame(raf2); raf2 = 0; clearTimeout(btimer);
  if (bw) { bw.terminate(); bw = null; }
  $("bk-jalan").disabled = false;
}
function frame() {
  let b = diam ? 1e9 : +$("bk-kec").value * 6;
  while (b > 0 && ci < cmds.length) {
    const c = cmds[ci], t = c[0];
    if (t === "f" || t === "b" || t === "r" || t === "l") {
      const jarak = t === "f" || t === "b", tanda = t === "b" || t === "l" ? -1 : 1;
      if (sisa === null) sisa = c[1] * tanda;
      const s = Math.sign(sisa) * Math.min(Math.abs(sisa), jarak ? b : b * 2);
      if (jarak) geser(Math.sin(kura.a * Math.PI / 180) * s, Math.cos(kura.a * Math.PI / 180) * s); else kura.a += s;
      sisa -= s; b -= jarak ? Math.abs(s) : Math.abs(s) / 2;
      if (sisa === 0) { sisa = null; ci++; }
    } else {
      if (t === "pen") kura.tulis = c[1]; else if (t === "c") kura.warna = c[1]; else if (t === "w") kura.tebal = c[1];
      else if (t === "go") geser(c[1] - kura.x, c[2] - kura.y); else if (t === "home") { kura.tulis = kura.tulis; geser(-kura.x, -kura.y); }
      else if (t === "clr") gj.clearRect(0, 0, SW, SH);
      ci++; b -= 0.5;
    }
  }
  gambarKura();
  if (ci < cmds.length) raf2 = requestAnimationFrame(frame); else { raf2 = 0; $("bk-jalan").disabled = false; }
}
const buatWorker = (src) => new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));

function jalanBlok() {
  if (!ws) { cetakBlok("Editor blok belum siap. Tunggu sebentar lalu coba lagi.", "err"); return; }
  hentikanBlok(); resetKura(); $("bk-hasil").textContent = "";
  const kode = Blockly.JavaScript.workspaceToCode(ws);
  if (!kode.trim()) { cetakBlok("Tidak ada blok untuk dijalankan.", "info"); return; }
  $("bk-jalan").disabled = true;
  bw = buatWorker(SUMBER_BLOK);
  btimer = setTimeout(() => { hentikanBlok(); cetakBlok("Dihentikan: program berjalan lebih dari 6 detik.", "err"); }, 6000);
  bw.onmessage = (e) => {
    const m = e.data;
    if (m.t === "out" || m.t === "err") cetakBlok(m.v, m.t);
    else if (m.t === "cmds") { clearTimeout(btimer); bw.terminate(); bw = null; cmds = m.v; ci = 0; sisa = null; raf2 = requestAnimationFrame(frame); }
  };
  bw.onerror = (err) => { hentikanBlok(); cetakBlok("Error di worker: " + (err.message || err), "err"); };
  bw.postMessage(kode);
}
resetKura();
new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); if (bhs === "blok") siapkanBlok(); } }, { rootMargin: "800px" }).observe($("lab"));

/* ===== Quick News + Owner ===== */
/* ===== Supabase (opsional) =====
   Isi dua nilai ini dari Supabase > Project Settings > API. Kosong = mode lokal (localStorage). */
const SUPABASE_URL = "https://radautxisbayvoeuiiif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhZGF1dHhpc2JheXZvZXVpaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMzM2MzIsImV4cCI6MjEwNzYwOTYzMn0.ruUkf_NbvLM0COTQwhKGlnkinBCGcBEbytVY-xesWuI";
const SB = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
function sbInfo(t) { const n = $("bk-status"); if (n) n.textContent = t; console.warn(t); }
async function sbSimpan(key, value) {
  if (!SB || !window.sbSesi) return null;
  const { error } = await SB.from("site_data").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) sbInfo("Gagal sinkron ke Supabase: " + error.message);
  return error;
}
async function simpanFoto(dataUrl, folder) {
  if (!SB || !window.sbSesi || !dataUrl.startsWith("data:")) return dataUrl;
  const blob = await (await fetch(dataUrl)).blob();
  const path = folder + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + ".jpg";
  const { error } = await SB.storage.from("media").upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error("Upload foto gagal: " + error.message);
  return SB.storage.from("media").getPublicUrl(path).data.publicUrl;
}
async function sbMuat() {
  if (!SB) return;
  try {
    const { data: sesi } = await SB.auth.getSession(); window.sbSesi = sesi.session;
    SB.auth.onAuthStateChange((_e, ss) => { window.sbSesi = ss; });
    const { data, error } = await SB.from("site_data").select("key,value");
    if (!error && data) {
      let beda = false;
      data.forEach(r => {
        const k = r.key === "news" ? NEWS_KEY : r.key === "galeri" ? "kelas8e-galeri" : r.key === "wallOfFame" ? WALL_KEY : null, baru = JSON.stringify(r.value);
        if (k && localStorage.getItem(k) !== baru) { localStorage.setItem(k, baru); beda = true; }
      });
      if (beda) { renderTicker(); bangunGaleri(); if (typeof renderWall === "function") renderWall(); if (typeof window.renderGaleriJikaAktif === "function") window.renderGaleriJikaAktif(); }
    }
  } catch (e) { console.warn("Supabase tidak bisa dihubungi:", e); }
  window.sbSiap = true;
  if (location.hash === "#owner") initOwner();
}
function sbMasuk() {
  let d = $("login-dlg");
  if (!d) {
    d = el("dialog"); d.id = "login-dlg";
    d.innerHTML = '<form id="login-form"><h3>Masuk Admin</h3><input id="lg-email" type="email" placeholder="Email admin" required autocomplete="username"><input id="lg-pass" type="password" placeholder="Password" required autocomplete="current-password"><p id="lg-info" role="status"></p><div class="aksi-kontak"><button class="btn" type="submit">Masuk</button><button class="btn putih" type="button" id="lg-batal">Batal</button></div></form>';
    document.body.append(d);
    $("lg-batal").onclick = () => { d.close(); location.hash = ""; };
    d.addEventListener("cancel", () => { location.hash = ""; });
    $("login-form").onsubmit = async (e) => {
      e.preventDefault(); $("lg-info").textContent = "Masuk...";
      const { data, error } = await SB.auth.signInWithPassword({ email: $("lg-email").value.trim(), password: $("lg-pass").value });
      if (error) { $("lg-info").textContent = "Gagal: " + error.message; return; }
      window.sbSesi = data.session; $("lg-pass").value = ""; d.close(); initOwner();
    };
  }
  if (!d.open) d.showModal();
  setTimeout(() => $("lg-email").focus(), 60);
}

/* ===== Cadangan JSON ===== */
const str = (v, m = 600) => typeof v === "string" ? v.slice(0, m) : "";
const urlOk = (v) => typeof v === "string" && (/^https?:\/\//.test(v) || /^data:image\/(jpeg|png|webp|gif);base64,/.test(v));
function bersihBerita(a) {
  if (!Array.isArray(a)) throw new Error("Bagian 'news' di file tidak valid.");
  return a.filter(x => x && typeof x === "object" && str(x.judul).trim()).map(x => ({ tgl: str(x.tgl, 40), judul: str(x.judul, 200), img: urlOk(x.img) ? x.img : "", isi: str(x.isi, 5000) }));
}
function bersihGaleri(a) {
  if (!Array.isArray(a)) throw new Error("Bagian 'galeri' di file tidak valid.");
  return a.filter(x => x && typeof x === "object" && urlOk(x.src) && str(x.cap).trim()).map((x, n) => {
    const cap = str(x.cap, 80);
    return { id: str(x.id, 20) || Date.now().toString(36) + n, src: x.src, cap, alt: str(x.alt, 140) || cap, rasio: ["1/1", "3/4"].includes(x.rasio) ? x.rasio : "" };
  });
}
async function naikkan(arr, field, folder) {
  if (!SB || !window.sbSesi) return arr;
  const hasil = [];
  for (const x of arr) hasil.push(x[field] && x[field].startsWith("data:") ? { ...x, [field]: await simpanFoto(x[field], folder) } : x);
  return hasil;
}
function initBackup() {
  const st = $("bk-status"); st.textContent = "";
  $("bk-mode-info").textContent = SB ? "Mode: Supabase aktif. Perubahan tersimpan online untuk semua pengunjung." : "Mode: lokal. Data hanya tersimpan di browser ini. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di kode untuk menyimpan online.";
  $("bk-sb").hidden = !SB;
  $("bk-unduh").onclick = () => {
    const isi = JSON.stringify({ versi: 1, dibuat: new Date().toISOString(), news: loadNews(), galeri: loadGaleri(), wallOfFame: loadWall() }, null, 2);
    const u = URL.createObjectURL(new Blob([isi], { type: "application/json" })), a = el("a");
    a.href = u; a.download = "cadangan-kelas8e-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500);
    st.textContent = "Cadangan diunduh ✓";
  };
  $("bk-file").onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    try {
      if (f.size > 25e6) throw new Error("File terlalu besar (maks 25 MB).");
      const d = JSON.parse(await f.text());
      if (!d || typeof d !== "object") throw new Error("Isi file tidak valid.");
      let n = d.news !== undefined ? bersihBerita(d.news) : null, g = d.galeri !== undefined ? bersihGaleri(d.galeri) : null, w = d.wallOfFame !== undefined ? bersihWall(d.wallOfFame) : null;
      if (n === null && g === null && w === null) throw new Error("File tidak berisi data 'news', 'galeri', atau 'wallOfFame'.");
      const gabung = $("bk-mode").value === "gabung";
      const bagian = [n && n.length + " berita", g && g.length + " foto galeri", w && w.length + " pencapaian"].filter(Boolean).join(" dan ");
      if (!confirm("Pulihkan " + bagian + (gabung ? " (digabung dengan data sekarang)?" : "? Data yang ada di file akan DIGANTI."))) return;
      st.textContent = "Memulihkan...";
      if (n) {
        if (gabung) { const lama = loadNews(), ada = new Set(lama.map(x => x.tgl + x.judul)); n = lama.concat(n.filter(x => !ada.has(x.tgl + x.judul))); }
        saveNews(await naikkan(n, "img", "berita"));
      }
      if (g) {
        if (gabung) { const lama = loadGaleri(), ada = new Set(lama.map(x => x.src)); g = lama.concat(g.filter(x => !ada.has(x.src))); }
        saveGaleri(await naikkan(g, "src", "galeri"));
      }
      if (w) {
        if (gabung) { const lama = loadWall(), ada = new Set(lama.map(x => x.id)); w = lama.concat(w.filter(x => !ada.has(x.id))); }
        saveWall(await naikkan(w, "img", "wall"));
      }
      renderOwner(); renderTicker(); renderGalOwner(); if (typeof renderWallOwner === "function") renderWallOwner();
      st.textContent = "Pemulihan berhasil ✓ Galeri akan menyesuaikan setelah kembali ke website.";
    } catch (err) { st.textContent = err instanceof SyntaxError ? "File bukan JSON yang valid." : err.message.includes("quota") || err.name === "QuotaExceededError" ? "Penyimpanan browser penuh." : err.message; }
  };
  $("bk-sinkron").onclick = async () => {
    if (!SB || !window.sbSesi) return;
    try {
      st.textContent = "Mengirim ke Supabase...";
      const n = await naikkan(loadNews(), "img", "berita"), g = await naikkan(loadGaleri(), "src", "galeri"), w = await naikkan(loadWall(), "img", "wall");
      saveNews(n); saveGaleri(g); saveWall(w);
      const e1 = await sbSimpan("news", n), e2 = await sbSimpan("galeri", g), e3 = await sbSimpan("wallOfFame", w);
      if (!e1 && !e2 && !e3) st.textContent = "Data browser ini sudah tersimpan di Supabase ✓";
    } catch (err) { st.textContent = err.message; }
  };
  $("bk-keluar").onclick = async () => { await SB.auth.signOut(); window.sbSesi = null; location.hash = ""; };
}

const NEWS_KEY = "kelas8e-news";
const DEFAULT_NEWS = [
  { judul: "Selamat datang di Kelas 8E!", img: "", isi: "Kebersamaan dan semangat belajar." },
  { judul: "Coding Lab sudah dibuka", img: "", isi: "Coba terminal dan playground blok." },
  { judul: "Foto bersama kelas", img: document.querySelector(".polaroid img")?.src || "foto1.jpeg", isi: "Momen kebersamaan 8E." },
  { judul: "Kegiatan keagamaan", img: "", isi: "Pembiasaan akhlak mulia." }
];

function loadNews() {
  try {
    const s = localStorage.getItem(NEWS_KEY);
    return s ? JSON.parse(s) : DEFAULT_NEWS;
  } catch { return DEFAULT_NEWS; }
}
function saveNews(arr) { localStorage.setItem(NEWS_KEY, JSON.stringify(arr)); sbSimpan("news", arr); }

function renderTicker() {
  const track = $("news-track");
  if (!track) return;
  const items = loadNews();
  track.innerHTML = "";
  track.style.animation = "none";
  const makeSet = () => items.forEach((n, ni) => {
    const d = el("a", "news-item");
    d.href = "#halaman-berita"; d.dataset.idx = ni; d.title = "Buka di halaman berita";
    const thumb = el("div", "thumb");
    if (n.img) {
      const i = el("img");
      i.src = n.img; i.alt = n.judul; i.loading = "lazy";
      i.onerror = () => { i.remove(); thumb.textContent = "Foto"; };
      thumb.append(i);
    } else thumb.textContent = "Foto";
    d.append(thumb);
    const info = el("div", "info");
    info.append(el("strong", null, n.judul), el("span", null, n.isi || ""));
    d.append(info);
    track.append(d);
  });
  if (!items.length) return;
  makeSet();
  const setW = track.scrollWidth || 1;
  const per = Math.max(1, Math.ceil(window.innerWidth / setW) + 1);
  track.innerHTML = "";
  for (let k = 0; k < per * 2; k++) makeSet();
  track.style.setProperty("--dur", Math.max(15, (setW * per) / 70) + "s");
  track.style.animation = "";
}
saatLebarBerubah(renderTicker, 250);

function renderOwner() {
  const list = $("owner-list");
  if (!list) return;
  list.innerHTML = "";
  loadNews().forEach((n, idx) => {
    const d = el("div", "owner-item");
    d.append(el("div", null, n.judul));
    const b = el("button", "btn putih", "Hapus");
    b.onclick = () => {
      const arr = loadNews(); arr.splice(idx, 1); saveNews(arr); renderOwner(); renderTicker();
    };
    d.append(b);
    list.append(d);
  });
}

function saveGaleri(a) { localStorage.setItem("kelas8e-galeri", JSON.stringify(a)); window.galeriBerubah = true; sbSimpan("galeri", a); bangunGaleri(); if (typeof window.renderGaleriJikaAktif === "function") window.renderGaleriJikaAktif(); }
function kecilkanFoto(file, maks = 1000) {
  return new Promise((ok, gagal) => {
    const fr = new FileReader();
    fr.onerror = () => gagal(new Error("Gagal membaca file."));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => gagal(new Error("File bukan gambar yang valid."));
      im.onload = () => {
        const k = Math.min(1, maks / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", 0.8));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function renderGalOwner() {
  const list = $("gal-list"); list.innerHTML = "";
  const arr = loadGaleri();
  if (!arr.length) list.append(el("p", null, "Belum ada foto tambahan."));
  const pindah = (i, s) => { const j = i + s; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; saveGaleri(arr); renderGalOwner(); };
  arr.forEach((g, i) => {
    const d = el("div", "owner-item"), th = el("img"), t = el("div", null, g.cap), aksi = el("div");
    th.src = g.src; th.alt = ""; th.style.cssText = "width:4.5rem;height:3.4rem;object-fit:cover;border:2px solid var(--ht);border-radius:.4rem;flex:none";
    t.style.flex = "1"; aksi.style.cssText = "display:flex;gap:.4rem;flex-wrap:wrap";
    const tombol = (label, fn) => { const b = el("button", "btn putih", label); b.type = "button"; b.onclick = fn; aksi.append(b); };
    tombol("↑", () => pindah(i, -1)); tombol("↓", () => pindah(i, 1));
    tombol("Edit teks", () => { const v = prompt("Tulisan foto:", g.cap); if (v !== null && v.trim()) { arr[i].cap = v.trim(); saveGaleri(arr); renderGalOwner(); } });
    tombol("Hapus", () => { if (confirm("Hapus foto ini dari galeri?")) { arr.splice(i, 1); saveGaleri(arr); renderGalOwner(); } });
    d.append(th, t, aksi); list.append(d);
  });
}
function initGaleriOwner() {
  renderGalOwner();
  $("galeri-form").onsubmit = async (e) => {
    e.preventDefault();
    const st = $("gal-status"), f = $("gal-file").files[0];
    if (!f) return;
    st.textContent = "Memproses foto...";
    try {
      const src = await simpanFoto(await kecilkanFoto(f), "galeri"), arr = loadGaleri(), cap = $("gal-cap").value.trim();
      arr.push({ id: Date.now().toString(36), src, cap, alt: $("gal-alt").value.trim() || cap, rasio: $("gal-rasio").value });
      try { saveGaleri(arr); } catch (_) { st.textContent = "Penyimpanan browser penuh. Hapus foto lama dulu."; return; }
      $("galeri-form").reset(); st.textContent = "Foto ditambahkan ✓ Akan muncul di Galeri setelah kamu kembali ke website."; renderGalOwner();
    } catch (err) { st.textContent = err.message; }
  };
}

function initOwner() {
  const isOwner = location.pathname.endsWith("/owner") || location.hash === "#owner" || location.search.includes("owner");
  const page = $("owner-page");
  if (!page) return;
  if (isOwner) {
    if (SB) {
      if (!window.sbSiap || !window.sbSesi) { if (window.sbSiap) sbMasuk(); return; }
    } else {
      location.hash = ""; alert("Panel admin hanya tersedia saat Supabase terhubung."); return;
    }
    if (page.classList.contains("aktif")) return;
    page.classList.add("aktif"); page.scrollTop = 0;
    document.body.style.overflow = "hidden";
    if (!page._spy) {
      const tabs = [...page.querySelectorAll("[data-ke]")];
      page._spy = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) tabs.forEach(t => t.setAttribute("aria-current", String(t.dataset.ke === en.target.id))); }), { root: page, rootMargin: "-15% 0px -75% 0px" });
      tabs.forEach(t => { const h = document.getElementById(t.dataset.ke); if (h) page._spy.observe(h); });
    }
    renderOwner(); initGaleriOwner(); initWallOwner(); initFeedback(); initBackup();
    $("owner-form").onsubmit = async (e) => {
      e.preventDefault();
      const judul = $("news-judul").value.trim(), st = $("news-status");
      if (!judul) return;
      try {
        st.textContent = "Menyimpan...";
        const f = $("news-img").files[0], img = f ? await simpanFoto(await kecilkanFoto(f, 700), "berita") : "";
        const arr = loadNews();
        arr.unshift({ tgl: new Date().toISOString(), judul, img, isi: $("news-isi").value.trim() });
        try { saveNews(arr); } catch (_) { st.textContent = "Penyimpanan browser penuh. Hapus berita atau foto lama dulu."; return; }
        $("owner-form").reset(); st.textContent = "News ditambahkan ✓";
        renderOwner(); renderTicker();
      } catch (err) { st.textContent = err.message; }
    };
  } else if (page.classList.contains("aktif")) {
    page.classList.remove("aktif");
    setTimeout(() => { if (!page.classList.contains("aktif")) document.body.style.overflow = ""; }, 700);
  }
}

renderTicker();
initOwner();
window.addEventListener("hashchange", initOwner);

// tombol admin: panel membuka dari titik klik
const ownerLink = document.getElementById("owner-link");
if (ownerLink) {
  ownerLink.addEventListener("click", (e) => {
    e.preventDefault();
    const r = ownerLink.getBoundingClientRect(), pg = $("owner-page");
    pg.style.setProperty("--ox", (e.clientX || r.left + r.width / 2) + "px");
    pg.style.setProperty("--oy", (e.clientY || r.top + r.height / 2) + "px");
    if (location.hash === "#owner") initOwner(); else location.hash = "owner";
  });
}

// kembali dari admin + loncat antar bagian
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-kembali]");
  if (b) {
    e.preventDefault(); location.hash = ""; initOwner();
    if (window.galeriBerubah) setTimeout(() => location.reload(), 750);
    return;
  }
  const t = e.target.closest && e.target.closest("[data-ke]");
  const h = t && document.getElementById(t.dataset.ke);
  if (h) h.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
});
document.addEventListener("keydown", (e) => {
  const pg = $("owner-page");
  if (e.key === "Escape" && pg && pg.classList.contains("aktif") && !document.querySelector("dialog[open]")) { location.hash = ""; initOwner(); }
});

/* Kurangi lag ASCII di Coding tab */
function latarAscii(sec) {
  const c = el("canvas", "biner-bg"), g = c.getContext && c.getContext("2d");
  if (!g) return;
  c.setAttribute("aria-hidden", "true"); sec.prepend(c);
  const CW = 20, CH = 26, GLIF = ".:-=+*#%", font = `700 ${CW - 2}px ${getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace"}`;
  const LV = 14, WARNA = Array.from({ length: LV }, (_, i) => `rgba(120,175,215,${(0.025 + i * 0.012).toFixed(3)})`);
  let w, h, raf = 0, last = 0, kolom = 0, baris = 0, glif = [];
  const gambar = (t) => {
    g.clearRect(0, 0, w, h); g.font = font; g.textBaseline = "top";
    const r0 = sec.getBoundingClientRect(), a = Math.max(0, Math.floor(-r0.top / CH)), z = Math.min(baris, Math.ceil((innerHeight - r0.top) / CH));
    const ox = w * (0.5 + 0.35 * Math.sin(t * 0.00006)), oy = h * (0.5 + 0.3 * Math.sin(t * 0.00004 + 1.3));
    for (let r = a; r < z; r++) for (let k = 0; k < kolom; k++) {
      const x = k * CW, y = r * CH;
      let v = 0.5 + 0.5 * Math.sin(k * 0.12 + r * 0.09 + t * 0.00035);            // gelombang sangat pelan
      v = v * 0.35 + 0.55 * Math.exp(-((x - ox) ** 2 + (y - oy) ** 2) / 160000);
      const i = Math.min(LV - 1, Math.floor(v * LV));
      if (i < 2) continue;
      g.fillStyle = WARNA[i]; g.fillText(glif[r * kolom + k], x, y);
    }
  };
  const loop = (t) => { raf = requestAnimationFrame(loop); if (t - last < 50) return; last = t; gambar(t); };
  const atur = () => {
    w = c.width = sec.clientWidth; h = c.height = sec.clientHeight;
    kolom = Math.ceil(w / CW); baris = Math.ceil(h / CH);
    glif = Array.from({ length: kolom * baris }, (_, n) => GLIF[((n * 2654435761) >>> 7) % GLIF.length]);   // huruf tetap per sel
    if (diam || !raf) gambar(diam ? 3000 : 0);
  };
  new ResizeObserver(atur).observe(sec); atur();
  if (diam) return;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); } else { cancelAnimationFrame(raf); raf = 0; }
  }).observe(sec);
}
latarAscii($("lab"));


/* ===== Jam hidup WIB (Asia/Jakarta), satu interval ===== */
(function mulaiJam() {
  if (window.__jamTimer) return;
  const elW = $("jam-waktu"), elT = $("jam-tanggal");
  if (!elW || !elT) return;
  const fmtW = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const fmtT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const tick = () => {
    const now = new Date();
    elW.textContent = fmtW.format(now);
    elT.textContent = fmtT.format(now);
  };
  tick();
  window.__jamTimer = setInterval(tick, 1000);
})();

/* ===== Wall of Fame ===== */
const WALL_KEY = "kelas8e-wall";
const WALL_KAT = ["Prestasi", "Karya", "Lomba", "Kegiatan", "Lainnya"];
function loadWall() {
  try {
    const s = localStorage.getItem(WALL_KEY);
    const a = s ? JSON.parse(s) : [];
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}
function saveWall(arr) {
  localStorage.setItem(WALL_KEY, JSON.stringify(arr));
  sbSimpan("wallOfFame", arr);
  renderWall();
}
function fmtTanggal(iso) {
  if (!iso) return "";
  const d = new Date(String(iso).length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function renderWall() {
  const grid = $("w-grid");
  if (!grid) return;
  const data = loadWall().slice().sort((a, b) => String(b.date || b.created || "").localeCompare(String(a.date || a.created || "")));
  grid.textContent = "";
  if (!data.length) {
    grid.append(el("p", "kosong", "Belum ada pencapaian yang ditampilkan. Nantikan prestasi dan karya kelas di sini."));
    return;
  }
  data.forEach((w, i) => {
    const a = el("article", "w-kartu" + (i === 0 ? " utama" : ""));
    const th = el("div", "thumb");
    if (w.img) {
      const im = el("img"); im.src = w.img; im.alt = w.alt || w.title || ""; im.loading = "lazy";
      im.onerror = () => { im.remove(); th.textContent = "Foto"; };
      th.append(im);
    } else th.textContent = w.category || "8E";
    const tb = el("div", "tubuh");
    if (w.category) tb.append(el("span", "b-label", w.category));
    const t = fmtTanggal(w.date);
    if (t) { const tm = el("time", null, t); tm.dateTime = w.date; tb.append(tm); }
    tb.append(el("h3", null, w.title || "Tanpa judul"));
    if (w.student) tb.append(el("p", "w-siswa", w.student));
    if (w.description) tb.append(el("p", null, w.description));
    a.append(th, tb); grid.append(a);
  });
  if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches && grid.children.length) {
    gsap.from(grid.children, { opacity: 0, y: 28, duration: 0.6, stagger: 0.07, ease: "power3.out", clearProps: "opacity,transform" });
  }
}
function bersihWall(a) {
  if (!Array.isArray(a)) throw new Error("Bagian 'wallOfFame' di file tidak valid.");
  return a.filter(x => x && typeof x === "object" && str(x.title).trim()).map((x, n) => ({
    id: str(x.id, 24) || Date.now().toString(36) + n,
    title: str(x.title, 120).trim(),
    category: WALL_KAT.includes(x.category) ? x.category : "Lainnya",
    student: str(x.student, 80).trim(),
    description: str(x.description, 500).trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(x.date || "") ? x.date : "",
    img: urlOk(x.img) ? x.img : "",
    alt: str(x.alt, 140).trim(),
    created: str(x.created, 40) || new Date().toISOString()
  }));
}
function resetWallForm() {
  const f = $("wall-form"); if (f) f.reset();
  if ($("wf-id")) $("wf-id").value = "";
  if ($("wf-simpan")) $("wf-simpan").textContent = "Tambah pencapaian";
  if ($("wf-batal")) $("wf-batal").hidden = true;
  const pv = $("wf-preview");
  if (pv) { pv.hidden = true; pv.removeAttribute("src"); }
}
function renderWallOwner() {
  const list = $("wf-list");
  if (!list) return;
  list.textContent = "";
  const arr = loadWall();
  if (!arr.length) list.append(el("p", null, "Belum ada pencapaian."));
  arr.forEach((w, i) => {
    const d = el("div", "owner-item");
    if (w.img) {
      const th = el("img"); th.src = w.img; th.alt = "";
      th.style.cssText = "width:4.5rem;height:3.4rem;object-fit:cover;border:2px solid var(--ht);border-radius:.4rem;flex:none";
      d.append(th);
    }
    const t = el("div"); t.style.flex = "1";
    t.append(el("strong", null, w.title || "Tanpa judul"));
    const meta = el("div", null, [w.category, w.student, w.date].filter(Boolean).join(" · "));
    meta.style.fontSize = ".85rem"; meta.style.color = "var(--redup)";
    t.append(meta);
    const aksi = el("div"); aksi.style.cssText = "display:flex;gap:.4rem;flex-wrap:wrap";
    const edit = el("button", "btn putih", "Edit"); edit.type = "button";
    edit.onclick = () => {
      $("wf-id").value = w.id || "";
      $("wf-judul").value = w.title || "";
      $("wf-kat").value = WALL_KAT.includes(w.category) ? w.category : "Lainnya";
      $("wf-siswa").value = w.student || "";
      $("wf-isi").value = w.description || "";
      $("wf-tgl").value = w.date || "";
      $("wf-alt").value = w.alt || "";
      $("wf-simpan").textContent = "Simpan perubahan";
      $("wf-batal").hidden = false;
      if (w.img) { $("wf-preview").src = w.img; $("wf-preview").hidden = false; }
      else { $("wf-preview").hidden = true; $("wf-preview").removeAttribute("src"); }
      $("wf-judul").focus();
      $("own-wall").scrollIntoView({ block: "start" });
    };
    const hapus = el("button", "btn putih", "Hapus"); hapus.type = "button";
    hapus.onclick = () => {
      if (!confirm("Hapus pencapaian ini dari Wall of Fame?")) return;
      const next = loadWall(); next.splice(i, 1); saveWall(next); renderWallOwner();
    };
    aksi.append(edit, hapus);
    d.append(t, aksi); list.append(d);
  });
}
function initWallOwner() {
  if (!$("wall-form")) return;
  renderWallOwner();
  $("wf-batal").onclick = () => { resetWallForm(); $("wf-status").textContent = ""; };
  $("wf-img").onchange = () => {
    const f = $("wf-img").files[0];
    if (!f) return;
    $("wf-preview").src = URL.createObjectURL(f);
    $("wf-preview").hidden = false;
  };
  $("wall-form").onsubmit = async (e) => {
    e.preventDefault();
    const st = $("wf-status"), judul = $("wf-judul").value.trim();
    if (!judul) { st.textContent = "Judul wajib diisi."; return; }
    if (judul.length > 120) { st.textContent = "Judul terlalu panjang (maksimal 120 karakter)."; return; }
    const isi = $("wf-isi").value.trim();
    if (isi.length > 500) { st.textContent = "Deskripsi terlalu panjang (maksimal 500 karakter)."; return; }
    const siswa = $("wf-siswa").value.trim();
    if (siswa.length > 80) { st.textContent = "Nama siswa/kelompok terlalu panjang."; return; }
    st.textContent = "Menyimpan...";
    $("wf-simpan").disabled = true;
    try {
      const file = $("wf-img").files[0];
      const id = $("wf-id").value;
      const lama = id ? loadWall().find(x => x.id === id) : null;
      let img = lama ? lama.img || "" : "";
      if (file) img = await simpanFoto(await kecilkanFoto(file, 900), "wall");
      const item = {
        id: id || Date.now().toString(36),
        title: judul,
        category: WALL_KAT.includes($("wf-kat").value) ? $("wf-kat").value : "Lainnya",
        student: siswa,
        description: isi,
        date: $("wf-tgl").value || "",
        img,
        alt: $("wf-alt").value.trim().slice(0, 140) || (img ? judul : ""),
        created: (lama && lama.created) || new Date().toISOString()
      };
      const arr = loadWall();
      if (id) {
        const i = arr.findIndex(x => x.id === id);
        if (i >= 0) arr[i] = item; else arr.unshift(item);
      } else arr.unshift(item);
      try { saveWall(arr); } catch (_) { st.textContent = "Penyimpanan browser penuh. Hapus item lama dulu."; return; }
      resetWallForm();
      st.textContent = "Tersimpan. Wall of Fame sudah diperbarui.";
      renderWallOwner();
    } catch (err) {
      st.textContent = err.message || "Gagal menyimpan.";
    } finally {
      $("wf-simpan").disabled = false;
    }
  };
}
renderWall();

/* ===== Kritik & Saran (tabel class_feedback, bukan site_data) ===== */
const FB_KAT = { kritik: "Kritik", saran: "Saran", apresiasi: "Apresiasi" };
const FB_ST = { baru: "Baru", ditinjau: "Ditinjau", selesai: "Selesai" };
let fbCache = [], ksBusy = false;
function ksSetStatus(t, jenis) {
  const n = $("ks-status");
  if (!n) return;
  n.textContent = t;
  n.className = jenis || "";
}
function initKritikForm() {
  const pesan = $("ks-pesan"), hit = $("ks-hitung"), anon = $("ks-anon"), nama = $("ks-nama"), form = $("ks-form");
  if (!form || form.dataset.siap) return;
  form.dataset.siap = "1";
  const syncNama = () => { nama.disabled = anon.checked; if (anon.checked) nama.value = ""; };
  anon.addEventListener("change", syncNama); syncNama();
  pesan.addEventListener("input", () => {
    const n = pesan.value.length;
    hit.textContent = n + " / 800";
    hit.classList.toggle("penuh", n > 750);
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (ksBusy) return;
    const msg = pesan.value.trim();
    const kat = $("ks-kat").value;
    if (!FB_KAT[kat]) { ksSetStatus("Pilih kategori yang valid.", "err"); return; }
    if (msg.length < 10) { ksSetStatus("Pesan minimal 10 karakter.", "err"); pesan.focus(); return; }
    if (msg.length > 800) { ksSetStatus("Pesan maksimal 800 karakter.", "err"); return; }
    const cd = Number(sessionStorage.getItem("ks-cd") || 0);
    if (Date.now() < cd) { ksSetStatus("Tunggu sebentar sebelum mengirim lagi.", "err"); return; }
    if (!SB) { ksSetStatus("Pengiriman online belum aktif. Admin perlu menyiapkan Supabase dan tabel class_feedback.", "err"); return; }
    const isAnon = anon.checked || !nama.value.trim();
    const display = isAnon ? null : nama.value.trim().slice(0, 60);
    ksBusy = true;
    $("ks-kirim").disabled = true;
    ksSetStatus("Mengirim...", "");
    try {
      const { error } = await SB.from("class_feedback").insert({
        category: kat,
        message: msg,
        display_name: display,
        is_anonymous: isAnon,
        status: "baru"
      });
      if (error) throw error;
      form.reset(); syncNama(); hit.textContent = "0 / 800"; hit.classList.remove("penuh");
      sessionStorage.setItem("ks-cd", String(Date.now() + 20000));
      ksSetStatus("Terima kasih. Masukanmu sudah terkirim dan hanya bisa dibaca admin.", "ok");
    } catch (err) {
      const m = (err && err.message) || "Gagal mengirim.";
      const hint = /class_feedback|schema cache|relation|policy|row-level|RLS|permission/i.test(m)
        ? " Pastikan tabel class_feedback dan kebijakan RLS sudah dibuat di Supabase."
        : "";
      ksSetStatus("Gagal mengirim: " + m + hint, "err");
    } finally {
      ksBusy = false;
      $("ks-kirim").disabled = false;
    }
  });
}
initKritikForm();
function fmtWaktu(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
async function muatFeedback() {
  const st = $("fb-status"), list = $("fb-list");
  if (!list || !st) return;
  if (!SB) { st.textContent = "Mode lokal: masukan online tidak tersedia. Isi Supabase lalu jalankan SQL class_feedback."; list.textContent = ""; return; }
  if (!window.sbSesi) { st.textContent = "Masuk sebagai admin untuk melihat masukan."; list.textContent = ""; return; }
  st.textContent = "Memuat masukan...";
  list.textContent = "";
  try {
    const cek = await SB.rpc("is_admin");
    if (!cek.error && cek.data === false) {
      st.textContent = "Akun ini belum terdaftar di tabel admins. Tambahkan UUID-nya lewat SQL Editor, lalu muat ulang.";
      return;
    }
    const { data, error } = await SB.from("class_feedback").select("id,category,message,display_name,is_anonymous,status,created_at").order("created_at", { ascending: false });
    if (error) throw error;
    fbCache = Array.isArray(data) ? data : [];
    st.textContent = fbCache.length ? "" : "Belum ada masukan. Jika siswa sudah mengirim tapi daftar kosong, pastikan UID admin ada di tabel admins.";
    renderFeedback();
  } catch (err) {
    const m = (err && err.message) || "Gagal memuat.";
    st.textContent = "Gagal memuat masukan: " + m + (/class_feedback|schema cache|policy|RLS|permission/i.test(m) ? " Jalankan SQL di Supabase, lalu pastikan UID admin ada di tabel admins." : "");
  }
}
function renderFeedback() {
  const list = $("fb-list"); if (!list) return;
  const kat = $("fb-kat") ? $("fb-kat").value : "";
  const stf = $("fb-st") ? $("fb-st").value : "";
  const rows = fbCache.filter(x => (!kat || x.category === kat) && (!stf || x.status === stf));
  const baru = fbCache.filter(x => x.status === "baru").length;
  const badge = $("fb-badge");
  if (badge) { badge.textContent = baru ? baru + " baru" : ""; badge.hidden = !baru; }
  list.textContent = "";
  if (!rows.length) {
    list.append(el("p", null, fbCache.length ? "Tidak ada masukan pada filter ini." : "Belum ada masukan."));
    return;
  }
  rows.forEach(x => {
    const d = el("article", "fb-item" + (x.status === "baru" ? " baru" : ""));
    const meta = el("div", "fb-meta");
    meta.append(el("span", null, FB_KAT[x.category] || x.category || "—"));
    meta.append(el("span", null, FB_ST[x.status] || x.status || "—"));
    meta.append(el("span", null, x.is_anonymous || !x.display_name ? "Anonim" : x.display_name));
    meta.append(el("span", null, (fmtWaktu(x.created_at) || "—") + " WIB"));
    d.append(meta, el("p", null, x.message || ""));
    const aksi = el("div", "fb-aksi");
    if (x.status !== "ditinjau") {
      const b = el("button", "btn putih", "Tandai ditinjau"); b.type = "button";
      b.onclick = () => ubahFeedback(x.id, { status: "ditinjau" }); aksi.append(b);
    }
    if (x.status !== "selesai") {
      const b = el("button", "btn putih", "Tandai selesai"); b.type = "button";
      b.onclick = () => ubahFeedback(x.id, { status: "selesai" }); aksi.append(b);
    }
    const h = el("button", "btn putih", "Hapus"); h.type = "button";
    h.onclick = () => hapusFeedback(x.id); aksi.append(h);
    d.append(aksi); list.append(d);
  });
}
async function ubahFeedback(id, patch) {
  const st = $("fb-status");
  if (!SB || !window.sbSesi) { st.textContent = "Sesi admin tidak aktif."; return; }
  st.textContent = "Menyimpan...";
  const { data, error } = await SB.from("class_feedback").update(patch).eq("id", id).select("id");
  if (error) { st.textContent = "Gagal mengubah: " + error.message; return; }
  if (!data || !data.length) { st.textContent = "Ditolak database: tidak ada data yang berubah. Biasanya karena policy UPDATE untuk admin belum dibuat. Jalankan supabase-feedback.sql di SQL Editor Supabase."; return; }
  st.textContent = "Status diperbarui.";
  muatFeedback();
}
async function hapusFeedback(id) {
  if (!confirm("Hapus masukan ini?")) return;
  const st = $("fb-status");
  if (!SB || !window.sbSesi) { st.textContent = "Sesi admin tidak aktif."; return; }
  st.textContent = "Menghapus...";
  const { data, error } = await SB.from("class_feedback").delete().eq("id", id).select("id");
  if (error) { st.textContent = "Gagal menghapus: " + error.message; return; }
  if (!data || !data.length) { st.textContent = "Ditolak database: tidak ada data yang terhapus. Biasanya karena policy DELETE untuk admin belum dibuat. Jalankan supabase-feedback.sql di SQL Editor Supabase."; return; }
  st.textContent = "Masukan dihapus.";
  muatFeedback();
}
function initFeedback() {
  if ($("fb-kat")) $("fb-kat").onchange = renderFeedback;
  if ($("fb-st")) $("fb-st").onchange = renderFeedback;
  if ($("fb-muat")) $("fb-muat").onclick = muatFeedback;
  muatFeedback();
}

/* ============ Animasi (GSAP + ScrollTrigger + Lenis) ============ */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });        // bilah alamat HP naik/turun tidak memicu refresh berulang
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    /* Scroll halus + integrasi ScrollTrigger */
    let lenis;
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      window.gLenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);

      document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", (e) => {
        const t = document.querySelector(a.getAttribute("href"));
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); }
      }));

      const lb = $("lightbox");
      if (lb) {
        lb.addEventListener("close", () => lenis.start());
        new MutationObserver(() => lb.open ? lenis.stop() : lenis.start()).observe(lb, { attributes: true, attributeFilter: ["open"] });
      }
    }

    /* Hero entrance */
    const huruf = gsap.utils.toArray(".huruf");
    gsap.from(huruf, { yPercent: 140, rotate: 18, duration: 1.15, ease: "back.out(1.6)", stagger: 0.12, clearProps: "transform" });
    gsap.from(".hero .sekolah, .hero .lead, .hero .aksi, .polaroid", {
      opacity: 0, y: 30, duration: 0.9, delay: 0.45, stagger: 0.1, ease: "power3.out"
    });
    // secondary float on logo
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !layarKecil()) {
      gsap.to(".logo-hero", { y: -6, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.2 });
      gsap.to(".polaroid", { rotation: "+=2", duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.8 });
    }

    /* Mouse follow pada huruf kelas */
    if (matchMedia("(pointer: fine)").matches) {
      huruf.forEach((h, i) => {
        const rx = gsap.quickTo(h, "rotation", { duration: 0.55, ease: "power3" });
        const ry = gsap.quickTo(h, "y", { duration: 0.55, ease: "power3" });
        addEventListener("pointermove", (e) => {
          const dx = (e.clientX / innerWidth - 0.5);
          const dy = (e.clientY / innerHeight - 0.5);
          rx(dx * (i ? -12 : 12));
          ry(dy * (i ? 26 : -26));
        });
      });
    }

    /* Matahari berputar saat scroll */
    gsap.to("#sun", {
      rotation: 180, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
    });

    /* Kata-kata profil menyala */
    gsap.fromTo(".kata", { opacity: 0.15 }, {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: "#pernyataan", start: "top 75%", end: "bottom 40%", scrub: true }
    });

    /* Stiker entrance + sedikit bounce */
    gsap.from(".stiker li", {
      opacity: 0, y: 40, rotate: () => gsap.utils.random(-8, 8),
      duration: 0.7, stagger: 0.12, ease: "back.out(1.4)",
      scrollTrigger: { trigger: ".stiker", start: "top 85%" }
    });
    // continuous subtle wiggle on stickers
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !layarKecil()) {
      gsap.to(".stiker li", { rotation: "+=3", duration: 3.5, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.3, delay: 1 });
    }

    /* Kartu pengurus masuk bergiliran */
    gsap.from(".kartu", {
      opacity: 0, y: 40, rotate: 0,
      duration: 0.75, stagger: 0.08, ease: "power3.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: "#struktur", start: "top 82%", once: true }
    });
    // follow-through on cards
    gsap.from(".kartu .avatar, .kartu .peran, .kartu h3", {
      y: 12, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power2.out",
      scrollTrigger: { trigger: "#struktur", start: "top 75%", once: true },
      delay: 0.3
    });

    /* Terminal & playground fade-in */
    gsap.from(".lab-grid, .play", {
      opacity: 0, y: 40, duration: 0.9, stagger: 0.15, ease: "power2.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: "#lab", start: "top 75%" }
    });

    /* Kontak kotak */
    gsap.from(".kotak > div", {
      opacity: 0, y: 30, duration: 0.7, stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: "#kontak", start: "top 80%" }
    });
    // subtle lift on contact cards
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !layarKecil()) {
      gsap.to(".kotak > div", { y: -4, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.4 });
    }

    /* Refresh setelah layout stabil */
    setTimeout(() => ScrollTrigger.refresh(), 300);
  });

  /* Refresh ulang saat resize / gambar selesai */
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
