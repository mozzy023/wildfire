/**
 * classifica-duel.js
 * Classifica Duel (1vs1) - JSONP loader da Apps Script
 *
 * Fix inclusi:
 *  - default season coerente (all / s1)
 *  - callback JSONP univoca per richiesta
 *  - cache-busting con &t=...
 *  - timeout robusto (NON cancella la callback: evita "is not defined")
 *  - timeoutId gestito senza TDZ/ReferenceError
 */

const RANKING_API_URL =
  "https://script.google.com/macros/s/AKfycbxCEK43YFSNwQLsZ9W6hwlhJdfYlykc-Lu9bUf9rchp833SR2J9Z3JnsK20oZ5GNnh3VQ/exec";

const SEASONS = {
  all: "Duel – Classifica generale",
  s1: "Duel – Season 1",
};

const DEFAULT_SEASON = "all";
const TIMEOUT_MS = 12000;

const RANKING_HEADERS = ["Posizione", "Giocatore", "Punti", "Presenze"];
const NUMERIC_COL_INDEXES = [0, 2, 3];

let currentSeasonKey = DEFAULT_SEASON;
let rankingScriptEl = null;

/* ==========================
   UI helpers
   ========================== */
function showRankingMessage(msgClass, text) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = `<div class="${msgClass}">${text}</div>`;
}

/* ==========================
   Render tabella classifica
   ========================== */
function renderRanking(players) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = "";

  const list = Array.isArray(players) ? players.slice() : [];
  if (!list.length) {
    container.innerHTML =
      '<div class="ranking-empty">Nessun dato disponibile per questa season.</div>';
    return;
  }

  // Ordine robusto: posizione crescente, poi punti decrescenti, poi nome
  list.sort((a, b) => {
    const pa = Number(String(a.posizione ?? "").replace(",", "."));
    const pb = Number(String(b.posizione ?? "").replace(",", "."));
    if (!Number.isNaN(pa) && !Number.isNaN(pb) && pa !== pb) return pa - pb;

    const xa = Number(String(a.punti ?? "").replace(",", "."));
    const xb = Number(String(b.punti ?? "").replace(",", "."));
    if (!Number.isNaN(xa) && !Number.isNaN(xb) && xa !== xb) return xb - xa;

    const na = String(a.giocatore ?? "");
    const nb = String(b.giocatore ?? "");
    return na.localeCompare(nb, "it", { sensitivity: "base" });
  });

  const table = document.createElement("table");
  table.className = "ranking-table";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  RANKING_HEADERS.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  list.forEach((p) => {
    const tr = document.createElement("tr");
    const row = [p.posizione, p.giocatore, p.punti, p.presenze];

    row.forEach((val, i) => {
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
   Caricamento JSONP
   ========================== */
function loadRankingForSeason(seasonKey) {
  currentSeasonKey = seasonKey || DEFAULT_SEASON;
  showRankingMessage("ranking-loading", "Caricamento classifica...");

  // Rimuovi eventuale script precedente
  if (rankingScriptEl && rankingScriptEl.parentNode) {
    rankingScriptEl.parentNode.removeChild(rankingScriptEl);
  }

  // Callback univoco
  const cbName =
    "__handleRankingData_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2);

  let cbCalled = false;
  let timeoutId = null;

  // Definisci callback globale
  window[cbName] = (payload) => {
    cbCalled = true;
    if (timeoutId) clearTimeout(timeoutId);

    try {
      // players può essere payload.players oppure payload.data oppure payload stesso
      const players = payload?.players ?? payload?.data ?? payload;

      if (!Array.isArray(players)) {
        console.error("Payload non valido / players non è un array:", payload);
        showRankingMessage(
          "ranking-error",
          "Formato dati non valido dalla classifica. (players non è un array)"
        );
        return;
      }

      renderRanking(players);
    } catch (e) {
      console.error("Errore nel rendering classifica:", e);
      showRankingMessage("ranking-error", "Errore nel rendering della classifica.");
    } finally {
      // cleanup callback SOLO dopo che ha risposto
      try {
        delete window[cbName];
      } catch (_) {
        window[cbName] = undefined;
      }
    }
  };

  rankingScriptEl = document.createElement("script");

  const url =
    RANKING_API_URL +
    "?season=" +
    encodeURIComponent(currentSeasonKey) +
    "&callback=" +
    encodeURIComponent(cbName) +
    "&t=" +
    Date.now(); // cache-busting

  rankingScriptEl.src = url;
  rankingScriptEl.async = true;

  rankingScriptEl.onerror = () => {
    if (timeoutId) clearTimeout(timeoutId);

    showRankingMessage(
      "ranking-error",
      "Errore nel caricamento della classifica (network/permessi)."
    );

    // qui possiamo pulire, perché la risposta non arriverà
    try {
      delete window[cbName];
    } catch (_) {
      window[cbName] = undefined;
    }
  };

  document.body.appendChild(rankingScriptEl);

  // Timeout: NON cancelliamo la callback (evita crash se arriva tardi)
  timeoutId = setTimeout(() => {
    if (!cbCalled) {
      showRankingMessage(
        "ranking-error",
        "La richiesta sta impiegando troppo. Se continua, verifica che la WebApp risponda in JSONP con il parametro 'callback'."
      );
    }
  }, TIMEOUT_MS);
}

/* ==========================
   Filtri
   ========================== */
function initRankingFilters() {
  const select = document.getElementById("filter-season");
  if (!select) return;

  select.innerHTML = "";
  Object.entries(SEASONS).forEach(([k, label]) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = label;
    if (k === currentSeasonKey) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    loadRankingForSeason(select.value);
  });
}

/* ==========================
   Init
   ========================== */
document.addEventListener("DOMContentLoaded", () => {
  initRankingFilters();
  loadRankingForSeason(currentSeasonKey);

  // Animazione sezioni
  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("section").forEach((section) => {
      observer.observe(section);
    });
  }
});
