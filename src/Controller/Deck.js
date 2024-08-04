const { openDb } = require("../configDB")

async function createTableDecks() {
    openDb().then(db=>{
        db.exec(
            `CREATE TABLE IF NOT EXISTS decks ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(id) )`
        );
    });
}

async function listDecks(deck) {
    const db = await openDb();
    let query = `SELECT decks.*, users.login FROM decks JOIN users ON decks.user_id = users.id`;
    let countQuery = `SELECT COUNT(*) AS total_decks FROM decks`;
    let params = [];
    let countParams = [];

    if (deck.name) {
        query += " WHERE decks.name LIKE ?";
        countQuery += " WHERE name LIKE ?";
        params.push(`%${deck.name}%`);
        countParams.push(`%${deck.name}%`);
    }

    query += " ORDER BY decks.name LIMIT ? OFFSET ?";
    params.push(deck.limit, deck.offset);

    const result = await db.all(query, params);
    const total = await db.all(countQuery, countParams);

    return { data: result, total: total[0].total_decks };
}
async function listUserDecks(deck) {
    const db = await openDb();
    const result = await db.all(`SELECT decks.*, users.login FROM decks JOIN users ON decks.user_id = users.id WHERE decks.user_id = ? ORDER BY name`, [deck.user_id]);

    return result;
}

async function insertDeck(deck) {
    const db = await openDb();
    
    const result = await db.run(
        `INSERT INTO decks (name, user_id) VALUES (?,?)`, [deck.name, deck.user_id]
    );

    return result.lastID;
}

async function deleteCardsFromDeck(deck) {
    const db = await openDb();
    
    const result = await db.run(
        `DELETE * FROM cards WHERE cards.deck_id = ?`, [deck.id]
    );

    return result.lastID;
}

async function updateDeck(deck) {
    const db = await openDb();
    
    const result = await db.run(
        `UPDATE decks SET name = ? WHERE decks.id = ?`, [deck.name, deck.id]
    );

    return result.lastID;
}

async function getDeck(deck) {
    const db = await openDb();
    const result = await db.all(
        `SELECT decks.id, decks.user_id, decks.user_id, decks.name AS deck_name, cards.* FROM decks JOIN cards ON decks.id = cards.deck_id JOIN users ON decks.user_id = users.id WHERE decks.id = ?;`, [deck.id]
    );

    return result;
}

async function getDeckById(deck) {
    const db = await openDb();
    const result = await db.all(
        `SELECT * FROM decks WHERE decks.id = ?;`, [deck.id]
    );

    return result;
}


async function deleteDeck(deck) {
    const db = await openDb();
    const result = await db.run(
       "DELETE FROM decks WHERE id = ?;", [deck.id]
    );

    return result;
}

module.exports = {
    createTableDecks,
    listUserDecks,
    insertDeck,
    getDeck,
    deleteDeck,
    listDecks,
    getDeckById,
    deleteCardsFromDeck,
    updateDeck,
}