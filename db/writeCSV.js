const fs = require('fs');
const {stringify} = require('csv-stringify');
const db = require('./db');
const {UTC2timestamp} = require('../api/utils');
require('dotenv').config();

//filename to save : default
//const filename = 'sandbox-tracker.csv';
const dbTableName = process.env.TABLE_NAME || 'sandbox';

//csv columns
const columns = [
    "TxnHash",
    "Ts",
    "Dt",
    "Action",
    "Buyer",
    "NFT",
    "TokenID",
    "TType",
    "Quantity",
    "PriceInToken",
    "PriceInUSD",
    "Market"
];

/**
 * 
 * @param {string} stDate : general time format 2000:01:01 00:00:00
 * @param {string} edDate : general time format 2000:01:01 00:00:00
 * @param {string} filename : file name to save,
 */
const writeCSV =  async (stDate, edDate, filename) => {
    if (!filename) filename = `sandbox ${stDate},${edDate}.csv`;

    const writableStream = fs.createWriteStream(filename);
    
    const stTimeStamp = UTC2timestamp(new Date(stDate).toUTCString());
    const edTimeStamp = UTC2timestamp(new Date(edDate).toUTCString());
//    console.log(stTimeStamp, edTimeStamp);

    const selectionSQL = `select * from ${dbTableName} where Ts >= ${stTimeStamp} and Ts <= ${edTimeStamp}`;
    
    const stringifier = stringify({header: true, columns: columns});
 //   console.log(selectionSQL);
    
    db.each(selectionSQL, (error, row) => {
        if (error) {
            return console.log(error.message);
        }
        stringifier.write(row);
    });
    console.log("Finished writing data");    
    stringifier.pipe(writableStream);
}



module.exports = {
    writeCSV
}

