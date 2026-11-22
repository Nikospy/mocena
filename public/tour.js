// Przewodnik pokazu: numery przy elementach ekranu, pamięć rozwinięcia karty, strzałki. Strona działa też bez tego skryptu.
(function () {
  var first = null;
  document.querySelectorAll("[data-look-selector]").forEach(function (li) {
    // Pierwszy widoczny element: ten sam odnośnik bywa w wersji na komputer i na telefon.
    var el = null, all = [];
    try { all = document.querySelectorAll(li.getAttribute("data-look-selector")); } catch (e) { all = []; }
    for (var i = 0; i < all.length; i++) {
      if (all[i].closest(".gpanel, .gmob")) continue;
      var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { el = all[i]; break; }
    }
    if (!el) return;
    el.setAttribute("data-look", li.getAttribute("data-look-n"));
    if (!first) first = el;
  });
  if (first) first.scrollIntoView({ block: "center", behavior: "smooth" });
  var h1 = document.querySelector("main h1");
  if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }

  var skip = document.querySelector("[data-skip-guide]");
  var desk = document.getElementById("tour-guide");
  if (skip && desk && getComputedStyle(desk).display === "none") skip.setAttribute("href", "#tour-guide-m");

  var details = document.querySelector("[data-gmob]");
  if (details) {
    try {
      if (sessionStorage.getItem("mocena_gmob") === "1") details.open = true;
      details.addEventListener("toggle", function () {
        sessionStorage.setItem("mocena_gmob", details.open ? "1" : "0");
      });
    } catch (e) {}
  }

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
