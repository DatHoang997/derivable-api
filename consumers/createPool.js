require("dotenv").config({ path: "./.env" })
const { accumulationConsumerFactory } = require("chain-backend")
const InfoModel = require("../src/models/infoModel")
const PoolsModel = require("../src/models/PoolsModel")
const decodePools = require("../src/services/decodePools")
const configs = require("../src/helpers/constants")

module.exports = (config) => {
  const DecodePools = new decodePools()
  const derivableTopic =
    "0xe17be4ebc00f711cfd440c6386f98af2b21ea80c4efc6bb5e6008fc122caa630"
  const filter = [
    {
      topics: [derivableTopic],
    },
  ]
  filter.forEach((f) => delete f.address)

  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: 0,

    applyLogs: async (value, logs) => {
      const ddlLogs = logs.filter((log) => {
        return log.address && [derivableTopic].includes(log.topics[0])
      })
      const parsedLogs = await DecodePools.parseDdlLogs(ddlLogs)
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

  consumer.order = 1

  const save = async (pools) => {
    for (let pool of pools) {
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
