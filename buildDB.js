const {lastBlockNumberFromDB, latestBlockNumberWithToken} = require('./api/utils');
const {getDataFromToken} = require('./api/GetDataFromToken');

const tokenAddr = "0x5CC5B05a8A13E3fBDB0BB9FcCd98D38e50F90c38";
const tokenTypes = ["erc721"];

const buildRun = async ()=> {
    const fromBlock = await lastBlockNumberFromDB();
    const toBlock = await latestBlockNumberWithToken(tokenAddr, tokenTypes);
    
    getDataFromToken(tokenAddr, tokenTypes, fromBlock, toBlock);
}

buildRun();