// Setup
// import { Network, Alchemy } from 'alchemy-sdk';
const {Network, Alchemy} = require('alchemy-sdk');
const Web3 = require('web3');
const abiDecoder = require('abi-decoder');

const settings = {
    apiKey: "FZz43CmFKzmhsJoIymjjM0g4oASQ4bZp",
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);  
const WS_URL = "https://eth-mainnet.g.alchemy.com/v2/FZz43CmFKzmhsJoIymjjM0g4oASQ4bZp";
const web3 = new Web3(WS_URL);

const testABI = require('./test.json');


async function decodeLog(abi, txnHash) {
    console.log("using abi-decoder");
    
    let result;
    await web3.eth.getTransactionReceipt(txnHash, function(e, receipt) {
        if (e) {
            console.log(e);
        } else {
            abiDecoder.addABI(abi);
            try {
                const decodedLog = abiDecoder.decodeLogs(receipt.logs);
                result = decodedLog;
                console.log(decodedLog[0].events.length);
                console.log(decodedLog[0].events);

            } catch(e) {
                // console.log("error");
                console.log(e);
            }
        }
    })

    return result;
}

(async()=>{
        const res = await decodeLog(testABI, "0x74f474cbfdb80026e10b5df4917afac192d731fef1bd207d366453770fba37a1");
        console.log(res);
        // console.log(testABI);
        // console.log(res.length);
        // console.log(res[res.length - 1]);
    }
) ();
