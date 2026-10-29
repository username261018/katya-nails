/* Katya. nails · motion engine (vanilla, no deps) */
(function () {
var d = document, h = d.documentElement, W = window;
var on = h.classList.contains('m-on');
var top = d.querySelector('.top');
function setTop() { if (top) h.style.setProperty('--top-h', top.offsetHeight + 'px'); }
setTop();
if (W.ResizeObserver && top) new ResizeObserver(setTop).observe(top);
var menu = d.querySelector('.menu');
if (menu) {
menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.removeAttribute('open'); });
d.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.removeAttribute('open'); });
d.addEventListener('keydown', function (e) {
if (e.key === 'Escape' && menu.open) { menu.removeAttribute('open'); menu.querySelector('summary').focus(); }
});
}
[].forEach.call(d.querySelectorAll('[data-embed]'), function (a) {
a.addEventListener('click', function (e) {
e.preventDefault();
var box = a.closest('.map'), f = d.createElement('iframe');
f.src = a.getAttribute('data-embed');
f.title = a.getAttribute('data-title') || 'Карта';
f.setAttribute('allowfullscreen', '');
box.textContent = ''; box.appendChild(f); box.classList.add('map-on');
});
});
if (!on) return;
h.classList.add('m-ready');
function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
[].forEach.call(d.querySelectorAll('[data-words]'), function (el) {
var t = el.textContent.replace(/\s+/g, ' ').trim(), ws = t.split(' ');
if (ws.length > 8) { el.removeAttribute('data-words'); return; }
el.innerHTML = '<span class="sr">' + esc(t) + '</span><span aria-hidden="true">' +
ws.map(function (w, i) { return '<span class="w"><span class="wi" style="--i:' + i + '">' + esc(w) + '</span></span>'; }).join(' ') + '</span>';
});
[].forEach.call(d.querySelectorAll('[data-stagger]'), function (p) {
var n = +p.getAttribute('data-stagger') || 6;
[].forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i % n); });
});
var lights = [].slice.call(d.querySelectorAll('[data-light]'));
lights.forEach(function (el) {
var ws = el.textContent.replace(/\s+/g, ' ').trim().split(' ');
el.innerHTML = '<span class="sr">' + esc(ws.join(' ')) + '</span><span aria-hidden="true">' +
ws.map(function (w) { return '<span class="lw">' + esc(w) + '</span>'; }).join(' ') + '</span>';
el._w = el.querySelectorAll('.lw');
});
function light() {
var vh = W.innerHeight;
lights.forEach(function (el) {
var r = el.getBoundingClientRect();
var p = (vh * 0.9 - r.top) / (r.height + vh * 0.35);
p = p < 0 ? 0 : p > 1 ? 1 : p;
var n = Math.round(p * el._w.length);
for (var i = 0; i < n; i++) el._w[i].classList.add('lit');
});
}
var NOISE = '·/+|×:-=';
function marks(el) {
if (el._mk) return; el._mk = 1;
var t = el.textContent, tw = d.createElement('span'), rl = d.createElement('span');
rl.className = 'mk-r'; rl.textContent = t; el.textContent = ''; el.appendChild(rl);
tw.className = 'mk'; tw.setAttribute('aria-hidden', 'true');
el.classList.add('mk-run'); el.appendChild(tw);
var t0 = performance.now(), dur = 650;
(function step(now) {
var k = Math.min(1, (now - t0) / dur), n = Math.floor(k * t.length), s = t.slice(0, n);
for (var i = n; i < t.length; i++) s += t[i] === ' ' ? ' ' : NOISE[(i + Math.floor(now / 60)) % NOISE.length];
tw.textContent = s;
if (k < 1) requestAnimationFrame(step); else { el.classList.remove('mk-run'); tw.remove(); }
})(t0);
setTimeout(function () { el.classList.remove('mk-run'); if (tw.parentNode) tw.remove(); }, 1500);
}
var els = [].slice.call(d.querySelectorAll('[data-rv],[data-words],[data-marks]'));
function show(el) {
if (el.classList.contains('in')) return;
el.classList.add('in');
if (el.hasAttribute('data-marks')) marks(el);
if (el.getAttribute('data-rv') === 'curtain') {
var done = function () { el.classList.add('done'); };
el.addEventListener('transitionend', done, { once: true });
setTimeout(done, 1800);
}
}
var io = 'IntersectionObserver' in W ? new IntersectionObserver(function (es) {
es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }) : null;
els.forEach(function (el) { io ? io.observe(el) : show(el); });
function sweep() {
var vh = W.innerHeight;
els.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh) show(el); });
light();
}
var ticking = 0;
function onScroll() { if (!ticking) { ticking = 1; requestAnimationFrame(function () { ticking = 0; sweep(); }); } }
W.addEventListener('scroll', onScroll, { passive: true });
W.addEventListener('resize', onScroll);
W.addEventListener('hashchange', function () { setTimeout(sweep, 60); });
W.addEventListener('load', sweep);
W.addEventListener('beforeprint', function () { els.forEach(show); lights.forEach(function (el) { [].forEach.call(el._w, function (w) { w.classList.add('lit'); }); }); });
sweep();
var tones = d.querySelectorAll('[data-tone]');
if (tones.length && io) {
var tio = new IntersectionObserver(function (es) {
es.forEach(function (e) { if (e.isIntersecting) h.setAttribute('data-t', e.target.getAttribute('data-tone')); });
}, { rootMargin: '-48% 0px -48% 0px' });
[].forEach.call(tones, function (s) { tio.observe(s); });
}
if (W.matchMedia('(hover:hover) and (pointer:fine)').matches) {
var spot = d.querySelector('.spot'), tilts = d.querySelectorAll('[data-tilt]'), x = 0, y = 0, raf = 0;
if (spot) spot.classList.add('spot-on');
d.addEventListener('pointermove', function (e) {
x = e.clientX; y = e.clientY;
if (!raf) raf = requestAnimationFrame(function () {
raf = 0;
if (spot) spot.style.transform = 'translate(' + (x - 300) + 'px,' + (y - 300) + 'px)';
[].forEach.call(tilts, function (t) {
var r = t.getBoundingClientRect();
if (r.bottom < 0 || r.top > W.innerHeight) return;
var dx = (x - r.left - r.width / 2) / W.innerWidth, dy = (y - r.top - r.height / 2) / W.innerHeight;
t.style.transform = 'perspective(900px) rotateY(' + (dx * 8).toFixed(2) + 'deg) rotateX(' + (-dy * 6).toFixed(2) + 'deg)';
});
});
}, { passive: true });
}
})();
