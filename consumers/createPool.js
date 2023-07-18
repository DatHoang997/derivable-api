require("dotenv").config({ path: "./.env" })
const { accumulationConsumerFactory } = require("chain-backend")
const InfoModel = require("../src/models/infoModel")
const PoolsModel = require("../src/models/poolsModel")
const decodePools = require("../src/services/decodePools")
const configs = require("../src/helpers/config")
const { utils } = require("ethers")
const { getInfo } = require("../src/services/getInfo")

module.exports = (config) => {
  const DecodePools = new decodePools()
  const topic =
    "0x21435c5b618d77ff3657140cd3318e2cffaebc5e0e1b7318f56a9ba4044c3ed2"
  const filter = [
    {
      topics: [topic],
    },
  ]
  filter.forEach((f) => {
    console.log(f)
    delete f.address
  })
  let iface = new utils.Interface([
    "event ExecuteDecreasePosition(address indexed account,address[] path,address indexToken,uint256 collateralDelta,uint256 sizeDelta,bool isLong,address receiver,uint256 acceptablePrice,uint256 minOut,uint256 executionFee,uint256 blockGap,uint256 timeGap)",
  ])
  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: 0,

    applyLogs: async (value, logs) => {
      if (logs.length == 0) return
      console.log(logs)
      for (let log of logs) {
        const parsedLogs = await iface.parseLog(log)
        console.log("@@@@", parsedLogs)
      }
      // const poolData = await DecodePools.generatePoolData(parsedLogs)
      // const keys = Object.keys(poolData.pools)
      // const convertedData = []
      // for (let i = 0; i < keys.length; i++) {
      //   console.log('@@@',poolData.pools[keys[i]])
      //   convertedData.push(
      //     await DecodePools.convertData(poolData.pools[keys[i]]),
      //   )
      // }
      // await save(convertedData)
      // getInfo()
      return value // untouched
    },
  })

  const save = async (pools) => {
    for (let pool of pools) {
      pool.chainId = configs[process.env.CHAIN].chainId
      let poolsModel = new PoolsModel(pool)
      await poolsModel.save()
      await InfoModel.findOneAndUpdate(
        {},
        { time: Date.now(), native_price: pool.last_price },
        { upsert: true },
      )
    }
  }
  return consumer
}
