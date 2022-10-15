const {isValidTimeFormat} = require('./api/utils');
const {writeCSV} = require('./db/writeCSV');

/**
 * 
 * @param {string} input : '2000:01:01 00:00:00' '2000:01:01 00:00:00' "save"
 * @returns if the input value is avaliable, return array of parsed command
 * otherwise return empty array.
 */
const parseInputs = (input) => {
    const result = [...input];
    console.log(result);
    if (!isValidTimeFormat(result[0]) || !isValidTimeFormat(result[1])) return [];
    return result;
}

/**
 * write data to csv file 
 * command: node index.js '2000:01:01 00:00:00' '2000:01:01 00:00:00' "save.csv"
 * output: save.csv file
 */
const run = async() => {
    //run this command: node index.js 'stDate' 'edDate' 'filename.csv'
    //stDate, edDate should be UTC time format: like this -> 2019-12-05 23:32:50

    const parsed = parseInputs(process.argv.slice(2));
    if (parsed.length === 0) {
        console.log("please input right date format: yyyy-MM-dd hh:mm:ss");
    } else {
        await writeCSV(parsed[0], parsed[1], parsed[2]);
    }
}

run();