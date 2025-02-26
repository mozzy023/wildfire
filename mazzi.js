document.addEventListener("DOMContentLoaded", function () {
    let sheetURL = "https://script.google.com/macros/s/AKfycby1XVRjIkXhyavsnkzPQKlUidlpJmqdXaNKu_n_NlNQqmpE0tTFtijVX3pcF8bQNaZz/exec"; // Sostituisci con il tuo URL

    let deckList = document.getElementById("deck-list");

    fetch(sheetURL)
        .then(response => response.json())
        .then(data => {
            deckList.innerHTML = ""; // Svuota la lista

            data.forEach(deck => {
                let comandanti = deck.comandante2 ? 
                    `${deck.comandante1}, ${deck.comandante2}` : 
                    deck.comandante1;

                let listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>${deck.nome}</strong> - 
                    <em>${comandanti}</em> (by ${deck.autore}) 
                    <a href="${deck.link}" target="_blank">[Visualizza su MTG Goldfish]</a>
                `;
                deckList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error("Errore nel caricamento dei mazzi:", error);
            deckList.innerHTML = "<li>Errore nel caricamento delle liste.</li>";
        });
});
