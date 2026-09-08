/* ============================================================
   AURA fx.js — премиальные микроанимации v5
   reveal-on-scroll (stagger), заголовки по буквам, параллакс,
   лёгкий 3D-tilt галереи. Чтит prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  if (!reduced) root.classList.add('fx');

  /* ---------- 1. Появление при скролле ---------- */
  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('.card, .actcard, .hub-tile, .revcard, .step, .svc, .perk, .pass-feat, .stat, .infocard, .checkrow, .mini-banner, .act-banner, .live, .chkstep, .plan-step, .disc, .brand, .a-tab'));
    if (!els.length || reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el, i) {
      if (!el.classList.contains('in')) el.classList.add('rv');
      el.style.setProperty('--d', ((i % 10) * 55) + 'ms');
      if (el.getBoundingClientRect().top < window.innerHeight * .9) {
        // сразу показываем то, что в первом экране
        requestAnimationFrame(function () { el.classList.add('in'); });
      } else {
        io.observe(el);
      }
    });
  }

  /* ---------- 2. Заголовки по буквам ---------- */
  function splitText(el) {
    if (!el || el.dataset.spl) return;
    var frag = document.createDocumentFragment();
    var nodes = [].slice.call(el.childNodes);
    var idx = 0;
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        var text = node.nodeValue;
        for (var i = 0; i < text.length; i++) {
          var ch = text.charAt(i);
          if (ch === ' ') { frag.appendChild(makeSpan('hsp', ' ')); }
          else {
            var s = makeSpan('hl', ch);
            s.style.setProperty('--c', (idx * 26) + 'ms');
            frag.appendChild(s); idx++;
          }
        }
      } else if (node.nodeType === 1) {
        // вложенный <em>/<span> — обрабатываем как единый «тяжёлый» фрагмент
        var wrap = node.cloneNode(false);
        var txt = node.textContent || '';
        for (var k = 0; k < txt.length; k++) {
          var c2 = txt.charAt(k);
          if (c2 === ' ') wrap.appendChild(makeSpan('hsp', ' '));
          else { var s2 = makeSpan('hl', c2); s2.style.setProperty('--c', (idx * 26) + 'ms'); wrap.appendChild(s2); idx++; }
        }
        frag.appendChild(wrap);
      }
    });
    el.dataset.spl = '1';
    el.innerHTML = '';
    el.appendChild(frag);
  }
  function makeSpan(cls, txt) {
    var s = document.createElement('span');
    s.className = cls;
    s.textContent = txt;
    return s;
  }
  function playSplit(el) {
    splitText(el);
    var chars = el.querySelectorAll('.hl');
    if (!chars.length) return;
    chars.forEach(function (c) { c.classList.remove('on'); void c.offsetWidth; });
    requestAnimationFrame(function () {
      chars.forEach(function (c, i) { setTimeout(function () { c.classList.add('on'); }, i * 18); });
    });
  }
  window.__auraSplit = playSplit;

  function initHeadings() {
    var els = [].slice.call(document.querySelectorAll('.pagetitle'));
    if (reduced) return;
    els.forEach(function (el) { playSplit(el); });
    // крупные hero/h1-заголовки не разбиваем по буквам (клипались) — у них каскадный вход heroUp
  }

  /* ---------- 3. Параллакс декора ---------- */
  function initParallax() {
    var arts = [].slice.call(document.querySelectorAll('.hs-art, .hub-hero > div:last-child, .act-hero .a-big'));
    if (!arts.length || reduced) return;
    var ticking = false;
    function move() {
      var vh = window.innerHeight;
      arts.forEach(function (a) {
        var r = a.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var off = (r.top + r.height / 2 - vh / 2) / vh;      // -0.5..0.5
        var y = off * -34, x = off * 10;
        a.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(move); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    move();
  }

  /* ---------- 4. Лёгкий tilt главного фото товара ---------- */
  function initTilt() {
    if (reduced || !window.matchMedia('(hover:hover)').matches) return;
    var bigs = [].slice.call(document.querySelectorAll('.gallery .big'));
    bigs.forEach(function (big) {
      var inner = big.querySelector('svg');
      if (!inner) return;
      var r = null;
      big.addEventListener('mousemove', function (e) {
        var b = big.getBoundingClientRect();
        var px = (e.clientX - b.left) / b.width - .5;
        var py = (e.clientY - b.top) / b.height - .5;
        inner.style.transform = 'rotateX(' + (-py * 9).toFixed(2) + 'deg) rotateY(' + (px * 11).toFixed(2) + 'deg) scale(1.045)';
      });
      big.addEventListener('mouseleave', function () {
        inner.style.transform = '';
      });
    });
  }

  /* ---------- 5. Плавающий «Заказать звонок» ---------- */
  function initCallback() {
    if (document.getElementById('callback-btn')) return;
    var PHONE = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4z"/></svg>';
    var btn = document.createElement('button');
    btn.id = 'callback-btn';
    btn.className = 'callback-btn';
    btn.setAttribute('aria-label', 'Заказать звонок');
    btn.innerHTML = PHONE;
    document.body.appendChild(btn);
    var pop = document.createElement('div');
    pop.className = 'callback-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Заказать звонок');
    pop.innerHTML =
      '<button class="cb-close" aria-label="Закрыть">×</button>' +
      '<h4>Заказать звонок</h4>' +
      '<p class="cb-sub">Оставьте номер — перезвоним в течение 15 минут в рабочее время.</p>' +
      '<input type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" aria-label="Телефон">' +
      '<button class="btn btn-p" type="button">Жду звонка</button>' +
      '<div class="cb-links"><a href="tel:+74964640307">Позвонить сейчас</a><a href="https://wa.me/79167609142">Написать в WhatsApp</a></div>';
    document.body.appendChild(pop);
    function toggle(open) { pop.classList.toggle('show', open); if (open) { var i = pop.querySelector('input'); if (i) i.focus(); } }
    btn.addEventListener('click', function () { toggle(!pop.classList.contains('show')); });
    pop.querySelector('.cb-close').addEventListener('click', function () { toggle(false); });
    pop.querySelector('.btn').addEventListener('click', function () {
      var i = pop.querySelector('input'), v = i ? i.value.trim() : '';
      if (!v || v.replace(/\D/g, '').length < 6) { i && i.focus(); return; }
      var b = pop.querySelector('.btn');
      b.textContent = '✓ Заявка принята';
      b.classList.add('disabled');
      setTimeout(function () { toggle(false); b.textContent = 'Жду звонка'; b.classList.remove('disabled'); }, 1600);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- init ---------- */
  function init() {
    initReveal();
    initHeadings();
    initParallax();
    initTilt();
    initCallback();
    // повторная обработка динамически вставленных карточек
    setTimeout(initReveal, 700);
    window.addEventListener('load', function () { setTimeout(initReveal, 120); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
