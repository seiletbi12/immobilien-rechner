"use strict";

const fmtEuro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});
const fmtNum = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

function val(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function euro(v) {
  return fmtEuro.format(v);
}

function clampPercent(raw) {
  return Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0));
}

function applyBadge(idPrefix, faktor) {
  const badge = document.getElementById(`${idPrefix}-faktor-badge`);
  if (!badge) return;
  if (faktor < 12) {
    badge.textContent = "Gut";
    badge.className = "badge good";
  } else if (faktor <= 16) {
    badge.textContent = "Moderat";
    badge.className = "badge ok";
  } else {
    badge.textContent = "Teuer";
    badge.className = "badge bad";
  }
}

function applyBadgeEmpty(idPrefix) {
  const badge = document.getElementById(`${idPrefix}-faktor-badge`);
  if (!badge) return;
  badge.textContent = "–";
  badge.className = "badge";
}

function bindTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById(`panel-${tab.dataset.tab}`);
      if (panel) panel.classList.add("active");
    });
  });
}

function initKaufpreis() {
  const ids = ["kp-preis", "kp-groesse", "kp-miete", "kp-renov-prozent"];

  function update() {
    const preis = val("kp-preis");
    const groesse = val("kp-groesse");
    const mieteProM2 = val("kp-miete");
    const renovProzent = clampPercent(parseFloat(document.getElementById("kp-renov-prozent")?.value));

    const neben = preis * 0.10;
    const renov = preis * (renovProzent / 100);
    const summe = preis + neben + renov;
    const mieteMonat = groesse * mieteProM2;
    const mieteJahr = mieteMonat * 12;
    const faktor = mieteJahr > 0 ? summe / mieteJahr : 0;
    const rendite = summe > 0 ? (mieteJahr / summe) * 100 : 0;

    setText("kp-neben", euro(neben));
    setText("kp-renov", euro(renov));
    setText("kp-summe", euro(summe));
    setText("kp-preis-m2", groesse > 0 && preis > 0 ? euro(preis / groesse) : "–");
    setText("kp-preis-m2-voll", groesse > 0 && preis > 0 ? euro(summe / groesse) : "–");
    setText("kp-miete-monat", euro(mieteMonat));
    setText("kp-miete-jahr", euro(mieteJahr));

    if (faktor > 0) {
      setText("kp-faktor", fmtNum.format(faktor));
      applyBadge("kp", faktor);
    } else {
      setText("kp-faktor", "–");
      applyBadgeEmpty("kp");
    }

    setText("kp-rendite", rendite > 0 ? `${fmtNum.format(rendite)} %` : "–");
  }

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", update);
  });
  update();
}

function initMaxPreis() {
  const ids = ["mp-groesse", "mp-miete", "mp-renov-prozent"];

  function update() {
    const groesse = val("mp-groesse");
    const mieteProM2 = val("mp-miete");
    const renovProzent = clampPercent(parseFloat(document.getElementById("mp-renov-prozent")?.value));

    const mieteMonat = groesse * mieteProM2;
    const mieteJahr = mieteMonat * 12;
    const netto = mieteJahr * 15;
    const neben = netto * 0.10;
    const brutto = netto + neben;
    const renov = netto * (renovProzent / 100);
    const gesamt = brutto + renov;
    const faktor = mieteJahr > 0 && gesamt > 0 ? gesamt / mieteJahr : 0;
    const rendite = gesamt > 0 ? (mieteJahr / gesamt) * 100 : 0;

    setText("mp-miete-monat", euro(mieteMonat));
    setText("mp-miete-jahr", euro(mieteJahr));
    setText("mp-netto", euro(netto));
    setText("mp-neben", euro(neben));
    setText("mp-brutto", euro(brutto));
    setText("mp-brutto-m2", groesse > 0 ? euro(brutto / groesse) : "–");
    setText("mp-renov", euro(renov));
    setText("mp-gesamt", euro(gesamt));
    setText("mp-gesamt-m2", groesse > 0 ? euro(gesamt / groesse) : "–");

    if (faktor > 0) {
      setText("mp-faktor", fmtNum.format(faktor));
      applyBadge("mp", faktor);
    } else {
      setText("mp-faktor", "–");
      applyBadgeEmpty("mp");
    }

    setText("mp-rendite", rendite > 0 ? `${fmtNum.format(rendite)} %` : "–");
  }

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", update);
  });
  update();
}

function prefillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const mapping = {
    preis: ["kp-preis"],
    groesse: ["kp-groesse", "mp-groesse"],
    miete: ["kp-miete", "mp-miete"],
    renov: ["kp-renov-prozent", "mp-renov-prozent"]
  };
  Object.entries(mapping).forEach(([key, ids]) => {
    const raw = params.get(key);
    if (raw === null) return;
    const v = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(v) || v < 0) return;
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = v;
    });
  });
}

function init() {
  bindTabs();
  prefillFromUrl();
  initKaufpreis();
  initMaxPreis();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});

    // Wenn ein neuer Service Worker aktiv wird, Seite einmal neu laden,
    // damit HTML und Script immer zusammenpassen.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
