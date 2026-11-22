// Podpowiedź pola „Zmiana zadań pracownika” w trakcie pisania. Niczego nie wysyła do zapisu.
// Po pierwszym kliknięciu człowieka w pole skrypt przestaje je zmieniać.
(function () {
  var text = document.getElementById("text");
  var box = document.getElementById("task_change");
  var hint = document.getElementById("task-change-hint");
  if (!text || !box || !window.fetch) return;
  var touched = false;
  var timer = null;
  box.addEventListener("click", function () { touched = true; });
  function say(s) {
    if (!hint) return;
    if (!s.taskChange) { hint.textContent = ""; return; }
    if (s.source === "local-model") {
      hint.textContent = "Zaznaczone przez model uruchomiony w urzędzie. Możesz odznaczyć.";
    } else if (s.matched && s.matched.length) {
      hint.textContent = "Zaznaczone na podstawie listy słów (ustawienie urzędu): „" + s.matched.join("”, „") + "”. Możesz odznaczyć.";
    } else {
      hint.textContent = "";
    }
  }
  text.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      fetch("/suggestions/note", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text: text.value }).toString(),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (s) {
          if (!s || touched) return;
          box.checked = !!s.taskChange;
          say(s);
        });
    }, 600);
  });
})();
