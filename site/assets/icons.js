/* AURA — набор иконок для макетов (инжект по data-ic) */
(function () {
  var S = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var F = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">';
  var E = '</svg>';
  var I = {
    pin: S + '<path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>' + E,
    phone: S + '<path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4z"/>' + E,
    heart: S + '<path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8C20.5 15 12 20.5 12 20.5z"/>' + E,
    bag: S + '<path d="M5 8h14l-1 12.2a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>' + E,
    user: S + '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>' + E,
    search: S + '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>' + E,
    star: F + '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.5 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/>' + E,
    check: S + '<path d="M4.5 12.5l5 5L19.5 7"/>' + E,
    chat: S + '<path d="M21 12a8 8 0 0 1-8 8H4l2-3.2A8 8 0 1 1 21 12z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/>' + E,
    truck: S + '<path d="M2.5 6h11v10h-11z"/><path d="M13.5 10h4l3 3v3h-7z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>' + E,
    shield: S + '<path d="M12 2.8l7 2.6v5.4c0 5-3.2 8.6-7 10.4-3.8-1.8-7-5.4-7-10.4V5.4l7-2.6z"/><path d="M8.8 12l2.3 2.3 4.2-4.6"/>' + E,
    gem: S + '<path d="M7 3.5h10l4 5-9 12L3 8.5l4-5z"/><path d="M3 8.5h18M9.5 3.5L12 8.5l2.5-5M9 8.5l3 12 3-12"/>' + E,
    wallet: S + '<path d="M4 7a2 2 0 0 1 2-2h12v3"/><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M15.5 13h.01M16 13h.01"/>' + E,
    swap: S + '<path d="M4 8h13M14 4.5L17.5 8 14 11.5"/><path d="M20 16H7M10 12.5L6.5 16 10 19.5"/>' + E,
    gift: S + '<rect x="3.5" y="8" width="17" height="4"/><path d="M5 12v8h14v-8M12 8v12M12 8s-1-4.5-4-4.5a2.6 2.6 0 0 0 0 5.2M12 8s1-4.5 4-4.5a2.6 2.6 0 0 1 0 5.2"/>' + E,
    clock: S + '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>' + E,
    calendar: S + '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>' + E,
    spark: F + '<path d="M12 2l1.8 5.7L19.5 9l-5.7 1.3L12 16l-1.8-5.7L4.5 9l5.7-1.3L12 2zM19 15l.9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6-2.6-.9 2.6-.9L19 15z"/>' + E,
    zoom: S + '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5M10.5 7.5v6M7.5 10.5h6"/>' + E,
    msg: S + '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 10h10M7 14h6"/>' + E,
    cart: S + '<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2.5l2.3 11h10l2.4-8H6.4"/>' + E,
    arrow: S + '<path d="M4 12h15M14 6.5L19.5 12 14 17.5"/>' + E,
    scissors: S + '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.2 7.6L20 19M8.2 16.4L20 5"/>' + E,
    drop: S + '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>' + E,
    ring1: S + '<path d="M12 4.4l2.2 2.2L12 8.8 9.8 6.6z"/><path d="M12 8.8V10.4"/><circle cx="12" cy="14.4" r="4.4"/>' + E,
    ear1: S + '<path d="M8.5 8.6V5.8M15.5 8.6V5.8"/><circle cx="8.5" cy="12.6" r="3"/><circle cx="15.5" cy="12.6" r="3"/>' + E,
    bang1: S + '<circle cx="12" cy="13.4" r="5.2"/><path d="M7.2 13.4H5"/>' + E,
    neck1: S + '<path d="M4.5 8.4c3 5.6 12 5.6 15 0"/><circle cx="12" cy="13.6" r="1.6"/>' + E,
    pend1: S + '<path d="M12 6.2v2.4M12 8.6l2.6 2.6L12 16.2l-2.6-5z"/>' + E,
    chain1: S + '<path d="M5 11.6c2.4-3.8 6.6-3.8 7 0s4.6 3.8 7 0" stroke-dasharray=".1 10"/><circle cx="5" cy="15" r="1.7"/><circle cx="19" cy="15" r="1.7"/>' + E,
    wed1: S + '<circle cx="9.6" cy="13.6" r="4.4"/><circle cx="14.4" cy="13.6" r="4.4"/>' + E
  };
  function apply() {
    document.querySelectorAll('[data-ic]').forEach(function (el) {
      var n = el.getAttribute('data-ic');
      if (I[n] && !el.querySelector('svg')) el.innerHTML = I[n] + el.innerHTML;
    });
  }
  window.__iconsApply = apply;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
