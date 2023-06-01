require("dotenv").config({ path: './.env' });
const path = require("path");
const { JsonRpcProvider } = require("@ethersproject/providers");
const { AssistedJsonRpcProvider } = require("assisted-json-rpc-provider");
const { CHUNK_SIZE_HARD_CAP, TARGET_LOGS_PER_CHUNK } =
    require("../src/helpers/constants").getlogs;

const { Mongoose } = require("mongoose");
const { startWorker, chainlogProcessorConfig } = require("chain-backend");

async function createMongoose() {
    let mongoose = new Mongoose();
    let endpoint = process.env.MONGODB_URL;

    mongoose.connect(endpoint, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    return mongoose;
}

// const RPCs = [
//     "https://bsc-dataseed.binance.org",
//     "https://bsc-dataseed1.defibit.io",
//     "https://bsc-dataseed1.ninicoin.io",
//     "https://bsc-dataseed2.defibit.io",
//     "https://bsc-dataseed3.defibit.io",
//     "https://bsc-dataseed4.defibit.io",
//     "https://bsc-dataseed2.ninicoin.io",
//     "https://bsc-dataseed3.ninicoin.io",
//     "https://bsc-dataseed4.ninicoin.io",
//     "https://bsc-dataseed1.binance.org",
//     "https://bsc-dataseed2.binance.org",
//     "https://bsc-dataseed3.binance.org",
//     "https://bsc-dataseed4.binance.org",
// ]

async function main() {
    const mongoose = await createMongoose();
    const provider = new AssistedJsonRpcProvider(
        new JsonRpcProvider({
            timeout: 6000,
            url: process.env.RPC_URL,
        }),
        {
            rateLimitCount: parseInt(process.env.RPC_RATE_LIMIT_COUNT),
            rateLimitDuration: parseInt(process.env.RPC_RATE_LIMIT_DURATION),
            rangeThreshold: parseInt(process.env.RPC_RANGETHRESHOLD),
            maxResults: parseInt(process.env.RPC_MAX_RESULTS),
            url: process.env.RPC_SCANURL,
            apiKeys: [
                process.env.RPC_APIKEYS
            ],
        },
    );

    const processorConfigs = {
        merge: chainlogProcessorConfig({
            type: "MERGE",
            provider,
            size: Number.MIN_VALUE, // disable merge request
            concurrency: 1,
            hardCap: CHUNK_SIZE_HARD_CAP,
            target: TARGET_LOGS_PER_CHUNK,
        }),
        partition: chainlogProcessorConfig({
            type: "PARTN",
            provider,
            size: 1500,
            concurrency: 6,
            hardCap: 1500,
            target: TARGET_LOGS_PER_CHUNK,
        }),
    };

    const consumerConstructors = {};
    const normalizedPath = path.join(__dirname, "../consumers");
    require("fs")
        .readdirSync(normalizedPath)
        .forEach((file) => {
            if (path.extname(file) == ".js") {
                const key = file.split(".").slice(0, -1).join(".");
                consumerConstructors[key] = require(`${normalizedPath}/${key}`);
            }
        });

    await startWorker({
        consumerConstructors,
        mongoose,
        processorConfigs,
        safeDepth: 128,
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
