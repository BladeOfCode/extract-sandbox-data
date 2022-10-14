const {Network, Alchemy} = require('alchemy-sdk');
const Web3 = require('web3');
const abiDecoder = require('abi-decoder');
require('dotenv').config();

const marketplaceData = require('../config/MarketplaceData.json');
const { ALCHEMY_PENDING_TRANSACTIONS_EVENT_METHOD } = require('alchemy-sdk/dist/src/internal/internal-types');
const apiKey = process.env.ALCHEMY_KEY;
const action = {
    'buy': 'Bought',
    'bid': 'Bid Won'
}

const settings = {
    apiKey: apiKey,
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);
const SDK_URL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
const web3 = new Web3(SDK_URL);

const stringToEther = (value) => {
    const BN = web3.utils.BN;
    return web3.utils.fromWei(new BN(value));
}

const hexToNumberString = (hex) => {
    return web3.utils.hexToNumberString(hex);
}

const getTokenMetadata = async (tokenAddress) => {
    const metadata = await alchemy.core.getTokenMetadata(tokenAddress);
    return metadata;
}

const getNFTMetadata = async (tokenAddress, tokenId) => {
    const metadata = await alchemy.nft.getNftMetadata(tokenAddress, tokenId);
    return metadata;
}

const determineMarketPlace = (logs) => {
    const logSignature = logs[logs.length - 1].topics[0];
    let result = marketplaceData[0];

    for (const marketplace in marketplaceData) {
        if (marketplace.signature === logSignature) {
            result = marketplace;
            break;
        }
    }

    return result;
}

const parseDecodedData = async (marketPlace, decodedLog) => {
    const Len = decodedLog.length;
    const events = decodedLog[Len - 1].events;
    let marketplace, action, quantity, price, currency;

    marketplace = marketPlace.marketplace;

    if (marketplace === 'Opensea') {
        if (hexToNumberString(events[0].value) === "0") action = action.buy
        else action = action.bid
        quantity = "1",
        price = stringToEther(events[4].value);
        currency = "ETH";
    } else if (marketplace === 'LooksRare') {
        if (marketPlace.signature === '0x68cd251d4d267c6e2034ff0088b990352b97b2002c0476587d0c4da889c11330') { //TakerAsk()
            action = action.buy;
        } else action = action.bid
        quantity = events[8].value;
        price = stringToEther(events[9].value);
        currency = (await getTokenMetadata(events[5].value).result.name);
    } else if (marketplace === 'Rarible') {
        if (marketPlace.signature === '0xdddcdb07e460849cf04a4445b7af9faf01b7f5c7ba75deaf969ac5ed830312c3') { //Buy();
            if (events[2].value === "1") action = action.bid
            else action = action.buy

            quantity = events[8].value;
            price = stringToEther(events[6].value);
            if (hexToNumberString(events[4].value) === "0") currency = "ETH"
            else currency = (await getTokenMetadata(events[4].value).result.name)
            
        } else {
            if (events[4].value === '1') {
                action = action.buy;
                currency = "ETH";
                quantity = events[4].value;
                price = stringToEther(events[5].value);
            } else {
                action = action.bid;
                currency = "WETH";
                quantity = events[5].value;
                price = events[4].value;
            }
        }

    } else if (marketplace === 'X2Y2') {
        if (events[1].value === '0x0000000000000000000000000000000000000000') {
            action = action.buy;
            currency = "ETH";
        } else {
            action = action.bid;
            currency = (await getTokenMetadata(events[1].value).result.name);
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

module.exports = {
    getTokenMetadata,
    getNFTMetadata,
    determineMarketPlace,
    parseDecodedData
}