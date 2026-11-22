// Data słownie obok pól <input type="date">; bez zależności, bez Intl i stref czasowych.
(function () {
  var MONTHS = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  function words(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m || +m[2] < 1 || +m[2] > 12) return "";
    return +m[3] + " " + MONTHS[+m[2] - 1] + " " + m[1];
  }
  function update(input) {
    var out = document.querySelector('[data-date-words-for="' + input.id + '"]');
    if (out) out.textContent = words(input.value);
  }
  var inputs = document.querySelectorAll('input[type="date"]');
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("input", function (e) { update(e.target); });
    inputs[i].addEventListener("change", function (e) { update(e.target); });
  }
})();
