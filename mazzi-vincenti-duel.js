/**
 * Mazzi Vincenti Duel - JSONP loader da Apps Script
 */

// ⛓️ URL della WebApp Apps Script (INSERISCI QUI IL TUO URL)
const GOOGLE_SCRIPTS_VINCENTI = "https://script.google.com/macros/s/AKfycbwiiEWqHMHQwb7_cfBSZ3vqX7dt1kaABv5OL1zfuyKDFars5Y6pKk3MbuQ8JQuL-PEGlg/exec";

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
    } catch (_) { }
    return null;
}

function cacheSet(key, url) {
    try {
        localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() }));
    } catch (_) { }
}

async function fetchScryfallArt(name) {
    const n = sanitizeName(name);
    if (!n) return null;
    const key = "art:" + n.toLowerCase();
    const cached = cacheGet(key);
    if (cached) return cached;
    const base = "https://api.scryfall.com/cards/named";
    let res = await fetch(`${base}?exact=${encodeURIComponent(n)}`);
    if (!res.ok) res = await fetch(`${base}?fuzzy=${encodeURIComponent(n)}`);
    if (!res.ok) return null;
    const data = await res.json();
    let art = data.image_uris?.art_crop || data.card_faces?.[0]?.image_uris?.art_crop || data.image_uris?.normal;
    if (art) { cacheSet(key, art); return art; }
    return null;
}

async function insertCommanderArt(container, commander1) {
    const name = sanitizeName(commander1);
    if (!name) return;
    const url = await fetchScryfallArt(name);
    if (url) {
        const img = new Image();
        img.loading = "lazy";
        img.alt = `Artwork ${name}`;
        img.src = url;
        container.appendChild(img);
    } else {
        container.style.display = "none";
    }
}

function formatDateValue(value) {
    if (!value) return "";
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
        let out = d.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
        return out.charAt(0).toUpperCase() + out.slice(1);
    }
    return String(value);
}

const filterMeta = { years: new Set(), seasonsByYear: {} };

function registerDeckForFilters(li) {
    const y = li.dataset.y;
    const s = li.dataset.s;
    if (!y) return;
    filterMeta.years.add(y);
    if (!filterMeta.seasonsByYear[y]) filterMeta.seasonsByYear[y] = new Set();
    if (s) filterMeta.seasonsByYear[y].add(s);
}

function populateYearFilter() {
    const selectY = document.getElementById("filter-y");
    if (!selectY) return;
    const years = Array.from(filterMeta.years).sort();
    selectY.innerHTML = '<option value="tutte">Tutti gli anni</option>' + years.map(y => `<option value="${y}">${y}</option>`).join("");
}

function populateSeasonFilter() {
    const selectS = document.getElementById("filter-s");
    const selectY = document.getElementById("filter-y");
    if (!selectS || !selectY) return;
    const selectedYear = selectY.value;
    if (selectedYear === "tutte") { selectS.innerHTML = '<option value="tutte">Tutte le season</option>'; selectS.disabled = true; return; }
    const seasons = Array.from(filterMeta.seasonsByYear[selectedYear] || []).sort();
    selectS.disabled = false;
    selectS.innerHTML = '<option value="tutte">Tutte le season</option>' + seasons.map(s => `<option value="${s}">${s}</option>`).join("");
}

function applyFilters() {
    const y = document.getElementById("filter-y")?.value || "tutte";
    const s = document.getElementById("filter-s")?.value || "tutte";
    document.querySelectorAll("#vincenti-list .vincenti-item").forEach(li => {
        const matchY = y === "tutte" || li.dataset.y === y;
        const matchS = s === "tutte" || li.dataset.s === s;
        li.style.display = matchY && matchS ? "" : "none";
    });
}

document.addEventListener("change", (e) => {
    if (e.target.id === "filter-y") { populateSeasonFilter(); applyFilters(); }
    else if (e.target.id === "filter-s") applyFilters();
});

function handleVincentiData(data) {
    try {
        const listContainer = document.getElementById("vincenti-list");
        if (!listContainer) return;
        listContainer.innerHTML = "";
        (data || []).forEach(mazzo => {
            const li = document.createElement("li");
            li.classList.add("vincenti-item");
            const row = document.createElement("div"); row.className = "deck-row";
            const art = document.createElement("div"); art.className = "deck-art";
            const info = document.createElement("div"); info.className = "deck-info";
            info.innerHTML = `
        <span class="deck-name">${mazzo.nome || ""}</span>
        <span class="deck-author">${mazzo.autore || ""}</span>
        <span class="deck-commander">${mazzo.comandante1 || ""}</span>
        <span class="deck-date">${formatDateValue(mazzo.data)}</span>
        <a class="deck-link" href="${mazzo.link || "#"}" target="_blank">Vedi Mazzo</a>
      `;
            row.appendChild(art); row.appendChild(info); li.appendChild(row);
            const tag = String(mazzo.year_season || "").toUpperCase();
            const sMatch = tag.match(/S\s*(\d+)/); const yMatch = tag.match(/Y\s*(\d+)/);
            if (sMatch) li.dataset.s = `S${sMatch[1]}`; if (yMatch) li.dataset.y = `Y${yMatch[1]}`;
            registerDeckForFilters(li);
            listContainer.appendChild(li);
            insertCommanderArt(art, mazzo.comandante1);
        });
        populateYearFilter(); populateSeasonFilter(); applyFilters();
    } finally {
        document.getElementById("loading").style.display = "none";
    }
}

function caricaMazziVincenti() {
    if (GOOGLE_SCRIPTS_VINCENTI === "INSERIRE_URL_WEB_APP_VINCENTI_DUEL") {
        document.getElementById("loading").textContent = "Configura l'URL di Apps Script in mazzi-vincenti-duel.js";
        return;
    }
    const script = document.createElement("script");
    script.src = `${GOOGLE_SCRIPTS_VINCENTI}?callback=handleVincentiData`;
    document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", caricaMazziVincenti);
