const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const filepath = './export-main.db';

function connectToDatabase() {
    if (fs.existsSync(filepath)) {
        return new sqlite3.Database(filepath);
    } else {
        const db = new sqlite3.Database(filepath, (error) => {
            if (error) {
                return console.log(error.message);
            }
            createTable(db);
            console.log("Connected to the database successfully.");
        })
        return db;
    }
}

function createTable(db) {
    db.exec(`
    CREATE TABLE sandbox
    (
        TxnHash     TEXT,
        Ts          TEXT,
        Dt          TEXT,
        Action      TEXT,
        Buyer       TEXT,
        NFT         TEXT,
        TokenID     TEXT,
        TType       TEXT,
        Quantity    TEXT,
        Price       TEXT,
        Market      TEXT
    )
    `)
}

module.exports = connectToDatabase();