const GOOGLE_SCRIPTS_VINCENTI =
  "https://script.google.com/macros/s/AKfycbwkgPp0eoWDh-xrTVZ2Tnmv4T9JF66JPd52muFtnxDjH5pcPMjYbe5hGGWol5aOmpVg/exec"; // 🔹 Web App per i dati di Mazzi Vincenti

// 🔹 Funzione di callback per gestire i dati ricevuti dalla Web App
function handleVincentiData(data) {
  console.log("🔍 Dati ricevuti in handleVincentiData:", data);
  
  var listContainer = document.getElementById("vincenti-list");

  if (!listContainer) {
    console.error("❌ Errore: elemento #vincenti-list non trovato nel DOM.");
    return;
  }

  listContainer.innerHTML = ""; // Pulisce la lista prima di aggiungere nuovi dati

  data.sort((a, b) => a.id - b.id); // Mantiene l'ordine dello Sheet

  data.forEach(function (mazzo) {
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
        ${mazzo.year_season !== "N/A" ? `<span class="deck-season">${mazzo.year_season}</span>` : ""}
    `;

    listContainer.appendChild(listItem);
  });

  console.log("✅ Dati elaborati correttamente e aggiunti alla pagina.");
}

// 🔹 Funzione per caricare i dati dei mazzi vincenti dalla Web App
async function caricaMazziVincenti() {
  console.log("🔄 Tentativo di caricamento della Web App da Google Apps Script...");

  try {
    const response = await fetch(GOOGLE_SCRIPTS_VINCENTI);
    
    if (!response.ok) {
      throw new Error(`❌ Errore nella richiesta: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Dati ricevuti correttamente:", data);
    handleVincentiData(data);

  } catch (error) {
    console.error("❌ Errore nel caricamento dei dati:", error);
    document.getElementById("vincenti-list").innerHTML =
      "<li>Errore nel caricamento dei dati.</li>";
  }
}

// 🔹 Esegui la funzione quando la pagina è completamente caricata
document.addEventListener("DOMContentLoaded", function () {
  console.log("📢 La pagina è completamente caricata, ora eseguo caricaMazziVincenti!");
  caricaMazziVincenti();
});
