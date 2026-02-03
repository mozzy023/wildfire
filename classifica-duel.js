/**
 * Classifica Duel (1vs1) - JSONP loader da Apps Script
 * Basato sulla struttura funzionante di classifica-giocatori.js
 */

const RANKING_API_URL = "https://script.google.com/macros/s/AKfycbxCEK43YFSNwQLsZ9W6hwlhJdfYlykc-Lu9bUf9rchp833SR2J9Z3JnsK20oZ5GNnh3VQ/exec";

const SEASONS = {
  duel_all: "Duel – Classifica generale",
  duel_s1: "Duel – Season 1",
};

const RANKING_HEADERS = ["Posizione", "Giocatore", "Punti", "Presenze"];
const NUMERIC_COL_INDEXES = [0, 2, 3];

let currentSeasonKey = "duel_all";
let rankingScriptEl = null;

function showRankingMessage(msgClass, text) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = `<div class="${msgClass}">${text}</div>`;
}

function renderRanking(players, seasonKey) {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = "";

  const list = Array.isArray(players) ? players.slice() : [];

  if (!list.length) {
    container.innerHTML = `<div class="ranking-empty">Nessun dato disponibile per questa season.</div>`;
    return;
  }

  list.sort((a, b) => {
    const pa = Number(String(a.posizione).replace(",", ".")) || 0;
    const pb = Number(String(b.posizione).replace(",", ".")) || 0;
    return pa - pb;
  });

  const table = document.createElement("table");
  table.className = "ranking-table";

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

function handleRankingData(payload) {
  console.log("Dati ricevuti da Apps Script (Duel):", JSON.stringify(payload));
  try {
    if (!payload) {
      console.error("Payload nullo o non definito.");
      showRankingMessage("ranking-error", "Errore: nessun dato ricevuto.");
      return;
    }

    // Verifichiamo se i dati sono in 'players' o in un'altra proprietà
    const players = payload.players || payload.data || payload;

    if (!Array.isArray(players)) {
      console.error("I dati ricevi non sono un array di giocatori:", players);
      showRankingMessage("ranking-error", "Formato dati non riconosciuto.");
      return;
    }

    renderRanking(players, payload.season || currentSeasonKey);
  } catch (e) {
    console.error("Errore nel rendering classifica Duel:", e);
    showRankingMessage("ranking-error", "Errore nel rendering della classifica.");
  }
}

function loadRankingForSeason(seasonKey) {
  currentSeasonKey = seasonKey || "duel_all";
  showRankingMessage("ranking-loading", "Caricamento classifica...");

  if (rankingScriptEl && rankingScriptEl.parentNode) {
    rankingScriptEl.parentNode.removeChild(rankingScriptEl);
  }

  rankingScriptEl = document.createElement("script");
  const url = RANKING_API_URL + "?season=" + encodeURIComponent(currentSeasonKey) + "&callback=handleRankingData";

  rankingScriptEl.src = url;
  rankingScriptEl.async = true;
  rankingScriptEl.onerror = () => {
    showRankingMessage("ranking-error", "Errore nel caricamento della classifica (network/permessi).");
  };

  document.body.appendChild(rankingScriptEl);
}

function initRankingFilters() {
  const select = document.getElementById("filter-season");
  if (!select) return;

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

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });
  document.querySelectorAll("section").forEach((s) => observer.observe(s));

  initRankingFilters();
  loadRankingForSeason(currentSeasonKey);
});
