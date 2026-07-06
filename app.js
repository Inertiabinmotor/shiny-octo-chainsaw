(function () {
  const API_HOST = "http://0.0.0.0:80";
  const sameOriginAsApi =
    location.protocol.startsWith("http") &&
    (location.origin === API_HOST || location.port === "8002");
  const BASE = sameOriginAsApi ? location.origin : API_HOST;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );

  // Подставляем актуальный базовый адрес в текст «База: …» и ссылки футера.
  $$(".base-url").forEach((n) => (n.textContent = BASE));
  const swagger = $("#linkSwagger");
  const redoc = $("#linkRedoc");
  if (swagger) swagger.href = BASE + "/docs";
  if (redoc) redoc.href = BASE + "/redoc";

  // ---- Переключение разделов ----
  function showResource(id, epIdx) {
    $$(".resource-section").forEach((s) =>
      s.toggleAttribute("hidden", s.dataset.res !== id)
    );
    $$(".nav-resource").forEach((n) =>
      n.classList.toggle("active", n.dataset.res === id)
    );
    window.scrollTo(0, 0);
    if (epIdx != null) {
      const card = document.querySelector(
        `.resource-section[data-res="${id}"] .endpoint[data-ep="${epIdx}"]`
      );
      if (card) card.scrollIntoView({ behavior: "smooth" });
    }
    closeNavMobile();
  }

  $$(".nav-resource").forEach((link) => {
    link.addEventListener("click", () => showResource(link.dataset.res));
  });
  $$(".nav-endpoint").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
      showResource(link.dataset.res, link.dataset.ep);
    });
  });

  // ---- «Попробовать» ----
  $$(".try").forEach((box) => {
    const input = $(".try-bar input", box);
    const status = $(".try-status", box);
    const result = $(".try-result", box);

    async function send() {
      const path = input.value.trim();
      status.style.display = "block";
      status.className = "try-status";
      status.textContent = "Запрос…";
      result.innerHTML = "";
      const t0 = performance.now();
      try {
        const resp = await fetch(BASE + path);
        const ms = Math.round(performance.now() - t0);
        const data = await resp.json();
        status.className = "try-status " + (resp.ok ? "ok" : "err");
        const cnt =
          data && typeof data.count === "number" ? ` · count: ${data.count}` : "";
        status.textContent = `${resp.status} ${resp.statusText} · ${ms} мс${cnt}`;
        result.appendChild(jsonView(data));
      } catch (e) {
        status.className = "try-status err";
        status.textContent = "Ошибка соединения.";
      }
    }

    $(".send", box).addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });
    $$(".example-btn", box).forEach((b) =>
      b.addEventListener("click", () => {
        input.value = b.dataset.path;
        send();
      })
    );
  });

  // Подсветка JSON (длинные массивы results усекаются до 3 для читаемости).
  function jsonView(data) {
    let preview = data;
    if (data && Array.isArray(data.results) && data.results.length > 3) {
      preview = { ...data, results: data.results.slice(0, 3) };
      preview["…"] = `показаны 3 из ${data.results.length}`;
    }
    const pre = document.createElement("pre");
    pre.innerHTML = highlight(JSON.stringify(preview, null, 2));
    return pre;
  }

  function highlight(json) {
    return esc(json)
      .replace(/"([^"]+)":/g, '<span class="tok-key">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="tok-str">"$1"</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="tok-num">$1</span>')
      .replace(/: (true|false)/g, ': <span class="tok-bool">$1</span>')
      .replace(/: null/g, ': <span class="tok-null">null</span>');
  }

  // ---- Мобильное меню ----
  const sidebar = $("#sidebar");
  $("#navToggle").addEventListener("click", () => sidebar.classList.toggle("open"));
  function closeNavMobile() {
    sidebar.classList.remove("open");
  }
})();
