/* ============================================================
   Mazzi Vincenti - Loader JSONP (no CORS) + render + Scryfall
   ============================================================ */

/**
 * URL della WebApp Apps Script che restituisce l'array di mazzi in JSON.
 * Assicurati che la tua doGet(e) faccia:
 *   var cb = e.parameter.callback;
 *   return ContentService.createTextOutput(cb + "(" + json + ");")
 *          .setMimeType(ContentService.MimeType.JAVASCRIPT);
 */
const GOOGLE_SCRIPTS_VINCENTI =
  "https://script.google.com/macros/s/AKfycbxfsF7axySAFq228jRXAICg8DgeZ-N7jm5QB6ibyRSOMol-lvlbaFayvmbhtLq6zGQOQg/exec";

/* ==========================
   NAV: hamburger + brand → home
   ========================== */

document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector("header");
  const nav = document.querySelector("nav");
  if (header && nav) {
    let menuToggle = document.querySelector(".menu-toggle");
    if (!menuToggle) {
      menuToggle = document.createElement("button");
      menuToggle.className = "menu-toggle";
      menuToggle.type = "button";
      menuToggle.setAttribute("aria-label", "Apri il menu");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.innerHTML = '<span class="bar" aria-hidden="true"></span>';
      header.appendChild(menuToggle);
    }

    function isOpen() {
      return nav.classList.contains("show");
    }
    function openMenu() {
      nav.classList.add("show");
      menuToggle.classList.add("is-open");
      menuToggle.setAttribute("aria-label", "Chiudi il menu");
      menuToggle.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      nav.classList.remove("show");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-label", "Apri il menu");
      menuToggle.setAttribute("aria-expanded", "false");
    }

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpen() ? closeMenu() : openMenu();
    });

    function outsideHandler(e) {
      if (!isOpen()) return;
      const t = e.target;
      if (!nav.contains(t) && !menuToggle.contains(t)) closeMenu();
    }
    document.addEventListener("pointerdown", outsideHandler);
    document.addEventListener("click", outsideHandler);

    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeMenu)
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) closeMenu();
    });

    const brand = document.querySelector(".brand");
    if (brand) {
      brand.style.cursor = "pointer";
      brand.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }
  }
});

/* ==========================
   Loader "Caricamento in corso…"
   ========================== */

function setLoading(on) {
  const el = document.getElementById("loading");
  if (!el) return;
  el.style.display = on ? "" : "none";
}

/* ==========================
   Scryfall: fetch artwork + cache
   ========================== */

const ART_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 giorni

function sanitizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts < ART_TTL_MS) return obj.url;
    localStorage.removeItem(key);
  } catch (_) {}
  return null;
}

function cacheSet(key, url) {
  try {
    localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() }));
  } catch (_) {}
}

async function fetchScryfallArt(name) {
  const n = sanitizeName(name);
  if (!n) return null;

  const key = "art:" + n.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  const base = "https://api.scryfall.com/cards/named";
  const params = "&include_extras=true&include_multilingual=true";

  let res = await fetch(`${base}?exact=${encodeURIComponent(n)}${params}`);
  if (!res.ok) {
    res = await fetch(`${base}?fuzzy=${encodeURIComponent(n)}${params}`);
  }
  if (!res.ok) return null;

  const data = await res.json();
  if (data.object !== "card") return null;

  let art = null;
  if (data.image_uris && data.image_uris.art_crop) {
    art = data.image_uris.art_crop;
  } else if (Array.isArray(data.card_faces) && data.card_faces.length) {
    const face =
      data.card_faces.find(
        (f) => (f.name || "").toLowerCase() === n.toLowerCase()
      ) || data.card_faces[0];
    if (face.image_uris && face.image_uris.art_crop)
      art = face.image_uris.art_crop;
    else if (face.image_uris && face.image_uris.normal)
      art = face.image_uris.normal;
  } else if (data.image_uris && data.image_uris.normal) {
    art = data.image_uris.normal;
  }

  if (art) {
    cacheSet(key, art);
    return art;
  }
  return null;
}

async function insertCommanderArt(container, commander1, commander2) {
  const names = [sanitizeName(commander1), sanitizeName(commander2)].filter(
    Boolean
  );
  if (names.length === 0) return;

  if (names.length === 1) {
    const url = await fetchScryfallArt(names[0]);
    if (url) {
      const img = new Image();
      img.loading = "lazy";
      img.alt = `Artwork ${names[0]}`;
      img.src = url;
      container.appendChild(img);
    } else {
      container.style.display = "none";
    }
  } else {
    container.classList.add("pair");
    const [u1, u2] = await Promise.all([
      fetchScryfallArt(names[0]),
      fetchScryfallArt(names[1]),
    ]);
    if (u1) {
      const i1 = new Image();
      i1.loading = "lazy";
      i1.alt = `Artwork ${names[0]}`;
      i1.src = u1;
      container.appendChild(i1);
    }
    if (u2) {
      const i2 = new Image();
      i2.loading = "lazy";
      i2.alt = `Artwork ${names[1]}`;
      i2.src = u2;
      container.appendChild(i2);
    }
    if (!container.children.length) container.style.display = "none";
  }
}

/* ==========================
   Utility: mostra solo la data (no orario)
   ========================== */

/* ==========================
   Utility: mostra solo giorno/settimana + data (no orario)
   ========================== */

function formatDateValue(value) {
  if (!value) return "";

  const s = String(value).trim();
  const d = new Date(s);

  if (!isNaN(d.getTime())) {
    let out = d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    // prima lettera maiuscola
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  const m = s.match(/^(\w{3}\s+\w{3}\s+\d{1,2}\s+\d{4})/);
  if (m) return m[1];

  return s;
}



/* ==========================
   Filtri Y/S (dipendenti: Year -> Season)
   ========================== */

const filterMeta = {
  years: new Set(),      // es. Y2024, Y2025, ...
  seasonsByYear: {}      // es. { Y2024: Set(['S1','S2']), ... }
};

function registerDeckForFilters(li) {
  const y = li.dataset.y;
  const s = li.dataset.s;
  if (!y) return;

  filterMeta.years.add(y);
  if (!filterMeta.seasonsByYear[y]) {
    filterMeta.seasonsByYear[y] = new Set();
  }
  if (s) {
    filterMeta.seasonsByYear[y].add(s);
  }
}

// Popola il filtro ANNO (#filter-y)
function populateYearFilter() {
  const selectY = document.getElementById("filter-y");
  if (!selectY) return;

  const current = selectY.value || "tutte";
  const years = Array.from(filterMeta.years).sort((a, b) => {
    const na = parseInt(a.replace(/[^\d]/g, "")) || 0;
    const nb = parseInt(b.replace(/[^\d]/g, "")) || 0;
    if (na === nb) return a.localeCompare(b);
    return na - nb; // o nb - na se vuoi l'anno più recente in alto
  });

  selectY.innerHTML =
    '<option value="tutte">Tutti gli anni</option>' +
    years.map((y) => `<option value="${y}">${y}</option>`).join("");

  if ([...selectY.options].some((o) => o.value === current)) {
    selectY.value = current;
  } else {
    selectY.value = "tutte";
  }
}

// Popola il filtro SEASON (#filter-s) in funzione dell'ANNO scelto
function populateSeasonFilter() {
  const selectS = document.getElementById("filter-s");
  const selectY = document.getElementById("filter-y");
  if (!selectS || !selectY) return;

  const selectedYear = selectY.value || "tutte";

  // Se nessun anno selezionato ⇒ season disabilitata
  if (selectedYear === "tutte") {
    selectS.innerHTML =
      '<option value="tutte">Tutte le season</option>';
    selectS.value = "tutte";
    selectS.disabled = true;
    return;
  }

  const seasonsSet = filterMeta.seasonsByYear[selectedYear] || new Set();
  const seasons = Array.from(seasonsSet).sort((a, b) => {
    const na = parseInt(a.replace(/[^\d]/g, "")) || 0;
    const nb = parseInt(b.replace(/[^\d]/g, "")) || 0;
    if (na === nb) return a.localeCompare(b);
    return na - nb;
  });

  selectS.disabled = false;
  const current = selectS.value || "tutte";

  selectS.innerHTML =
    '<option value="tutte">Tutte le season</option>' +
    seasons.map((s) => `<option value="${s}">${s}</option>`).join("");

  if ([...selectS.options].some((o) => o.value === current)) {
    selectS.value = current;
  } else {
    selectS.value = "tutte";
  }
}

// Applica filtri anno + season alla lista
function applyFilters() {
  const selectY = document.getElementById("filter-y");
  const selectS = document.getElementById("filter-s");
  const y = (selectY && selectY.value || "tutte").toUpperCase();
  const s = (selectS && selectS.value || "tutte").toUpperCase();

  document
    .querySelectorAll("#vincenti-list .vincenti-item")
    .forEach((li) => {
      const ly = (li.dataset.y || "").toUpperCase();
      const ls = (li.dataset.s || "").toUpperCase();

      const matchY = y === "TUTTE" || ly === y;
      const matchS = s === "TUTTE" || ls === s;

      li.style.display = matchY && matchS ? "" : "none";
    });
}

// Eventi sui <select> di filtro
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "filter-y") {
    // Cambiando anno, aggiorno le season possibili e applico il filtro
    populateSeasonFilter();
    applyFilters();
  } else if (e.target && e.target.id === "filter-s") {
    applyFilters();
  }
});

/* ==========================
   Callback JSONP: render liste
   ========================== */

function handleVincentiData(data) {
  try {
    const listContainer = document.getElementById("vincenti-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    // reset meta filtri a ogni nuovo caricamento
    filterMeta.years.clear();
    filterMeta.seasonsByYear = {};

    (data || []).sort((a, b) => a.id - b.id);

    (data || []).forEach((mazzo) => {
      const li = document.createElement("li");
      li.classList.add("vincenti-item");

      const row = document.createElement("div");
      row.className = "deck-row";

      const art = document.createElement("div");
      art.className = "deck-art";

      const info = document.createElement("div");
      info.className = "deck-info";

      const dateText = formatDateValue(mazzo.data);

      info.innerHTML = `
        <span class="deck-name">${mazzo.nome || ""}</span>
        <span class="deck-author">${mazzo.autore || ""}</span>
        <span class="deck-commander">
          ${(mazzo.comandante1 || "")}${
        mazzo.comandante2 ? " & " + mazzo.comandante2 : ""
      }
        </span>
        <span class="deck-date">${dateText}</span>
        <span class="deck-players">Partecipanti: ${
          mazzo.partecipanti || ""
        }</span>
        <a class="deck-link" href="${mazzo.link || "#"}" target="_blank" rel="noopener">
          Vedi Mazzo
        </a>
        ${
          mazzo.year_season && mazzo.year_season !== "N/A"
            ? `<span class="deck-season">${mazzo.year_season}</span>`
            : ""
        }
      `;

      row.appendChild(art);
      row.appendChild(info);
      li.appendChild(row);

      // Tag S/Y per i filtri
      const tag = String(mazzo.year_season || "").toUpperCase();
      const sMatch = tag.match(/S\s*(\d+)/);
      const yMatch = tag.match(/Y\s*(\d+)/);
      if (sMatch) li.dataset.s = `S${sMatch[1]}`;
      if (yMatch) li.dataset.y = `Y${yMatch[1]}`;

      // registra per meta filtri (year -> seasons)
      registerDeckForFilters(li);

      listContainer.appendChild(li);

      // Artwork comandante (uno o due)
      insertCommanderArt(art, mazzo.comandante1, mazzo.comandante2);
    });

    // inizializza filtri dipendenti
    populateYearFilter();
    populateSeasonFilter();
    applyFilters();
  } finally {
    setLoading(false); // stop spinner quando i dati sono pronti (o se qualcosa va storto)
  }
}

/* ==========================
   Loader JSONP (no CORS)
   ========================== */

let jsonpScriptEl = null;

function caricaMazziVincenti() {
  setLoading(true);

  if (jsonpScriptEl && jsonpScriptEl.parentNode) {
    jsonpScriptEl.parentNode.removeChild(jsonpScriptEl);
  }

  jsonpScriptEl = document.createElement("script");
  jsonpScriptEl.src = `${GOOGLE_SCRIPTS_VINCENTI}?callback=handleVincentiData`;
  jsonpScriptEl.async = true;
  jsonpScriptEl.onerror = () => {
    console.error("Errore nel caricamento JSONP per mazzi vincenti");
    setLoading(false);
    const listContainer = document.getElementById("vincenti-list");
    if (listContainer) {
      listContainer.innerHTML =
        "<li class='vincenti-item'>Errore nel caricamento dei dati.</li>";
    }
  };

  document.body.appendChild(jsonpScriptEl);
}

/* ==========================
   Avvio pagina
   ========================== */

document.addEventListener("DOMContentLoaded", () => {
  // opzionale: animazione sezioni
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll("section").forEach((s) => observer.observe(s));

  caricaMazziVincenti();
});
