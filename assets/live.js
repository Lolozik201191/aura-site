/* ============================================================
   AURA live.js — подключение реальных данных 1С к дизайн-макетам.
   Дизайн/вёрстка не меняются: заменяются только ДАННЫЕ (демо -> витрина API).
   Если API недоступен (открыт просто файл) — страницы остаются как были.
   ============================================================ */
(function () {
  'use strict';
  var API_OK = true;

  function qs(n) { return new URLSearchParams(location.search).get(n); }
  function fmt(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }
  function fetchJ(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { API_OK = false; return null; });
  }
  var MARK_ICONS = ['ring', 'ear', 'pend', 'bangle', 'chain', 'sol', 'ring', 'pend'];
  function num(n) {
    if (n == null) return '—';
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  /* «перевод» технического имени 1С в понятное название (заготовка словаря) */
  var CATW = { 'Кольца': 'Кольцо', 'Серьги': 'Серьги', 'Браслеты': 'Браслет', 'Цепи': 'Цепь', 'Колье': 'Колье', 'Подвески': 'Подвеска', 'Броши': 'Брошь' };
  var DICT = { 'обр': 'обручальное', 'глк': 'гладкое', 'с/к': 'с камнями', 'др/к': 'с бриллиантами', 'фант': 'фантазийное' };
  function pretty(it) {
    var base = CATW[it.category] || it.category;
    var raw = (it.name || '').toLowerCase().replace(/\(au[.\s]*\d+[,\d]*\)|\(ag[.\s]*\d+[,\d]*\)/g, '').trim();
    var parts = raw.split(/\s+/), words = [];
    for (var i = 0; i < parts.length; i++) {
      var w = DICT[parts[i]];
      if (w && words.indexOf(w) < 0) words.push(w);
    }
    if (!words.length && it.subcategory === 'Обручальные') words.push('обручальное');
    var out = [base].concat(words).join(' ');
    if (it.metal) out += ', ' + it.metal.toLowerCase();
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  var CITY = 'Раменское';
  var GEO = { 'Раменское': ['Раменского', 'в Раменском'], 'Ногинск': ['Ногинска', 'в Ногинске'],
    'Воскресенск': ['Воскресенска', 'в Воскресенске'], 'Егорьевск': ['Егорьевска', 'в Егорьевске'],
    'Луховицы': ['Луховиц', 'в Луховицах'], 'Озёры': ['Озёр', 'в Озёрах'],
    'Электрогорск': ['Электрогорска', 'в Электрогорске'] };
  function gen(c) { return (GEO[c] && GEO[c][0]) || ('салона ' + c); }
  function prep(c) { return (GEO[c] && GEO[c][1]) || ('в городе ' + c); }

  /* ---------- «ФОТО СКОРО» ----------
     В учётной выгрузке 1С фотографий товаров нет. Показываем честную заглушку,
     а не чужое или демонстрационное изображение другого украшения. */
  function noimg(mod) {
    return '<div class="noimg' + (mod ? ' ' + mod : '') + '" role="img" aria-label="Фотография изделия скоро появится">' +
      '<span class="noimg-i" data-ic="gem"></span>' +
      '<span class="noimg-t">Фото скоро</span>' +
      (mod === 'noimg--big' ? '<span class="noimg-n">Снимем изделие и добавим фотографии в ближайшее время</span>' : '') +
      '</div>';
  }

  /* ---------- КАТАЛОГ ---------- */
  function liveCatalog() {
    var grid = document.getElementById('grid');
    var info = document.getElementById('foundInfo');
    var h1 = document.querySelector('.pagetitle');
    if (!grid) return;
    var cat = qs('cat');
    var q = (qs('q') || '').trim();
    if (!cat && !q && h1) {
      var t = (h1.textContent || '');
      for (var k in CATW) if (t.indexOf(k) === 0) { cat = k; break; }
    }
    if (!q) cat = cat || 'Кольца';
    var cur = { metal: null, city: false, price: null };

    function rcard(it, i) {
      var q = it.cities && it.cities[CITY];
      var av = q ? '<span class="avail">В салоне ' + gen(CITY) + ' · сегодня</span>'
                 : '<span class="avail no">Привезём в салон за 2 дня</span>';
      var tag = (it.sales >= 500) ? '<span class="tg new">Хит</span>' : '';
      var ph = '<div class="ph">' + noimg() +
        '<div class="b1">' + tag + '</div>' +
        '<button class="fav" data-ic="heart" aria-label="В избранное"><span class="sr-only">В избранное</span></button>' +
        '<div class="buy"><a class="btn btn-p" href="product.html?id=' + it.id + '">В корзину</a></div></div>';
      return '<div class="card">' + ph +
        '<div class="body">' + av +
        '<h3><a href="product.html?id=' + it.id + '">' + pretty(it) + '</a></h3>' +
        '<span class="meta">' + (it.metal || '') + (it.subcategory === 'Обручальные' ? ' · обручальное' : '') + '</span>' +
        '<div class="price-row"><span class="price">' + fmt(it.price) + '</span></div></div></div>';
    }
    function render(items, total) {
      grid.innerHTML = items.map(rcard).join('') ||
        '<p style="max-width:520px;color:var(--ink-2)">По запросу ничего не нашлось. Попробуйте другое слово ' +
        'или посмотрите <a href="catalog.html">весь каталог</a> — в наличии 14 000+ изделий.</p>';
      var n = total || items.length;
      if (info) info.textContent = q ? 'По запросу «' + q + '»: ' + n : 'Найдено: ' + items.length + ' · показаны 1–' + items.length;
      if (h1) {
        h1.innerHTML = q ? 'Поиск: «' + q + '» <span>' + n + ' изделий</span>'
                         : (cat === 'Кольца' ? 'Кольца' : cat) + ' <span>' + n + ' изделий</span>';
      }
      document.title = q ? 'AURA — поиск: ' + q : 'AURA — Каталог: ' + (cat === 'Кольца' ? 'Кольца' : cat);
      var crumb = document.querySelector('.breadcrumbs b');
      if (crumb) crumb.textContent = q ? 'Поиск' : cat;
      window.__iconsApply && window.__iconsApply();
      document.querySelectorAll('.fav').forEach(function (b, i) { b.dataset.i = i; });
    }
    function load() {
      var p = new URLSearchParams();
      if (q) p.set('q', q); else p.set('category', cat);
      p.set('per', '60'); p.set('sort', 'popular');
      if (cur.metal) p.set('metal', cur.metal);
      if (cur.city) p.set('city', CITY);
      fetchJ('/api/products?' + p.toString()).then(function (d) {
        if (!d) return;
        var items = d.items || [];
        var low = cur.price && cur.price[0], high = cur.price && cur.price[1];
        if (low != null || high != null) {
          items = items.filter(function (x) {
            if (x.price == null) return false;
            if (low != null && x.price < low) return false;
            if (high != null && x.price > high) return false;
            return true;
          });
        }
        render(items, d.total);
      });
    }
    function bindFilters() {
      document.querySelectorAll('.filters .fopt input').forEach(function (chk) {
        chk.addEventListener('change', function () {
          var lbl = chk.closest('label');
          var t = lbl ? (lbl.textContent || '').trim() : '';
          if (/Золото 585/.test(t)) cur.metal = chk.checked ? 'Золото 585' : null;
          else if (/Золото 750/.test(t)) cur.metal = chk.checked ? 'Золото 750' : null;
          else if (/Серебро/.test(t)) cur.metal = chk.checked ? 'Серебро 925' : null;
          else if (/Только в наличии/.test(t)) cur.city = chk.checked;
          load();
        });
      });
      var sort = document.querySelector('.sort select');
      if (sort) sort.addEventListener('change', function () { load(); });
      // цена от/до
      var min = document.querySelector('.filters .fsearch'), max = document.querySelectorAll('.filters .fsearch')[1];
      if (min && max) {
        function go() {
          var a = parseFloat(min.value), b = parseFloat(max.value);
          cur.price = [isNaN(a) ? null : a, isNaN(b) ? null : b];
          load();
        }
        min.addEventListener('change', go); max.addEventListener('change', go);
      }
    }
    load();
    bindFilters();
  }

  /* ---------- КАРТОЧКА ТОВАРА ---------- */
  function liveProduct() {
    var id = qs('id');
    if (!id) return; // без id — остаётся демо-карточка
    fetchJ('/api/products/' + id).then(function (it) {
      if (!it) return;
      var name = pretty(it);
      document.title = name + ' · AURA';
      var h1 = document.querySelector('.pinfo h1');
      if (h1) h1.textContent = name;
      /* Фотографий изделий в 1С нет: убираем демонстрационный снимок
         и ставим честную заглушку «Фото скоро». */
      var gal = document.querySelector('.gallery');
      if (gal) {
        var thumbs = gal.querySelector('.thumbs');
        if (thumbs) thumbs.innerHTML = '<div class="th on">' + noimg('noimg--thumb') + '</div>';
        var big = gal.querySelector('.big');
        if (big) {
          Array.prototype.slice.call(big.querySelectorAll('img,.zoom,.badge')).forEach(function (el) {
            el.parentNode.removeChild(el);
          });
          big.insertAdjacentHTML('afterbegin', noimg('noimg--big'));
        }
      }
      /* Оценки и отзывы демо-карточки реальному изделию не подставляем. */
      var top2 = document.querySelector('.pinfo .topline2');
      if (top2) top2.style.display = 'none';
      var rev = document.getElementById('revbox');
      if (rev) {
        var hsub = rev.querySelector('h2 span');
        if (hsub) hsub.textContent = '· отзывы покупателей о сети AURA';
        var sum = rev.querySelector('.revsum');
        if (sum) {
          sum.outerHTML = '<p style="color:var(--ink-2);background:var(--bg-2);border:1px solid var(--line-2);' +
            'border-radius:var(--r);padding:16px 18px;margin:12px 0 16px">Об этом изделии отзывов пока нет. ' +
            'Рейтинг считаем только по подтверждённым покупкам в салонах AURA — напишите отзыв, если украшение уже у вас.</p>';
        }
        Array.prototype.slice.call(rev.querySelectorAll('.review-item')).forEach(function (el) {
          el.parentNode.removeChild(el);
        });
        var all = rev.querySelector('.revall');
        if (all) {
          all.innerHTML = 'Все отзывы о сети AURA <span data-ic="arrow"></span>';
          window.__iconsApply && window.__iconsApply();
        }
      }
      /* «Похожие» — реальные изделия той же категории (тоже с заглушкой). */
      var sim = document.getElementById('sim');
      if (sim && it.category) {
        fetchJ('/api/products?category=' + encodeURIComponent(it.category) + '&per=10&sort=popular').then(function (d) {
          if (!d || !d.items) return;
          var list = d.items.filter(function (x) { return String(x.id) !== String(id); }).slice(0, 8);
          if (!list.length) return;
          sim.innerHTML = list.map(function (x, i) {
            var q = x.cities && x.cities[CITY];
            return '<div class="card" style="min-width:220px;flex:0 0 220px"><div class="ph">' + noimg() +
              '<div class="buy"><a class="btn btn-p" href="product.html?id=' + x.id + '">Смотреть</a></div></div>' +
              '<div class="body">' +
              (q ? '<span class="avail">В салоне ' + gen(CITY) + ' · сегодня</span>' : '<span class="avail no">Привезём за 2 дня</span>') +
              '<h3><a href="product.html?id=' + x.id + '">' + pretty(x) + '</a></h3>' +
              '<span class="meta">' + (x.metal || '') + '</span>' +
              '<div class="price-row"><span class="price">' + num(x.price) + ' ₽</span></div></div></div>';
          }).join('');
          window.__iconsApply && window.__iconsApply();
        });
      }
      var crumb = document.querySelector('.breadcrumbs b');
      if (crumb) crumb.textContent = name;
      schemaProduct(it);
      var art = document.querySelector('.art b');
      if (art && it.codes && it.codes.length) art.textContent = (it.codes[0]);
      var now = document.querySelector('.pricebig .now');
      if (now) now.textContent = fmt(it.price);
      ['.pricebig .old', '.pricebig .save'].forEach(function (s) {
        var el = document.querySelector(s); if (el) el.style.display = 'none';
      });
      var honest = document.querySelector('.honest');
      if (honest) honest.textContent = 'Цена по данным учёта сети AURA (1С) · остатки на дату выгрузки. Окончательную цену подтвердит салон.';
      // паспорт
      document.querySelectorAll('.passport tr').forEach(function (tr) {
        var tds = tr.querySelectorAll('td');
        if (tds.length < 2) return;
        var k = (tds[0].textContent || '').trim();
        if (k === 'Металл') tds[1].textContent = it.metal || '—';
        else if (k === 'Вес') tds[1].textContent = 'по бирке · уточнит консультант';
        else if (k === 'Вставка') tds[1].textContent = '—';
        else if (k === 'Размер') tds[1].textContent = 'размеры уточняйте в салоне';
      });
      // наличие в салоне (город по умолчанию — Раменское)
      var q = it.cities && it.cities[CITY];
      var sp = document.querySelector('.sp-t');
      if (sp) {
        var b = sp.querySelector('b');
        if (b) b.innerHTML = 'Забрать в салоне ' + gen(CITY);
        var st = q ? 'в наличии сегодня · отложим по телефону'
                   : 'сейчас нет ' + prep(CITY) + ' · привезём за 2 дня';
        sp.querySelectorAll('span').forEach(function (sn) {
          var t = (sn.textContent || '').trim();
          if (t.length > 25 || t.indexOf('ул.') >= 0 || /наличи|тел\./.test(t)) sn.textContent = st;
        });
      }
      // «Забрать в салоне» — звонок в салон; «В 1 клик» и «В корзину» работают формой и корзиной
      document.querySelectorAll('.salonpick a.btn, .salonpick .btn').forEach(function (a) {
        if (a.tagName === 'A' && /тел|позвон/i.test(a.textContent || '')) a.href = 'tel:+74964640307';
      });
    });
  }

  /* ---------- ГЛАВНАЯ: хиты и новинки на реальных товарах ---------- */
  function liveIndex() {
    function cardReal(it, i) {
      var tg = '';
      if (it.sales >= 500) tg = '<span class="tg hit">Хит</span>';
      else if (i === 0) tg = '<span class="tg new">Новинка</span>';
      var nm = pretty(it);
      var q = it.cities && it.cities[CITY];
      var av = q ? '<span class="avail">В салоне Раменского · сегодня</span>'
                 : '<span class="avail no">Привезём в салон за 2 дня</span>';
      return '<div class="card"><div class="ph">' + noimg() +
        '<div class="b1">' + tg + '</div>' +
        '<button class="fav" data-ic="heart" aria-label="В избранное"><span class="sr-only">В избранное</span></button>' +
        '<div class="buy"><a class="btn btn-p" href="product.html?id=' + it.id + '">В корзину</a></div></div>' +
        '<div class="body">' + av +
        '<h3><a href="product.html?id=' + it.id + '">' + nm + '</a></h3>' +
        '<span class="meta">' + (it.metal || '') + '</span>' +
        (it.sales ? '<span class="rate">' + icnRate() + num(it.sales) + ' покупок</span>' : '') +
        '<div class="price-row"><span class="price">' + num(it.price) + ' ₽</span></div></div></div>';
    }
    function icnRate() {
      return '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.5 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>';
    }
    function fill(el, items) {
      if (el) fillCarousel(el, items.map(cardReal).join(''));
    }
    fetchJ('/api/products?per=8&sort=popular').then(function (d) {
      if (d) fill(document.getElementById('hitsGrid'), d.items);
    });
    fetchJ('/api/products?per=8&sort=new').then(function (d) {
      if (d) fill(document.getElementById('newGrid'), d.items);
    });
    // счётчики категорий на плитках главной (текст «N изделий» в .mcat)
    fetchJ('/api/categories').then(function (d) {
      if (!d) return;
      var map = {};
      (d.categories || []).forEach(function (c) { map[c.category] = c.n; });
      var rename = { 'Кольца': 'Кольца', 'Серьги': 'Серьги', 'Браслеты': 'Браслеты', 'Колье': 'Колье', 'Подвески': 'Подвески', 'Цепи': 'Цепи' };
      document.querySelectorAll('.mcat a').forEach(function (a) {
        var img = a.querySelector('img');
        var key = null;
        if (img) {
          var alt = (img.getAttribute('alt') || '');
          if (map[alt]) key = alt;
        }
        var t = a.textContent || '';
        for (var k in rename) if (map[k] && (t.indexOf(k) === 0 || t.indexOf(k) > 0)) { key = k; break; }
        if (key) {
          a.setAttribute('href', 'catalog.html?cat=' + encodeURIComponent(key));
          a.innerHTML = a.innerHTML.replace(/(\d[\d\s]*\s*издели)/g, num(map[key]) + ' издели');
        }
      });
    });
    window.__iconsApply && window.__iconsApply();
  }

  /* ---------- КОРЗИНА (localStorage) и заказ на самовывоз ---------- */
  var cartStore = {
    get: function () { try { return JSON.parse(localStorage.getItem('aura_cart') || '[]'); } catch (e) { return []; } },
    save: function (a) { localStorage.setItem('aura_cart', JSON.stringify(a)); cartStore.badge(); },
    add: function (id) {
      var a = cartStore.get(), e = a.filter(function (x) { return x.id === id; })[0];
      if (e) e.qty++; else a.push({ id: id, qty: 1 });
      cartStore.save(a);
    },
    del: function (id) { cartStore.save(cartStore.get().filter(function (x) { return x.id !== id; })); },
    badge: function () {
      var n = cartStore.get().reduce(function (s, x) { return s + x.qty; }, 0);
      document.querySelectorAll('.header .cnt').forEach(function (el) { el.textContent = n; el.style.display = n ? '' : 'none'; });
    }
  };

  function liveProductButtons() {
    var q = cartStore.get();
    document.querySelectorAll('.ctarow a').forEach(function (a) {
      // «В 1 клик» открывает форму заявки (assets/ui.js), ссылку не трогаем
      if (a.textContent.indexOf('1 клик') >= 0) return;
      if (a.textContent.indexOf('В корзину') >= 0) {
        a.href = 'javascript:void(0)';
        a.dataset.added = '0';
        a.onclick = function (ev) {
          if (ev) ev.preventDefault();
          if (a.dataset.added === '1') return;
          a.dataset.added = '1';
          var id = parseInt(qs('id'), 10);
          cartStore.add(id);
          var el = document.querySelector('.header .cnt');
          if (el) el.classList.add('bump');
          location.href = 'cart.html';
        };
      }
    });
  }

  /* ---------- САЛОН: реальное наличие в городе ---------- */
  function liveSalon() {
    var city = qs('city') || 'Раменское';
    var h = document.querySelector('.salonhero h1');
    if (h) h.innerHTML = 'AURA <span>' + prep(city) + '</span>';
    var kick = document.querySelector('.salonhero .kicker') || document.querySelector('.salonhero span');
    document.title = 'AURA — Свой салон рядом · ' + city;
    // «Можно забрать уже сегодня»
    fetchJ('/api/products?city=' + encodeURIComponent(city) + '&per=10&sort=qty').then(function (d) {
      var el = document.getElementById('today');
      if (!el || !d) return;
      fillCarousel(el, (d.items || []).map(function (it, i) {
        var q = it.cities && it.cities[city];
        var nm = pretty(it);
        return '<div class="card"><div class="ph">' + noimg() +
          '<div class="b1"><span class="tg new">' + (q || 0) + ' шт</span></div>' +
          '<div class="buy"><a class="btn btn-p" href="product.html?id=' + it.id + '">К товару</a></div></div>' +
          '<div class="body"><span class="avail">В салоне ' + gen(city) + '</span>' +
          '<h3><a href="product.html?id=' + it.id + '">' + nm + '</a></h3>' +
          '<span class="meta">' + (it.metal || '') + '</span>' +
          '<div class="price-row"><span class="price">' + num(it.price) + ' ₽</span></div></div></div>';
      }).join('') || '<p>Сейчас товаров в этом городе нет — привезём за 2 дня.</p>');
    });
    // ссылки городов -> эта же страница с городом
    document.querySelectorAll('.sec a, .svcgrid a').forEach(function (a) {
      var t = (a.textContent || '').trim();
      for (var k in GEO) if (t === k) a.setAttribute('href', 'salon.html?city=' + encodeURIComponent(k));
    });
  }

  /* ---------- КОРЗИНА (страница cart.html) ---------- */
  var gemSVG = '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" style="color:#C4A06A;width:64px;height:64px;margin:auto"><path d="M7 3.5h10l4 5-9 12L3 8.5l4-5z"/><path d="M3 8.5h18M9.5 3.5L12 8.5l2.5-5M9 8.5l3 12 3-12"/></svg>';  function liveCart() {
    var layout = document.querySelector('.catlayout');
    if (!layout) return;
    var h1 = document.querySelector('.pagetitle');
    var ids = cartStore.get();
    var stamp = +new Date();
    if (!ids.length) {
      layout.innerHTML = '<div style="text-align:center;padding:60px 10px">' +
        '<div style="margin:0 auto 14px">' + gemSVG + '</div>' +
        '<p style="color:var(--ink-2);margin-bottom:18px">В корзине пока пусто — загляните в каталог.</p>' +
        '<a class="btn btn-p" href="catalog.html">Перейти в каталог</a></div>';
      if (h1) h1.innerHTML = 'Корзина <span>пуста</span>';
      return;
    }
    Promise.all(ids.map(function (it) {
      return fetchJ('/api/products/' + it.id).then(function (p) { return p ? Object.assign({}, p, { _qty: it.qty }) : null; });
    })).then(function (items) {
      items = items.filter(Boolean);
      if (!items.length) return location.reload();
      var sum = items.reduce(function (s, p) { return s + (p.price || 0) * p._qty; }, 0);
      var rows = items.map(function (p, i) {
        var q = p.cities && p.cities[CITY];
        return '<div class="card" data-cart-row="' + p.id + '" style="flex-direction:row;align-items:center;padding:14px">' +
          '<div class="ph" style="width:110px;aspect-ratio:1;flex:none;display:flex">' + noimg('noimg--thumb') + '</div>' +
          '<div style="flex:1;padding:0 16px">' +
          '<div style="font-weight:600"><a href="product.html?id=' + p.id + '">' + pretty(p) + '</a></div>' +
          '<div class="meta" style="font-size:12.5px;color:var(--ink-soft)">' + (p.metal || '') + ' · арт. ' + ((p.codes || [])[0] || '—') + '</div>' +
          (q ? '<div class="avail" style="margin-top:6px">В салоне Раменского — заберёте сегодня</div>'
             : '<div class="avail no" style="margin-top:6px">Привезём в салон за 2 дня</div>') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px"><button class="sz js-minus" data-m="' + p.id + '" aria-label="Уменьшить количество" style="min-width:34px;height:34px">−</button>' +
          '<span class="qty-n" data-qty="' + p.id + '" style="font-weight:700;min-width:22px;text-align:center">' + p._qty + '</span>' +
          '<button class="sz js-plus" data-p="' + p.id + '" aria-label="Увеличить количество" style="min-width:34px;height:34px">+</button></div>' +
          '<div style="min-width:120px;text-align:right"><div class="price" style="font-size:18px">' + num((p.price || 0) * p._qty) + ' ₽</div>' +
          '<a href="javascript:void(0)" class="js-remove" data-d="' + p.id + '" style="font-size:12px;color:var(--ink-soft)">Удалить</a></div></div>';
      }).join('');
      var aside =
        '<aside class="filters cart-sum" style="position:static;padding:20px">' +
        '<div style="font-family:var(--serif);font-size:20px;font-weight:600;margin-bottom:14px">Ваш заказ · самовывоз</div>' +
        '<div style="display:grid;gap:8px;font-size:14px">' +
        '<div style="display:flex;justify-content:space-between"><span>Товары (' + items.length + ')</span><b>' + num(sum) + ' ₽</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span>Скидка</span><b style="color:var(--emerald)">0 ₽</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span>Доставка в салон</span><b style="color:var(--emerald)">0 ₽</b></div></div>' +
        '<hr class="sep" style="margin:8px 0 12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:700">Итого</span>' +
        '<span style="font-size:24px;font-weight:800" id="itSum">' + num(sum) + ' ₽</span></div>' +
        '<div style="font-size:12px;color:var(--ink-soft);margin:4px 0 12px">Оплата — в салоне при получении · без онлайн-платежей</div>' +
        '<input class="fsearch" id="oName" style="margin:0 0 8px" placeholder="Ваше имя">' +
        '<input class="fsearch" id="oPhone" style="margin:0 0 10px" placeholder="+7 (___) ___-__-__" inputmode="tel">' +
        '<button class="btn btn-p btn-l" id="oGo">Отправить заказ в салон</button>' +
        '<div id="oMsg" style="font-size:13px;margin-top:8px"></div>' +
        '<div class="chklist" style="margin-top:12px">' +
        '<span class="chk">Заберёте в салоне ' + gen(CITY) + '</span>' +
        '<span class="chk">Примерка перед оплатой</span></div></aside>';
      layout.innerHTML = '<div style="display:grid;gap:14px">' + rows + '</div>' + aside;
      window.__iconsApply && window.__iconsApply();
      document.querySelectorAll('[data-p]').forEach(function (b) {
        b.onclick = function () { var a = cartStore.get(), e = a.filter(function (x) { return x.id === Number(b.dataset.p); })[0]; if (e) { e.qty++; cartStore.save(a); } location.reload(); };
      });
      document.querySelectorAll('[data-m]').forEach(function (b) {
        b.onclick = function () { var a = cartStore.get(), e = a.filter(function (x) { return x.id === Number(b.dataset.m); })[0]; if (e && e.qty > 1) { e.qty--; cartStore.save(a); } else cartStore.del(Number(b.dataset.m)); location.reload(); };
      });
      document.querySelectorAll('[data-d]').forEach(function (b) {
        b.onclick = function () { cartStore.del(Number(b.dataset.d)); location.reload(); };
      });
      if (h1) h1.innerHTML = 'Корзина <span>' + items.length + ' издели' + (items.length === 1 ? 'е' : 'я') + '</span>';
      document.getElementById('oGo').addEventListener('click', function () {
        var phone = document.getElementById('oPhone').value.trim();
        var msg = document.getElementById('oMsg');
        if (!/^\+?[\d\s()-]{10,18}$/.test(phone)) { msg.innerHTML = '<span style="color:var(--terra)">Укажите корректный телефон.</span>'; return; }
        var payload = { name: document.getElementById('oName').value.trim(), phone: phone, city: CITY,
          comment: 'Заказ с сайта (самовывоз)',
          items: items.map(function (p) { return { id: p.id, name: pretty(p), code: (p.codes || [])[0], price: p.price, qty: p._qty }; }) };
        fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.ok) {
              localStorage.removeItem('aura_cart'); cartStore.badge();
              var wrap = document.querySelector('main.wrap') || document.body;
              wrap.innerHTML = '<div style="padding:60px 10px;text-align:center">' +
                '<h1 class="pagetitle" style="margin-bottom:10px">Спасибо! Заказ №' + res.id + ' принят</h1>' +
                '<p style="color:var(--ink-2);max-width:520px;margin:0 auto 20px">Салон ' + gen(CITY) +
                ' свяжется с вами по телефону ' + phone + ' — подтвердит и отложит украшения к примерке.<br>Оплата — в салоне.</p>' +
                '<a class="btn btn-p" href="catalog.html">Вернуться в каталог</a></div>';
            } else msg.innerHTML = '<span style="color:var(--terra)">Ошибка: ' + (res.error || '') + '</span>';
          });
      });
    });
  }

  /* ---------- Schema.org для реального товара ----------
     Разметку строим по данным 1С, а не по демо-карточке: цена, артикул,
     наличие и ссылка — настоящие. */
  function schemaProduct(it) {
    var q = it.cities && it.cities[CITY];
    var node = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: pretty(it),
      sku: (it.codes || [])[0] || String(it.id),
      category: it.category || undefined,
      material: it.metal || undefined,
      brand: { '@type': 'Brand', name: 'AURA' },
      url: location.origin + location.pathname + '?id=' + it.id,
      offers: {
        '@type': 'Offer',
        price: it.price || undefined,
        priceCurrency: 'RUB',
        availability: q ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: 'Ювелирный дом AURA' },
        areaServed: Object.keys(it.cities || {}),
        url: location.origin + location.pathname + '?id=' + it.id,
      },
    };
    var old = document.getElementById('auraProductSchema');
    if (old) old.parentNode.removeChild(old);
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'auraProductSchema';
    s.textContent = JSON.stringify(node);
    document.head.appendChild(s);
  }

  /* Карточки в каруселях: ui.js строит .crl-view/.crl-track при загрузке,
     поэтому живой рендер обязан попадать в дорожку, иначе карточки встают
     в столбик и секция вырастает на тысячи пикселей. */
  function fillCarousel(el, html) {
    if (!el) return;
    var track = el.querySelector('.crl-track');
    if (track) { track.innerHTML = html; return; }
    Array.prototype.slice.call(el.querySelectorAll('.crl-view,.crl-a,.crl-dots')).forEach(function (n) {
      n.parentNode.removeChild(n);
    });
    el.innerHTML = html;
    if (window.__auraCarousels) {
      el.classList.remove('crl-built');
      window.__auraCarousels();
    }
  }

  /* ---------- ЛИЧНЫЙ КАБИНЕТ: заказы, бонусы, резервы (данные салона) ---------- */
  var STATUS = {
    'новый': ['Принят · ждём подтверждения', 'gold'],
    'подтверждён': ['Подтверждён салоном', 'gold'],
    'готов': ['Готов к выдаче', 'g'],
    'выдан': ['Забрали в салоне', 'g'],
    'отменён': ['Отменён', ''],
  };
  function statusOf(o) {
    var s = STATUS[o.status] || [o.status || 'В работе', ''];
    return '<span class="st ' + s[1] + '">' + s[0] + '</span>';
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function orderSum(o) {
    return (o.items || []).reduce(function (s, i) { return s + (i.price || 0) * (i.qty || 1); }, 0);
  }

  function liveAccount() {
    var login = document.getElementById('loginView');
    var cab = document.getElementById('accView');
    if (!login || !cab) return;
    var token = localStorage.getItem('aura_token') || '';
    var stage = document.getElementById('codeStage');
    var hint = document.getElementById('codeHint');
    var phoneIn = document.getElementById('inPhone');
    var nameIn = document.getElementById('accName');

    function showLogin(msg) {
      login.style.display = '';
      cab.style.display = 'none';
      if (msg && hint) { hint.textContent = msg; stage.style.display = ''; }
    }
    function showCabinet(p) {
      login.style.display = 'none';
      cab.style.display = '';
      var letter = (p.name || 'Г').trim().charAt(0).toUpperCase() || 'Г';
      var av = document.getElementById('accAv'); if (av) av.textContent = letter;
      if (nameIn) nameIn.textContent = p.name || 'Гость AURA';
      var meta = document.getElementById('accMeta');
      if (meta) meta.textContent = phoneIn.value.trim() + ' · ' + (p.city || 'Раменское') + ' · уровень «' + (p.level || 'Серебро') + '»';

      var ord = p.orders || [];
      var set = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
      set('stOrders', ord.length);
      set('stBonus', num(p.bonuses || 0));
      set('stPass', (p.passports || []).length);
      set('stReserve', (p.reserves || []).length);

      // заказы
      var rows = ord.map(function (o) {
        var names = (o.items || []).map(function (i) { return i.name || ('арт. ' + (i.code || '—')); }).join(', ');
        return '<tr data-st="' + (o.status === 'выдан' ? 'done' : o.status === 'отменён' ? 'cancel' : 'active') + '">' +
          '<td><b>AURA-' + o.id + '</b></td><td>' + fmtDate(o.created) + '</td>' +
          '<td>' + (names || '—') + '</td><td><b>' + num(orderSum(o)) + ' ₽</b></td>' +
          '<td>' + statusOf(o) + '</td></tr>';
      }).join('') || '<tr><td colspan="5" style="color:var(--ink-2)">Заказов пока нет. Оформите самовывоз в каталоге — заказ появится здесь, а салон подтвердит его по телефону.</td></tr>';
      var ordBody = document.querySelector('#pane-orders tbody');
      if (ordBody) ordBody.innerHTML = rows;

      // вкладки «все / в работе / завершённые»
      var tabs = document.querySelectorAll('#ordTabs .a-tab');
      function applyTab(mode) {
        document.querySelectorAll('#pane-orders tbody tr[data-st]').forEach(function (tr) {
          var st = tr.getAttribute('data-st');
          tr.style.display = (mode === 'all' || (mode === 'active' && st === 'active') || (mode === 'done' && st === 'done')) ? '' : 'none';
        });
      }
      tabs.forEach(function (t) {
        t.onclick = function () {
          tabs.forEach(function (x) { x.classList.remove('on'); });
          t.classList.add('on');
          applyTab(t.getAttribute('data-pp'));
        };
      });

      // бонусы и история начислений
      set('bnVal', num(p.bonuses || 0));
      var bnNote = document.getElementById('bnNote');
      if (bnNote) {
        bnNote.textContent = p.bonuses
          ? '1 бонус = 1 ₽. Начислено 2% от выданных заказов на ' + num(p.turnover) + ' ₽. Списать можно до 30% покупки.'
          : '1 бонус = 1 ₽. Бонусы начислим после выдачи заказа в салоне (2% от суммы). Пока заказы не выданы — баланс 0.';
      }
      var bnBody = document.querySelector('#pane-bonus tbody');
      if (bnBody) {
        var paid = (p.orders || []).filter(function (o) { return o.status === 'выдан'; });
        bnBody.innerHTML = paid.map(function (o) {
          return '<tr><td>' + fmtDate(o.created) + '</td><td>Заказ AURA-' + o.id + '</td>' +
            '<td style="text-align:right;color:var(--emerald);font-weight:700">+ ' + num(Math.round(orderSum(o) * (p.bonus_rate || 0.02))) + '</td></tr>';
        }).join('') || '<tr><td colspan="3" style="color:var(--ink-2)">Начислений пока нет — бонусы появятся после выдачи заказа в салоне.</td></tr>';
      }

      // резервы = заявки в работе
      var res = document.getElementById('resList');
      if (res) {
        res.innerHTML = (p.reserves || []).map(function (o) {
          var names = (o.items || []).map(function (i) { return i.name || ('арт. ' + i.code); }).join(', ');
          return '<div class="plan-step"><span class="pn" data-ic="calendar"></span><div><b>Заявка AURA-' + o.id + ' · ' + gen(o.city || CITY) + '</b>' +
            '<p>' + fmtDate(o.created) + ' · ' + (names || 'изделия из заявки') + ' · сумма ' + num(orderSum(o)) + ' ₽</p></div>' +
            '<span class="st gold" style="margin-left:auto">' + ((STATUS[o.status] || ['В работе'])[0]) + '</span></div>';
        }).join('') || '<div class="plan-step"><span class="pn" data-ic="calendar"></span><div><b>Активных заявок нет</b>' +
          '<p>Резерв и примерку можно оформить в карточке украшения — салон подтвердит по телефону.</p></div></div>';
      }

      // паспорта изделий из заказов
      var pass = document.getElementById('passList');
      if (pass) {
        pass.innerHTML = (p.passports || []).map(function (i) {
          return '<div class="pass-feat" style="border:1px solid var(--border);align-items:center">' +
            '<span class="pf-ic" data-ic="gem"></span>' +
            '<div style="flex:1"><b>' + (i.name || 'Изделие') + '</b>' +
            '<span style="display:block;font-size:12.5px;color:var(--ink-3)">арт. ' + (i.code || '—') + ' · ' + (i.price ? num(i.price) + ' ₽' : 'цена в салоне') + '</span></div>' +
            '<a href="passport.html" style="color:var(--emerald);font-weight:700;font-size:13px">Открыть паспорт</a></div>';
        }).join('') || '<p style="color:var(--ink-2)">Паспорта появятся здесь после покупки: документ выдаётся на каждое изделие и хранится в кабинете.</p>';
      }

      // настройки
      var sp = document.getElementById('setPhone'); if (sp) sp.value = phoneIn.value.trim();
      var sn = document.getElementById('setName'); if (sn) sn.value = p.name || '';
      var sc = document.getElementById('setCity'); if (sc && p.city) sc.value = p.city;

      var src = document.getElementById('accSrc');
      if (src) src.textContent = 'Данные кабинета — из учёта сети: ' + (p.source_note || '') + (p.next_level ? ' До уровня «' + p.next_level + '» осталось ' + num(p.next_level_at - p.turnover) + ' ₽ покупок.' : '');

      window.__iconsApply && window.__iconsApply();
      loadFavorites();
    }

    function loadFavorites() {
      var box = document.getElementById('favList');
      if (!box) return;
      var ids = [];
      try { ids = JSON.parse(localStorage.getItem('aura_fav') || '[]'); } catch (e) { ids = []; }
      if (!ids.length) {
        box.innerHTML = '<p style="color:var(--ink-2)">В избранном пусто. Нажмите на сердце в каталоге — украшение появится здесь.</p>';
        return;
      }
      Promise.all(ids.slice(0, 12).map(function (id) {
        return fetchJ('/api/products/' + id);
      })).then(function (list) {
        var items = list.filter(Boolean);
        box.innerHTML = items.map(function (x) {
          var q = x.cities && x.cities[CITY];
          return '<div class="cartitem" style="cursor:default">' +
            '<div class="ph" style="width:96px;height:96px;flex:none;position:relative">' + noimg('noimg--thumb') + '</div>' +
            '<div style="flex:1"><b><a href="product.html?id=' + x.id + '">' + pretty(x) + '</a></b>' +
            '<div class="meta">' + (x.metal || '') + (q ? ' · в салоне ' + gen(CITY) : ' · привезём за 2 дня') + '</div>' +
            '<b>' + num(x.price) + ' ₽</b></div>' +
            '<div style="display:flex;gap:8px"><a class="btn btn-p" style="padding:10px 16px;min-height:42px" href="product.html?id=' + x.id + '">Смотреть</a>' +
            '<button class="fav on js-unfav" data-id="' + x.id + '" data-ic="heart" aria-label="Убрать из избранного"><span class="sr-only">Убрать</span></button></div></div>';
        }).join('') || '<p style="color:var(--ink-2)">Товары из избранного больше не в каталоге.</p>';
        window.__iconsApply && window.__iconsApply();
        box.querySelectorAll('.js-unfav').forEach(function (b) {
          b.onclick = function () {
            var arr = [];
            try { arr = JSON.parse(localStorage.getItem('aura_fav') || '[]'); } catch (e) { arr = []; }
            localStorage.setItem('aura_fav', JSON.stringify(arr.filter(function (x) { return String(x) !== b.dataset.id; })));
            loadFavorites();
          };
        });
      });
    }

    function enter(p) { localStorage.setItem('aura_token', token); showCabinet(p); }
    function loadProfile() {
      if (!token) { showLogin(); return; }
      fetchJ('/api/account?token=' + encodeURIComponent(token)).then(function (p) {
        if (!p || p.error) { localStorage.removeItem('aura_token'); token = ''; showLogin(); return; }
        showCabinet(p);
      });
    }

    // вход: код на телефон
    var goCode = document.getElementById('goCode');
    if (goCode) goCode.onclick = function () {
      var phone = phoneIn.value.trim();
      if (!/^\+?[\d\s()-]{10,18}$/.test(phone)) { hint.textContent = 'Проверьте номер телефона.'; stage.style.display = ''; return; }
      goCode.disabled = true;
      fetch('/api/auth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone }) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          goCode.disabled = false;
          stage.style.display = '';
          if (!res || !res.ok) { hint.textContent = 'Не получилось отправить код — проверьте номер.'; return; }
          hint.textContent = res.demo
            ? 'SMS-шлюз не подключён, поэтому код показан здесь: ' + res.code + '. На боевом сайте он приходит сообщением.'
            : 'Код отправлен по СМС на ' + phone + '.';
          var box = stage.querySelectorAll('.codebox input');
          box.forEach(function (i) { i.value = ''; });
          if (res.demo && box[0]) { res.code.split('').forEach(function (c, i) { if (box[i]) box[i].value = c; }); }
          box.forEach(function (i) {
            i.oninput = function () {
              if (i.value && i.nextElementSibling) i.nextElementSibling.focus();
              if (box[box.length - 1].value) enterCode();
            };
          });
          (box[0] || {}).focus && box[0].focus();
        });
    };
    function enterCode() {
      var code = Array.prototype.map.call(document.querySelectorAll('#codeStage .codebox input'), function (i) { return i.value; }).join('');
      fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneIn.value.trim(), code: code }) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) { hint.textContent = 'Код не подошёл. Запросите новый.'; return; }
          token = res.token;
          fetchJ('/api/account?token=' + encodeURIComponent(token)).then(function (p) {
            if (p && !p.error) enter(p); else showLogin('Не удалось загрузить кабинет.');
          });
        });
    }
    var goEnter = document.getElementById('goEnter');
    if (goEnter) goEnter.onclick = enterCode;

    var out = document.getElementById('logout');
    if (out) out.onclick = function (e) {
      e.preventDefault();
      localStorage.removeItem('aura_token');
      token = '';
      stage.style.display = 'none';
      showLogin();
    };

    /* избранное: сердце в карточках каталога и на главной */
    loadProfile();
  }

  /* Избранное работает на всех страницах: сердце → localStorage → кабинет */
  function initFavButtons() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.fav');
      if (!b || b.classList.contains('js-unfav') || b.id === 'logout') return;
      var card = b.closest('.card');
      var link = card && card.querySelector('h3 a');
      var id = null;
      if (link) { var m = /id=(\d+)/.exec(link.getAttribute('href') || ''); if (m) id = m[1]; }
      if (!id) return;                        // демо-карточка макета
      e.preventDefault();
      var arr = [];
      try { arr = JSON.parse(localStorage.getItem('aura_fav') || '[]'); } catch (err) { arr = []; }
      var has = arr.some(function (x) { return String(x) === id; });
      arr = has ? arr.filter(function (x) { return String(x) !== id; }) : arr.concat([Number(id)]);
      localStorage.setItem('aura_fav', JSON.stringify(arr));
      b.classList.toggle('on', !has);
      if (window.__auraToast) window.__auraToast(has ? 'Убрали из избранного' : 'Добавили в избранное — список в кабинете');
    });
  }

  /* ---------- СКУПКА И ОБМЕН: калькулятор по прейскуранту сети ----------
     Ставки — из действующего прейскуранта AURA (от 21.08.2026).
     При изменении прейскуранта правится только эта таблица. */
  var SK_RATES = {
    '375': { label: '375', buy: 3900, swap: 4200 },
    '500': { label: '500', buy: 5100, swap: 5500 },
    '585i': { label: '585 импортное', buy: 5900, swap: 6500 },
    '585': { label: '583–585 отечественное', buy: 6100, swap: 6500 },
    '750': { label: '750', buy: 7800, swap: 8000 },
    '900': { label: '900', buy: 9300, swap: 9500 },
  };
  function liveSkupka() {
    var sel = document.getElementById('skProba');
    var weight = document.getElementById('skWeight');
    var deal = document.getElementById('skDeal');
    if (!sel) return;
    function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
    function recalc() {
      var r = SK_RATES[sel.value] || SK_RATES['585'];
      var g = parseFloat(String(weight.value).replace(',', '.').replace(/[^\d.]/g, ''));
      if (isNaN(g) || g < 0) g = 0;
      var buy = Math.round(r.buy * g);
      var swap = Math.round(r.swap * g);
      set('skProbaOut', r.label);
      set('skRateBuy', num(r.buy) + ' ₽/г');
      set('skRateSwap', num(r.swap) + ' ₽/г');
      set('skSumBuy', num(buy) + ' ₽');
      set('skSumSwap', num(swap) + ' ₽');
      set('skGain', '+ ' + num(swap - buy) + ' ₽');
      // подсвечиваем строку прейскуранта выбранной пробы
      document.querySelectorAll('#skRatesTable tbody tr').forEach(function (tr) {
        tr.classList.toggle('on', tr.dataset.proba === sel.value);
      });
      // при обмене подчёркиваем выгоду
      var rows = document.querySelectorAll('.sk-out .row');
      rows.forEach(function (row) { row.style.opacity = ''; });
      if (deal && deal.value === 'swap' && rows.length >= 5) rows[4].style.opacity = '1';
    }
    ['change', 'input'].forEach(function (ev) {
      sel.addEventListener(ev, recalc);
      if (weight) weight.addEventListener(ev, recalc);
      if (deal) deal.addEventListener(ev, recalc);
    });
    recalc();

    // заявка на оценку
    var send = document.getElementById('skSend');
    if (send) send.onclick = function () {
      var name = document.getElementById('skName');
      var phone = document.getElementById('skPhone');
      var note = document.getElementById('skNote');
      var err = document.getElementById('skErr');
      var ok = document.getElementById('skOk');
      var bad = !name.value.trim() || name.value.trim().length < 2 || phone.value.replace(/\D/g, '').length < 10;
      if (err) err.hidden = !bad;
      if (ok) ok.hidden = true;
      if (bad) { (name.value.trim().length < 2 ? name : phone).focus(); return; }
      var r = SK_RATES[sel.value] || SK_RATES['585'];
      var g = parseFloat(String(weight.value).replace(',', '.')) || 0;
      send.disabled = true;
      fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value.trim(), phone: phone.value.trim(), city: CITY,
          comment: 'Заявка: скупка и обмен' + (g ? ' — ' + r.label + ', ' + g + ' г по прейскуранту' : '') + (note.value.trim() ? '. ' + note.value.trim() : ''),
          items: [],
        }),
      }).then(function (res) { return res.json(); }).then(function (res) {
        send.disabled = false;
        if (ok) {
          ok.textContent = res && res.ok
            ? 'Заявка №' + res.id + ' принята. Консультант салона позвонит и подскажет удобное время оценки.'
            : 'Заявка отправлена. Консультант свяжется с вами по телефону ' + phone.value.trim() + '.';
          ok.hidden = false;
        }
        send.textContent = 'Заявка отправлена ✓';
        window.__auraToast && window.__auraToast('Заявка отправлена в салон');
      }).catch(function () {
        send.disabled = false;
        if (ok) { ok.textContent = 'Заявка принята. Салон свяжется с вами по телефону ' + phone.value.trim() + '.'; ok.hidden = false; }
      });
    };
  }

  var fn = (location.pathname.split('/').pop() || 'index.html');
  window.addEventListener('DOMContentLoaded', function () {
    cartStore.badge();
    initFavButtons();
    if (fn === 'index.html') liveIndex();
    else if (fn === 'catalog.html') liveCatalog();
    else if (fn === 'product.html') { liveProduct(); liveProductButtons(); }
    else if (fn === 'salon.html') liveSalon();
    else if (fn === 'cart.html') liveCart();
    else if (fn === 'account.html') liveAccount();
    else if (fn === 'skupka.html') liveSkupka();
  });
})();
