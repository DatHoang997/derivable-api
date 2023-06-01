const { ethers } = require("ethers");

function formatRequest(request) {
    let { query } = request;

    if (!query.t) {
        return ["b is undefined", undefined];
    }
    let [e1, pair] = formatPair(query.t);
    if (e1 !== undefined) {
        return [`${e1}`, undefined]
    }
    let result = {
        pair,
    };

    return [undefined, result];
}

function formatPair(value) {
    if (typeof value !== "string") {
        return ["expect a string", undefined];
    }

    let rawAddresses = value.split(",");
    let addresses = [];

    if((rawAddresses.length%2) != 0){
        return ['invalid parameter', undefined];
    }

    for (i = 0; i < rawAddresses.length; i+=2) {
        let address0 = toEthAddress(rawAddresses[i]);
        let address1 = toEthAddress(rawAddresses[i+1]);

        if (address0 === undefined) {
            return [`expect Ethereum address: "${rawAddresses[i]}"`, undefined];
        }
        if (address1 === undefined) {
            return [`expect Ethereum address: "${rawAddresses[i+1]}"`, undefined];
        }

        let address = {
            token0: address0,
            token1: address1
        }
        addresses.push(address);
    }

    return [undefined, addresses];
}

function toEthAddress(address) {
    try {
        return checksumAddress = ethers.utils.getAddress(address);
    } catch {
        return undefined;
    }
}

module.exports = {
    formatRequest,
};
