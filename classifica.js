const GOOGLE_SCRIPTS_CLASSIFICA =
  "https://script.google.com/macros/s/AKfycbyVfx9Wt9mY9NxGipXCUFxUAHOgZAqMw16UIMq1wbe59bYa7nmPz_AmmBaszWXp9QJi/exec"; // 🔹 Sostituisci con il tuo nuovo link

// 🔹 Funzione per gestire i dati ricevuti
function handleClassificaData(data) {
    var tableBody = document.querySelector("#classifica-table tbody");

    if (!tableBody) {
        console.error("❌ Errore: elemento #classifica-table non trovato.");
        return;
    }

    tableBody.innerHTML = ""; // Pulisce la tabella prima di aggiungere nuovi dati

    // 📌 Ordina prima per "posizione", poi per "punti" decrescenti
    data.sort((a, b) => a.posizione - b.posizione || b.punti - a.punti);

    data.forEach(function (giocatore, index) {
        var row = document.createElement("tr");

        row.innerHTML = `
            <td>${giocatore.posizione}</td>
            <td>${giocatore.giocatore}</td>
            <td>${giocatore.punti}</td>
            <td>${giocatore.presenza}</td>
        `;

        tableBody.appendChild(row);
    });

    console.log("✅ Dati classifica elaborati con successo.");
}

// 🔹 Funzione per caricare i dati della classifica dalla Web App
async function caricaClassifica() {
    console.log("🔄 Caricamento dati classifica...");

    try {
        const response = await fetch(GOOGLE_SCRIPTS_CLASSIFICA);
        
        if (!response.ok) {
            throw new Error(`❌ Errore nella richiesta: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Dati ricevuti:", data);
        handleClassificaData(data);

    } catch (error) {
        console.error("❌ Errore nel caricamento dei dati:", error);
        document.querySelector("#classifica-table tbody").innerHTML =
            "<tr><td colspan='4'>Errore nel caricamento dei dati.</td></tr>";
    }
}

// 🔹 Esegui la funzione quando la pagina è completamente caricata
document.addEventListener("DOMContentLoaded", function () {
    console.log("📢 Pagina classifica caricata, eseguo caricaClassifica...");
    caricaClassifica();
});
