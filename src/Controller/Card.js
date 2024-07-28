const { openDb } = require("../configDB")

async function createTableCards() {
    openDb().then(db=>{
        db.exec(
            `CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, card_code INTEGER NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, frameType TEXT NOT NULL, desc TEXT NOT NULL, atk INTEGER, def INTEGER, level INTEGER, race TEXT NOT NULL, attribute TEXT, scale INTEGER, linkval INTEGER, quantity INTEGER NOT NULL, deck_id INTEGER, FOREIGN KEY (deck_id) REFERENCES decks(id))`
        );
    });
}

async function insertCard(card) {
    const db = await openDb()
    await db.run(
        `INSERT INTO cards (card_code, name, type, frameType, desc, atk, def, level, race, attribute, quantity, deck_id, scale, linkval) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
        [
            card.card_code,
            card.name,
            card.type,
            card.frameType,
            card.desc,
            card.atk,
            card.def,
            card.level,
            card.race,
            card.attribute,
            card.quantity,
            card.deck_id,
            card.scale,
            card.linkval,
        ]
    );
}

async function deleteCardsFromDeck(deck) {
    const db = await openDb();
    const result = await db.run(
       "DELETE FROM cards WHERE deck_id = ?;", [deck.id]
    );

    return result;
}

module.exports = {
    createTableCards,
    insertCard,
    deleteCardsFromDeck,
}