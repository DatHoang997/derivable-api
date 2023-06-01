const config = require("../helpers/constants");

exports.chainConfigs = () => {
    if (!process.env.CHAIN_ID) {
        return false
    }
    return config['config' + process.env.CHAIN_ID]
}