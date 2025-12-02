/**
 * Classifica Giocatori - JSONP loader da Apps Script
 * Season: y3_all, y3_s1, y3_s2, y3_s3
 */

// ⛓️ URL della WebApp Apps Script (quella che hai appena pubblicato)
const RANKING_API_URL =
  "https://script.google.com/macros/s/AKfycbxTePXJEbTAcEPTmXsS373ADuwKUATnbAAnJ1p7qKmybXvMcULSgLTzYnxyG-MAwyUP/exec";

// Chiavi di season disponibili
const SEASONS = {
  y3_all: "Year 3 – Classifica generale",
  y3_s1: "Year 3 – Season 1",
  y3_s2: "Year 3 – Season 2",
  y3_s3: "Year 3 – Season 3",
};

const RANKING_HEADERS = ["Posizione", "Giocatore", "Punti", "Presenze"];
const NUMERIC_COL_INDEXES = [0, 2, 3]; // posizione, punti, presenze

let currentSeasonKey = "y3_all";
let rankingScriptEl = null;

/* ==========================
   Messaggi di stato
   ========================== */
function showRankingMessage(msgClass, text) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = `<div class="${msgClass}">${text}</div>`;
}

/* ==========================
   Render tabella classifica
   ========================== */
function renderRanking(players, seasonKey) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = "";

  const list = Array.isArray(players) ? players.slice() : [];

  if (!list.length) {
    container.innerHTML =
      `<div class="ranking-empty">Nessun dato disponibile per questa season.</div>`;
    return;
  }

  // Ordina per posizione numerica (già ordinato lato Apps Script, ma per sicurezza)
  list.sort((a, b) => {
    const pa = Number(String(a.posizione).replace(",", ".")) || 0;
    const pb = Number(String(b.posizione).replace(",", ".")) || 0;
    return pa - pb;
  });

  const table = document.createElement("table");
  table.className = "ranking-table";

  // THEAD
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  RANKING_HEADERS.forEach((h, i) => {
    const th = document.createElement("th");
    if (NUMERIC_COL_INDEXES.includes(i)) th.classList.add("num");
    const pill = document.createElement("span");
    pill.className = "hdr-pill";
    pill.textContent = h;
    th.appendChild(pill);
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // TBODY
  const tbody = document.createElement("tbody");
  list.forEach((p) => {
    const tr = document.createElement("tr");
    const rowValues = [
      p.posizione ?? "",
      p.giocatore ?? "",
      p.punti ?? "",
      p.presenze ?? "",
    ];
    rowValues.forEach((val, i) => {
      const td = document.createElement("td");
      const text = val != null ? String(val) : "";
      td.textContent = text;
      td.setAttribute("data-label", RANKING_HEADERS[i]);
      if (i === 1) td.classList.add("name");
      if (NUMERIC_COL_INDEXES.includes(i)) td.classList.add("num");
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/* ==========================
   JSONP callback (Apps Script)
   ========================== */
function handleRankingData(payload) {
  try {
    if (!payload || !Array.isArray(payload.players)) {
      console.error("Payload non valido:", payload);
      showRankingMessage(
        "ranking-error",
        "Formato dati non valido dalla classifica."
      );
      return;
    }
    renderRanking(payload.players, payload.season || currentSeasonKey);
  } catch (e) {
    console.error("Errore nel rendering classifica:", e);
    showRankingMessage(
      "ranking-error",
      "Errore nel rendering della classifica."
    );
  }
}

/* ==========================
   Caricamento JSONP per una season
   ========================== */
function loadRankingForSeason(seasonKey) {
  currentSeasonKey = seasonKey || "y3_all";
  showRankingMessage("ranking-loading", "Caricamento classifica...");

  // Rimuovi eventuale script precedente
  if (rankingScriptEl && rankingScriptEl.parentNode) {
    rankingScriptEl.parentNode.removeChild(rankingScriptEl);
  }

  rankingScriptEl = document.createElement("script");
  const url =
    RANKING_API_URL +
    "?season=" +
    encodeURIComponent(currentSeasonKey) +
    "&callback=handleRankingData";

  rankingScriptEl.src = url;
  rankingScriptEl.async = true;
  rankingScriptEl.onerror = () => {
    showRankingMessage(
      "ranking-error",
      "Errore nel caricamento della classifica (network/permessi)."
    );
  };

  document.body.appendChild(rankingScriptEl);
}

/* ==========================
   Inizializzazione filtro Season
   ========================== */
function initRankingFilters() {
  const select = document.getElementById("filter-season");
  if (!select) return;

  // Popola le opzioni (se non già definite in HTML)
  if (!select.options.length) {
    Object.entries(SEASONS).forEach(([key, label]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = label;
      select.appendChild(opt);
    });
  }

  select.value = currentSeasonKey;
  select.addEventListener("change", () => {
    loadRankingForSeason(select.value);
  });
}

/* ==========================
   Animazioni sezione e avvio
   ========================== */

document.addEventListener("DOMContentLoaded", () => {
  // Reveal animato sezioni (coerente con le altre pagine)
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll("section").forEach((s) => observer.observe(s));

  // Filtro Season + classifica iniziale (Year 3 generale)
  initRankingFilters();
  loadRankingForSeason(currentSeasonKey);
});
