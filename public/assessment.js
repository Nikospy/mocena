// Podgląd wyniku na żywo: wysyła formularz na /preview i podmienia ramkę wyniku i listę blokad. Niczego nie zapisuje.
(function () {
  var form = document.getElementById("assessment-form");
  if (!form || !window.fetch || !window.DOMParser) return;
  var timer = null;
  function refresh() {
    fetch(form.dataset.preview, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        if (!html) return;
        var doc = new DOMParser().parseFromString(html, "text/html");
        ["assessment-result", "assessment-blockers"].forEach(function (id) {
          var fresh = doc.getElementById(id);
          var old = document.getElementById(id);
          if (!fresh || !old) return;
          // Numer ramki przewodnika pokazu (tour.js) zostaje na nowej karcie wyniku.
          var look = old.getAttribute("data-look");
          if (look) fresh.setAttribute("data-look", look);
          old.replaceWith(fresh);
        });
      });
  }
  form.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(refresh, 250);
  });
})();
// Notatki pod kryterium: na telefonie zwinięte (ekran oceny krótszy), od 1000 px rozwinięte od razu.
(function () {
  if (!window.matchMedia || !window.matchMedia("(min-width: 1000px)").matches) return;
  Array.prototype.forEach.call(document.querySelectorAll("details.crit-notes-d"), function (d) { d.open = true; });
})();
