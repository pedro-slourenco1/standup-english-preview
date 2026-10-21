/* Standup English: rastreamento, UTMs, checkout e consentimento (LGPD). Sem bibliotecas. */
(function () {
  // [[FALTA: link do checkout]] Cole aqui a URL do checkout. Vazia = os botoes rolam ate a secao de oferta (#preco).
  var CHECKOUT_URL = "";
  var VALOR = 100, MOEDA = "BRL";
  var KEY = "se_consent";
  var q = new URLSearchParams(location.search), a = q.get("a") || "0", t = q.get("utm_campaign") || "";
  var fila = [], pronto = false;

  // 1) UTMs e angulo: guarda na sessao para sobreviver a navegacao (ex.: privacidade -> index)
  var utms = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(function (k) {
    var v = q.get(k) || sessionStorage.getItem("gb_" + k); if (v) { utms[k] = v; try { sessionStorage.setItem("gb_" + k, v) } catch (e) {} }
  });
  if (a !== "0") try { sessionStorage.setItem("gb_a", a) } catch (e) {} else a = sessionStorage.getItem("gb_a") || "0";
  t = utms.utm_campaign || t;

  // 2) Botoes de compra: checkout com UTMs + src (angulo)
  function urlCheckout() {
    var p = new URLSearchParams(utms); p.set("src", a);
    return CHECKOUT_URL + (CHECKOUT_URL.indexOf("?") < 0 ? "?" : "&") + p.toString();
  }
  document.querySelectorAll(".js-comprar").forEach(function (e) {
    if (CHECKOUT_URL) e.href = urlCheckout();
    e.addEventListener("click", function () { gbTrack("InitiateCheckout", { value: VALOR, currency: MOEDA, content_name: "Standup English" }) });
  });

  // 3) WhatsApp: a mensagem leva o angulo e a campanha
  document.querySelectorAll("[data-wa]").forEach(function (e) {
    e.href = e.href.replace("ANG", a).replace("UTM", t || "direto");
    e.addEventListener("click", function () { gbTrack("Contact", {}) });
  });

  // 4) Eventos do pixel (so depois do consentimento; antes, ficam na fila)
  function gbTrack(ev, dados) {
    if (pronto && window.fbq) { window.fbq("track", ev, dados || {}); } else if (!pronto) { fila.push([ev, dados]); }
  }
  function ativar() {
    if (pronto) return; pronto = true;
    if (window.gbPixel) window.gbPixel();
    fila.forEach(function (x) { if (window.fbq) window.fbq("track", x[0], x[1] || {}) }); fila = [];
  }
  if (document.body.dataset.pagina === "obrigado") {
    var oid = q.get("order_id") || q.get("transaction_id") || "";
    gbTrack("Purchase", { value: VALOR, currency: MOEDA, content_name: "Standup English", order_id: oid });
  }

  // 5) Banner de consentimento
  var c = ""; try { c = localStorage.getItem(KEY) || "" } catch (e) {}
  if (c === "1") { ativar(); return; }
  if (c === "0") return;
  var b = document.createElement("div");
  b.className = "consent"; b.setAttribute("role", "dialog"); b.setAttribute("aria-label", "Aviso de cookies");
  b.innerHTML = '<p>Usamos cookies para medir os anúncios e melhorar o site. Veja a <a href="privacidade.html">política de privacidade</a>.</p><div><button type="button" data-c="1">Aceitar</button><button type="button" data-c="0" class="sec">Recusar</button></div>';
  b.addEventListener("click", function (ev) {
    var v = ev.target.getAttribute && ev.target.getAttribute("data-c"); if (v == null) return;
    try { localStorage.setItem(KEY, v) } catch (e) {}
    b.remove(); if (v === "1") ativar();
  });
  document.body.appendChild(b);
})();
