const {lastBlockNumberFromDB, latestBlockNumberWithToken} = require('./api/utils');
const {getDataFromToken} = require('./api/GetDataFromToken');

const tokenAddr = "0x50f5474724e0ee42d9a4e711ccfb275809fd6d4a";
const tokenTypes = ["erc721"];

const buildRun = async ()=> {
    const fromBlock = await lastBlockNumberFromDB();
    const toBlock = await latestBlockNumberWithToken(tokenAddr, tokenTypes);

    getDataFromToken(tokenAddr, tokenTypes, fromBlock, toBlock);
}

buildRun();