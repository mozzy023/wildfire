const GOOGLE_SCRIPTS_TUTTIMAZZI =
  "https://script.google.com/macros/s/AKfycbytHHGKXgztw7KKVHUOmDk8gyTJo5otlZ4lHgCspEX1RhxnGcC1YBWqsWUjGwWE7LanaA/exec"; // 🔹 Web App per i dati di TuttiMazzi

// 🔹 Funzione di callback per gestire i dati ricevuti dalla Web App (JSON)
function handleData(data) {
    var listContainer = document.getElementById("deck-list");

    if (!listContainer) {
        console.error("Errore: elemento #deck-list non trovato nel DOM.");
        return;
    }

    listContainer.innerHTML = ""; // Pulisce la lista prima di aggiungere nuovi dati

    data.sort((a, b) => a.id - b.id); // Mantiene l'ordine dello Sheet

    data.forEach(function (mazzo) {
        var listItem = document.createElement("li");
        listItem.classList.add("deck-item");

        listItem.innerHTML = `
            <span class="deck-name">${mazzo.nome}</span> 
            <span class="deck-author">${mazzo.autore}</span> 
            <span class="deck-commander">${mazzo.comandante1}${
            mazzo.comandante2 ? " & " + mazzo.comandante2 : ""
        }</span> 
            <a class="deck-link" href="${mazzo.link}" target="_blank">Vedi Mazzo</a>
            ${mazzo.year_season !== "N/A" ? `<span class="deck-season">${mazzo.year_season}</span>` : ""}
        `;

        listContainer.appendChild(listItem);
    });
}


// 🔹 Funzione per caricare i dati dei mazzi dalla Web App con JSON
async function caricaMazzi() {
  try {
    console.log("Chiamata alla Web App per i dati:", GOOGLE_SCRIPTS_TUTTIMAZZI);
    
    const response = await fetch(GOOGLE_SCRIPTS_TUTTIMAZZI);
    
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status}`);
    }

    const data = await response.json();
    handleData(data);

  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
    document.getElementById("deck-list").innerHTML =
      "<li>Errore nel caricamento dei dati.</li>";
  }
}

// 🔹 Esegui la funzione quando la pagina è completamente caricata
document.addEventListener("DOMContentLoaded", function () {
  console.log("Pagina caricata, caricamento dati...");
  caricaMazzi();
});
