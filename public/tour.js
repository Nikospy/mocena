// Przewodnik pokazu: numery przy elementach ekranu, pamięć rozwinięcia karty, strzałki. Strona działa też bez tego skryptu.
(function () {
  // Pierwszy widoczny element: ten sam odnośnik bywa w wersji na komputer i na telefon.
  function visible(selector) {
    var all = [];
    try { all = document.querySelectorAll(selector); } catch (e) { all = []; }
    for (var i = 0; i < all.length; i++) {
      if (all[i].closest(".gpanel, .gmob")) continue;
      var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return all[i];
    }
    return null;
  }
  document.querySelectorAll("[data-look-selector]").forEach(function (li) {
    var el = visible(li.getAttribute("data-look-selector"));
    if (el) el.setAttribute("data-look", li.getAttribute("data-look-n"));
  });

  // Przewijanie tylko do miejsca działania z „Spróbuj” i tylko wtedy, gdy nie widać go od razu; inaczej nagłówek strony zostaje na ekranie.
  function tryTarget() {
    var t = document.querySelector("[data-try-selector]");
    return t ? visible(t.getAttribute("data-try-selector")) : null;
  }
  // Dół widocznej części strony nad dolnym paskiem przewodnika na telefonie; otwarty opis liczymy jak zwinięty, bo widz go zwija po przeczytaniu.
  function viewBottom() {
    var m = document.querySelector(".gmob");
    if (!m || getComputedStyle(m).display === "none") return window.innerHeight;
    var body = m.querySelector("details[open] .gp-b");
    return window.innerHeight - m.getBoundingClientRect().height + (body ? body.getBoundingClientRect().height : 0);
  }
  function reveal(el) {
    if (!el) return;
    // Pod miejscem działania zostaje miejsce na podpis, np. „Wybrano 1: …” pod ocenami.
    var r = el.getBoundingClientRect(), bottom = viewBottom(), gap = 16, below = 48;
    if (r.top >= 0 && r.bottom <= bottom - below) return;
    // Blisko: najmniejsze przewinięcie, żeby było widać, co stoi nad miejscem działania. Daleko: miejsce działania w górnej części ekranu.
    var room = bottom - r.height;
    var near = r.top < bottom * 1.5 && room > below + gap;
    var delta;
    if (near) {
      delta = r.bottom - bottom + below;
      if (delta < gap) return; // przesunięcie o kilka pikseli tylko rozprasza
      // Nagłówek strony chowa się w całości albo zostaje, a nie jest ucięty w połowie.
      var head = document.querySelector("header.top");
      var headBottom = head ? head.getBoundingClientRect().bottom : 0;
      if (delta < headBottom && r.top - headBottom >= 0) delta = headBottom;
    } else {
      delta = r.top - (room > 2 * gap ? Math.min(room / 3, 160) : gap);
    }
    window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: "smooth" });
  }
  var target = tryTarget();
  var h1 = document.querySelector("main h1");
  if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }

  var skip = document.querySelector("[data-skip-guide]");
  var desk = document.getElementById("tour-guide");
  if (skip && desk && getComputedStyle(desk).display === "none") skip.setAttribute("href", "#tour-guide-m");

  // Szuflada na telefonie jest otwarta przy pierwszym wejściu w przystanek; pamiętamy tylko jej zwinięcie na tym przystanku.
  var details = document.querySelector("[data-gmob]");
  function syncMobBarHeight() {
    var m = document.querySelector(".gmob");
    if (!m || getComputedStyle(m).display === "none") return;
    var sum = m.querySelector("summary");
    var bar = m.querySelector(".gm-bar");
    var h = (sum ? sum.getBoundingClientRect().height : 0) + (bar ? bar.getBoundingClientRect().height : 0);
    if (h > 0) document.documentElement.style.setProperty("--gmob-bar-h", Math.ceil(h) + "px");
  }
  if (details) {
    var key = "mocena_gmob_" + details.getAttribute("data-gmob");
    try {
      if (sessionStorage.getItem(key) === "0") details.open = false;
      details.addEventListener("toggle", function () {
        sessionStorage.setItem(key, details.open ? "1" : "0");
        syncMobBarHeight();
      });
    } catch (e) {}
    label();
  }
  syncMobBarHeight();
  window.addEventListener("resize", syncMobBarHeight);
  // Po wczytaniu fontów i skryptów strony: wtedy położenie miejsca działania już się nie zmienia.
  function whenSettled(fn) {
    var go = function () { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fn, fn); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
  }
  whenSettled(function () { reveal(target); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
    var forms = document.querySelectorAll(e.key === "ArrowRight" ? "[data-tour-next]" : "[data-tour-prev]");
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].offsetParent !== null) { forms[i].requestSubmit(); e.preventDefault(); return; }
    }
  });
})();
