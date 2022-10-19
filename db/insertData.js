const db = require('./db');
const {parse} = require('csv-parse');
const fs = require('fs');
require('dotenv').config();

const dbTableName = process.env.TABLE_NAME;

/**
 * 
 * @param {array of string} row
 * insert data into database 
 */
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

const insertDB = async (filepath) => {
    
    fs.createReadStream(filepath)
    .pipe(parse({delimiter: ",", from_line:2}))
    .on("data", function(row) {
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
    });
}

const insertNewDB = async (filepath) => {
    fs.createReadStream(filepath)
    .pipe(parse({delimiter: ",", from_line:2}))
    .on("data", function(row) {
    db.serialize(function() {
        db.run(
            `INSERT INTO ${dbTableName} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11]],
            function(error) {
                if (error) {
                    return console.log(error.message);
                }
                console.log(`Inserted a row with the id: ${this.lastID}`);
            }
        )
    }) 
    });
}

/**
 * 
 * @param {array of array} rows
 * insert data into database 
 */
const insertRows = async (rows) => {
    for (const row of rows) {
        await insertRow(row);
    }
}

module.exports = {
    insertRow,
    insertDB,
    insertNewDB,
    insertRows
}