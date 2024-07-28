const { openDb } = require("../configDB")

async function createTableUsers() {
    openDb().then(db=>{
        db.exec(
            `CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT NOT NULL UNIQUE, password TEXT NOT NULL, token TEXT)`
        );
    });
}

async function insertUser(user) {
    const db = await openDb();
    const result = await db.run(
        `INSERT INTO users (login, password) VALUES (?,?)`, [user.login, user.password]
    );

    return result;
}

async function getUserById(user) {
    const db = await openDb();
    const result = await db.get(
        `SELECT users.id, users.login, users.token FROM users WHERE users.id = ?;`, [user.id]
    );

    return result;
}

async function getUserByLogin(user) {
    const db = await openDb();
    const result = await db.get(
        `SELECT users.id, users.login, users.password, users.token FROM users WHERE users.login = ?;`, [user.login]
    );

    return result;
}

async function getUserByToken(user) {
    const db = await openDb();
    const result = await db.get(
        `SELECT users.id, users.login, users.token FROM users WHERE users.token = ?;`, [user.token]
    );

    return result;
}

async function updateUserToken(user) {
    const db = await openDb();
    const result = await db.get(
        `UPDATE users SET token = ? WHERE login = ?;`, [user.token, user.login]
    );

    return result;
}

module.exports = {
    createTableUsers,
    insertUser,
    getUserById,
    getUserByToken,
    getUserByLogin,
    updateUserToken,
}