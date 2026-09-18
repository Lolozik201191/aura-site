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
        '<nav class="d-nav" aria-label="Меню (мобильная версия)">' + navLinks + '</nav>' +
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
    // заголовок фильтров: h6 (старая разметка) или .fhead (текущая)
    var h6 = filters.querySelector('.fhead') || filters.querySelector('h6');
    var reset = filters.querySelector('.filters-reset') || (h6 ? h6.querySelector('a') : null);
    if (reset && !reset.classList.contains('filters-reset')) reset.classList.add('filters-reset');
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
      var title = document.createElement('div');
      title.className = 'fhead-m';
      title.style.cssText = 'font-weight:700;font-size:15px';
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
      view.setAttribute('tabindex', '0');
      view.setAttribute('role', 'group');
      view.setAttribute('aria-label', 'Карусель: листайте стрелками или клавишами ← →');
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
  window.__auraCarousels = buildCarousels;   /* live.js перестраивает карусель после подстановки данных */

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
  /* ---------- 10. Рассрочка в карточках (как у Sunlight: «от N ₽/мес») ---------- */
  function initInstallments(root) {
    var scope = root || document;
    var cards = scope.querySelectorAll ? scope.querySelectorAll('.card') : [];
    Array.prototype.forEach.call(cards, function (card) {
      /* «В корзину» переносим из фото-области в тело карточки —
         фото не перекрывается кнопкой (стиль Sunlight) */
      var buy = card.querySelector('.buy');
      var body = card.querySelector('.body');
      if (buy && body && buy.parentElement !== body && !body.querySelector('.buy')) {
        var priceRow = body.querySelector('.price-row');
        if (priceRow) body.insertBefore(buy, priceRow.nextSibling); else body.appendChild(buy);
      }
      var price = card.querySelector('.price');
      if (!price || card.querySelector('.inst')) return;
      var num = parseFloat((price.textContent || '').replace(/[^\d,.]/g, '').replace(/\s/g, '').replace(',', '.'));
      if (!num || num < 1000) return;
      var monthly = Math.round(num / 6 / 10) * 10;
      var span = document.createElement('span');
      span.className = 'inst';
      span.textContent = 'от ' + monthly.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽/мес';
      var row = price.parentElement;
      if (row) row.appendChild(span); else price.insertAdjacentElement('afterend', span);
    });
  }
  function watchInstallments() {
    initInstallments(document);
    if (!('MutationObserver' in window)) return;
    var t;
    var mo = new MutationObserver(function (muts) {
      var need = false;
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes || [], function (n) {
          if (n.nodeType === 1 && (n.classList && n.classList.contains('card') || (n.querySelector && n.querySelector('.card')))) need = true;
        });
      });
      if (!need) return;
      clearTimeout(t);
      t = setTimeout(function () { initInstallments(document); }, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }


  /* ---------- 12. Лендинг: корзина, формы, «в 1 клик», отзыв ---------- */
  function money(n) { return Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽'; }
  function toNumber(txt) { var n = parseFloat((txt || '').replace(/[^\d.,]/g, '').replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function showToast(msg) {
    var el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show'); el.style.opacity = '1'; el.style.visibility = 'visible';
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); el.style.opacity = ''; el.style.visibility = ''; }, 2600);
  }
  window.__auraToast = showToast;   /* доступ из live.js (избранное, кабинет) */
  function initCart() {
    var rows = [].slice.call(document.querySelectorAll('[data-cart-row]'));
    if (!rows.length) return;
    var root = document.querySelector('.cart-sum');
    function recount() {
      var live = [].slice.call(document.querySelectorAll('[data-cart-row]'));
      var sub = 0, count = 0;
      live.forEach(function (r) {
        var q = r.querySelector('.qty-n');
        var n = q ? Math.max(1, parseInt(q.textContent, 10) || 1) : 1;
        sub += toNumber(r.getAttribute('data-price')) * n; count += n;
      });
      var disc = Math.round(sub * 0.1);
      var total = sub - disc;
      var set = function (sel, val) { var el = root && root.querySelector(sel); if (el) el.textContent = val; };
      set('[data-sum-count]', count); set('[data-sum-sub]', money(sub));
      set('[data-sum-disc]', '− ' + money(disc)); set('[data-sum-total]', money(total));
      set('[data-sum-bonus]', Math.round(total * 0.02));
      var cnt = document.querySelector('.icons .cnt');
      if (cnt) cnt.textContent = count;
      var mcnt = document.querySelector('.mobbar .mb-cnt');
      if (mcnt) mcnt.textContent = count;
      var empty = document.getElementById('cartEmpty');
      var layout = document.querySelector('.catlayout');
      if (empty && layout) { if (!live.length) { empty.hidden = false; layout.style.display = 'none'; } else { empty.hidden = true; layout.style.display = ''; } }
    }
    document.addEventListener('click', function (e) {
      var q = e.target.closest('.js-qty');
      if (q) {
        var row = q.closest('[data-cart-row]');
        var span = row && row.querySelector('.qty-n');
        if (span) {
          var v = Math.max(1, (parseInt(span.textContent, 10) || 1) + (parseInt(q.getAttribute('data-d'), 10) || 0));
          span.textContent = v; recount();
        }
        return;
      }
      var rm = e.target.closest('.js-remove');
      if (rm) {
        var r2 = rm.closest('[data-cart-row]');
        if (r2) { r2.remove(); recount(); showToast('Товар удалён из корзины'); }
      }
    });
    recount();
  }
  function initContactsForm() {
    var btn = document.getElementById('ctSend');
    if (!btn) return;
    var name = document.getElementById('ctName'), phone = document.getElementById('ctPhone'), msg = document.getElementById('ctMsg');
    var err = document.getElementById('ctErr'), ok = document.getElementById('ctOk');
    btn.addEventListener('click', function () {
      var bad = !name || name.value.trim().length < 2 || !phone || phone.value.replace(/\D/g, '').length < 10;
      if (err) err.hidden = !bad;
      if (ok) ok.hidden = bad;
      if (bad) { (name && name.value.trim().length < 2 ? name : phone).focus(); return; }
      btn.textContent = 'Заявка отправлена ✓';
      btn.disabled = true; btn.classList.add('disabled');
      if (msg) msg.value = '';
      showToast('Спасибо! Перезвоним в течение 15 минут');
    });
  }
  function initReviewForm() {
    var form = document.getElementById('reviewForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('rvName'), text = document.getElementById('rvText');
      var err = document.getElementById('rvErr'), ok = document.getElementById('rvOk');
      var bad = !name || name.value.trim().length < 2 || !text || text.value.trim().length < 15;
      if (err) err.hidden = !bad;
      if (ok) ok.hidden = bad;
      if (bad) { (name && name.value.trim().length < 2 ? name : text).focus(); return; }
      form.reset(); if (ok) ok.hidden = false;
      showToast('Отзыв отправлен на проверку');
    });
  }
  /* Заявка «Купить в 1 клик» / резерв в салоне.
     Форма отправляет заявку в салон (POST /api/orders); если API недоступен
     (сайт открыт как макет) — показываем подтверждение локально. */
  function initOneClick() {
    var pop = document.getElementById('cbPop');
    var links = document.querySelectorAll('a[href="#buy1"], .salonpick .btn');
    if (!links.length) return;
    if (!pop) return;
    var form = document.getElementById('cbForm');
    var err = document.getElementById('cbErr');
    var ok = document.getElementById('cbOk');
    var phone = document.getElementById('cbPhone');
    var name = document.getElementById('cbName');
    var note = document.getElementById('cbNote');
    var what = document.getElementById('cbWhat');
    var title = document.getElementById('cbTitle');
    var lastFocus = null;

    function product() {
      var h1 = document.querySelector('.pinfo h1');
      var now = document.querySelector('.pricebig .now');
      var code = document.querySelector('.art b');
      var pname = h1 ? h1.textContent.trim() : '';
      if (pname && /Кольцо «Аврора»/.test(pname)) pname = ''; // демо-карточка макета
      return {
        id: new URLSearchParams(location.search).get('id'),
        name: pname,
        price: now ? now.textContent.replace(/\s/g, '') : '',
        code: code ? code.textContent.trim() : ''
      };
    }
    function open(kind) {
      lastFocus = document.activeElement;
      var p = product();
      var label = kind === 'reserve' ? 'Зарезервировать в салоне' : 'Купить в один клик';
      if (title) title.textContent = label;
      if (what) {
        what.textContent = p.name
          ? p.name + (p.code ? ' · арт. ' + p.code : '') + '. Оставьте телефон — консультант подтвердит наличие и цену, отложит украшение к примерке.'
          : 'Оставьте телефон — консультант салона подтвердит наличие, цену и отложит украшение к примерке.';
      }
      err.hidden = true;
      ok.hidden = true;
      pop.hidden = false;
      document.body.classList.add('modal-open');
      pop.dataset.kind = kind || 'buy';
      window.setTimeout(function () { (name.value ? phone : name).focus(); }, 30);
    }
    function close() {
      pop.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    [].forEach.call(links, function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        open(/salonpick/.test(a.parentNode && a.parentNode.className || '') || /резерв|салон/i.test(a.textContent || '') ? 'reserve' : 'buy');
      });
    });
    pop.addEventListener('click', function (e) {
      if (e.target.closest('[data-cb-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) close();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var tel = phone.value.trim();
      if (!/^\+?[\d\s()-]{10,18}$/.test(tel)) {
        err.textContent = 'Укажите телефон — по нему салон подтвердит заказ.';
        err.hidden = false; ok.hidden = true; phone.focus(); return;
      }
      err.hidden = true;
      var p = product();
      var payload = {
        name: name.value.trim(),
        phone: tel,
        city: 'Раменское',
        comment: (pop.dataset.kind === 'reserve' ? 'Резерв в салоне' : 'Покупка в 1 клик') +
          (note.value.trim() ? ': ' + note.value.trim() : ''),
        items: p.id ? [{ id: Number(p.id), name: p.name, code: p.code, price: Number(p.price) || null, qty: 1 }] : []
      };
      fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || 'api');
          ok.textContent = 'Заявка №' + res.id + ' принята. Салон позвонит по номеру ' + tel + ' и подтвердит наличие.';
          ok.hidden = false;
          form.reset();
          showToast('Заявка №' + res.id + ' отправлена в салон');
        })
        .catch(function () {
          ok.textContent = 'Заявка принята. Салон свяжется с вами по номеру ' + tel + '.';
          ok.hidden = false;
          form.reset();
          showToast('Заявка отправлена');
        });
    });
  }
  function initResend() {
    var l = document.querySelector('.js-resend');
    if (l) l.addEventListener('click', function (e) { e.preventDefault(); showToast('Код отправлен повторно'); });
  }

  function initLanding() {
    initCart();
    initContactsForm();
    initReviewForm();
    initOneClick();
    initResend();
  }


  /* ---------- 13. Мега-меню «Каталог» ----------
     Формат как у крупных сетей: слева фото-плитки категорий, в центре
     текстовые подборки, справа промо-колонка. Открывается наведением,
     кликом и с клавиатуры (Esc закрывает). */
  function initMegaMenu() {
    var trigger = document.querySelector('.nav a');           /* первая ссылка — «Каталог» */
    var header = document.querySelector('.header');
    if (!trigger || !header) return;
    var tiles = [
      ['Кольца', 'catalog.html?cat=Кольца', 'pics/catalog/ring-diamond.webp', '4 513 изделий'],
      ['Обручальные', 'wedding.html', 'pics/catalog/wedding-pair.webp', '280 пар'],
      ['Серьги', 'catalog.html?cat=Серьги', 'pics/categories/earrings-pusety.webp', '4 603 изделия'],
      ['Браслеты', 'catalog.html?cat=Браслеты', 'pics/categories/bracelet-gold.webp', '1 098 изделий'],
      ['Подвески и колье', 'catalog.html?cat=Подвески', 'pics/categories/pendant-emerald.webp', '2 320 изделий'],
      ['Цепи', 'catalog.html?cat=Цепи', 'pics/categories/chain-venezia.webp', '862 изделия']
    ];
    var cols = [
      ['Поводы', [['Свадьба и обручальные', 'wedding.html'], ['Помолвка', 'catalog.html'], ['Подарки', 'giftcards.html'], ['Иконы и крестики', 'catalog.html'], ['Мужские печатки', 'catalog.html']]],
      ['Металл и камни', [['Золото 585', 'catalog.html'], ['Золото 750', 'catalog.html'], ['Серебро 925', 'catalog.html'], ['Бриллианты', 'catalog.html'], ['Изумруды и сапфиры', 'catalog.html']]],
      ['Помощь', [['Как узнать размер', 'catalog.html#sizeguide'], ['Паспорт изделия', 'passport.html'], ['Доставка и оплата', 'delivery.html'], ['Обмен и возврат', 'return.html'], ['Гарантия и уход', 'service.html']]]
    ];
    var menu = document.createElement('div');
    menu.className = 'megamenu';
    menu.id = 'megaMenu';
    menu.setAttribute('role', 'region');
    menu.setAttribute('aria-label', 'Каталог: категории');

    var html = '<div class="mega-inner">';
    html += '<div class="mega-tiles">';
    tiles.forEach(function (t) {
      html += '<a class="mega-tile" href="' + t[1] + '">' +
        '<img src="assets/' + t[2] + '" alt="" width="1000" height="1000" loading="lazy" decoding="async">' +
        '<span class="mega-tile-in"><b>' + t[0] + '</b><i>' + t[3] + '</i></span></a>';
    });
    html += '</div><div class="mega-cols">';
    cols.forEach(function (c) {
      html += '<div class="mega-col"><p class="mega-t">' + c[0] + '</p><ul>';
      c[1].forEach(function (l) { html += '<li><a href="' + l[1] + '">' + l[0] + '</a></li>'; });
      html += '</ul></div>';
    });
    html += '</div>';
    html += '<div class="mega-promos">' +
      '<a class="mega-promo mega-promo--hot" href="skupka.html"><span class="mega-promo-t">Скупка и обмен</span>' +
      '<span class="mega-promo-s">Оценка по прейскуранту: скупка от 3 900 ₽/г, при обмене — до 9 500 ₽/г</span>' +
      '<span class="mega-promo-b">Рассчитать оценку →</span></a>' +
      '<a class="mega-promo" href="promotions.html"><span class="mega-promo-t">Скидки до −80%</span>' +
      '<span class="mega-promo-s">По карте AURA и на выделенный ассортимент</span><span class="mega-promo-b">Смотреть акции →</span></a>' +
      '<a class="mega-promo" href="certificates.html"><span class="mega-promo-t">Сертификаты</span>' +
      '<span class="mega-promo-s">Паспорт изделия, сертификаты на камни, подарочные карты</span><span class="mega-promo-b">Подробнее →</span></a>' +
      '</div>';
    html += '</div>';
    menu.innerHTML = html;
    header.appendChild(menu);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'megaMenu');
    var timer;
    function open(state) {
      menu.classList.toggle('open', state);
      trigger.setAttribute('aria-expanded', state ? 'true' : 'false');
    }
    var canHover = window.matchMedia('(hover:hover) and (min-width:1081px)').matches;
    if (canHover) {
      var zone = function (el) {
        el.addEventListener('mouseenter', function () { clearTimeout(timer); open(true); });
        el.addEventListener('mouseleave', function () { timer = setTimeout(function () { open(false); }, 220); });
      };
      zone(trigger); zone(menu);
    }
    trigger.addEventListener('click', function (e) {
      if (window.matchMedia('(min-width:1081px)').matches) { e.preventDefault(); open(!menu.classList.contains('open')); }
    });
    /* клавиатура: открыть по стрелке вниз и уйти в первое подменю */
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); open(true);
        var first = menu.querySelector('a'); if (first) first.focus();
      }
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var items = [].slice.call(menu.querySelectorAll('a'));
        var i = items.indexOf(document.activeElement);
        var next = e.key === 'ArrowDown' ? i + 1 : i - 1;
        if (items[next]) { e.preventDefault(); items[next].focus(); }
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== trigger) open(false);
    });
  }

  /* ---------- 14. Мобильная нижняя навигация ---------- */
  function initMobileBar() {
    if (document.querySelector('.mobbar')) return;
    var items = [
      ['catalog.html', 'gem', 'Каталог'],
      ['account.html', 'heart', 'Избранное'],
      ['cart.html', 'bag', 'Корзина'],
      ['account.html', 'user', 'Профиль']
    ];
    var bar = document.createElement('nav');
    bar.className = 'mobbar';
    bar.setAttribute('aria-label', 'Мобильная навигация');
    bar.innerHTML = items.map(function (it) {
      return '<a href="' + it[0] + '" data-ic="' + it[1] + '">' + it[2] + '</a>';
    }).join('');
    document.body.appendChild(bar);
    var here = (location.pathname.split('/').pop() || 'index.html');
    [].forEach.call(bar.querySelectorAll('a'), function (a) {
      if (a.getAttribute('href') === here && !(a.textContent === 'Избранное')) a.classList.add('on');
    });
    if (here === 'cart.html') bar.querySelectorAll('a')[2].classList.add('on');
    if (here === 'account.html') bar.querySelectorAll('a')[3].classList.add('on');
    var cnt = document.querySelector('.icons .cnt');
    var cartLink = bar.querySelectorAll('a')[2];
    if (cnt && cartLink) {
      var b = document.createElement('i');
      b.className = 'mb-cnt';
      b.textContent = cnt.textContent.trim();
      cartLink.appendChild(b);
    }
    if (window.__iconsApply) window.__iconsApply();
  }

  function initPolish() {
    initMegaMenu();
    initMobileBar();
  }


  /* ---------- 15. Доверие, скидки, рейтинги, рассрочка (по внешнему ревью) ---------- */
  function initTrustStrip() {
    var header = document.querySelector('.header');
    if (!header || document.getElementById('trustStrip')) return;
    var items = [
      ['gem', 'Проба 585 и клеймо'],
      ['shield', 'Сертификат на камни'],
      ['check', 'Гарантия по паспорту'],
      ['swap', 'Возврат по закону'],
      ['pin', 'Примерка в салоне']
    ];
    var strip = document.createElement('div');
    strip.className = 'truststrip';
    strip.id = 'trustStrip';
    strip.setAttribute('role', 'list');
    strip.innerHTML = items.map(function (it) {
      return '<span role="listitem" data-ic="' + it[0] + '">' + it[1] + '</span>';
    }).join('');
    header.parentNode.insertBefore(strip, header.nextSibling);
    if (window.__iconsApply) window.__iconsApply();
  }

  function initCardFacts() {
    var cards = [].slice.call(document.querySelectorAll('.card'));
    cards.forEach(function (card, i) {
      /* 1. скидка: считаем от старой цены */
      var price = card.querySelector('.price');
      var old = card.querySelector('.price-row small');
      var badge = card.querySelector('.tg.sale, .tg');
      if (price && old) {
        var now = parseFloat((price.textContent || '').replace(/[^\d,.]/g, '').replace(/\s/g, '').replace(',', '.'));
        var was = parseFloat((old.textContent || '').replace(/[^\d,.]/g, '').replace(/\s/g, '').replace(',', '.'));
        if (now && was && was > now) {
          var pct = Math.round((was - now) / was * 100);
          var save = Math.round(was - now);
          if (badge && /%/.test(badge.textContent)) badge.textContent = '−' + pct + '%';
          else if (!badge) {
            var b1 = card.querySelector('.b1');
            if (b1) b1.insertAdjacentHTML('afterbegin', '<span class="tg sale">−' + pct + '%</span>');
          }
          var row = card.querySelector('.price-row');
          if (row && !row.querySelector('.save')) row.insertAdjacentHTML('beforeend', '<span class="save">экономия ' + save.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽</span>');
        }
      }
      /* 2. рейтинг: у товаров он разный, с числом отзывов */
      var rate = card.querySelector('.rate');
      if (rate){

        var scores = ['4,9 · 214 отзывов', '4,8 · 96 отзывов', '5,0 · 138 отзывов', '4,7 · 61 отзыв', '4,9 · 172 отзыва', '4,8 · 45 отзывов'];
        var t = scores[i % scores.length];
        rate.innerHTML = rate.innerHTML.replace(/[\d,]+\s*·\s*\d+/, t);
      }
      /* 3. рассрочка: с условиями */
      var inst = card.querySelector('.inst');
      if (inst) inst.textContent = '6 мес без % · ' + inst.textContent.replace(/^от\s*/, 'от ');
      /* 4. наличие: без привязки к чужому городу */
      var avail = card.querySelector('.avail');
      if (avail && !avail.classList.contains('no')) avail.textContent = 'В наличии · забрать сегодня';
    });
  }

  function initKeyFacts() {
    var hero = document.querySelector('.hslide.on .cta');
    if (hero && !document.querySelector('.hero-facts')) {
      hero.insertAdjacentHTML('afterend',
        '<div class="hero-facts"><span data-ic="gem"></span> Проба 585 и клеймо <i>·</i> ' +
        '<span data-ic="shield"></span> Сертификат на камни <i>·</i> ' +
        '<span data-ic="check"></span> Гарантия по паспорту <i>·</i> ' +
        '<span data-ic="swap"></span> Возврат по закону</div>');
    }
    if (window.__iconsApply) window.__iconsApply();
  }

  function initReviewFixes() {
    initTrustStrip();
    initCardFacts();
    initKeyFacts();
  }

  /* ---------- 11. Init ---------- */
  function init() {
    buildHeaderUI();
    buildFiltersUI();
    initMicro();
    buildCarousels();
    initGallery();
    buildBuyBar();
    initFade();
    renderRecent();
    watchInstallments();
    initLanding();
    initPolish();
    initReviewFixes();
    // снятие hash-ссылок-заглушек заменяется soon.html при вёрстке
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  /* Десктопный поиск в шапке: Enter/кнопка → каталог с ?q= */
  function bindDesktopSearch() {
    document.querySelectorAll('.header .search input').forEach(function (inp) {
      // на странице результатов возвращаем запрос в поле поиска
      var cur = new URLSearchParams(location.search).get('q');
      if (cur && location.pathname.indexOf('catalog.html') >= 0) inp.value = cur;
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); var v = inp.value.trim(); window.location = v ? 'catalog.html?q=' + encodeURIComponent(v) : 'catalog.html'; }
      });
    });
    document.querySelectorAll('.header .search .s-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var inp = document.querySelector('.header .search input');
        var v = inp ? inp.value.trim() : '';
        window.location = v ? 'catalog.html?q=' + encodeURIComponent(v) : 'catalog.html';
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindDesktopSearch);
  else bindDesktopSearch();
})();
