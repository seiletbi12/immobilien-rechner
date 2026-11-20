"use strict";

const fmtEuro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});
const fmtNum = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

const LAGE_RICHTWERTE = [
  ["Baden-Baden", 12],
  ["Bühl", 9.5],
  ["Rastatt", 9],
  ["Achern", 8.5],
  ["Karlsruhe", 11],
  ["Offenburg", 10.5],
  ["Eigener Wert", null]
];

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

function initLage(lageId, mieteId) {
  const select = document.getElementById(lageId);
  const miete = document.getElementById(mieteId);

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Ort wählen / eigener Wert";
  placeholder.selected = true;
  select.appendChild(placeholder);

  LAGE_RICHTWERTE.forEach(([name, wert]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = wert === null ? name : `${name} (ca. ${fmtNum.format(wert)} €/m²)`;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    const eintrag = LAGE_RICHTWERTE.find(([name]) => name === select.value);
    if (!eintrag || eintrag[1] === null) return;
    miete.value = eintrag[1];
    miete.dispatchEvent(new Event("input", { bubbles: true }));
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

function init() {
  bindTabs();
  initLage("kp-lage", "kp-miete");
  initLage("mp-lage", "mp-miete");
  initKaufpreis();
  initMaxPreis();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
