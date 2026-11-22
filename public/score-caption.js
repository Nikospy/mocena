// Podpis wybranego poziomu pod rzędem 1/3/5/7/9 odświeża się przy każdym wyborze. Niczego nie zapisuje.
document.addEventListener("change", function (e) {
  var input = e.target;
  if (!input || input.type !== "radio" || !input.hasAttribute("data-level")) return;
  var box = input.closest ? input.closest(".scorebox") : null;
  var cap = box ? box.querySelector(".lvl") : null;
  if (cap) cap.textContent = "Wybrano " + input.value + ": " + input.getAttribute("data-level");
});
