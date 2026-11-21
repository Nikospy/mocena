// „Wstaw”: dopisuje zaznaczone notatki na końcu pola docelowego. Niczego nie wysyła i nie zapisuje.
document.addEventListener("click", function (e) {
  var btn = e.target && e.target.closest ? e.target.closest("button[data-target]") : null;
  if (!btn) return;
  var field = document.getElementById(btn.getAttribute("data-target"));
  if (!field) return;
  var boxes = Array.prototype.slice.call(document.querySelectorAll("input[type=checkbox][data-insert]")).filter(function (b) { return b.checked; });
  if (!boxes.length) return;
  var lines = boxes.map(function (b) { return b.getAttribute("data-insert"); });
  var current = field.value.replace(/\s+$/, "");
  field.value = (current ? current + "\n" : "") + lines.join("\n");
  boxes.forEach(function (b) { b.checked = false; });
  field.dispatchEvent(new Event("input", { bubbles: true }));
});
