require("dotenv").config({ path: "./.env" })
const { accumulationConsumerFactory } = require("chain-backend")
const { utils } = require("ethers")
const { bn } = require("../src/utils/helper")
const volumeModel = require("../src/models/volumeModel")
module.exports = (config) => {
  const topic =
    "0x6950339c7661cca450281e53722525cc136590e622b011d5be7e4c4993685a6c"
  const filter = [
    {
      address: "0x185808A2e2819840d2A0BcF8c90D815Fb9da2054",
      topics: [topic],
    },
  ]
  sideCheckNative = "1364068194842176056990105843868530818345537040110"
  sideCheckTarget = "32"

  let iface = new utils.Interface([
    "event Swap(address indexed payer,address indexed poolIn,address indexed poolOut,address recipient,uint sideIn,uint sideOut,uint amountIn,uint amountOut)",
  ])

  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: 0,

    applyLogs: async (value, logs) => {
      const operations = []
      if (logs.length == 0) return
      for (let log of logs) {
        const logParsed = iface.parseLog(log)
        // console.log('sideIn', logParsed.args.sideIn)
        // console.log('sideOut', logParsed.args.sideOut)
        console.log(logParsed)
        let type
        if (logParsed.args.sideIn.toString() == bn(sideCheckNative)) {
          type = 1
          value = logParsed.args.amountIn
        }
        if (logParsed.args.sideOut.toString() == bn(sideCheckNative)) {
          type = 2
          value = logParsed.args.amountOut
        }
        if (logParsed.args.sideIn.toString() == bn(sideCheckTarget)) {
          type = 3
          value = logParsed.args.amountIn
        }
        if (logParsed.args.sideOut.toString() == bn(sideCheckTarget)) {
          type = 4
          value = logParsed.args.amountOut
        }

        operations.push(
          makeOperations({
            address: logParsed.args.poolIn,
            type,
            value: value.toString(),
            timestamp: parseInt(log.timeStamp),
          }),
        )
      }
      console.log(operations[1].insertOne)
      save(operations)
      return value // untouched
    },
  })

  const save = async (operations) => {
    await volumeModel.bulkWrite(operations)
  }

  const makeOperations = (pool) => {
    return {
      insertOne: {
        document: pool,
      },
    }
  }

  return consumer
}
