require("dotenv").config({ path: "./.env" })
const { accumulationConsumerFactory } = require("chain-backend")
const InfoModel = require("../src/models/infoModel")
const PoolsModel = require("../src/models/poolsModel")
const configs = require("../src/helpers/config")
const { utils } = require("ethers")
const { bn } = require("../src/utils/helper")
module.exports = (config) => {
  const topic =
    "0x6950339c7661cca450281e53722525cc136590e622b011d5be7e4c4993685a6c"
  const filter = [
    {
      address: "0x185808A2e2819840d2A0BcF8c90D815Fb9da2054",
      topics: [topic],
    },
  ]
  sideCheckNative = '1364068194842176056990105843868530818345537040110'
  sideCheckTarget = '32'

  let iface = new utils.Interface([
    "event Swap(address indexed payer,address indexed poolIn,address indexed poolOut,address recipient,uint sideIn,uint sideOut,uint amountIn,uint amountOut)",
  ])

  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: 0,

    applyLogs: async (value, logs) => {
      for (let log of logs) {
        const logParsed = iface.parseLog(log);
        // console.log('sideIn', logParsed.args.sideIn)
        // console.log('sideOut', logParsed.args.sideOut)
        let price
        // if(logParsed.args.sideIn.toString() == bn(sideCheckNative)) {
        //   price = 
        // }
        // if(logParsed.args.sideOut.toString() == bn(sideCheckNative)) console.log('true')
        // if(logParsed.args.sideIn.toString() == bn(sideCheckTarget)) console.log('true')
        // if(logParsed.args.sideOut.toString() == bn(sideCheckTarget)) console.log('true')
      }
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
        { time: Date.now(), eth_price: pool.last_price },
        { upsert: true },
      )
    }
  }
  return consumer
}
