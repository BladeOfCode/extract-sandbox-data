
const {getNFTMetadata, UTC2timestamp, alchemy} = require('./utils');
const {getDataFromTxnHash} = require('./GetDataFromTxnHash');

const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.ALCHEMY_KEY
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;

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
    // do {
        
        // await axios(config)
        // .then(async function (response) {
        //     const tmp = await Promise.all(
        //         response.data.result.transfers.map(async (transfer) => {
        //             //get {Marketplace, Action, quantity, price} from 
    
        //             const marketInfo = await getDataFromTxnHash(transfer.hash, UTC2timestamp(transfer.metadata.blockTimestamp));   
        //             //get NFTMetadata from tokenAddresss and its id.
        //             const metadata = await getNFTMetadata(tokenAddress, transfer.tokenId);
        //             currentLastBlock = transfer.blockNum;
                    
        //             const result = {
        //                 TxnHash: transfer.hash,
        //                 Ts: UTC2timestamp(transfer.metadata.blockTimestamp),
        //                 Dt: transfer.metadata.blockTimestamp,
        //                 Action: marketInfo.action,
        //                 Buyer: transfer.from,
        //                 NFT: metadata.contract.name,
        //                 TokenId: transfer.tokenId,
        //                 TType: metadata.contract.tokenType,
        //                 Quantity: marketInfo.quantity,
        //                 Price: marketInfo.price,
        //                 Market: marketInfo.marketplace
        //             }
                    
        //             return result;
        //         })
        //     )

        // })
        // .catch(function (error) {
        //     console.log("error", error);
        // })
        

        const res = await alchemy.core.getAssetTransfers({
            "fromBlock":`${fromBlock}`, //String: starting block
            "toBlock": `${toBlock}`, //String: end block
            "order": "asc", //String: Whether to return results i ascending (asc) or descending (desc) order
            "contractAddresses": [`${tokenAddress}`],  // Array of Strings: List of contract addresses (hex strings) to filter for
            "category": tokenTypes, // Array of Strings: 
            "withMetadata": true, // Boolean: true or false
            "excludeZeroValue": false, // Boolean: true or false
            "maxCount": "0x05"
        });

        const ans = await Promise.all(
            res.transfers.map(async (transfer) => {
                //get {Marketplace, Action, quantity, price} from 

                const marketInfo = await getDataFromTxnHash(transfer.hash, UTC2timestamp(transfer.metadata.blockTimestamp));   
                //get NFTMetadata from tokenAddresss and its id.
                const metadata = await getNFTMetadata(tokenAddress, transfer.tokenId);
                currentLastBlock = transfer.blockNum;
                
                const result = {
                    TxnHash: transfer.hash,
                    Ts: UTC2timestamp(transfer.metadata.blockTimestamp),
                    Dt: transfer.metadata.blockTimestamp,
                    Action: marketInfo.action,
                    Buyer: transfer.from,
                    NFT: metadata.contract.name,
                    TokenId: transfer.tokenId,
                    TType: metadata.contract.tokenType,
                    Quantity: marketInfo.quantity,
                    Price: marketInfo.price,
                    Market: marketInfo.marketplace
                }
                
                return result;
            })
        )
        
        console.log(ans);
    // } while(currentLastBlock < toBlock);

}

const tokenAddr = "0x50f5474724e0ee42d9a4e711ccfb275809fd6d4a";
const tokenTypes = ["erc721"];
const fromBlock =  "0x0";
const toBlock = "latest";

getDataFromToken(tokenAddr, tokenTypes, fromBlock, toBlock);