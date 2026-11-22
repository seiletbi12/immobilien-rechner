"use strict";

const fmtEuro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});
const fmtNum = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

function val(id) {
  const v = parseFloat(document.getElementById(id).value);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function euro(v) {
  return fmtEuro.format(v);
}

function bindTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    });
  });
}

function initKaufpreis() {
  const ids = ["kp-preis", "kp-groesse", "kp-miete", "kp-renov-prozent"];

  function update() {
    const preis = val("kp-preis");
    const groesse = val("kp-groesse");
    const mieteProM2 = val("kp-miete");
    const renovProzent = Math.min(100, Math.max(0, parseFloat(document.getElementById("kp-renov-prozent").value) || 0));

    const neben = preis * 0.10;
    const renov = preis * (renovProzent / 100);
    const summe = preis + neben + renov;
    const mieteMonat = groesse * mieteProM2;
    const mieteJahr = mieteMonat * 12;
    const faktor = mieteJahr > 0 ? summe / mieteJahr : 0;
    const rendite = summe > 0 ? (mieteJahr / summe) * 100 : 0;

    document.getElementById("kp-neben").textContent = euro(neben);
    document.getElementById("kp-renov").textContent = euro(renov);
    document.getElementById("kp-summe").textContent = euro(summe);
    document.getElementById("kp-miete-monat").textContent = euro(mieteMonat);
    document.getElementById("kp-miete-jahr").textContent = euro(mieteJahr);

    const preisM2Out = document.getElementById("kp-preis-m2");
    const preisM2VollOut = document.getElementById("kp-preis-m2-voll");
    if (groesse > 0 && preis > 0) {
      preisM2Out.textContent = euro(preis / groesse);
      preisM2VollOut.textContent = euro(summe / groesse);
    } else {
      preisM2Out.textContent = "–";
      preisM2VollOut.textContent = "–";
    }

    const faktorOut = document.getElementById("kp-faktor");
    const badge = document.getElementById("kp-faktor-badge");
    if (faktor > 0) {
      faktorOut.textContent = fmtNum.format(faktor);
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
    } else {
      faktorOut.textContent = "–";
      badge.textContent = "–";
      badge.className = "badge";
    }

    document.getElementById("kp-rendite").textContent =
      rendite > 0 ? `${fmtNum.format(rendite)} %` : "–";
  }

  ids.forEach((id) => document.getElementById(id).addEventListener("input", update));
  update();
}

function initMaxPreis() {
  const ids = ["mp-groesse", "mp-miete", "mp-renov-prozent"];

  function update() {
    const groesse = val("mp-groesse");
    const mieteProM2 = val("mp-miete");
    const renovProzent = Math.min(100, Math.max(0, parseFloat(document.getElementById("mp-renov-prozent").value) || 0));

    const mieteMonat = groesse * mieteProM2;
    const mieteJahr = mieteMonat * 12;
    const netto = mieteJahr * 15;
    const neben = netto * 0.10;
    const brutto = netto + neben;
    const renov = netto * (renovProzent / 100);
    const gesamt = brutto + renov;

    document.getElementById("mp-miete-monat").textContent = euro(mieteMonat);
    document.getElementById("mp-miete-jahr").textContent = euro(mieteJahr);
    document.getElementById("mp-netto").textContent = euro(netto);
    document.getElementById("mp-neben").textContent = euro(neben);
    document.getElementById("mp-brutto").textContent = euro(brutto);
    document.getElementById("mp-renov").textContent = euro(renov);
    document.getElementById("mp-gesamt").textContent = euro(gesamt);
  }

  ids.forEach((id) => document.getElementById(id).addEventListener("input", update));
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
  }
}

document.addEventListener("DOMContentLoaded", init);
