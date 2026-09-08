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

  /* ---------- КАТАЛОГ ---------- */
  function liveCatalog() {
    var grid = document.getElementById('grid');
    var info = document.getElementById('foundInfo');
    var h1 = document.querySelector('.pagetitle');
    if (!grid) return;
    var cat = qs('cat');
    if (!cat && h1) {
      var t = (h1.textContent || '');
      for (var k in CATW) if (t.indexOf(k) === 0) { cat = k; break; }
    }
    cat = cat || 'Кольца';
    var cur = { metal: null, city: false, price: null };

    function PICS(i) {
      var set = ['ring', 'ring2', 'ring3', 'sol'];
      var p = window.PICS && window.PICS[set[i % 4]];
      return p || (window.PICS && window.PICS.ring) || '';
    }
    function rcard(it, i) {
      var q = it.cities && it.cities[CITY];
      var av = q ? '<span class="avail">В салоне ' + gen(CITY) + ' · сегодня</span>'
                 : '<span class="avail no">Привезём в салон за 2 дня</span>';
      var tag = (it.sales >= 500) ? '<span class="tg new">Хит</span>' : '';
      var ph = '<div class="ph">' + PICS(i) +
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
      grid.innerHTML = items.map(rcard).join('');
      if (info) info.textContent = 'Найдено: ' + items.length + ' · показаны 1–' + items.length;
      if (h1) h1.innerHTML = (cat === 'Кольца' ? 'Кольца' : cat) + ' <span>' + (total || items.length) + ' изделий</span>';
      document.title = 'AURA — Каталог: ' + (cat === 'Кольца' ? 'Кольца' : cat);
      var crumb = document.querySelector('.breadcrumbs b');
      if (crumb) crumb.textContent = cat;
      window.__iconsApply && window.__iconsApply();
      document.querySelectorAll('.fav').forEach(function (b, i) { b.dataset.i = i; });
    }
    function load() {
      var p = new URLSearchParams();
      p.set('category', cat); p.set('per', '60'); p.set('sort', 'popular');
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
      var crumb = document.querySelector('.breadcrumbs b');
      if (crumb) crumb.textContent = name;
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
      // кнопки «В корзину/резерв» ведут на заказ по телефону (без онлайн-оплаты)
      document.querySelectorAll('.ctarow a, .salonpick .btn').forEach(function (a) {
        a.href = 'tel:+74964640307';
      });
    });
  }

  /* ---------- ГЛАВНАЯ: хиты и новинки на реальных товарах ---------- */
  function liveIndex() {
    function cardReal(it, i) {
      var tg = '';
      if (it.sales >= 500) tg = '<span class="tg hit">Хит</span>';
      else if (i === 0) tg = '<span class="tg new">Новинка</span>';
      var pics = window.PICS || {};
      var icn = pics[MARK_ICONS[i % MARK_ICONS.length]] || pics.ring || '';
      var q = it.cities && it.cities[CITY];
      var av = q ? '<span class="avail">В салоне Раменского · сегодня</span>'
                 : '<span class="avail no">Привезём в салон за 2 дня</span>';
      var nm = pretty(it);
      return '<div class="card"><div class="ph">' + icn +
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
      if (el) el.innerHTML = items.map(cardReal).join('');
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
      if (a.textContent.indexOf('1 клик') >= 0) { a.href = 'tel:+74964640307'; return; }
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
      var pics = window.PICS || {};
      var icn = pics.ring || '';
      el.innerHTML = (d.items || []).map(function (it, i) {
        var q = it.cities && it.cities[city];
        var nm = pretty(it);
        return '<div class="card"><div class="ph">' + (pics[MARK_ICONS[i % MARK_ICONS.length]] || icn) +
          '<div class="b1"><span class="tg new">' + (q || 0) + ' шт</span></div>' +
          '<div class="buy"><a class="btn btn-p" href="product.html?id=' + it.id + '">К товару</a></div></div>' +
          '<div class="body"><span class="avail">В салоне ' + gen(city) + '</span>' +
          '<h3><a href="product.html?id=' + it.id + '">' + nm + '</a></h3>' +
          '<span class="meta">' + (it.metal || '') + '</span>' +
          '<div class="price-row"><span class="price">' + num(it.price) + ' ₽</span></div></div></div>';
      }).join('') || '<p>Сейчас товаров в этом городе нет — привезём за 2 дня.</p>';
    });
    // ссылки городов -> эта же страница с городом
    document.querySelectorAll('.sec a, .svcgrid a').forEach(function (a) {
      var t = (a.textContent || '').trim();
      for (var k in GEO) if (t === k) a.setAttribute('href', 'salon.html?city=' + encodeURIComponent(k));
    });
  }

  /* ---------- КОРЗИНА (страница cart.html) ---------- */
  var gemSVG = '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" style="color:#C4A06A;width:64px;height:64px;margin:auto"><path d="M7 3.5h10l4 5-9 12L3 8.5l4-5z"/><path d="M3 8.5h18M9.5 3.5L12 8.5l2.5-5M9 8.5l3 12 3-12"/></svg>';
  function liveCart() {
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
        return '<div class="card" style="flex-direction:row;align-items:center;padding:14px">' +
          '<div class="ph" style="width:110px;aspect-ratio:1;flex:none;border-radius:12px;display:flex">' + gemSVG + '</div>' +
          '<div style="flex:1;padding:0 16px">' +
          '<div style="font-weight:600"><a href="product.html?id=' + p.id + '">' + pretty(p) + '</a></div>' +
          '<div class="meta" style="font-size:12.5px;color:var(--ink-soft)">' + (p.metal || '') + ' · арт. ' + ((p.codes || [])[0] || '—') + '</div>' +
          (q ? '<div class="avail" style="margin-top:6px">В салоне Раменского — заберёте сегодня</div>'
             : '<div class="avail no" style="margin-top:6px">Привезём в салон за 2 дня</div>') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px"><button class="sz" data-m="' + p.id + '" style="min-width:34px;height:34px">−</button>' +
          '<span style="font-weight:700;min-width:22px;text-align:center">' + p._qty + '</span>' +
          '<button class="sz" data-p="' + p.id + '" style="min-width:34px;height:34px">+</button></div>' +
          '<div style="min-width:120px;text-align:right"><div class="price" style="font-size:18px">' + num((p.price || 0) * p._qty) + ' ₽</div>' +
          '<a href="javascript:void(0)" data-d="' + p.id + '" style="font-size:12px;color:var(--ink-soft)">Удалить</a></div></div>';
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

  var fn = (location.pathname.split('/').pop() || 'index.html');
  window.addEventListener('DOMContentLoaded', function () {
    cartStore.badge();
    if (fn === 'index.html') liveIndex();
    else if (fn === 'catalog.html') liveCatalog();
    else if (fn === 'product.html') { liveProduct(); liveProductButtons(); }
    else if (fn === 'salon.html') liveSalon();
    else if (fn === 'cart.html') liveCart();
  });
})();
