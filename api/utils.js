const { Network, Alchemy } = require('alchemy-sdk');
const Web3 = require('web3');
const db = require('../db/db');
const abiDecoder = require('abi-decoder');
require('dotenv').config();

const marketplaceData = require('../config/MarketplaceData.json');

const apiKey = process.env.ALCHEMY_KEY;
const cryptoCompareKey = process.env.CRYPTOCOMPARE_KEY;
const tableName = process.env.TABLE_NAME || 'sandbox';
const eps = 1e-8;
const Action = {
    buy: 'Bought',
    bid: 'Bid Won'
}

const settings = {
    apiKey: apiKey,
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);
const SDK_URL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
const web3 = new Web3(SDK_URL);

/**
 * @param {string} dateString 
 * @returns if the dateString is the valid date return true, otherwise return false
 */
const isValidTimeFormat = (dateString) => {
    return new Date(dateString).toString() !== "Invalid Date";
}

/**
 * @param {uint} timestamp 
 * @returns UTC time sliced .000Z
 */
const timestamp2UTC = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toUTCString().split('T').join(' ').slice(0, 19);
}

/**
 * @param {UTC time string} UTCTime 
 * @returns timestamp corresponding to UTC time
 */
const UTC2timestamp = (UTCTime) => {
    return Math.floor(new Date(UTCTime).valueOf() / 1000);
}

/**
 * @param {UTC time string} UTCTime 
 * @returns yyyy-MM-dd hh:mm:ss
 */
const UTC2desiredTime = (UTCTime) => {
    return UTCTime.split('T').join(' ').slice(0, 19);
}

/**
 * @param {string of number} value 
 * @returns number/(10**18)
 */
const stringToEther = (value) => {
    const BN = web3.utils.BN;
    return web3.utils.fromWei(new BN(value));
}

/**
 * @param {hex string} hex 
 * @returns decimal string to hex
 */
const hexToNumberString = (hex) => {
    return web3.utils.hexToNumberString(hex);
}

/**
 * @param {decimal number || string} number 
 * @returns hex string corresponding to number
 */
const toHexString = (number) => {
    return web3.utils.toHex(number).toString();
}

/**
 * @param {20 bytes hex string} tokenAddress 
 * @returns metadata of token
 */
const getTokenMetadata = async (tokenAddress) => {
    return alchemy.core.getTokenMetadata(tokenAddress);
}

/**
 * @param {20 bytes hex string} tokenAddress 
 * @param {decimal number} tokenId 
 * @returns metadata of NFT
 */
const getNFTMetadata = async (tokenAddress, tokenId) => {
    return alchemy.nft.getNftMetadata(tokenAddress, tokenId);
}

/**
 * 
 * @param {decimal} timestamp 
 * @param {string} token : "ETH", "WETH","BTC"
 * @param {string} currency : "USD"
 * @returns token price in USD at {timestamp} time
 */
const getCurrencyPrice = async (timestamp, token, currency) => {
    if (token === 'WETH') token = 'ETH';
    // current api_key is free, but if you want to get more accurate data, you should pay for it.
    const URL = `https://min-api.cryptocompare.com/data/pricehistorical?fsym=${token}&tsyms=${currency}&ts=${timestamp}&api_key=${cryptoCompareKey}`

    let tokenPrice = 0.0;

    await fetch(URL)
        .then(response => response.json())
        .then(json => tokenPrice = json[token][currency])
        .catch(err => console.error(err));

    return tokenPrice > eps ? tokenPrice : 0.0;
}

/**
 * @param {array of string} logs 
 * @returns determine marketplace type based on the logs/event
 */
const determineMarketPlace = (logs) => {
    let result;

    if (!logs.length) return result;
    const logSignature = logs[logs.length - 1].topics[0];
    
    for (const marketplace of marketplaceData) {
        if (marketplace.signature === logSignature) {
            result = marketplace;
            break;
        }
    }

    if (!result) {
        // console.log("marketplace:", logSignature);
        // console.log(logs);
    }
    return result;
}

/**
 * 
 * @param {object} marketPlace 
 * @param {array of string} decodedLog 
 * @returns desired information such as {marketplace, action, buyer, price, quantity}
 */
const parseDecodedData = async (marketPlace, decodedLog) => {
    const Len = decodedLog.length;
    if (!Len) return {};
    const events = decodedLog[Len - 1].events;
    let marketplace, action, quantity, price, currency;

    marketplace = marketPlace.marketplace;
    
    if (marketplace === 'Opensea') {
        if (hexToNumberString(events[0].value) == "0") {
            action = Action.buy;
            currency = "ETH";
        }
        else {
            action = Action.bid;
            currency = "WETH";
        }
        quantity = "1",
        price = stringToEther(events[4].value);
    } else if (marketplace === 'LooksRare') {
        if (marketPlace.signature === '0x68cd251d4d267c6e2034ff0088b990352b97b2002c0476587d0c4da889c11330') { //TakerAsk()
            action = Action.buy;
        } else action = Action.bid
        quantity = events[8].value;
        price = stringToEther(events[9].value);

        currency = (await getTokenMetadata(events[5].value)).name;
        
    } else if (marketplace === 'Rarible') {
        if (marketPlace.signature === '0xdddcdb07e460849cf04a4445b7af9faf01b7f5c7ba75deaf969ac5ed830312c3') { //Buy();
            if (events[2].value === "1") {
                action = Action.bid;
                currency = "ETH";
                quantity = events[8].value;
                price = stringToEther(events[6].value);
            }
            else {
                action = Action.buy;
                currency = (await getTokenMetadata(events[0].value)).name;
                quantity = events[6].value;
                price = stringToEther(events[8].value);
            }
        } else {
            if (events[4].value === '1') {
                action = Action.buy;
                currency = "WETH";
                quantity = events[4].value;
                price = stringToEther(events[5].value);
            } else {
                action = Action.bid;
                currency = "ETH";
                quantity = events[5].value;
                price = stringToEther(events[4].value);
            }
        }

    } else if (marketplace === 'X2Y2') {
        if (events[1].value === '0x0000000000000000000000000000000000000000') {
            action = Action.buy;
            currency = "ETH";
        } else {
            action = Action.bid;
            currency = await getTokenMetadata(events[1].value).name;
        }
        quantity = '1';
        price = stringToEther(events[3].value);
    }

    return {
        marketplace: marketplace,
        action: action,
        price: price,
        currency: currency,
        quantity: quantity
    }
}

/**
 * 
 * @param {20 bytes hex string} tokenAddress 
 * @param {array of strings} tokenTypes : ["erc721", "erc1155"]
 * @returns latest block number including the transaction related to the token address.
 */
const latestBlockNumberWithToken = async (tokenAddress, tokenTypes) => {
    const res = await alchemy.core.getAssetTransfers({
        "fromBlock": "0x0", //String: starting block
        "toBlock": "latest", //String: end block
        "order": "desc", //String: Whether to return results i ascending (asc) or descending (desc) order
        "contractAddresses": [`${tokenAddress}`],  // Array of Strings: List of contract addresses (hex strings) to filter for
        "category": tokenTypes, // Array of Strings: 
        "withMetadata": true, // Boolean: true or false
        "excludeZeroValue": false, // Boolean: true or false
        "maxCount": "0x01"
    });

    return Number.parseInt(hexToNumberString(res.transfers[0].blockNum), 10);
}

/**
 * 
 * @param {Object of result} row 
 * @returns 
 */
const changeRow = (row) => {
    let newObj = {
        TxnHash: row.TxnHash,
        Ts: row.Ts,
        Dt: row.Dt,
        Action:row.Action,
        Buyer:row.Buyer,
        NFT:row.NFT,
        TokenID:row.TokenID,
        TType: "ERC721",
        Quantity: row.Quantity,
        PriceInToken:'',
        PriceInUSD: '',
        Market: row.Market
    }
    
    console.log(row.Price);
    const temp = row.Price.split(' ');
    // console.log(temp);
    if (temp.length === 3) {
        const tokenPrice = Number.parseFloat(temp[0]).toFixed(2).toString() + " " + temp[1];
        const usdPrice = "$" + Number.parseFloat(temp[2].split('').filter((chr) => ('0' <= chr && chr <='9') || chr === '.').join('')).toFixed(2);
        
        newObj.PriceInToken = tokenPrice;
        newObj.PriceInUSD = usdPrice;
    } else {
        newObj.PriceInToken = Number.parseFloat(temp[0]).toFixed(2).toString() + " " + temp[1];
        newObj.PriceInUSD = "$" + Number.parseFloat(temp[0]).toFixed(2).toString();
    }

    return newObj;
}


/**
 * 
 * @param {20 bytes of hex string} tokenAddress 
 * @param {array of string} tokenTypes : ["erc721", "erc1155"]
 * @returns first block number including transaction related to the token address
 */
const firstBlockNumberWithToken = async (tokenAddress, tokenTypes) => {
    const res = await alchemy.core.getAssetTransfers({
        "fromBlock": "0x0", //String: starting block
        "toBlock": "latest", //String: end block
        "order": "asc", //String: Whether to return results i ascending (asc) or descending (desc) order
        "contractAddresses": [`${tokenAddress}`],  // Array of Strings: List of contract addresses (hex strings) to filter for
        "category": tokenTypes, // Array of Strings: 
        "withMetadata": true, // Boolean: true or false
        "excludeZeroValue": false, // Boolean: true or false
        "maxCount": "0x01"
    });

    return Number.parseInt(hexToNumberString(res.transfers[0].blockNum), 10);
}

/**
 * 
 * @returns last block number from the database (main.db)
 */
const lastBlockNumberFromDB = async () => {
    const selectionSQL = `select TxnHash from ${tableName} order by Ts desc limit 1`;
    const row = await new Promise((resolve, reject) => {
        db.get(selectionSQL, [], async (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row)
        })
    });

    if(!row) {
        //9055366: the first available block with this token;
        return 9055366;
    }

    const transaction = await alchemy.core.getTransaction(row.TxnHash);
    return Number.parseInt(transaction.blockNumber, 10);
}

module.exports = {
    getTokenMetadata,
    getNFTMetadata,
    determineMarketPlace,
    parseDecodedData,
    isValidTimeFormat,
    UTC2desiredTime,
    timestamp2UTC,
    UTC2timestamp,
    toHexString,
    hexToNumberString,
    getCurrencyPrice,
    lastBlockNumberFromDB,
    latestBlockNumberWithToken,
    changeRow,
    alchemy,
    web3,
}