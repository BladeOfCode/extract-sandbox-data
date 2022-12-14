
const {getNFTMetadata, UTC2desiredTime, UTC2timestamp, alchemy, toHexString, sleep, hexToNumberString, getCurrencyPrice, changeRow} = require('./utils');
const {getDataFromTxnHash} = require('./GetDataFromTxnHash');
const { insertRow , insertRows} = require('../db/insertData');
const {debounce} = require('debounce');

const axios = require('axios');
const { Queue } = require('./Queue');
const buffer = new Queue();
require('dotenv').config();

const apiKey = process.env.ALCHEMY_KEY;
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;

/**
 * insert data of buffer (Queue) into database
 * 
 */
const parseAndWriteDB = async () => {
    // since the timestamps of items in buffer have the same value, pick out fist timestamp. 
    const timestamp = (buffer.peek()).Ts;
    const currency = (buffer.peek()).Currency;
    // get token price to 
    //sleep(100);
    const tokenPrice = await getCurrencyPrice(timestamp, currency, "USD");
    
    const bufferLen = buffer.length;
    while(!buffer.isEmpty) {
        const data = buffer.dequeue();
        const priceToken = data.PriceInToken / bufferLen;
        const priceDollar = priceToken * tokenPrice;
        // data.Price = `${priceToken} ${currency} ($${priceDollar})`;
        data.PriceInToken = priceToken + " " + currency;
        data.PriceInUSD = "$" + priceDollar;
        
        await insertRow(Object.values(data));
    }
}

/**
 * 
 * @param {20 bytes hex string} tokenAddress :0x50f5474724e0ee42d9a4e711ccfb275809fd6d4a
 * @param {array of strings} tokenTypes : ["erc721", "erc1155"]
 * @param {uint} fromBlock : 1000001
 * @param {uint} toBlock : 10000012,
 */
const getDataFromToken = async (tokenAddress, tokenTypes, fromBlock, toBlock) => {

    /**get transaction data from 'fromBlock' to 'toBlock'.
     * Since there are limits(<1000) of fetching size, you should iterate same procedure until the
     * current blockNumber gets bigger than 'toBlock'
     */
    
    let currentLastBlock = fromBlock;
    let pastTxnHash;
    let firstRun = true;
    console.log(tokenAddress, tokenTypes, fromBlock, toBlock);
    do {
        const res = await alchemy.core.getAssetTransfers({
            /**alchemy config settings */
            "fromBlock":`${toHexString(currentLastBlock)}`, //String: starting block
            "toBlock": `${toHexString(toBlock)}`, //String: end block
            "order": "asc", //String: Whether to return results i ascending (asc) or descending (desc) order
            "contractAddresses": [`${tokenAddress}`],  // Array of Strings: List of contract addresses (hex strings) to filter for
            "category": tokenTypes, // Array of Strings: 
            "withMetadata": true, // Boolean: true or false
            "excludeZeroValue": false, // Boolean: true or false
        });

        console.log(res.transfers.length);
        for (let i = 0; i<res.transfers.length; i++) {
            const transfer = res.transfers[i];
            console.log(i);
            // update currentLastBlock to transfer.blockNum for iterating
            currentLastBlock = transfer.blockNum;

            //get {marketplace, buyer, action, price, quantity} from transaction hash.
            
            const marketInfo = await getDataFromTxnHash(transfer.hash, transfer.metadata.blockTimestamp);
            // unavailable data 
            if (!marketInfo) {
                console.log(hexToNumberString(transfer.blockNum));
                continue;
            }
            
            //get NFTMetadata from tokenAddresss and its id.
            
            const metadata = await getNFTMetadata(tokenAddress, transfer.tokenId);

            const result = {
                TxnHash: transfer.hash,
                Ts: UTC2timestamp(transfer.metadata.blockTimestamp),
                Dt: UTC2desiredTime(transfer.metadata.blockTimestamp),
                Action: marketInfo.action,
                Buyer: transfer.to,
                NFT: metadata.contract.name,
                TokenId: hexToNumberString(transfer.tokenId),
                TType: metadata.contract.tokenType,
                Quantity: marketInfo.quantity,
                PriceInToken: marketInfo.price,
                PriceInUSD:'',
                Market: marketInfo.marketplace,
                Currency: marketInfo.currency,
            }

            //console.log(result);

            // streaming process for writing database
            if (pastTxnHash === result.TxnHash || firstRun) {
                buffer.enqueue(result);
                if (firstRun) firstRun = false;
            } else {
                await parseAndWriteDB();
                buffer.enqueue(result);
            }
            pastTxnHash = result.TxnHash;
            
        }
        console.log(currentLastBlock);
    } while(currentLastBlock < toBlock);

    console.log("finished building databased");
}

// const tokenAddr = "0x50f5474724e0ee42d9a4e711ccfb275809fd6d4a";
// const tokenTypes = ["erc721"];
// const fromBlock =  "0x8A2C86";
// const toBlock = "0x8C54A2";

// getDataFromToken(tokenAddr, tokenTypes, fromBlock, toBlock);

module.exports = {
    getDataFromToken
}
