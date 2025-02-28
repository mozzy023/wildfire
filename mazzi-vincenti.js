const GOOGLE_SCRIPTS_VINCENTI =
  "https://script.google.com/macros/s/AKfycbwkgPp0eoWDh-xrTVZ2Tnmv4T9JF66JPd52muFtnxDjH5pcPMjYbe5hGGWol5aOmpVg/exec"; // 🔹 Web App Google Apps Script

// 🔹 Funzione di callback per gestire i dati ricevuti dalla Web App (JSONP)
function handleVincentiData(data) {
  var listContainer = document.getElementById("vincenti-list");

  if (!listContainer) {
    console.error("❌ Errore: elemento #vincenti-list non trovato nel DOM.");
    return;
  }

  if (data && Array.isArray(data)) {
    console.log("✅ Dati ricevuti:", data);
    listContainer.innerHTML = ""; // Pulisce la lista prima di aggiungere nuovi dati

    data.forEach(function (mazzo) {
      var yearSeason = mazzo.year_season && mazzo.year_season !== "N/A" ? mazzo.year_season : "";

      var listItem = document.createElement("li");
      listItem.classList.add("vincenti-item");

      listItem.innerHTML = `
        <span class="deck-name">${mazzo.nome}</span> 
        <span class="deck-author">${mazzo.autore}</span> 
        <span class="deck-commander">${mazzo.comandante1}${
        mazzo.comandante2 ? " & " + mazzo.comandante2 : ""
      }</span> 
        <span class="deck-date">${mazzo.data}</span> 
        <span class="deck-players">Partecipanti: ${mazzo.partecipanti}</span> 
        <a class="deck-link" href="${mazzo.link}" target="_blank">Vedi Mazzo</a>
        ${yearSeason ? `<span class="deck-season">${yearSeason}</span>` : ""}
      `;
      listContainer.appendChild(listItem);
    });
  } else {
    console.error("❌ Errore: dati non validi ricevuti.");
    listContainer.innerHTML = "<li>Errore nel caricamento dei dati.</li>";
  }
}

// 🔹 Funzione per caricare i dati dalla Web App con JSONP
function caricaMazziVincenti() {
  console.log("🔄 Tentativo di caricamento della Web App da Google Apps Script...");

  var script = document.createElement("script");
  script.src = GOOGLE_SCRIPTS_VINCENTI + "?callback=handleVincentiData";

  // 🔹 Gestione errore in caso di problemi con il caricamento
  script.onerror = function () {
    console.error("❌ Errore nel caricamento dello script JSONP.");
    document.getElementById("vincenti-list").innerHTML =
      "<li>Errore nel caricamento dei dati. Controlla la console.</li>";
  };

  document.body.appendChild(script);
}

// 🔹 Avvia il caricamento con un leggero ritardo per evitare problemi di caricamento
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(caricaMazziVincenti, 1000); // 🔹 Ritardo di 1 secondo per stabilizzare il caricamento
});
