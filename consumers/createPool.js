require("dotenv").config({ path: "./.env" })
const { accumulationConsumerFactory } = require("chain-backend")
const InfoModel = require("../src/models/infoModel")
const PoolsModel = require("../src/models/poolsModel")
const decodePools = require("../src/services/decodePools")
const configs = require("../src/helpers/constants")
const { getApi } = require("../src/services/getPrice")

module.exports = (config) => {
  const DecodePools = new decodePools()
  const derivableTopic =
    "0xe17be4ebc00f711cfd440c6386f98af2b21ea80c4efc6bb5e6008fc122caa630"
  const filter = [
    {
      topics: [derivableTopic],
    },
  ]
  filter.forEach((f) => {
    console.log(f)
    delete f.address})

  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: 0,

    applyLogs: async (value, logs) => {
      const parsedLogs = await DecodePools.parseDdlLogs(logs)
      const poolData = await DecodePools.generatePoolData(parsedLogs)
      const keys = Object.keys(poolData.pools)
      const convertedData = []
      for (let i = 0; i < keys.length; i++) {
        convertedData.push(
          await DecodePools.convertdata(poolData.pools[keys[i]]),
        )
      }
      save(convertedData)
      return value // untouched
    },
  })

  const save = async (pools) => {
    for (let pool of pools) {
      const r_price = await getApi([{ token_address: pool.r_address }])
      pool.r_price = r_price[0].usdPrice.toString()
      pool.chainId = configs[process.env.CHAIN].chainId
      let poolsModel = new PoolsModel(pool)
      await poolsModel.save()
      await InfoModel.findOneAndUpdate(
        {},
        { time: Date.now(), eth_price: pool.last_price },
        { upsert: true },
      )
    }
  }
  return consumer
}
