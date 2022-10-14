const {determineMarketPlace, parseDecodedData, UTC2timestamp} = require('./utils');

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

    await web3.eth.getTransactionReceipt(txnHash, async (error, receipt) => {
        if (error) {
            console.log("Error:", error);
        } else {
            const marketPlace = determineMarketPlace(receipt.logs);
            if (marketPlace.marketplace === "Opensea") {
                if (timestamp >= marketPlace.timestamp) abiDecoder.addABI(marketPlace.abi[1]);
                else abiDecoder.addABI(marketPlace.abi[0]);
            } else {
                abiDecoder.addABI(marketPlace.abi[0]);
            }
            const decodedLog = abiDecoder.decodeLogs(receipt.logs);
            result = await parseDecodedData(marketPlace, decodedLog);
            console.log(result);
        }
    })

    if (result) return result;
}


/**Unit testing */
//opensea, 0x26f50dd064e1d43ee8cced51deb0a502dbf031c6e9dd26b355235cb7d08bee49, 2019-12-05T18:48:27.000Z
//LooksRare, 0x33fa7cccd464d7da16a7fa49bc42fb0afa80b6fb098cbcddd720cb8c0802e187, 2022-04-24T21:55:15.000Z
//Rarible, 0x1a2d398f10a358c2c0929271f708c02f7cbff815de5eca6eb7115ca6ca19613a, 0xb0db05c87be86a292498d15815e227d5a9a92a32d9f8466f80bb2ce73642d104
//X2Y2,0x15e3a860bce5e8741511e0076d8e9118524b5bd4c51d49b132a3fb0648d0cb43

// const txnHash = "0xcae42d3ce5c046e4f1ef985ffcee20507ed3a50fecb833d13d2e45cddccdb924";
// const timeStamp = UTC2timestamp("2022-03-19T11:11:49.000Z");

// ( async() => {
//     const res = await getDataFromTxnHash(txnHash, timeStamp);    
//     console.log(res);
// }
// ) ();

module.exports = {
    getDataFromTxnHash
}