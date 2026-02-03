/**
 * Classifica Giocatori - JSONP loader da Apps Script
 * Robust: callback univoco per richiesta + timeout se la WebApp non restituisce JSONP.
 */

const RANKING_API_URL = "https://script.google.com/macros/s/AKfycbydFxcrG75JT4LUW6Uprb3XKrjN8j4GhTHafAJT0sTRlGzi9JvZ7DaFMhcOCWvqrJ8n/exec";

const SEASONS = {
  y3_all: "Year 3 – Classifica generale",
  y3_s1: "Year 3 – Season 1",
  y3_s2: "Year 3 – Season 2",
  y3_s3: "Year 3 – Season 3"
};

const RANKING_HEADERS = ["Posizione", "Giocatore", "Punti", "Presenze"];
const NUMERIC_COL_INDEXES = [0, 2, 3];

let currentSeasonKey = "y3_all";
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
    container.innerHTML = `<div class="ranking-empty">Nessun dato disponibile per questa season.</div>`;
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
  currentSeasonKey = seasonKey || "y3_all";
  showRankingMessage("ranking-loading", "Caricamento classifica...");

  // Rimuovi eventuale script precedente
  if (rankingScriptEl && rankingScriptEl.parentNode) {
    rankingScriptEl.parentNode.removeChild(rankingScriptEl);
  }

  // Callback univoco: evita collisioni / cache strane
  const cbName = "__handleRankingData_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  let cbCalled = false;

  window[cbName] = (payload) => {
    cbCalled = true;
    try {
      // Normalizziamo i dati: players può essere payload.players oppure payload.data oppure payload stesso
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
      // cleanup callback
      try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
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
    // network / permessi / blocco
    showRankingMessage("ranking-error", "Errore nel caricamento della classifica (network/permessi).");
    try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
  };

  document.body.appendChild(rankingScriptEl);

  // Se la WebApp NON restituisce JSONP (ma JSON puro), lo script può caricarsi senza chiamare callback:
  // dopo un timeout mostriamo un messaggio chiarissimo.
  setTimeout(() => {
    if (!cbCalled) {
      showRankingMessage(
        "ranking-error",
        "La WebApp non ha restituito JSONP. Assicurati che il doGet(e) supporti il parametro 'callback' (es. callback(payload))."
      );
      try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
    }
  }, 2500);
}

/* ==========================
   Filtri
   ========================== */
function initRankingFilters() {
  const select = document.getElementById("filter-season");
  if (!select) return;

  // Popola opzioni da SEASONS (idempotente)
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

  // Animazione sezioni (coerente con il sito)
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
