const GOOGLE_SCRIPTS_VINCENTI =
  "https://script.google.com/macros/s/AKfycbwybE9hQF77L5EsaeJ3Z3Z2IHkVmhMZ0_ID8_uz8k857-Z5Onh1NAsjO2r31GMDNbxa/exec"; // 🔹 Web App per i dati di MazziVincenti

// 🔹 Funzione di callback per gestire i dati ricevuti dalla Web App (JSON)
async function handleVincentiData(data) {
    var listContainer = document.getElementById("vincenti-list");
  
    if (!listContainer) {
      console.error("Errore: elemento #vincenti-list non trovato nel DOM.");
      return;
    }
  
    if (data && Array.isArray(data)) {
      console.log("Dati ricevuti:", data);
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
      console.error("Errore: dati non validi ricevuti");
      listContainer.innerHTML = "<li>Errore nel caricamento dei dati.</li>";
    }
  }
  
  

// 🔹 Funzione per caricare i dati dei mazzi vincenti dalla Web App con JSON
async function caricaMazziVincenti() {
  try {
    console.log("Chiamata alla Web App per i dati vincenti:", GOOGLE_SCRIPTS_VINCENTI);
    
    const response = await fetch(GOOGLE_SCRIPTS_VINCENTI);
    
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status}`);
    }

    const data = await response.json();
    handleVincentiData(data);

  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
    document.getElementById("vincenti-list").innerHTML =
      "<li>Errore nel caricamento dei dati.</li>";
  }
}

// 🔹 Esegui la funzione quando la pagina è completamente caricata
document.addEventListener("DOMContentLoaded", function () {
  console.log("Pagina caricata, caricamento mazzi vincenti...");
  caricaMazziVincenti();
});
