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
    var el = t ? visible(t.getAttribute("data-try-selector")) : null;
    if (el) el.setAttribute("data-look-try", "");
    return el;
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
    var r = el.getBoundingClientRect(), bottom = viewBottom(), gap = 16;
    if (r.top >= 0 && r.bottom <= bottom - gap) return;
    // Blisko: najmniejsze przewinięcie, żeby było widać, co stoi nad miejscem działania. Daleko: miejsce działania w górnej części ekranu.
    var room = bottom - r.height;
    var near = r.top < bottom * 1.5 && room > 2 * gap;
    var y = window.scrollY + (near ? r.bottom - bottom + gap : r.top - (room > 2 * gap ? Math.min(room / 3, 160) : gap));
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }
  var target = tryTarget();
  var h1 = document.querySelector("main h1");
  if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }

  var skip = document.querySelector("[data-skip-guide]");
  var desk = document.getElementById("tour-guide");
  if (skip && desk && getComputedStyle(desk).display === "none") skip.setAttribute("href", "#tour-guide-m");

  // Szuflada na telefonie jest otwarta przy pierwszym wejściu w przystanek; pamiętamy tylko jej zwinięcie na tym przystanku.
  var details = document.querySelector("[data-gmob]");
  if (details) {
    var key = "mocena_gmob_" + details.getAttribute("data-gmob");
    try {
      if (sessionStorage.getItem(key) === "0") details.open = false;
      details.addEventListener("toggle", function () {
        sessionStorage.setItem(key, details.open ? "1" : "0");
      });
    } catch (e) {}
  }
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
