/* motion engine: entrance once, scroll-linked both ways, nothing hidden without it */
(function () {
  var d = document, h = d.documentElement, W = window;
  var mq = function (q) { return W.matchMedia && W.matchMedia(q).matches; };
  var on = h.classList.contains('m-on');
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };

  /* strip + header height -> --top-h */
  var top = d.querySelector('.top');
  function setTop() { if (top) h.style.setProperty('--top-h', top.offsetHeight + 'px'); }
  setTop();
  if (top && W.ResizeObserver) new ResizeObserver(setTop).observe(top);

  /* menu: close on item, Esc */
  var menu = d.querySelector('details.menu');
  if (menu) {
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.open = false; });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  }

  /* map on click */
  $$('[data-map]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var box = b.closest('.map'), f = d.createElement('iframe');
      f.src = b.getAttribute('data-map'); f.title = b.getAttribute('data-title') || 'Карта';
      f.loading = 'lazy'; f.setAttribute('allowfullscreen', '');
      box.innerHTML = ''; box.appendChild(f); box.classList.add('loaded');
    });
  });

  if (!on) return;
  h.classList.add('m-ready');

  /* split headings into masked words (child span classes kept on the word) */
  $$('[data-words]').forEach(function (el) {
    var t = el.textContent.trim().replace(/\s+/g, ' '), out = [], k = 0;
    Array.prototype.forEach.call(el.childNodes, function (n) {
      var cls = n.nodeType === 1 ? ' ' + n.className : '';
      (n.textContent.trim() ? n.textContent.trim().split(/\s+/) : []).forEach(function (w) {
        out.push('<span class="w' + cls + '"><span class="wi" style="--wi:' + (k++) + '">' + esc(w) + '</span></span>');
      });
    });
    el.innerHTML = '<span class="sr">' + esc(t) + '</span><span aria-hidden="true">' + out.join(' ') + '</span>';
  });
  /* glow paragraph */
  var lit = $$('[data-lit]').map(function (el) {
    var t = el.textContent.trim().replace(/\s+/g, ' ');
    el.innerHTML = '<span class="sr">' + esc(t) + '</span><span aria-hidden="true">' +
      t.split(' ').map(function (w) { return '<span class="lw">' + esc(w) + '</span>'; }).join(' ') + '</span>';
    return { el: el, ws: $$('.lw', el) };
  });
  /* stagger index from parent */
  $$('[data-stagger]').forEach(function (p) { Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); }); });

  /* marks: aria-hidden twin assembles from noise */
  var NO = '·:+/×#=-|';
  function noise(t) { return t.replace(/\S/g, function () { return NO[(Math.random() * NO.length) | 0]; }); }
  $$('[data-marks] .tw').forEach(function (tw) { tw.setAttribute('data-t', tw.textContent); tw.textContent = noise(tw.textContent); });
  function marks(el) {
    var tw = el.querySelector('.tw'); if (!tw || tw._done) return; tw._done = 1;
    var fin = tw.getAttribute('data-t'), t0 = 0;
    function step(ts) {
      if (!t0) t0 = ts; var p = clamp((ts - t0) / 750), n = Math.floor(fin.length * p), s = fin.slice(0, n);
      for (var i = n; i < fin.length; i++) s += fin[i] === ' ' ? ' ' : NO[(Math.random() * NO.length) | 0];
      tw.textContent = s; if (p < 1) requestAnimationFrame(step); else tw.textContent = fin;
    }
    setTimeout(function () { requestAnimationFrame(step); }, parseInt(el.getAttribute('data-marks'), 10) || 0);
  }

  function show(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    if (el.hasAttribute('data-marks')) marks(el);
  }
  /* curtain cleanup: frame ends uncropped */
  d.addEventListener('transitionend', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('cur') && t.classList.contains('in') && e.propertyName === 'clip-path') {
      setTimeout(function () { t.classList.add('done'); }, 320);
    }
  });

  var sel = '[data-rv],[data-words]:not([data-hero]),[data-lead],[data-marks]:not([data-hero])';
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$(sel).forEach(function (el) { if (!el.closest('[data-hero]') || el.hasAttribute('data-rv-free')) io.observe(el); });

  /* sweep: everything above the bottom of the screen is shown */
  function sweep() {
    var vh = innerHeight;
    $$(sel).forEach(function (el) { if (el.classList.contains('in') || el.closest('[data-hero]:not(.in)')) return; var r = el.getBoundingClientRect(); if (r.top < vh && r.left < innerWidth) show(el); });
  }
  function sweepAll() { $$(sel + ',[data-hero]').forEach(show); $$('[data-tone]').forEach(function (s) { s.classList.add('toned'); }); }
  W.addEventListener('hashchange', function () { setTimeout(sweep, 60); });
  W.addEventListener('load', sweep);
  W.addEventListener('beforeprint', sweepAll);

  /* hero intro chain: 300ms after DOMContentLoaded */
  function intro() {
    setTimeout(function () {
      $$('[data-hero]').forEach(function (el) { show(el); $$('[data-words],[data-rv],[data-marks]', el).forEach(show); });
      sweep();
    }, 300);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', intro); else intro();

  /* lanes (>=900 only) */
  var lanes = $$('[data-lane]').map(function (s) {
    return { s: s, track: s.querySelector('.lane-track'), view: s.querySelector('.lane-view'), clip: s.querySelector('.lane-clip') || s.querySelector('.lane-view'), bar: s.querySelector('.lane-bar i'), max: parseFloat(s.getAttribute('data-lane')) || 0 };
  });
  function layoutLanes() {
    var wide = mq('(min-width: 900px)');
    lanes.forEach(function (L) {
      if (!wide) { L.s.classList.remove('lane-on'); L.s.style.height = ''; L.track.style.translate = ''; L.dist = 0; return; }
      L.s.classList.add('lane-on');
      L.s.style.height = '';
      var over = Math.max(0, L.track.scrollWidth - L.clip.clientWidth);
      L.over = over;
      L.dist = L.max ? Math.min(over, innerHeight * L.max) : over;
      L.s.style.height = (L.view.offsetHeight + L.dist) + 'px';
    });
  }
  /* stacks */
  var stacks = $$('[data-stack]').map(function (s) { return $$(':scope > .card', s); });
  var panels = $$('[data-panel]');
  var tones = $$('[data-tone]');

  var ticking = false;
  function update() {
    ticking = false;
    var vh = innerHeight;
    lit.forEach(function (L) {
      var r = L.el.getBoundingClientRect(), p = clamp((vh * 0.88 - r.top) / (vh * 0.5)), n = L.ws.length;
      L.ws.forEach(function (w, i) { w.style.opacity = (0.25 + 0.75 * clamp(p * n - i)).toFixed(3); });
    });
    stacks.forEach(function (cs) {
      cs.forEach(function (c, i) {
        var nx = cs[i + 1]; if (!nx || c.closest('.lane-on') || getComputedStyle(c).position !== 'sticky') { c.style.scale = ''; return; }
        var a = c.getBoundingClientRect(), b = nx.getBoundingClientRect();
        var cov = clamp(1 - (b.top - a.top) / Math.max(1, a.height));
        c.style.scale = (1 - 0.06 * cov).toFixed(4);
      });
    });
    lanes.forEach(function (L) {
      if (!L.dist) { if (L.bar) L.bar.style.scale = ''; return; }
      var r = L.s.getBoundingClientRect(), p = clamp(-(r.top - (parseFloat(getComputedStyle(h).getPropertyValue('--top-h')) || 0)) / L.dist);
      L.track.style.translate = (-L.over * p).toFixed(1) + 'px 0';
      if (L.bar) L.bar.style.scale = p.toFixed(4) + ' 1';
    });
    panels.forEach(function (p) {
      var r = p.getBoundingClientRect(), k = clamp((vh - r.top) / (vh * 0.6));
      p.style.setProperty('--fx', (48 * (1 - k)).toFixed(1) + 'px');
    });
    tones.forEach(function (s) { if (s.getBoundingClientRect().top < vh * 0.75) s.classList.add('toned'); });
    sweep();
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  W.addEventListener('scroll', req, { passive: true });
  var rw = innerWidth;
  W.addEventListener('resize', function () {
    if (mq('(pointer: coarse)') && Math.abs(innerWidth - rw) < 2) return; /* toolbar resize */
    rw = innerWidth; layoutLanes(); req();
  });
  W.addEventListener('load', function () { layoutLanes(); req(); });
  layoutLanes(); update();

  /* cursor: light spot + tilt (fine pointer only) */
  if (mq('(hover: hover) and (pointer: fine)')) {
    var spot = d.querySelector('.spot'), tilts = $$('[data-tilt]'), mx = 0, my = 0, busy = false;
    h.classList.add('fine');
    W.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (busy) return; busy = true;
      requestAnimationFrame(function () {
        busy = false;
        if (spot) spot.style.transform = 'translate(' + (mx - 300) + 'px,' + (my - 300) + 'px)';
        tilts.forEach(function (t) {
          var r = t.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
          var x = clamp((mx - r.left) / r.width) - 0.5, y = clamp((my - r.top) / r.height) - 0.5;
          t.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg)';
        });
      });
    }, { passive: true });
  }
})();
