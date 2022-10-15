const {isValidTimeFormat} = require('./api/utils');
const {writeCSV} = require('./db/writeCSV');

const parseInputs = (input) => {
    const result = [...input];
    console.log(result);
    if (!isValidTimeFormat(result[0]) || !isValidTimeFormat(result[1])) return [];
    return result;
}
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