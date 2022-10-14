
const {getTokenMetadata, getNFTMetadata} = require('./utils');

const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.ALCHEMY_KEY;
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;

const timestamp2UTC = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toUTCString().slice(-4);
}

const getDataFromToken = async (tokenAddress, tokenTypes, fromBlock, toBlock) => {
    /** axios config settings */
    const data = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "alchemy_getAssetTransfers", // get historicl data (see alchemy api docs)
        "params": [
            {
                "fromBlock": fromBlock, //String: starting block
                "toBlock": toBlock, //String: end block
                "order": "asc", //String: Whether to return results i ascending (asc) or descending (desc) order
                "contractAddresses": [`${tokenAddress}`],  // Array of Strings: List of contract addresses (hex strings) to filter for
                "category": tokenTypes, // Array of Strings: 
                "withMetadata": true, 
                "excludeZeroValue": false,
            }
        ]
    })

    const config = {
        method: 'post',
        url: baseURL,
        headers: {
          'Content-Type': 'application/json'
        },
        data : data
    };
    
    let currentLastBlock = fromBlock;
    do {
        await axios(config)
        .then((response) => {
            const temp = Promise.all(response.data.result.transfers.map(async (transfer) => {
                const marketInfo = await getDataFromTxnHash(transfer.hash, transfer.metadata.blockTimestamp);
                const metadata = await getNFTMetadata(tokenAddress, transfer.tokenId);
                currentLastBlock = transfer.blockNum;
                return {
                    TxnHash: transfer.hash,
                    Ts: transfer.metadata.blockTimestamp,
                    Dt: timestamp2UTC(transfer.metadata.blockTimestamp),
                    Action: marketInfo.action,
                    Buyer: transfer.from,
                    NFT: metadata.contractMetadata.name,
                    TokenId: transfer.tokenId,
                    TType: metadata.contractMetadata.tokenType,
                    Quantity: marketInfo.quantity,
                    Price: marketInfo.price,
                    Market: marketInfo.marketplace
                }
            }));
        })
    } while(currentLastBlock < toBlock);
    

}