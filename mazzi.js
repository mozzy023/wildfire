// Funzione di callback per gestire i dati ricevuti dalla Web App
function handleData(data) {
    var listContainer = document.getElementById("deck-list");

    if (!listContainer) {
        console.error("Errore: elemento #deck-list non trovato nel DOM.");
        return;
    }

    if (data && Array.isArray(data)) {
        console.log("Dati ricevuti:", data);

        listContainer.innerHTML = ""; // Pulisce la lista prima di aggiungere nuovi dati

        data.forEach(function(mazzo) {
            var listItem = document.createElement("li");
            listItem.classList.add("deck-item");
            listItem.innerHTML = `
                <span class="deck-name">${mazzo.nome}</span> 
                <span class="deck-author">${mazzo.autore}</span> 
                <span class="deck-commander">${mazzo.comandante1}${mazzo.comandante2 ? " & " + mazzo.comandante2 : ""}</span> 
                <a class="deck-link" href="${mazzo.link}" target="_blank">Vedi Mazzo</a>
            `;
            listContainer.appendChild(listItem);
        });
    } else {
        console.error("Errore: dati non validi ricevuti");
        listContainer.innerHTML = "<li>Errore nel caricamento dei dati.</li>";
    }
}

// Funzione per caricare i dati dalla Web App usando JSONP
function caricaMazzi() {
    var script = document.createElement("script");

    // Inserisci qui il tuo script ID corretto
    var webAppURL = "https://script.google.com/macros/s/AKfycbzbWZuFpMXwmDZzsa41SX5MLjZXNM85PQbd-wHmRfbBZ1wNPA4AvmatFYVGjRM0LbfJlw/exec";

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
