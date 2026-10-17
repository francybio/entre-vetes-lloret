/* ==========================================================
   ENTRE VETES — interacciones
   Vetas animadas en la portada, cortador de jamón en canvas
   (cada pasada del cuchillo saca una loncha que vuela al plato),
   precintos del ibérico, vitrina arrastrable y mazo de vídeos.
   ========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const STATIC = /[?&]static\b/.test(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC;
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const motion = hasGSAP && !reduced;
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const play = (v) => { if (!v) return; const p = v.play(); if (p) p.catch(() => {}); };
const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

/* ----------------------------------------------------------
   DATOS (textos de los posts de @entrevetes y su TikTok)
   ---------------------------------------------------------- */
const TICKER = ['Jamón ibérico a cuchillo', 'Cinco Jotas', 'Lomo de bellota', 'San Simón da Costa', 'Gorgonzola Dolce DOP', 'Mortadela de Bolonia', 'Torreznos de Soria', 'Salmón ahumado', 'Foie mi-cuit', 'Vins i caves', 'Formatges', 'Embotits'];
const ITEMS = [
  { img: '5j-plato.jpg', tag: 'Pernil', t: 'Cinco Jotas', s: '100 % ibérico de bellota', d: 'Jamón Cinco Jotas no se come, se celebra. Detrás de cada loncha hay más de un siglo de tradición artesana, cerdos 100 % ibéricos criados en libertad y una curación lenta que no entiende de prisas.\n\nEsa grasa brillante que se funde en la boca, ese aroma inconfundible y ese sabor largo y elegante.' },
  { img: 'lomo.jpg', tag: 'Embotit', t: 'Caña de lomo', s: 'Ibérico de bellota', d: '«Advertencia: abrir esta caña de lomo puede provocar amistades repentinas y visitas inesperadas.»' },
  { img: 'san-simon.jpg', tag: 'Formatge', t: 'San Simón da Costa', s: 'Galicia · vaca · ahumado', d: 'Si ves un queso con forma de bala… ¡estás ante un San Simón da Costa! Gallego, de vaca y con ese toque ahumado tan sutil que enamora a la primera. Cremoso por dentro y pura tradición por fuera.\n\nUn consejo: pruébalo fundido.' },
  { img: 'gorgonzola.jpg', tag: 'Formatge', t: 'Gorgonzola Dolce', s: 'DOP · leche de vaca', d: 'Se elabora con leche de vaca entera y pasteurizada. Increíblemente cremoso, dulce y equilibrado, con el sello DOP que garantiza su calidad tradicional.' },
  { img: 'mortadela.jpg', tag: 'Embotit', t: 'Mortadela de Bolonia', s: 'Italia · un clásico con historia', d: 'Nacida en Italia hace siglos, ya era apreciada por su sabor delicado y su elaboración cuidada. Perfecta para bocadillos, tablas o para disfrutarla sola.' },
  { img: 'salmon.jpg', tag: 'Racions', t: 'Salmón ahumado', s: 'Cortado a cuchillo', d: 'Salmón ahumado natural, cortado a cuchillo para respetar cada veta, servido con pan crujiente y la mantequilla Beppino Occelli, cremosa y llena de matices.\n\nEl equilibrio entre humo, sal y suavidad láctea. Ideal para un aperitivo de lujo.' },
  { img: 'torreznos.jpg', tag: 'Tapa', t: 'Torreznos de Soria', s: 'Crujientes por fuera', d: 'Crujientes por fuera, jugosos por dentro y con todo el sabor de Soria. Si no los ves en la carta, pregunta a nuestros camareros: a veces los mejores bocados se piden en persona.' },
  { img: 'silencio.jpg', tag: 'Vi', t: 'Habla del Silencio', s: 'Extremadura · barrica', d: 'Ese tinto que siempre queda bien en la mesa: muy aromático, con notas de fruta roja, toques de especias y chocolate suave. Syrah, Cabernet Sauvignon y Tempranillo criados en barrica de roble francés.' },
  { img: 'phylos.jpg', tag: 'Vi', t: 'Phylos · De Blas Serrano', s: 'Ribera del Duero', d: 'Ribera del Duero en estado puro: un tinto lleno de fruta, fresco y muy fácil de beber. Tinta del País de viñas viejas, unos 12 meses en barrica de roble francés.' },
  { img: 'san-simon-2.jpg', tag: 'Formatge', t: 'Para la tabla', s: 'Quesos de aquí y de fuera', d: 'Quesos curados, cremosos, ahumados o con trufa: pregunta en el mostrador y te los damos a probar.' }
];
const DECK = [
  { v: 'tienda', c: 'Un lujo para el paladar' },
  { v: 'corte', c: 'Arte ibérico, cortado a cuchillo' },
  { v: 'quesos', c: 'El arte de armar una bandeja de quesos' },
  { v: 'bellota', c: 'Jamón de bellota con 60 meses de curación', wide: true },
  { v: 'cuerda', c: '¡Dale cuerda!' },
  { v: 'lujo', c: 'Jamón y quesos para compartir' }
];
const SEALS = [
  { c: '#141110', ink: '#F2E4CF', n: 'Negro', t: '100 % ibérico de bellota', s: 'El único «pata negra»', d: 'Padre y madre de raza ibérica pura. En su última etapa campa por la dehesa durante la montanera y engorda a base de bellota y pastos. Es el único que puede llamarse «pata negra».', dl: [['Raza', '100 % ibérica'], ['Alimentación', 'Bellota y pastos en montanera'], ['Ejemplo', 'Cinco Jotas']] },
  { c: '#B3262B', ink: '#F2E4CF', n: 'Rojo', t: 'De bellota ibérico', s: 'Cruce, en montanera', d: 'Cerdo ibérico cruzado (50 % o 75 % de raza ibérica) que también engorda en libertad en la dehesa, con bellota y pastos.', dl: [['Raza', '50 % o 75 % ibérica'], ['Alimentación', 'Bellota y pastos en montanera']] },
  { c: '#2F7A45', ink: '#F2E4CF', n: 'Verde', t: 'De cebo de campo ibérico', s: 'Al aire libre', d: 'Ibérico criado al aire libre, en el campo, que combina los pastos con piensos de cereales y leguminosas.', dl: [['Raza', '100 %, 75 % o 50 % ibérica'], ['Alimentación', 'Pastos y piensos naturales']] },
  { c: '#EDE6DA', ink: '#141110', n: 'Blanco', t: 'De cebo ibérico', s: 'En granja', d: 'Ibérico criado en granja y alimentado con piensos de cereales y leguminosas. La puerta de entrada al mundo del ibérico.', dl: [['Raza', '100 %, 75 % o 50 % ibérica'], ['Alimentación', 'Piensos de cereales y leguminosas']] }
];
const TIPS = [
  'La loncha perfecta es fina, casi transparente, y del tamaño de un bocado.',
  'Corta siempre en paralelo a la cara, sin dejar escalones.',
  'Cada loncha con su poquito de grasa: ahí está el sabor de las vetas.',
  'El jamón se sirve a temperatura ambiente, nunca recién sacado de la nevera.',
  'En el plato, en una sola capa, para que las lonchas no se peguen.',
  'Sin prisa: el cuchillo largo y flexible hace el trabajo.',
  'Una copa de tinto al lado nunca sobra.'
];

/* ----------------------------------------------------------
   HORARIO (Google): L–J 9–13:30 y 17–21 · V–S 9–14 y 17–22 · D cerrado
   ---------------------------------------------------------- */
const SLOTS = { 0: [], 1: [[540, 810], [1020, 1260]], 2: [[540, 810], [1020, 1260]], 3: [[540, 810], [1020, 1260]], 4: [[540, 810], [1020, 1260]], 5: [[540, 840], [1020, 1320]], 6: [[540, 840], [1020, 1320]] };
const madrid = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { d, m: +p.hour * 60 + +p.minute };
};
const hhmm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const paintLive = () => {
  const { d, m } = madrid();
  const today = SLOTS[d];
  const cur = today.find(([a, b]) => m >= a && m < b);
  let txt;
  if (cur) txt = `Abierto · hasta las ${hhmm(cur[1])}`;
  else {
    const next = today.find(([a]) => m < a);
    if (next) txt = `Cerrado · abrimos a las ${hhmm(next[0])}`;
    else { let k = 1; while (!SLOTS[(d + k) % 7].length) k++; txt = `Cerrado · ${k === 1 ? 'mañana' : 'el lunes'} a las ${hhmm(SLOTS[(d + k) % 7][0][0])}`; }
  }
  $$('[data-live]').forEach((el) => { el.classList.toggle('is-open', !!cur); el.classList.toggle('is-closed', !cur); $('[data-live-text]', el).textContent = txt; });
  $$('#hours tr').forEach((tr) => tr.classList.toggle('is-today', +tr.dataset.d === d));
};
paintLive(); setInterval(paintLive, 30000);

/* ----------------------------------------------------------
   SCROLL SUAVE · NAV · MENÚ
   ---------------------------------------------------------- */
let lenis = null;
if (motion && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const nav = $('#nav');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 40);
  nav.classList.toggle('is-hidden', y > 500 && y > lastY && !drawer.classList.contains('is-open'));
  lastY = y;
};
const burger = $('#burger'), drawer = $('#drawer');
const setDrawer = (open) => { burger.setAttribute('aria-expanded', open); drawer.classList.toggle('is-open', open); document.body.style.overflow = open ? 'hidden' : ''; if (lenis) open ? lenis.stop() : lenis.start(); };
burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
window.addEventListener('scroll', onScroll, { passive: true });
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const t = $(id); if (!t) return;
  e.preventDefault(); setDrawer(false);
  if (lenis) lenis.scrollTo(t, { offset: -60 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}));

/* ----------------------------------------------------------
   ENTRADA
   ---------------------------------------------------------- */
const intro = $('#intro');
const heroIn = () => {
  if (!motion) return;
  gsap.from('.hero__title .ln > span', { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: .12 });
  gsap.from('.hero__lead, .hero__cta, .hero__rate, .hero .kicker', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .25 });
  gsap.from('.hero__pic', { clipPath: 'inset(100% 0 0 0 round 260px 260px 18px 18px)', duration: 1.4, ease: 'power4.inOut' });
  gsap.from('.hero__pic img', { scale: 1.3, duration: 1.8, ease: 'power3.out' });
};
if (reduced || !intro) { if (intro) intro.remove(); heroIn(); }
else {
  document.body.style.overflow = 'hidden';
  setTimeout(() => { intro.classList.add('is-out'); document.body.style.overflow = ''; heroIn(); setTimeout(() => intro.remove(), 900); }, 1900);
}

/* ticker */
$('#ticker').innerHTML = [...TICKER, ...TICKER].map((t) => `<span>${t}</span>`).join('');

/* ----------------------------------------------------------
   PORTADA · VETAS VIVAS (canvas)
   Líneas de grasa que ondulan lentamente y se apartan del cursor.
   ---------------------------------------------------------- */
(() => {
  const cv = $('#veins'); if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, veins = [], mx = -999, my = -999, visible = true, t0 = performance.now();
  const build = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const r = rng(7); veins = [];
    const n = W < 700 ? 18 : 30;
    for (let i = 0; i < n; i++) {
      veins.push({
        y: H * (.08 + .84 * r()), a: 12 + r() * 46, f: .0016 + r() * .004, f2: .006 + r() * .01,
        p: r() * 6.28, sp: .12 + r() * .25, w: .5 + r() * 2.2, al: .07 + r() * .2, drift: (r() - .5) * .18
      });
    }
  };
  const draw = (now) => {
    const t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // fondo: un «corte» rojo detrás de la foto
    const g = ctx.createRadialGradient(W * .72, H * .48, 10, W * .72, H * .48, Math.max(W, H) * .62);
    g.addColorStop(0, 'rgba(158,28,34,.55)'); g.addColorStop(.45, 'rgba(90,16,20,.28)'); g.addColorStop(1, 'rgba(14,11,10,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (const v of veins) {
      ctx.beginPath();
      const step = W < 700 ? 18 : 14;
      for (let x = -20; x <= W + 20; x += step) {
        let y = v.y + Math.sin(x * v.f + v.p + t * v.sp) * v.a + Math.sin(x * v.f2 - t * v.sp * .7 + v.p * 2) * v.a * .22 + Math.sin(t * .2 + v.p) * 10 + x * v.drift * .2;
        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < 32000) { const k = 1 - d2 / 32000; y += (dy >= 0 ? 1 : -1) * k * k * 46; }
        x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      // las vetas se ven más cerca del rojo (derecha) y se apagan a la izquierda
      const lg = ctx.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, `rgba(242,228,207,${v.al * .25})`); lg.addColorStop(.6, `rgba(242,228,207,${v.al})`); lg.addColorStop(1, `rgba(242,228,207,${v.al * .6})`);
      ctx.strokeStyle = lg; ctx.lineWidth = v.w; ctx.stroke();
    }
  };
  const loop = (now) => { if (visible) draw(now); if (!reduced) requestAnimationFrame(loop); };
  build();
  if (reduced) draw(performance.now() + 4000); else requestAnimationFrame(loop);
  window.addEventListener('resize', () => { build(); if (reduced) draw(performance.now() + 4000); });
  const hero = cv.parentElement;
  hero.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mx = my = -999; });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(cv);
})();

/* ----------------------------------------------------------
   MANIFIESTO · palabras que se encienden con el scroll
   ---------------------------------------------------------- */
(() => {
  const el = $('#manifesto'); if (!el) return;
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span> `).join('');
  const words = $$('.w', el);
  if (!motion) { words.forEach((w) => w.classList.add('is-on')); return; }
  ScrollTrigger.create({
    trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: (s) => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('is-on', i < n)); }
  });
  $$('.mp').forEach((f) => gsap.to(f, { yPercent: parseFloat(f.dataset.speed) * 100, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true } }));
})();

/* ----------------------------------------------------------
   CORTA TÚ · el cortador de jamón
   La cara del jamón es una textura de carne con vetas generada
   en un canvas. Cada pasada del cuchillo de lado a lado recorta
   una loncha de esa textura, que vuela al plato de pizarra y se
   coloca en roseta.
   ---------------------------------------------------------- */
(() => {
  const wrap = $('#slicerWrap'), cv = $('#slicer'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const nEl = $('#sliceN'), barEl = $('#sliceBar'), tipEl = $('#sliceTip'), hint = $('#slicerHint');
  const MAX = 15; $('#sliceMax').textContent = MAX;
  let W = 0, H = 0, dpr = 1, vertical = false;
  let S = 1, OX = 0, OY = 0;            // escala y origen del dibujo del jamón (caja 600×420)
  let plate = { x: 0, y: 0, r: 0 };
  let face = { x: 215, y: 222, rx: 128, ry: 84, rot: -.2 };
  let meat = null, depth = 0;            // textura de la cara y profundidad del corte
  let placed = [], flying = [], slots = [];
  let knife = { x: 0, y: 0, tx: 0, ty: 0, a: -.25, ta: -.25 };
  let down = false, minX = Infinity, maxX = -Infinity, lastCut = 0, trail = [], auto = null;
  let visible = false, raf = 0, done = false, tipI = 0, count = 0;

  /* caja local → pantalla */
  const P = (x, y) => [OX + x * S, OY + y * S];
  const inFace = (sx, sy, pad = 1) => {
    const [cx, cy] = P(face.x, face.y);
    const dx = sx - cx, dy = sy - cy, c = Math.cos(-face.rot), s = Math.sin(-face.rot);
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    return (lx * lx) / ((face.rx * S * pad) ** 2) + (ly * ly) / ((face.ry * S * pad) ** 2) <= 1;
  };

  /* textura de carne con vetas */
  const buildMeat = () => {
    const w = Math.ceil(face.rx * 2 * S * dpr), h = Math.ceil(face.ry * 2 * S * dpr);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const r = rng(11 + depth * 97);
    const base = g.createRadialGradient(w * .42, h * .55, 4, w * .5, h * .5, w * .62);
    base.addColorStop(0, '#B8323A'); base.addColorStop(.5, '#9C1E27'); base.addColorStop(1, '#6E1219');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // zonas de músculo más oscuras
    for (let i = 0; i < 5; i++) {
      const rg = g.createRadialGradient(r() * w, r() * h, 2, r() * w, r() * h, w * (.15 + r() * .25));
      rg.addColorStop(0, 'rgba(70,8,14,.45)'); rg.addColorStop(1, 'rgba(70,8,14,0)');
      g.fillStyle = rg; g.fillRect(0, 0, w, h);
    }
    // vetas: paseos aleatorios que se ramifican, más gruesos al nacer
    g.lineCap = 'round'; g.lineJoin = 'round';
    const vein = (x, y, ang, steps, wd, al) => {
      let px = x, py = y;
      for (let k = 0; k < steps; k++) {
        ang += (r() - .5) * .55;
        const nx = px + Math.cos(ang) * 5 * dpr, ny = py + Math.sin(ang) * 5 * dpr;
        g.strokeStyle = `rgba(246,233,215,${al * (1 - k / steps * .6)})`;
        g.lineWidth = Math.max(.35 * dpr, wd * (1 - k / steps)) ;
        g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
        px = nx; py = ny;
        if (r() < .045 && wd > .9 * dpr) vein(px, py, ang + (r() < .5 ? -1 : 1) * (.5 + r() * .7), steps * .45 | 0, wd * .6, al * .85);
      }
    };
    for (let i = 0; i < 26; i++) {
      const ang = (r() < .7 ? 0 : Math.PI) + (r() - .5) * 1.1;
      vein(r() * w, r() * h, ang, 18 + (r() * 46 | 0), (.6 + r() * 2.4) * dpr, .35 + r() * .5);
    }
    // islas de grasa
    for (let i = 0; i < 9; i++) {
      g.beginPath(); g.ellipse(r() * w, r() * h, (2 + r() * 9) * dpr, (1 + r() * 4) * dpr, r() * 3, 0, 6.3);
      g.fillStyle = `rgba(247,236,220,${.35 + r() * .45})`; g.fill();
    }
    // brillo
    const sh = g.createLinearGradient(0, 0, w, h);
    sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    meat = c;
  };

  /* huecos del plato en roseta */
  const buildSlots = () => {
    slots = [];
    const R = plate.r;
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + i * (Math.PI * 2 / 9); slots.push({ x: Math.cos(a) * R * .55, y: Math.sin(a) * R * .55, a: a + Math.PI / 2, len: R * .74 }); }
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + .3 + i * (Math.PI * 2 / 5); slots.push({ x: Math.cos(a) * R * .24, y: Math.sin(a) * R * .24, a: a + Math.PI / 2, len: R * .56 }); }
    slots.push({ x: 0, y: 0, a: .6, len: R * .42 });
  };

  const layout = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = wrap.clientWidth; H = wrap.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    vertical = W < 640;
    const aw = vertical ? W : W * .62, ah = vertical ? H * .56 : H;
    S = Math.min(aw / 640, ah / 450);
    OX = (aw - 600 * S) / 2 + (vertical ? 0 : W * .01);
    OY = (ah - 420 * S) / 2 + (vertical ? H * .02 : 0);
    plate = vertical ? { x: W / 2, y: H * .76, r: Math.min(W * .4, H * .2) } : { x: W * .8, y: H * .52, r: Math.min(W * .17, H * .36) };
    buildMeat(); buildSlots();
    placed.forEach((p) => { const s = slots[p.slot]; p.x = plate.x + s.x; p.y = plate.y + s.y; p.a = s.a; p.len = s.len; });
    knife.x = knife.tx = P(470, 60)[0]; knife.y = knife.ty = P(470, 60)[1];
  };

  /* --- dibujo --- */
  const drawBoard = () => {
    const [x0, y0] = P(10, 352), [x1, y1] = P(615, 404);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#6B4528'); g.addColorStop(1, '#3E2615');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 10 * S); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,180,.12)'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + 10 * S, y0 + i * (y1 - y0) / 4); ctx.lineTo(x1 - 10 * S, y0 + i * (y1 - y0) / 4 + 2 * S); ctx.stroke(); }
    // poste y husillo del jamonero
    const [px, py] = P(556, 70), [, pb] = P(556, 356);
    const pg = ctx.createLinearGradient(px - 8 * S, 0, px + 8 * S, 0);
    pg.addColorStop(0, '#5a5f66'); pg.addColorStop(.5, '#dfe3e8'); pg.addColorStop(1, '#6b7078');
    ctx.fillStyle = pg; ctx.fillRect(px - 7 * S, py, 14 * S, pb - py);
    ctx.fillStyle = '#2a2d31'; ctx.beginPath(); ctx.arc(px, py + 22 * S, 11 * S, 0, 6.3); ctx.fill();
  };
  const drawHam = () => {
    // caña y pezuña
    ctx.save();
    const [a1, b1] = P(492, 120), [a2, b2] = P(580, 52), [a3, b3] = P(598, 82), [a4, b4] = P(505, 172);
    const cg = ctx.createLinearGradient(a1, b1, a3, b3);
    cg.addColorStop(0, '#A8723A'); cg.addColorStop(1, '#7A4C24');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.lineTo(a3, b3); ctx.lineTo(a4, b4); ctx.closePath(); ctx.fill();
    const [hx, hy] = P(596, 62);
    ctx.fillStyle = '#211714'; ctx.beginPath(); ctx.ellipse(hx, hy, 20 * S, 26 * S, -.75, 0, 6.3); ctx.fill();
    // precinto negro
    const [sx, sy] = P(566, 84);
    ctx.fillStyle = '#0c0a09'; ctx.beginPath(); ctx.roundRect(sx - 9 * S, sy - 16 * S, 18 * S, 32 * S, 4 * S); ctx.fill();
    ctx.strokeStyle = 'rgba(201,163,91,.8)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
    // cuerpo
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...P(500, 116));
    ctx.bezierCurveTo(...P(420, 86), ...P(300, 66), ...P(190, 92));
    ctx.bezierCurveTo(...P(58, 122), ...P(22, 300), ...P(140, 352));
    ctx.bezierCurveTo(...P(260, 404), ...P(410, 300), ...P(508, 172));
    ctx.closePath();
    const [gx, gy] = P(300, 120);
    const bg = ctx.createRadialGradient(gx, gy, 10 * S, gx, gy, 380 * S);
    bg.addColorStop(0, '#C99554'); bg.addColorStop(.45, '#A06A32'); bg.addColorStop(1, '#5A3417');
    ctx.fillStyle = bg; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40 * S; ctx.shadowOffsetY = 18 * S; ctx.fill();
    ctx.shadowColor = 'transparent';
    // brillo de la corteza
    ctx.clip();
    const hl = ctx.createLinearGradient(...P(200, 80), ...P(260, 200));
    hl.addColorStop(0, 'rgba(255,230,190,.35)'); hl.addColorStop(1, 'rgba(255,230,190,0)');
    ctx.fillStyle = hl; ctx.fillRect(...P(0, 0), 620 * S, 420 * S);
    ctx.restore();
    // grasa alrededor de la cara
    const [cx, cy] = P(face.x, face.y);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(face.rot);
    const fg = ctx.createRadialGradient(0, 0, face.rx * S * .8, 0, 0, face.rx * S * 1.12);
    fg.addColorStop(0, '#F4E6CF'); fg.addColorStop(1, '#D9B98A');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0, 0, face.rx * S + 13 * S, face.ry * S + 11 * S, 0, 0, 6.3); ctx.fill();
    // carne
    ctx.beginPath(); ctx.ellipse(0, 0, face.rx * S, face.ry * S, 0, 0, 6.3); ctx.clip();
    if (meat) ctx.drawImage(meat, -face.rx * S, -face.ry * S, face.rx * 2 * S, face.ry * 2 * S);
    ctx.restore();
  };
  const drawPlate = () => {
    const { x, y, r } = plate;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    const g = ctx.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r * 1.05);
    g.addColorStop(0, '#34343a'); g.addColorStop(.7, '#1d1d21'); g.addColorStop(1, '#121214');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r - 6, 0, 6.3); ctx.stroke();
    // textura de pizarra
    const rr = rng(3);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, 6.3); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) { const yy = y - r + rr() * r * 2; ctx.beginPath(); ctx.moveTo(x - r, yy); ctx.bezierCurveTo(x - r * .3, yy + 8, x + r * .2, yy - 6, x + r, yy + 4); ctx.stroke(); }
    ctx.restore();
    if (!placed.length && !flying.length) {
      ctx.fillStyle = 'rgba(242,228,207,.35)'; ctx.font = `400 ${Math.max(13, r * .11)}px Onest, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('el plato espera', x, y + 5);
    }
  };
  const drawSlice = (sl, x, y, a, len, sc = 1, alpha = 1) => {
    const k = (len / sl.w) * sc;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(a); ctx.scale(k, k);
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8 / k; ctx.shadowOffsetY = 3 / k;
    ctx.drawImage(sl.c, -sl.w / 2, -sl.h / 2, sl.w, sl.h);
    ctx.restore();
  };
  const drawKnife = () => {
    const { x, y, a } = knife;
    const L = 250 * S, Wb = 15 * S;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
    // hoja: el punto de agarre es el centro del filo
    const bg = ctx.createLinearGradient(0, -Wb, 0, Wb * .3);
    bg.addColorStop(0, '#f4f6f8'); bg.addColorStop(.55, '#b9c0c8'); bg.addColorStop(1, '#7c848d');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(-L * .55, 0); ctx.lineTo(L * .45, 0); ctx.quadraticCurveTo(L * .5, -Wb * .6, L * .44, -Wb); ctx.lineTo(-L * .55, -Wb); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-L * .55, -.5); ctx.lineTo(L * .45, -.5); ctx.stroke();
    // alvéolos
    ctx.fillStyle = 'rgba(90,96,104,.35)';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-L * .4 + i * L * .09, -Wb * .45, 4 * S, 2.5 * S, 0, 0, 6.3); ctx.fill(); }
    // mango
    ctx.fillStyle = '#16110f'; ctx.beginPath(); ctx.roundRect(-L * .55 - 92 * S, -Wb * 1.1, 92 * S, Wb * 1.25, 6 * S); ctx.fill();
    ctx.fillStyle = '#c9a35b'; [0.25, .55, .8].forEach((f) => { ctx.beginPath(); ctx.arc(-L * .55 - 92 * S * f, -Wb * .48, 2.4 * S, 0, 6.3); ctx.fill(); });
    ctx.restore();
  };
  const drawTrail = (now) => {
    trail = trail.filter((p) => now - p.t < 260);
    if (trail.length < 2) return;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const f = 1 - (now - trail[i].t) / 260;
      ctx.strokeStyle = `rgba(255,246,230,${f * .7})`; ctx.lineWidth = 2 * f + .3;
      ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
    }
    ctx.restore();
  };

  /* --- loncha nueva a partir de la textura de la cara --- */
  const makeSlice = (sy) => {
    const [cx, cy] = P(face.x, face.y);
    const w = face.rx * S * 1.3, h = face.ry * S * .78;
    const c = document.createElement('canvas'); c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    const r = rng(Math.floor(performance.now()));
    // contorno irregular
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const t = i / 28 * Math.PI * 2;
      const wob = 1 + (r() - .5) * .14;
      pts.push([w / 2 + Math.cos(t) * (w / 2 - 3) * wob, h / 2 + Math.sin(t) * (h / 2 - 3) * (1 + (r() - .5) * .25) * (Math.sin(t) < 0 ? .9 : 1)]);
    }
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.save(); g.clip();
    // trozo de carne de la fila que se ha cortado
    const rel = clamp((sy - (cy - face.ry * S)) / (face.ry * 2 * S), .1, .9);
    if (meat) g.drawImage(meat, meat.width * .12, meat.height * (rel - .22), meat.width * .76, meat.height * .44, 0, 0, w, h);
    // franja de grasa
    const fg = g.createLinearGradient(0, 0, 0, h * .32);
    fg.addColorStop(0, 'rgba(248,238,222,.98)'); fg.addColorStop(.55, 'rgba(242,226,200,.85)'); fg.addColorStop(1, 'rgba(242,226,200,0)');
    g.fillStyle = fg; g.fillRect(0, 0, w, h * .32);
    // brillo
    const sh = g.createLinearGradient(0, 0, w, h);
    sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(.5, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.restore();
    g.strokeStyle = 'rgba(120,20,26,.6)'; g.lineWidth = 1; g.stroke();
    return { c, w, h };
  };

  const updateUI = () => {
    nEl.textContent = count;
    barEl.style.width = (count / MAX * 100) + '%';
  };
  const setTip = (txt) => {
    if (!motion) { tipEl.textContent = txt; return; }
    gsap.to(tipEl, { opacity: 0, y: -6, duration: .2, onComplete: () => { tipEl.textContent = txt; gsap.fromTo(tipEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .35 }); } });
  };

  const cut = (sy) => {
    if (done) return;
    const slot = placed.length + flying.length;
    if (slot >= MAX) return;
    const sl = makeSlice(sy);
    const [cx] = P(face.x, face.y);
    const s = slots[slot];
    flying.push({ sl, slot, t0: performance.now(), x0: cx, y0: sy, x1: plate.x + s.x, y1: plate.y + s.y, a0: face.rot, a1: s.a, len0: sl.w, len1: s.len });
    depth++; buildMeat();
    count++; updateUI();
    hint.classList.add('is-gone');
    if (count >= MAX) { done = true; setTip('¡Plato listo! Quince lonchas en roseta, como lo servimos en la terraza.'); }
    else setTip(TIPS[tipI++ % TIPS.length]);
    kick();
  };

  const reset = () => {
    placed = []; flying = []; count = 0; done = false; depth = 0; buildMeat(); updateUI();
    setTip(TIPS[0]); tipI = 1; kick();
  };

  /* --- puntero --- */
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', (e) => { down = true; cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); knife.tx = x; knife.ty = y; minX = Infinity; maxX = -Infinity; kick(); });
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e); knife.tx = x; knife.ty = y;
    const over = inFace(x, y, 1.08);
    knife.ta = over ? face.rot * .6 : -.25;
    if ((down || e.pointerType === 'mouse') && over) {
      // con ratón basta con pasar por encima con el botón pulsado; en táctil, arrastrar
      if (down) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        trail.push({ x, y, t: performance.now() });
        const now = performance.now();
        if (maxX - minX > face.rx * S * 1.05 && now - lastCut > 240) { lastCut = now; cut(y); minX = maxX = x; }
      }
    } else if (!over) { minX = Infinity; maxX = -Infinity; }
    kick();
  });
  const up = () => { down = false; minX = Infinity; maxX = -Infinity; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!down) { const [x, y] = P(470, 60); knife.tx = x; knife.ty = y; knife.ta = -.25; kick(); } });

  /* corte automático (botón / teclado) */
  const autoCut = () => {
    if (auto || done) { if (done) reset(); return; }
    const [cx, cy] = P(face.x, face.y);
    const row = cy + (Math.random() - .5) * face.ry * S * .9;
    auto = { t0: performance.now(), x0: cx - face.rx * S * .95, x1: cx + face.rx * S * .95, y: row };
    hint.classList.add('is-gone');
    kick();
  };
  $('#sliceBtn').addEventListener('click', autoCut);
  $('#plateBtn').addEventListener('click', reset);

  /* --- bucle --- */
  const frame = (now) => {
    raf = 0;
    if (auto) {
      const k = clamp((now - auto.t0) / 650, 0, 1), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      knife.tx = lerp(auto.x0, auto.x1, e); knife.ty = auto.y + Math.sin(k * Math.PI) * 6; knife.ta = face.rot * .6;
      trail.push({ x: knife.tx, y: knife.ty, t: now });
      if (k >= 1) { cut(auto.y); auto = null; }
    }
    knife.x = lerp(knife.x, knife.tx, .35); knife.y = lerp(knife.y, knife.ty, .35); knife.a = lerp(knife.a, knife.ta, .2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBoard(); drawHam(); drawPlate();
    placed.forEach((p) => drawSlice(p.sl, p.x, p.y, p.a, p.len));
    flying = flying.filter((f) => {
      const k = clamp((now - f.t0) / 900, 0, 1);
      const lift = clamp(k / .25, 0, 1), fly = clamp((k - .18) / .82, 0, 1);
      const e = 1 - (1 - fly) ** 3;
      const x = lerp(f.x0, f.x1, e), y = lerp(f.y0 - lift * 26, f.y1, e) - Math.sin(fly * Math.PI) * 70;
      const a = lerp(f.a0, f.a1, e), len = lerp(f.len0, f.len1, e), sc = 1 + Math.sin(fly * Math.PI) * .08;
      drawSlice(f.sl, x, y, a, len, sc);
      if (k >= 1) { placed.push({ sl: f.sl, slot: f.slot, x: f.x1, y: f.y1, a: f.a1, len: f.len1 }); return false; }
      return true;
    });
    drawTrail(now);
    drawKnife();
    const moving = auto || flying.length || trail.length || Math.abs(knife.x - knife.tx) > .5 || Math.abs(knife.y - knife.ty) > .5;
    if (visible && moving) kick();
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  layout();
  if (STATIC) { for (let i = 0; i < 9; i++) { const sl = makeSlice(P(face.x, face.y)[1] + (i - 4) * 6); const s = slots[i]; placed.push({ sl, slot: i, x: plate.x + s.x, y: plate.y + s.y, a: s.a, len: s.len }); } count = 9; updateUI(); }
  frame(performance.now());
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }).observe(wrap);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); kick(); }, 120); });
})();

/* ----------------------------------------------------------
   EL PRECINTO
   ---------------------------------------------------------- */
(() => {
  const box = $('#seals'); if (!box) return;
  const card = $('#sealCard');
  const tag = (c, ink) => `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 4c6 0 9 4 9 9v8l6 6c2 2 3 4 3 7v18c0 3-2 5-5 5H17c-3 0-5-2-5-5V34c0-3 1-5 3-7l6-6v-8c0-5 3-9 9-9z" fill="${c}" stroke="rgba(242,228,207,.35)"/><circle cx="30" cy="13" r="3.4" fill="#0E0B0A" stroke="rgba(242,228,207,.5)"/><path d="M19 40h22M19 46h14" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" opacity=".75"/></svg>`;
  box.innerHTML = SEALS.map((s, i) => `<button class="seal" type="button" role="tab" aria-selected="${i === 0}" data-i="${i}">${tag(s.c, s.ink)}<span><b>${s.n}</b><small>${s.s}</small></span></button>`).join('');
  const show = (i) => {
    const s = SEALS[i];
    $$('.seal', box).forEach((b, j) => b.setAttribute('aria-selected', j === i));
    card.style.setProperty('--seal', s.c === '#141110' ? '#6b6058' : s.c);
    $('#sealNo').textContent = `0${i + 1} · Precinto ${s.n.toLowerCase()}`;
    $('#sealT').textContent = s.t;
    $('#sealD').textContent = s.d;
    $('#sealDl').innerHTML = s.dl.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
    if (motion) gsap.fromTo(card.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, stagger: .05, ease: 'power3.out' });
  };
  box.addEventListener('click', (e) => { const b = e.target.closest('.seal'); if (b) show(+b.dataset.i); });
  show(0);
})();

/* sonido de los vídeos con voz */
$$('.phone__snd').forEach((b) => b.addEventListener('click', () => {
  const v = document.getElementById(b.dataset.snd);
  $$('video').forEach((o) => { if (o !== v) o.muted = true; });
  $$('.phone__snd').forEach((o) => { if (o !== b) { o.classList.remove('is-on'); o.querySelector('i').className = 'ph ph-speaker-slash'; } });
  v.muted = !v.muted; if (!v.muted) { v.currentTime = Math.max(0, v.currentTime); play(v); }
  b.classList.toggle('is-on', !v.muted);
  b.querySelector('i').className = v.muted ? 'ph ph-speaker-slash' : 'ph ph-speaker-high';
  b.setAttribute('aria-label', v.muted ? 'Activar sonido' : 'Silenciar');
}));
/* los vídeos solo se reproducen cuando se ven */
const vio = new IntersectionObserver((ens) => ens.forEach((en) => {
  const v = en.target;
  if (en.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; if (!reduced) play(v); }
  else v.pause();
}), { threshold: .35 });
$$('#precVid, #tiroVid').forEach((v) => vio.observe(v));

/* ----------------------------------------------------------
   LA VITRINA · carrusel arrastrable con inercia
   ---------------------------------------------------------- */
(() => {
  const glass = $('#glass'), track = $('#glassTrack'); if (!track) return;
  track.innerHTML = ITEMS.map((it, i) => `
    <article class="item" data-i="${i}" tabindex="0" role="button" aria-label="${it.t}: ver detalle">
      <div class="item__pic"><img src="assets/img/${it.img}" alt="${it.t}, ${it.s}" loading="lazy" draggable="false"><span class="item__tag">${it.tag}</span></div>
      <div class="label"><b>${it.t}</b><span>${it.s}</span></div>
    </article>`).join('');
  let x = 0, tx = 0, max = 0, dragging = false, sx = 0, sxx = 0, moved = 0, v = 0, lastX = 0, lastT = 0, raf = 0;
  const bar = $('#glBar');
  const measure = () => { max = Math.max(0, track.scrollWidth - glass.clientWidth); tx = clamp(tx, -max, 0); };
  const render = () => {
    raf = 0;
    if (!dragging) { tx += v; v *= .92; if (Math.abs(v) < .1) v = 0; }
    tx = clamp(tx, -max, 0);
    x = lerp(x, tx, reduced ? 1 : .14);
    track.style.transform = `translate3d(${x}px,0,0)`;
    const p = max ? -x / max : 0;
    const vis = glass.clientWidth / track.scrollWidth;
    bar.style.width = (vis * 100) + '%'; bar.style.transform = `translateX(${p * (1 / vis - 1) * 100}%)`;
    if (Math.abs(x - tx) > .3 || v || dragging) raf = requestAnimationFrame(render);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(render); };
  glass.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; sx = e.clientX; sxx = tx; v = 0; lastX = e.clientX; lastT = performance.now(); glass.classList.add('is-drag'); go(); });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
    tx = sxx + dx;
    const now = performance.now(); v = (e.clientX - lastX) / Math.max(1, now - lastT) * 16; lastX = e.clientX; lastT = now;
    go();
  });
  window.addEventListener('pointerup', () => { if (!dragging) return; dragging = false; glass.classList.remove('is-drag'); go(); });
  glass.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); tx -= e.deltaX; go(); } }, { passive: false });
  const step = () => (track.firstElementChild ? track.firstElementChild.offsetWidth + 22 : 300);
  $('#glPrev').addEventListener('click', () => { tx += step() * 1.5; v = 0; go(); });
  $('#glNext').addEventListener('click', () => { tx -= step() * 1.5; v = 0; go(); });
  // visor
  const lb = $('#lb');
  const open = (i) => { const it = ITEMS[i]; $('#lbImg').src = 'assets/img/' + it.img; $('#lbImg').alt = it.t; $('#lbT').textContent = it.t; $('#lbD').textContent = it.d; lb.hidden = false; if (lenis) lenis.stop(); $('.lb__close', lb).focus(); };
  const close = () => { lb.hidden = true; if (lenis) lenis.start(); };
  track.addEventListener('click', (e) => { const a = e.target.closest('.item'); if (a && moved < 6) open(+a.dataset.i); });
  track.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const a = e.target.closest('.item'); if (a) { e.preventDefault(); open(+a.dataset.i); } } });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb__close')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) close(); });
  window.addEventListener('resize', () => { measure(); go(); });
  window.addEventListener('load', () => { measure(); go(); });
  measure(); go();
})();

/* ----------------------------------------------------------
   MOSTRADOR · mazo de vídeos que se lanzan a un lado
   ---------------------------------------------------------- */
(() => {
  const deck = $('#deck'); if (!deck) return;
  const cards = DECK.map((d, i) => {
    const el = document.createElement('div');
    el.className = 'card' + (d.wide ? ' is-wide' : '');
    el.innerHTML = `<video muted loop playsinline preload="none" poster="assets/img/v-${d.v}.jpg" aria-label="${d.c}"><source src="assets/video/${d.v}.mp4" type="video/mp4"></video><span class="card__no">${String(i + 1).padStart(2, '0')}</span>`;
    deck.appendChild(el);
    return el;
  });
  let order = cards.map((_, i) => i);
  let inView = false;
  const layoutDeck = (anim = true) => {
    order.forEach((ci, pos) => {
      const el = cards[ci];
      el.style.zIndex = cards.length - pos;
      el.classList.toggle('is-top', pos === 0);
      const tf = { x: pos * 14, y: pos * -12, rotation: pos === 0 ? 0 : (pos % 2 ? 4 : -3) * Math.min(pos, 2), scale: 1 - pos * .045, opacity: pos > 3 ? 0 : 1 };
      if (hasGSAP && anim && !reduced) gsap.to(el, { ...tf, duration: .6, ease: 'power3.out' });
      else el.style.transform = `translate(${tf.x}px,${tf.y}px) rotate(${tf.rotation}deg) scale(${tf.scale})`, el.style.opacity = tf.opacity;
      const v = el.querySelector('video');
      if (pos === 0 && inView) { if (v.preload === 'none') v.preload = 'auto'; if (!reduced) play(v); } else v.pause();
    });
    const top = order[0];
    $('#deckNo').textContent = String(top + 1).padStart(2, '0');
    $('#deckCap').textContent = DECK[top].c;
  };
  const next = (dir = 1) => {
    const el = cards[order[0]];
    const finish = () => { order.push(order.shift()); layoutDeck(); };
    if (hasGSAP && !reduced) gsap.to(el, { x: dir * 520, rotation: dir * 22, opacity: 0, duration: .45, ease: 'power2.in', onComplete: () => { gsap.set(el, { opacity: 0 }); finish(); } });
    else finish();
  };
  const prev = () => { order.unshift(order.pop()); const el = cards[order[0]]; if (hasGSAP && !reduced) gsap.fromTo(el, { x: -520, rotation: -20, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: .5, ease: 'power3.out' }); layoutDeck(); };
  $('#deckNext').addEventListener('click', () => next(1));
  $('#deckPrev').addEventListener('click', prev);
  // arrastre de la carta de arriba
  let drag = null;
  deck.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.card.is-top'); if (!el) return;
    drag = { el, sx: e.clientX, sy: e.clientY, dx: 0 }; el.setPointerCapture(e.pointerId);
    if (hasGSAP) gsap.killTweensOf(el);
  });
  deck.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.dx = e.clientX - drag.sx; const dy = (e.clientY - drag.sy) * .3;
    drag.el.style.transform = `translate(${drag.dx}px,${dy}px) rotate(${drag.dx * .06}deg)`;
  });
  const end = () => {
    if (!drag) return;
    const { el, dx } = drag; drag = null;
    if (Math.abs(dx) > 110) next(Math.sign(dx));
    else if (hasGSAP) gsap.to(el, { x: 0, y: 0, rotation: 0, duration: .5, ease: 'back.out(1.6)', clearProps: 'transform', onComplete: () => layoutDeck(false) });
    else layoutDeck(false);
  };
  deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', end);
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; layoutDeck(false); }, { threshold: .3 }).observe(deck);
  layoutDeck(false);
})();

/* ----------------------------------------------------------
   RESEÑAS
   ---------------------------------------------------------- */
(() => {
  const qs = $$('#quotes .q'), dots = $('#qDots'); if (!qs.length) return;
  dots.innerHTML = qs.map((_, i) => `<button type="button" aria-label="Reseña ${i + 1}"${i ? '' : ' class="is-on"'}></button>`).join('');
  let i = 0, timer;
  const show = (n) => { i = (n + qs.length) % qs.length; qs.forEach((q, j) => q.classList.toggle('is-on', j === i)); $$('button', dots).forEach((d, j) => d.classList.toggle('is-on', j === i)); };
  const auto = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => show(i + 1), 6000); };
  dots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { show($$('button', dots).indexOf(b)); auto(); } });
  auto();
})();

/* ----------------------------------------------------------
   APARICIONES
   ---------------------------------------------------------- */
if (motion) {
  $$('.sec-head, .seal-card, .tiro, .mostrador__copy, .pizarra, .tz, .resenas__big, .visita__copy, .visita__pic, .corte__side').forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
  gsap.from('.item', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: '#glass', start: 'top 85%' } });
  gsap.from('.foot__big', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.foot', start: 'top 90%' } });
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
})();
