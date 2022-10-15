
const {getNFTMetadata, UTC2timestamp, alchemy, hexToNumberString, getCurrencyPrice} = require('./utils');
const {getDataFromTxnHash} = require('./GetDataFromTxnHash');
const { insertRow , insertRows} = require('../db/insertData');

const axios = require('axios');
const { Queue } = require('./Queue');
const buffer = new Queue();
require('dotenv').config();

const apiKey = process.env.ALCHEMY_KEY;
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;

const parseAndWriteDB = async (currency) => {
    const timestamp = (buffer.peek()).Ts;
    const tokenPrice = await getCurrencyPrice(timestamp, currency, "USD");
    
    const bufferLen = buffer.length;
    while(!buffer.isEmpty) {
        const data = buffer.dequeue();
        const priceToken = data.Price / bufferLen;
        const priceDollar = priceToken * tokenPrice;
        data.Price = `${priceToken} ${currency} ($${priceDollar})`;
        await insertRow(Object.values(data));
    }
}
/**
 * 
 * @param {20 bytes hex string} tokenAddress 
 * @param {*} tokenTypes 
 * @param {*} fromBlock 
 * @param {*} toBlock 
 */
const getDataFromToken = async (tokenAddress, tokenTypes, fromBlock, toBlock) => {
    /** axios config settings */
    // data 
    const data = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "alchemy_getAssetTransfers", // get historicl data (see alchemy api docs)
        "params": [
            {
                "fromBlock":`${fromBlock}`, //String: starting block
                "toBlock": `${toBlock}`, //String: end block
                "order": "asc", //String: Whether to return results i ascending (asc) or descending (desc) order
                "contractAddresses": [`${tokenAddress}`],  // Array of Strings: List of contract addresses (hex strings) to filter for
                "category": tokenTypes, // Array of Strings: 
                "withMetadata": true, // Boolean: true or false
                "excludeZeroValue": false, // Boolean: true or false
                "maxCount": "0x10"
            }
        ]
    })
    // config
    const config = {
        method: 'post',
        url: baseURL,
        headers: {
          'Content-Type': 'application/json'
        },
        data : data
    };
    

    /**get transaction data from 'fromBlock' to 'toBlock'.
     * Since there are limits(<1000) of fetching size, you should iterate same procedure until the
     * current block gets bigger than 'toBlock'
     */
    let currentLastBlock = fromBlock;
    let pastTxnHash;
    let resultCnt = 0;
    let firstRun = true;
    do {
        const res = await alchemy.core.getAssetTransfers({
            "fromBlock":`${currentLastBlock}`, //String: starting block
            "toBlock": `${toBlock}`, //String: end block
            "order": "asc", //String: Whether to return results i ascending (asc) or descending (desc) order
            "contractAddresses": [`${tokenAddress}`],  // Array of Strings: List of contract addresses (hex strings) to filter for
            "category": tokenTypes, // Array of Strings: 
            "withMetadata": true, // Boolean: true or false
            "excludeZeroValue": false, // Boolean: true or false
            // "maxCount": "0x01"
        });

        console.log(res.transfers.length);
        for (let i = 0; i<res.transfers.length; i++) {
            const transfer = res.transfers[i];
            //get {Marketplace, Action, quantity, price} from 

            const marketInfo = await getDataFromTxnHash(transfer.hash, UTC2timestamp(transfer.metadata.blockTimestamp));   
            if (!marketInfo) {
                // console.log(i);
                continue;
            }
            //get NFTMetadata from tokenAddresss and its id.
            const metadata = await getNFTMetadata(tokenAddress, transfer.tokenId);

            currentLastBlock = transfer.blockNum;
            
            const result = {
                TxnHash: transfer.hash,
                Ts: UTC2timestamp(transfer.metadata.blockTimestamp),
                Dt: transfer.metadata.blockTimestamp.toString().slice(19),
                Action: marketInfo.action,
                Buyer: transfer.to,
                NFT: metadata.contract.name,
                TokenId: hexToNumberString(transfer.tokenId),
                TType: metadata.contract.tokenType,
                Quantity: marketInfo.quantity,
                Price: marketInfo.price,
                Market: marketInfo.marketplace
            }
            // console.log(result);
            if (pastTxnHash === result.TxnHash || firstRun) {
                buffer.enqueue(result);
                if (firstRun) firstRun = false;
            } else {
                await parseAndWriteDB(marketInfo.currency);
                buffer.enqueue(result);
            }
            pastTxnHash = result.TxnHash;
            // await insertRow(Object.values(result));
            resultCnt++;
        }
    } while(currentLastBlock < toBlock);
    console.log(resultCnt);
}

const tokenAddr = "0x50f5474724e0ee42d9a4e711ccfb275809fd6d4a";
const tokenTypes = ["erc721"];
const fromBlock =  "0x8A2C86";
const toBlock = "0x8C54A2";

getDataFromToken(tokenAddr, tokenTypes, fromBlock, toBlock);

