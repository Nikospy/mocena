// Przewodnik pokazu: numery przy elementach ekranu, pamięć rozwinięcia karty, strzałki. Strona działa też bez tego skryptu.
(function () {
  var first = null;
  document.querySelectorAll("[data-look-selector]").forEach(function (li) {
    var el = null;
    try { el = document.querySelector(li.getAttribute("data-look-selector")); } catch (e) { el = null; }
    if (!el || el.closest(".gpanel, .gmob")) return;
    el.setAttribute("data-look", li.getAttribute("data-look-n"));
    if (!first) first = el;
  });
  if (first) first.scrollIntoView({ block: "center", behavior: "smooth" });

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
