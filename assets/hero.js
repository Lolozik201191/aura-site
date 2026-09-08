/* ============================================================
   AURA — главный слайдер v5 («живая» смена: заголовок по буквам,
   вход контента, автостоп при наведении, свайп, клавиатура)
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('hsl');
  if (!root) return;
  var view = root.querySelector('.hsl-view');
  var slides = Array.prototype.slice.call(root.querySelectorAll('.hslide'));
  if (!view || slides.length < 2) return;
  var idx = 0;
  var timer = null;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ARR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M14 6.5L19.5 12 14 17.5"/></svg>';

  function makeBtn(cls, label) {
    var b = document.createElement('button');
    b.className = 'hsl-a ' + cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = ARR;
    return b;
  }
  var prev = makeBtn('prev', 'Предыдущий слайд');
  var next = makeBtn('next', 'Следующий слайд');
  root.appendChild(prev);
  root.appendChild(next);

  var dotsBox = document.createElement('div');
  dotsBox.className = 'hsl-dots';
  slides.forEach(function (_, i) {
    var d = document.createElement('i');
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', 'Слайд ' + (i + 1));
    d.addEventListener('click', function () { go(i); restart(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i); restart(); } });
    dotsBox.appendChild(d);
  });
  root.appendChild(dotsBox);
  var dots = Array.prototype.slice.call(dotsBox.children);

  function go(n, instant) {
    idx = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle('on', i === idx);
      // перезапуск CSS-анимаций входа
      if (i === idx) {
        var w = s.querySelector('.wrap');
        if (w) {
          w.classList.remove('play');
          void w.offsetWidth;
          w.classList.add('play');
        }
      }
    });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
  }
  function restart() {
    stop();
    if (!reduced) timer = setInterval(function () { go(idx + 1); }, 7000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  prev.addEventListener('click', function () { go(idx - 1); restart(); });
  next.addEventListener('click', function () { go(idx + 1); restart(); });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', restart);

  // свайп
  var x0 = null;
  view.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
  view.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 46) go(idx + (dx < 0 ? 1 : -1));
    x0 = null;
    restart();
  }, { passive: true });

  // клавиши (не ломаем ввод в полях)
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowLeft') { go(idx - 1); restart(); }
    if (e.key === 'ArrowRight') { go(idx + 1); restart(); }
  });

  go(0, true);
  restart();
})();
