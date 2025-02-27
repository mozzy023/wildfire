// Funzione di callback per gestire i dati ricevuti dalla Web App
function handleData(data) {
    var container = document.getElementById("deck-list");

    if (!container) {
        console.error("Errore: elemento #deck-list non trovato nel DOM.");
        return;
    }

    if (data && Array.isArray(data)) {
        console.log("Dati ricevuti:", data);

        container.innerHTML = ""; // Pulisce il contenitore prima di aggiungere nuovi dati

        data.forEach(function(mazzo) {
            var mazzoElement = document.createElement("li");
            mazzoElement.innerHTML = `
                <strong>${mazzo.nome}</strong> - ${mazzo.autore} <br>
                <em>Comandante:</em> ${mazzo.comandante1} ${mazzo.comandante2 ? " & " + mazzo.comandante2 : ""} <br>
                <a href="${mazzo.link}" target="_blank">Vedi Mazzo</a>
            `;
            container.appendChild(mazzoElement);
        });
    } else {
        console.error("Errore: dati non validi ricevuti");
        container.innerHTML = "<li>Errore nel caricamento dei dati.</li>";
    }
}

// Funzione per caricare i dati dalla Web App usando JSONP
function caricaMazzi() {
    var script = document.createElement("script");

    // Inserisci qui il tuo script ID corretto
    var webAppURL = "https://script.google.com/macros/s/AKfycbwxXbCO51cA-8P4CcP4PXdq7M9S773cJq_1nGOfxzQ4MD0TPhbq0ykXw9WJKMorRWS_ZQ/exec";

    script.src = webAppURL + "?callback=handleData";
    
    // Gestione errore in caso di problemi con il caricamento
    script.onerror = function() {
        console.error("Errore nel caricamento dello script JSONP.");
        document.getElementById("deck-list").innerHTML = "<li>Errore nel caricamento dei dati.</li>";
    };

    document.body.appendChild(script);
}

// Esegui la funzione quando la pagina è completamente caricata
document.addEventListener("DOMContentLoaded", function() {
    caricaMazzi();
});
