// Pola dat DD.MM.RRRR (input[data-date-input]): kropki wstawiane przy wpisywaniu samych cyfr
// i data słownie pod polem. Bez zależności, bez Intl i stref czasowych. Bez tego skryptu pole też działa:
// serwer przyjmuje DD.MM.RRRR, D.M.RRRR, inne separatory i osiem cyfr.
(function () {
  if (window.__mocenaDateInputs) return;
  window.__mocenaDateInputs = true;
  var MONTHS = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  function parts(v) {
    v = (v || "").trim();
    var m = /^(\d{1,2})\s*[.,\/\- ]\s*(\d{1,2})\s*[.,\/\- ]\s*(\d{4})$/.exec(v) || /^(\d{2})(\d{2})(\d{4})$/.exec(v);
    if (m) return { d: +m[1], m: +m[2], y: +m[3] };
    m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? { d: +m[3], m: +m[2], y: +m[1] } : null;
  }
  function words(v) {
    var p = parts(v);
    if (!p || p.m < 1 || p.m > 12 || p.d < 1) return "";
    var last = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
    if (p.d > last) return "";
    return p.d + " " + MONTHS[p.m - 1] + " " + p.y;
  }
  // Same cyfry → DD.MM.RRRR w trakcie pisania; wpisu z własnymi kropkami (np. 3.11.2026) nie rusza.
  function mask(input, e) {
    if (!e || !e.inputType || e.inputType.indexOf("insert") !== 0) return;
    var v = input.value;
    if (input.selectionStart !== v.length) return;
    var next = v;
    if (/^\d{3,}$/.test(v)) next = v.slice(0, 2) + "." + v.slice(2);
    if (/^\d{2}\.\d{3,}$/.test(next)) next = next.slice(0, 5) + "." + next.slice(5);
    next = next.slice(0, 10);
    if (next !== v) input.value = next;
  }
  function update(input) {
    var out = document.querySelector('[data-date-words-for="' + input.id + '"]');
    if (out) out.textContent = words(input.value);
  }
  var inputs = document.querySelectorAll("input[data-date-input]");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("input", function (e) { mask(e.target, e); update(e.target); });
    inputs[i].addEventListener("change", function (e) { update(e.target); });
  }
})();
