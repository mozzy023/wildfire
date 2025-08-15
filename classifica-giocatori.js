
/**
 * Classifica Giocatori - JSONP loader (CORS-proof) con mappatura colonne e header migliorati
 * Fonte: Google Sheet "Classifica giocatori", intervallo F2:I
 */

const SHEET_ID = "1_BmMKF37hdTEqcW_krIr4Eny3fR6065q9lZfV6cEdNU";
const GID = "28931984";
const RANGE = "F2:I";
const GVIZ_JSONP_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}&range=${encodeURIComponent(RANGE)}`;

// Etichette richieste e ordine finale desiderato
const DISPLAY_HEADERS = ["Posizione", "Giocatore", "Punti", "Presenze"];

// Mappa delle colonne: indice nel foglio -> ordine visualizzato
// Assumiamo F=posizione(0), G=giocatore(1), H=punti(2), I=presenze(3).
// Se l'ordine nel foglio cambia, basta aggiornare questi indici.
const DISPLAY_COLS = [3, 0, 1, 2];

// Quali colonne sono numeriche (per allineamento e ordinamento più chiaro)?
const NUMERIC_COL_INDEXES = [0, 2, 3]; // "punti", "presenze"

function parseRowsFromPayload(payload) {
  const rows = (payload?.table?.rows) || [];
  const parsed = rows
    .map((r) => (r.c || []).map((c) => (c ? (c.f ?? c.v ?? "") : "")))
    .map((arr) => arr.map((v) => (typeof v === "string" ? v.trim() : v)))
    .filter((arr) => arr.some((cell) => cell !== "" && cell !== null && cell !== undefined));
  return parsed;
}

function renderRanking(rows) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = "";

  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="ranking-empty">Nessun dato disponibile.</div>`;
    return;
  }

  // Ordina per "posizione" (prima colonna della mappa DISPLAY_COLS)
  const posIdx = DISPLAY_COLS[0];
  const sorted = rows.every((r) => r[posIdx] !== undefined && r[posIdx] !== "" && !isNaN(Number(String(r[posIdx]).replace(",", "."))))
    ? rows.slice().sort((a, b) => Number(String(a[posIdx]).replace(",", ".")) - Number(String(b[posIdx]).replace(",", ".")))
    : rows;

  const table = document.createElement("table");
  table.className = "ranking-table";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  DISPLAY_HEADERS.forEach((h, i) => {
    const th = document.createElement("th");
    if (NUMERIC_COL_INDEXES.includes(i)) th.classList.add("num");
    const span = document.createElement("span");
    span.className = "hdr-pill";
    span.textContent = h;
    th.appendChild(span);
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  sorted.forEach((row) => {
    const tr = document.createElement("tr");
    DISPLAY_COLS.forEach((colIdx, i) => {
      const td = document.createElement("td");
      if (i === 1) td.classList.add("name");
      const val = row[colIdx] != null ? row[colIdx] : "";
      td.textContent = val;
      td.setAttribute("data-label", DISPLAY_HEADERS[i]);
      if (NUMERIC_COL_INDEXES.includes(i)) td.classList.add("num");
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}

function showMessage(msgClass, text) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = `<div class="${msgClass}">${text}</div>`;
}

// JSONP handler hook: google.visualization.Query.setResponse(...)
function installJSONPHandler() {
  window.google = window.google || {};
  window.google.visualization = window.google.visualization || {};
  window.google.visualization.Query = window.google.visualization.Query || {};
  window.google.visualization.Query.setResponse = (payload) => {
    try {
      if (payload?.status !== "ok") {
        console.error("GViz error payload:", payload);
        showMessage("ranking-error", "Errore dal foglio Google (controlla permessi/range).");
        return;
      }
      const rows = parseRowsFromPayload(payload);
      renderRanking(rows);
    } catch (e) {
      console.error("Parsing error:", e);
      showMessage("ranking-error", "Errore nel parsing dei dati.");
    }
  };
}

let jsonpScriptEl = null;
function loadJSONP() {
  if (jsonpScriptEl && jsonpScriptEl.parentNode) {
    jsonpScriptEl.parentNode.removeChild(jsonpScriptEl);
  }
  jsonpScriptEl = document.createElement("script");
  jsonpScriptEl.src = GVIZ_JSONP_URL;
  jsonpScriptEl.async = true;
  jsonpScriptEl.onerror = () => {
    showMessage("ranking-error", "Errore nel caricamento della classifica (network/permessi).");
  };
  document.head.appendChild(jsonpScriptEl);
}

function caricaClassificaGiocatori() {
  showMessage("ranking-loading", "Caricamento classifica...");
  installJSONPHandler();
  loadJSONP();
}

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });

  document.querySelectorAll("section").forEach((s) => observer.observe(s));
  caricaClassificaGiocatori();
});
