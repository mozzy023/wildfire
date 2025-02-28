// Funzione di callback per gestire i dati ricevuti dalla Web App
function handleVincentiData(data) {
    var listContainer = document.getElementById("vincenti-list");

    if (!listContainer) {
        console.error("Errore: elemento #vincenti-list non trovato nel DOM.");
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
                <span class="deck-date">${mazzo.data}</span>
                <span class="deck-participants">${mazzo.partecipanti} partecipanti</span>
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
function caricaMazziVincenti() {
    var script = document.createElement("script");

    // Inserisci qui il tuo script ID corretto
    var webAppURL = "https://script.google.com/macros/s/AKfycbzJlGRp7Hqsm1x3vDkPfG2uki7-_FBhVqh-gD0IuL993mcupQuJqZB9llj34QfZwWgImA/exec";

    script.src = webAppURL + "?callback=handleVincentiData";
    
    // Gestione errore in caso di problemi con il caricamento
    script.onerror = function() {
        console.error("Errore nel caricamento dello script JSONP.");
        document.getElementById("vincenti-list").innerHTML = "<li>Errore nel caricamento dei dati.</li>";
    };

    document.body.appendChild(script);
}

// Esegui la funzione quando la pagina è completamente caricata
document.addEventListener("DOMContentLoaded", function() {
    caricaMazziVincenti();
});
