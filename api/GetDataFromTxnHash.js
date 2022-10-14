const {determineMarketPlace, parseDecodedData} = require('./utils');

const {Network, Alchemy} = require('alchemy-sdk');
const Web3 = require('web3');
const abiDecoder = require('abi-decoder');
require('dotenv').config();

const apiKey = process.env.ALCHEMY_KEY;

const settings = {
    apiKey: apiKey,
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);
const SDK_URL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
const web3 = new Web3(SDK_URL);

const getDataFromTxnHash = async (txnHash, timestamp) => {
    let result;
    await web3.eth.getTransactionReceipt(txnHash, (error, receipt) => {
        if (error) {
            console.log("Error:", error);
        } else {
            const marketPlace = determineMarketPlace(receipt.logs);
            if (marketPlace.marketplace === "Opensea") {
                if (timestamp >= marketPlace.timestamp) abiDecoder.addABI(marketPlace.abi[1]);
                else abiDecoder.addABI(marketPlace.abi[0]);
            } else {
                abiDecoder.addABI(marketPlace.abi);
            }
            const decodedLog = abiDecoder.decodeLogs(receipt.logs);
            result = parseDecodedData(marketPlace, decodedLog);
        }
    })
    return result;
}