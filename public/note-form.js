// Podpowiedź pola „Zmiana zadań pracownika” oraz ostrzeżenie o danych szczególnych (art. 9 RODO) w trakcie pisania.
// Niczego nie wysyła do zapisu i niczego nie usuwa z tekstu.
// Po pierwszym kliknięciu człowieka w pole zmiany zadań skrypt przestaje je zmieniać.
(function () {
  var text = document.getElementById("text");
  var box = document.getElementById("task_change");
  var hint = document.getElementById("task-change-hint");
  var warnBox = document.getElementById("sensitive-warning");
  var warnText = document.getElementById("sensitive-warning-text");
  var confirmWrap = document.getElementById("confirm-sensitive-wrap");
  var confirmBox = document.getElementById("confirm_no_sensitive");
  var confirmToken = document.getElementById("confirm_sensitive_token");
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
  function saySensitive(s) {
    if (!warnBox || !warnText) return;
    var items = (s && s.sensitiveCategories) || [];
    var nextToken = (s && s.sensitiveToken) || "";
    if (!items.length) {
      warnBox.hidden = true;
      warnText.textContent = "";
      if (confirmWrap) confirmWrap.hidden = true;
      if (confirmBox) confirmBox.checked = false;
      if (confirmToken) confirmToken.value = "";
      return;
    }
    var parts = items.map(function (m) {
      return m.label + " („" + m.matched.join("”, „") + "”)";
    });
    warnText.textContent =
      "Notatka może zawierać dane szczególne z art. 9 RODO: " +
      parts.join("; ") +
      " — lista słów (ustawienie urzędu). Usuń je przed zapisem albo potwierdź, że notatka dotyczy wyłącznie faktów z pracy.";
    warnBox.hidden = false;
    if (confirmWrap) confirmWrap.hidden = false;
    if (confirmToken && confirmToken.value !== nextToken) {
      if (confirmBox) confirmBox.checked = false;
      confirmToken.value = nextToken;
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
          if (!s) return;
          saySensitive(s);
          if (touched) return;
          box.checked = !!s.taskChange;
          say(s);
        });
    }, 600);
  });
})();
