document.addEventListener("DOMContentLoaded", function () {
    let data = [
        {
            "nome": "Gambling PT4",
            "autore": "Alestoppons",
            "comandanti": ["Krark, the Thumbless", "Thrasios, Triton Hero"],
            "link": "https://www.mtggoldfish.com/deck/6817088#paper"
        }
    ];

    let deckList = document.getElementById("deck-list");
    deckList.innerHTML = ""; // Svuota la lista di default

    data.forEach(deck => {
        let listItem = document.createElement("li");
        let comandanti = deck.comandanti.join(", ");
        
        listItem.innerHTML = `
            <strong>${deck.nome}</strong> - 
            <em>${comandanti}</em> (by ${deck.autore}) 
            <a href="${deck.link}" target="_blank">[Visualizza su MTG Goldfish]</a>
        `;
        deckList.appendChild(listItem);
    });
});