const config = require("./config");

exports.chainConfigs = () => {
    if (!process.env.CHAIN_ID) {
        return false
    }
    return config['config' + process.env.CHAIN_ID]
}