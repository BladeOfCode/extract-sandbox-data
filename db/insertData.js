const db = require('./db');
require('dotenv').config();
const dbTableName = process.env.TABLE_NAME;

const insertRow = async (row) => {
    db.serialize(function() {
        db.run(
            `INSERT INTO ${dbTableName} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10]],
            function(error) {
                if (error) {
                    return console.log(error.message);
                }
                console.log(`Inserted a row with the id: ${this.lastID}`);
            }
        )
    }) 
}

const insertRows = async (rows) => {
    for (const row of rows) {
        await insertRow(row);
    }
}

module.exports = {
    insertRow,
    insertRows
}