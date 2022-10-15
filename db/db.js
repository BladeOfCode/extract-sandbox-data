const fs = require('fs');
require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();

//file name to save into sqlite file format.
const filepath = './main.db';
//sqlite table name to save.
const dbTableName = process.env.TABLE_NAME;

/**
 * 
 * @returns connect to the database
 * if there is no db file, it will automatically create new db file.
 */
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

/**
 * @param {instance of sqlite3} db 
 * create new table 
 */
function createTable(db) {
    db.exec(`
    CREATE TABLE ${dbTableName}
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
