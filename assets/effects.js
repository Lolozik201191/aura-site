/* ============================================================
   Визуальные эффекты «как у сетей»: мягкие, производительные,
   с уважением к prefers-reduced-motion.
   1) шапка при скролле — компактнее + тень,
   2) счётчики чисел (категории, факты) — плавный набор,
   3) лёгкий параллакс фонов баннеров,
   4) анимация подчёркивания ссылок и лёгкий подъём плиток.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. шапка при скролле: только тень, без изменения высоты —
     иначе на старте прокрутки содержимое прыгает и выглядят артефакты */
  function initHeaderScroll() {
    var header = document.querySelector('.header');
    if (!header) return;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-compact', y > 90);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 2. счётчики: «4 513 изделий» → плавный набор */
  function initCounters() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var targets = document.querySelectorAll('.stat b, .sk-facts b, .perk b, .mcat .m-name + span, [data-count]');
    var list = [];
    targets.forEach(function (el) {
      var txt = (el.textContent || '');
      var m = txt.replace(/\s|\u00a0/g, '').match(/^(\d{2,6})/);
      if (!m) return;
      var target = parseInt(m[1], 10);
      if (!target || target < 20) return;
      list.push({ el: el, target: target, tail: txt.slice(m[0].length) });
    });
    if (!list.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var item = list.filter(function (x) { return x.el === e.target; })[0];
        io.unobserve(e.target);
        if (!item) return;
        var start = null, dur = 900;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Math.round(item.target * eased);
          item.el.textContent = val.toLocaleString('ru-RU').replace(/,/g, ' ') + item.tail;
          if (p < 1) requestAnimationFrame(step);
          else item.el.textContent = item.target.toLocaleString('ru-RU').replace(/,/g, ' ') + item.tail;
        }
        requestAnimationFrame(step);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    list.forEach(function (x) { io.observe(x.el); });
  }

  /* 3. параллакс фонов баннеров (только большие экраны) */
  function initParallax() {
    if (reduce || window.innerWidth < 900) return;
    var layers = [].slice.call(document.querySelectorAll('.sk-hero, .mini-banner, .promo, .salonhero, .hslide'));
    if (!layers.length) return;
    var ticking = false;
    function frame() {
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var shift = ((r.top + r.height / 2) - vh / 2) / vh;   /* -1..1 */
        el.style.backgroundPosition = '50% calc(50% + ' + (-shift * 14).toFixed(1) + 'px)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }, { passive: true });
    frame();
  }

  /* 4. появление карточек и плиток лесенкой */
  function initStagger() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () { el.classList.add('in'); }, Math.min(i * 45, 260));
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    function mark() {
      var sel = '#grid .card, #hitsGrid .card, #newGrid .card, #today .card, #sim .card, .hub-tile, .news-item, .sk-card';
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.classList.contains('in')) return;
        el.classList.add('stagger');
        io.observe(el);
      });
    }
    mark();
    setTimeout(mark, 1200);
    setTimeout(mark, 2600);
  }

  /* 5. липкая панель покупки на мобильных (карточка товара) */
  function initBuyBar() {
    var page = location.pathname.split('/').pop() || 'index.html';
    if (page !== 'product.html') return;
    var price = document.querySelector('.pricebig .now');
    var cta = document.querySelector('.ctarow');
    if (!price || !cta) return;
    var addBtn = null;
    [].slice.call(cta.querySelectorAll('a')).forEach(function (a) {
      var t = (a.textContent || '').trim();
      if (!addBtn && /В корзину/i.test(t)) addBtn = a;
    });
    var bar = document.createElement('div');
    bar.className = 'buybar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Покупка');
    bar.innerHTML = '<span class="bb-price"><b>' + price.textContent.trim() + '</b><span>примерка и оплата в салоне</span></span>' +
      '<span class="bb-actions">' +
      '<a class="btn btn-p" href="#buy1" data-bb="one">В 1 клик</a>' +
      '<button type="button" class="btn btn-p" data-bb="cart">В корзину</button>' +
      '</span>';
    document.body.appendChild(bar);

    /* «В корзину» повторяет основную кнопку, «В 1 клик» открывает окно заявки */
    bar.querySelector('[data-bb="cart"]').addEventListener('click', function () {
      if (addBtn) addBtn.click(); else location.href = 'cart.html';
    });
    bar.querySelector('[data-bb="one"]').addEventListener('click', function (e) {
      e.preventDefault();
      var link = document.querySelector('.ctarow a[href="#buy1"]');
      if (link) link.click();
    });

    /* показываем панель, когда основная кнопка ушла из вида */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var visible = en.isIntersecting;
          bar.classList.toggle('show', !visible);
          document.body.classList.toggle('buybar-on', !visible);
          document.body.classList.toggle('has-buybar', !visible);
        });
      }, { rootMargin: '-80px 0px 0px 0px' });
      io.observe(cta);
    } else {
      bar.classList.add('show');
    }
  }

  function init() {
    initHeaderScroll();
    initCounters();
    initParallax();
    initStagger();
    initBuyBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
