require("dotenv").config({ path: "./.env" })
const { accumulationConsumerFactory } = require("chain-backend")
const { utils } = require("ethers")
const { bn } = require("../src/utils/helper")
const volumeModel = require("../src/models/volumeModel")
module.exports = (config) => {
  const topic =
    "0xa5a79273c52413fd319bf0be43c422824dc76fc4f69c671d8805d1aaf3cecc77"
  const filter = [
    {
      topics: [topic],
    },
  ]
  sideCheckNative = "1364068194842176056990105843868530818345537040110"
  sideCheckTarget = "0"

  let iface = new utils.Interface([
    "event Swap(address indexed payer,address indexed recipient,uint indexed sideMax,uint sideIn,uint sideOut,uint maturity,uint amountIn,uint amountOut)",
  ])

  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: 107513624,

    applyLogs: async (value, logs) => {
      const operations = []
      if (logs.length == 0) return
      for (let log of logs) {
        const logParsed = iface.parseLog(log)
        let type
        if (logParsed.args.sideIn.toString() == bn(sideCheckNative)) {
          type = 1
          amount = logParsed.args.amountIn
        }
        if (logParsed.args.sideOut.toString() == bn(sideCheckNative)) {
          type = 2
          amount = logParsed.args.amountOut
        }
        if (logParsed.args.sideIn.toString() == bn(sideCheckTarget)) {
          type = 3
          amount = logParsed.args.amountIn
        }
        if (logParsed.args.sideOut.toString() == bn(sideCheckTarget)) {
          type = 4
          amount = logParsed.args.amountOut
        }

        operations.push(
          makeOperations({
            address: log.address,
            type,
            amount: amount.toString(),
            timestamp: parseInt(log.timeStamp),
          }),
        )
      }
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
