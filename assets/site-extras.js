/* ============================================================
   AURA — дополнительные сетевые механики сайта:
   1) выбор города в шапке (влияет на наличие в живом каталоге),
   2) плашка о cookie — как на сайтах крупных сетей,
   3) кнопка «Задать вопрос» на всех страницах.
   Подключается последним скриптом на каждой странице.
   ============================================================ */
(function () {
  'use strict';
  var CITIES = ['Раменское', 'Ногинск', 'Воскресенск', 'Егорьевск', 'Луховицы', 'Озёры', 'Электрогорск'];
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* ---------- 1. выбор города ---------- */
  function initCity() {
    var box = document.querySelector('.topline .city');
    if (!box) return;
    var current = store('aura_city') || 'Раменское';
    var label = box.querySelector('b');
    if (label) label.textContent = current;
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-haspopup', 'listbox');
    box.setAttribute('aria-expanded', 'false');
    box.style.cursor = 'pointer';
    box.style.position = 'relative';

    var list = document.createElement('div');
    list.className = 'city-pop';
    list.setAttribute('role', 'listbox');
    list.innerHTML = '<p class="city-pop-t">Ваш город</p>' + CITIES.map(function (c) {
      return '<button type="button" role="option" data-city="' + c + '"' + (c === current ? ' aria-selected="true" class="on"' : '') + '>' + c + '</button>';
    }).join('') + '<p class="city-pop-n">Город влияет на наличие изделий и адрес салона в карточке товара.</p>';
    box.appendChild(list);

    function open(state) {
      list.classList.toggle('open', state);
      box.setAttribute('aria-expanded', state ? 'true' : 'false');
    }
    box.addEventListener('click', function (e) {
      if (e.target.closest('.city-pop')) return;
      open(!list.classList.contains('open'));
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(!list.classList.contains('open')); }
      if (e.key === 'Escape') open(false);
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-city]');
      if (!b) return;
      var city = b.getAttribute('data-city');
      store('aura_city', city);
      if (label) label.textContent = city;
      Array.prototype.forEach.call(list.querySelectorAll('[data-city]'), function (x) {
        x.classList.toggle('on', x === b);
        if (x === b) x.setAttribute('aria-selected', 'true'); else x.removeAttribute('aria-selected');
      });
      open(false);
      if (window.__auraSetCity) window.__auraSetCity(city);
      if (window.__auraToast) window.__auraToast('Город: ' + city + ' — показываем наличие в нём');
      // на страницах с живыми данными перезагружаем, чтобы подтянуть наличие
      var fn = location.pathname.split('/').pop() || 'index.html';
      if (['catalog.html', 'product.html', 'salon.html', 'index.html'].indexOf(fn) >= 0) setTimeout(function () { location.reload(); }, 700);
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
  }

  /* ---------- 2. cookie ---------- */
  function initCookie() {
    if (store('aura_cookie_ok') === '1') return;
    var bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Использование cookie');
    bar.innerHTML = '<p>Мы используем файлы cookie, чтобы сайт работал корректно и был удобнее. ' +
      'Продолжая пользоваться сайтом, вы соглашаетесь с <a href="legal.html">политикой обработки данных</a>.</p>' +
      '<button type="button" class="btn btn-p">Понятно</button>';
    document.body.appendChild(bar);
    /* пока плашка видна — нижние панели скрыты, иначе они накладываются друг на друга */
    document.body.classList.add('cookie-on');
    bar.querySelector('button').addEventListener('click', function () {
      store('aura_cookie_ok', '1');
      bar.classList.add('hide');
      document.body.classList.remove('cookie-on');
      setTimeout(function () { bar.remove(); }, 300);
    });
  }

  /* ---------- 3. кнопка «Задать вопрос» ---------- */
  function initAsk() {
    var ask = document.createElement('a');
    ask.className = 'ask-btn';
    ask.href = 'contacts.html';
    ask.setAttribute('aria-label', 'Задать вопрос консультанту');
    ask.innerHTML = '<span class="ask-ic" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 12a8 8 0 0 1-8 8H4l2-3.2A8 8 0 1 1 21 12z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg></span>' +
      '<span class="ask-t">Задать вопрос</span>';
    document.body.appendChild(ask);
  }

  /* ---------- 4. кнопка «Наверх» ---------- */
  function initToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Вернуться наверх');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    document.body.appendChild(btn);
    function onScroll() { btn.classList.toggle('show', (window.scrollY || 0) > 900); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    initCity();
    setTimeout(initCookie, 2200);   /* не перекрываем баннер в первые секунды */
    initAsk();
    initToTop();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
