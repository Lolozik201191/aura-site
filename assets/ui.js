/* ============================================================
   AURA ui.js — интерактив макетов: меню, фильтры, карусели,
   fade-in, лайтбокс, «недавно смотрели», тосты, счётчик корзины
   ============================================================ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
  var E = '</svg>';
  var IC = {
    arrow: S + '<path d="M4 12h15M14 6.5L19.5 12 14 17.5"/>' + E,
    close: S + '<path d="M6 6l12 12M18 6L6 18"/>' + E,
    search: S + '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>' + E,
    zoom: S + '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5M10.5 7.5v6M7.5 10.5h6"/>' + E,
    heart: S + '<path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8C20.5 15 12 20.5 12 20.5z"/>' + E,
    ringPic: '<svg viewBox="0 0 200 200" fill="none" stroke="#C4A06A" stroke-width="4" stroke-linecap="round"><circle cx="100" cy="118" r="50"/><path d="M100 118V68M100 68l16 8-7 22-19 4M100 68l-16 8 7 22 19 4"/><path d="M100 68v-12"/></svg>'
  };

  /* Закрытие панели фильтров из любого модуля: buildFiltersUI публикует
     свой внутренний обработчик как window.__filtersToggle. Трогаем
     шторку, только если она открыта, чтобы не гасить оверлей drawer. */
  function sheetClose() {
    if (!window.__filtersToggle) return;
    var f = document.querySelector('.filters');
    if (f && f.classList.contains('open')) window.__filtersToggle(false);
  }

  function toast(text) {
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.innerHTML = '<span>' + IC.ringPic + '</span><span style="font-size:0">.</span>' + text;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  /* ---------- 1. Счётчик корзины ---------- */
  function bumpCart() {
    var cnt = document.querySelector('.icons .cnt, .header .cnt');
    if (!cnt) return;
    var n = parseInt(cnt.textContent, 10) || 0;
    cnt.textContent = n + 1;
    cnt.classList.remove('bump');
    void cnt.offsetWidth;
    cnt.classList.add('bump');
  }

  /* ---------- 2. Бургер + выезжающая панель + поиск ---------- */
  function buildHeaderUI() {
    var header = document.querySelector('.header');
    if (!header) return;
    var wrap = header.querySelector('.wrap');

    // бургер
    if (!document.getElementById('burger')) {
      var burger = document.createElement('button');
      burger.id = 'burger';
      burger.className = 'burger';
      burger.setAttribute('aria-label', 'Открыть меню');
      burger.innerHTML = '<span></span><span></span><span></span>';
      var hw = header.querySelector('.wrap'); (hw || header).insertBefore(burger, (hw || header).firstChild);
      burger.addEventListener('click', function () { toggleDrawer(true); });
    }
    // drawer
    if (!document.getElementById('drawer')) {
      var drawer = document.createElement('aside');
      drawer.id = 'drawer';
      drawer.className = 'drawer';
      drawer.setAttribute('aria-label', 'Меню');
      var navLinks = Array.prototype.map.call(document.querySelectorAll('.nav a'), function (a) {
        return '<a href="' + (a.getAttribute('href') || '#') + '">' + a.textContent + '</a>';
      }).join('');
      drawer.innerHTML =
        '<div class="d-head"><span class="logo" style="opacity:.85">' + (wrap.querySelector('.logo') ? wrap.querySelector('.logo').innerHTML : 'AURA') + '</span>' +
        '<button class="d-close" aria-label="Закрыть меню">' + IC.close + '</button></div>' +
        '<nav class="d-nav">' + navLinks + '</nav>' +
        '<div class="d-sub"><b>Салоны</b>' +
        '<a href="salon.html">Раменское · 2 салона</a><a href="salon.html">Ногинск · Воскресенск · Егорьевск</a><a href="salon.html">Луховицы · Озёры · Электрогорск</a>' +
        '<b>Покупателям</b>' +
        '<a href="passport.html">Паспорт украшения</a><a href="promotions.html">Старое на новое</a>' +
        '<a href="delivery.html">Доставка и оплата</a><a href="return.html">Возврат и обмен</a></div>' +
        '<div class="d-foot"><div class="d-city">Ювелирный дом AURA · Московская область</div>' +
        '<a class="d-phone" href="tel:+74964640307">+7 (496) 464-03-07 · офис</a>' +
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
        '<a class="fbtn" href="http://vk.com/jewelry_aura">VK</a>' +
        '<a class="fbtn" href="https://www.instagram.com/juvelirnyiaura/">Instagram</a></div></div>';
      document.body.appendChild(drawer);
      drawer.querySelector('.d-close').addEventListener('click', function () { toggleDrawer(false); });
    }
    // overlay
    if (!document.getElementById('ovl')) {
      var ovl = document.createElement('div');
      ovl.id = 'ovl';
      ovl.className = 'overlay';
      document.body.appendChild(ovl);
      ovl.addEventListener('click', function () { toggleDrawer(false); sheetClose(); });
    }
    // поиск-иконка на мобильном + панель
    if (!document.getElementById('qbar')) {
      var q = document.createElement('div');
      q.id = 'qbar';
      q.className = 'qbar';
      q.innerHTML = '<input type="search" placeholder="Поиск: кольцо, серьги, подвеска…" aria-label="Поиск">' +
        '<button class="ic" aria-label="Искать">' + IC.arrow + '</button>' +
        '<button class="ic q-close" aria-label="Закрыть поиск">' + IC.close + '</button>';
      document.body.appendChild(q);
      var inp = q.querySelector('input');
      q.querySelector('.q-close').addEventListener('click', function () { toggleQ(false); });
      q.querySelector('.ic:not(.q-close)').addEventListener('click', goSearch);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') goSearch(); });
      var mq = window.matchMedia('(max-width: 768px)');
      function refresh() {
        var btn = document.querySelector('.q-open');
        if (mq.matches) {
          if (!btn) {
            var b = document.createElement('button');
            b.className = 'ic q-open';
            b.setAttribute('aria-label', 'Поиск');
            b.innerHTML = IC.search || (S + '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>' + E);
            var icons = document.querySelector('.icons');
            if (icons) icons.insertBefore(b, icons.firstChild);
            b.addEventListener('click', function () { toggleQ(true); });
          }
        } else if (btn) { btn.remove(); toggleQ(false); }
      }
      refresh();
      if (mq.addEventListener) mq.addEventListener('change', refresh); else mq.addListener(refresh);
    }
    function goSearch() {
      var v = (document.querySelector('#qbar input').value || '').trim();
      toggleQ(false);
      window.location = v ? 'catalog.html?q=' + encodeURIComponent(v) : 'catalog.html';
    }
    function toggleQ(open) {
      var bar = document.getElementById('qbar');
      if (!bar) return;
      bar.classList.toggle('open', open);
      if (open) bar.querySelector('input').focus();
    }
    function toggleDrawer(open) {
      var d = document.getElementById('drawer'), o = document.getElementById('ovl'),
          b = document.getElementById('burger');
      if (d) d.classList.toggle('open', open);
      if (o) o.classList.toggle('show', open);
      if (b) b.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      sheetClose();
    }
    // esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { toggleDrawer(false); toggleQ(false); sheetClose(); if (window.closeLb) window.closeLb(); }
    });
    // выбранный пункт меню
    document.querySelectorAll('.drawer .d-nav a, .drawer .d-sub a').forEach(function (a) {
      if (a.getAttribute('href') === location.pathname.split('/').pop()) a.style.color = 'var(--emerald)';
    });
    // клик по бургеру вне
  }

  /* ---------- 3. Мобильные фильтры (выдвижная панель) ---------- */
  function buildFiltersUI() {
    var filters = document.querySelector('.filters');
    if (!filters) return;
    // заголовок фильтров, чтобы работала кнопка
    var h6 = filters.querySelector('h6');
    var reset = h6 ? h6.querySelector('a') : null;
    // кнопка «Фильтры» в тулбаре
    var toolbar = document.querySelector('.toolbar');
    if (toolbar && !document.querySelector('.btn-filters')) {
      var fbtn = document.createElement('button');
      fbtn.className = 'btn btn-g btn-filters';
      fbtn.textContent = 'Фильтры';
      toolbar.insertBefore(fbtn, toolbar.firstChild);
      fbtn.addEventListener('click', function () { closeFilters(true); });
    }
    // панель: маркер-«ручка»
    var grip = document.createElement('div');
    grip.style.cssText = 'height:5px;width:44px;border-radius:99px;background:var(--line);margin:8px auto 2px;display:none';
    filters.insertBefore(grip, filters.firstChild);
    // закрепляем заголовок поверх
    if (h6) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0 2px;position:sticky;top:0;background:var(--bg-2);z-index:2';
      var title = document.createElement('h6');
      title.textContent = 'Фильтры';
      var close = document.createElement('button');
      close.className = 'd-close';
      close.setAttribute('aria-label', 'Закрыть фильтры');
      close.innerHTML = IC.close;
      close.style.cssText = 'width:38px;height:38px';
      close.addEventListener('click', function () { closeFilters(false); });
      row.appendChild(title); row.appendChild(close);
      filters.insertBefore(row, filters.firstChild);
      if (h6.parentNode === filters) h6.remove();
    }
    function closeFilters(open) {
      var openNow = !!open;
      filters.classList.toggle('open', openNow);
      document.body.classList.toggle('sheet-open', openNow);
      document.getElementById('ovl').classList.toggle('show', openNow);
      grip.style.display = openNow ? 'block' : 'none';
    }
    window.__filtersToggle = closeFilters;
    // сворачивание групп
    filters.querySelectorAll('.fgroup').forEach(function (g) {
      var fh = g.querySelector('.fh');
      if (fh) fh.addEventListener('click', function () { g.classList.toggle('collapsed'); });
    });
    // сброс по клику
    document.querySelectorAll('.filters-reset, .chipghost').forEach(function (el) {
      el.addEventListener('click', function () {
        filters.querySelectorAll('.fopt input').forEach(function (i) { i.checked = false; });
      });
    });
    // смена активного чипа города и города в шапке не реализуем (мок)
  }

  /* ---------- 4. Карусели ---------- */
  function buildCarousels() {
    document.querySelectorAll('.crl').forEach(function (crl) {
      if (crl.classList.contains('crl-built')) return;
      crl.classList.add('crl-built');
      var view = document.createElement('div');
      view.className = 'crl-view';
      var track = document.createElement('div');
      track.className = 'crl-track';
      while (crl.firstChild) track.appendChild(crl.firstChild);
      view.appendChild(track);
      crl.appendChild(view);
      var step = function () {
        var c = track.querySelector('.card');
        return c ? c.getBoundingClientRect().width + 18 : 320;
      };
      var canPrev = function () { return view.scrollLeft > 4; };
      var canNext = function () { return view.scrollLeft + view.clientWidth < view.scrollWidth - 4; };
      ['prev', 'next'].forEach(function (dir) {
        var b = document.createElement('button');
        b.className = 'crl-a ' + dir;
        b.setAttribute('aria-label', dir === 'prev' ? 'Назад' : 'Вперёд');
        b.innerHTML = IC.arrow;
        b.addEventListener('click', function () {
          view.scrollBy({ left: dir === 'prev' ? -step() : step(), behavior: reduceMotion ? 'auto' : 'smooth' });
        });
        crl.appendChild(b);
      });
      // точки-индикаторы
      var dots = document.createElement('div');
      dots.className = 'crl-dots';
      crl.appendChild(dots);
      function refreshDots() {
        var count = Math.max(1, Math.ceil(view.scrollWidth / view.clientWidth));
        while (dots.children.length < count) dots.appendChild(document.createElement('i'));
        while (dots.children.length > count) dots.removeChild(dots.lastChild);
        var idx = Math.round(view.scrollLeft / view.clientWidth);
        Array.prototype.forEach.call(dots.children, function (d, i) {
          d.classList.toggle('on', i === idx);
        });
      }
      var rb;
      function onScroll() { clearTimeout(rb); rb = setTimeout(refreshDots, 80); }
      view.addEventListener('scroll', onScroll, { passive: true });
      refreshDots();
    });
  }

  /* ---------- 5. Fade-in секций ---------- */
  function initFade() {
    var els = document.querySelectorAll('.hero, .cityband, .promo, .sec, .sec2, .salonhero, .checkcards, .salinfo, .ai, .soon');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    els.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < window.innerHeight * .85) {
        el.classList.add('in');
      } else {
        el.classList.add('fo');
      }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fo').forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. Галерея: миниатюры + полноэкранный просмотр ---------- */
  function initGallery() {
    var gallery = document.querySelector('.gallery');
    if (!gallery) return;
    var big = gallery.querySelector('.big');
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.th'));
    if (!big || !thumbs.length) return;
    // Фото-режим (img) либо прежний SVG-режим
    var imgMode = !!big.querySelector('img');
    var imgs;
    if (imgMode) {
      imgs = thumbs.map(function (t) {
        var im = t.querySelector('img');
        return im ? '<img src="' + im.getAttribute('src') + '" alt="' + (im.getAttribute('alt') || '') + '" loading="lazy">' : '';
      });
    } else {
      var bigSvg = big.querySelector('svg');
      imgs = thumbs.map(function (t) { return t.querySelector('svg') ? t.innerHTML : ''; });
      if (bigSvg) imgs.unshift(bigSvg.outerHTML);
    }
    var badgeHtml = gallery.querySelector('.badge') ? gallery.querySelector('.badge').outerHTML : '';
    var zoomHtml = '<button class="zoom" aria-label="Увеличить">' + IC.zoom + '</button>';
    function show(i) {
      var src = imgs[i % imgs.length];
      if (!src) return;
      big.classList.add('swap');
      setTimeout(function () {
        big.innerHTML = src + badgeHtml + zoomHtml;
        var z = big.querySelector('.zoom');
        if (z) z.addEventListener('click', function () { openLb(i); });
        big.classList.remove('swap');
      }, 200);
    }
    thumbs.forEach(function (t, i) {
      t.setAttribute('role', 'button');
      t.setAttribute('tabindex', '0');
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.click(); } });
      t.addEventListener('click', function () {
        thumbs.forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        show(imgMode ? i : i + 1);
      });
    });
    if (gallery.querySelector('.zoom')) {
      gallery.querySelector('.zoom').addEventListener('click', function () { openLb(0); });
    }
    var lb = null, lbStage = null, lbIdx = 0, lbSrcs = imgs;
    function mkArrow(dir) {
      var b = document.createElement('button');
      b.className = 'lb-a ' + dir;
      b.setAttribute('aria-label', dir === 'prev' ? 'Назад' : 'Вперёд');
      b.innerHTML = IC.arrow;
      b.addEventListener('click', function () { lbGo(dir === 'prev' ? -1 : 1); });
      return b;
    }
    function paint() {
      lbStage.innerHTML = imgs[lbIdx % imgs.length];
      lbStage.appendChild(mkArrow('prev'));
      lbStage.appendChild(mkArrow('next'));
      var c = lb.querySelector('.lb-count');
      if (c) c.textContent = (lbIdx % imgs.length + 1) + ' / ' + imgs.length;
    }
    function openLb(i) {
      if (!lb) buildLb();
      lbIdx = i % imgs.length;
      paint();
      lb.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function lbGo(d) {
      lbIdx = (lbIdx + d + imgs.length) % imgs.length;
      paint();
    }
    function buildLb() {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = '<div class="lb-top"><button class="lb-close" aria-label="Закрыть">' + IC.close + '</button></div><div class="lb-stage"></div><div class="lb-count"></div>';
      document.body.appendChild(lb);
      lbStage = lb.querySelector('.lb-stage');
      lb.querySelector('.lb-close').addEventListener('click', closeLb);
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbStage) closeLb(); });
      var x0 = null;
      lbStage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      lbStage.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 42) lbGo(dx < 0 ? 1 : -1);
        x0 = null;
      }, { passive: true });
    }
    window.closeLb = function () {
      if (!lb) return;
      lb.classList.remove('show');
      document.body.style.overflow = '';
    };
  }

  /* ---------- 7. Нижняя панель «В корзину» (карточка товара) ---------- */
  function buildBuyBar() {
    var now = document.querySelector('.pricebig .now');
    if (!now || document.getElementById('buybar')) return;
    var old = document.querySelector('.pricebig .old');
    var bar = document.createElement('div');
    bar.id = 'buybar';
    bar.innerHTML = '<div><div class="bb-price">' + now.textContent.trim() + '</div>' +
      (old ? '<div class="bb-old">' + old.textContent.trim() + '</div>' : '') + '</div>' +
      '<a class="btn btn-p" href="cart.html">В корзину</a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-buybar');
    bar.querySelector('.btn').addEventListener('click', function () { bumpCart(); });
  }

  /* ---------- 8. Выбор размера / времени, избранное ---------- */
  function initMicro() {
    document.addEventListener('click', function (e) {
      // размеры и слоты
      var sz = e.target.closest('.sizes .sz, .slotrow .slot');
      if (sz) {
        var box = sz.closest('.sizes, .slotrow');
        if (box) box.querySelectorAll('.on').forEach(function (x) { x.classList.remove('on'); });
        sz.classList.add('on');
        return;
      }
      // избранное
      var fav = e.target.closest('.fav');
      if (fav) { fav.classList.toggle('on'); return; }
      // города-пилюли
      var cp = e.target.closest('.cp');
      if (cp && cp.tagName !== 'A') {
        var host = cp.parentElement;
        if (host) host.querySelectorAll('.cp.on').forEach(function (x) { x.classList.remove('on'); });
        cp.classList.add('on');
        return;
      }
      // сброс фильтров (кнопка «сбросить»)
      var rs = e.target.closest('a[href^="javascript:"]');
      if (rs) {
        e.preventDefault();
        document.querySelectorAll('.fopt input').forEach(function (i) { i.checked = false; });
        toast('Фильтры сброшены');
        return;
      }
      // активный чип фильтра (крестик)
      var cx = e.target.closest('.chipsel.x');
      if (cx) { cx.remove(); return; }
      // добавление в корзину
      var add = e.target.closest('.card .buy .btn, #buybar .btn, .ctarow .btn-p');
      if (add) {
        var t = (add.textContent || '').toLowerCase();
        if (t.indexOf('корзин') > -1 || t.indexOf('купить') > -1) {
          bumpCart();
          toast('Добавлено в корзину');
          // если это ссылка-переход — позволяем навигации произойти
        }
        return;
      }
      // «недавно смотрели»
      var pl = e.target.closest('a[href*="product.html"]');
      if (pl && pl.closest('.card')) rememberRecent(pl.closest('.card'));
    });
  }

  /* ---------- 9. Недавно смотрели (localStorage) ---------- */
  function rememberRecent(card) {
    try {
      var name = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'Украшение';
      var arr = JSON.parse(localStorage.getItem('aura_recent') || '[]');
      arr = arr.filter(function (x) { return x !== name; });
      arr.unshift(name);
      localStorage.setItem('aura_recent', JSON.stringify(arr.slice(0, 8)));
      renderRecent();
    } catch (e) { /* ignore */ }
  }
  function renderRecent() {
    var box = document.getElementById('recentGrid');
    if (!box) return;
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem('aura_recent') || '[]'); } catch (e) { arr = []; }
    var sec = document.getElementById('recentSec');
    if (!arr.length) { if (sec) sec.classList.add('hidden'); return; }
    if (sec) sec.classList.remove('hidden');
    box.innerHTML = arr.slice(0, 6).map(function (name) {
      return '<div class="card"><div class="ph">' + IC.ringPic +
        '<div class="buy"><a class="btn btn-p" href="product.html">В корзину</a></div></div>' +
        '<div class="body"><h3><a href="product.html">' + name + '</a></h3>' +
        '<span class="meta">золото 585 · смотреть на сайте</span></div></div>';
    }).join('');
    window.__iconsApply && window.__iconsApply();
  }
  /* ---------- 10. Init ---------- */
  function init() {
    buildHeaderUI();
    buildFiltersUI();
    initMicro();
    buildCarousels();
    initGallery();
    buildBuyBar();
    initFade();
    renderRecent();
    // снятие hash-ссылок-заглушек заменяется soon.html при вёрстке
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
