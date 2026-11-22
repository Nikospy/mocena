// Podsumowanie błędów formularza: fokus na podsumowaniu po załadowaniu, a odnośnik przenosi fokus do pola
// i przewija tak, żeby było widać jego etykietę (wzór GOV.UK).
(function () {
  var box = document.querySelector("[data-error-summary]");
  if (!box) return;
  if (document.activeElement !== box) box.focus();
  box.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (!a) return;
    var field = document.getElementById(a.getAttribute("href").slice(1));
    if (!field) return;
    e.preventDefault();
    var group = field.closest("fieldset, [role=radiogroup]") || field.closest(".card") || document.querySelector("label[for='" + field.id + "']") || field;
    group.scrollIntoView({ block: "start" });
    field.focus({ preventScroll: true });
  });
})();
