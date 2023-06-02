require("dotenv").config({ path: "./.env" })
const { ethers } = require("ethers")
const bn = ethers.BigNumber.from
const { accumulationConsumerFactory } = require("chain-backend")
const VolumeModel = require("../src/models/VolumeModel")
const decodePool = require("../src/services/decodePools")

module.exports = (config) => {
  const derivableTopic = '0xe17be4ebc00f711cfd440c6386f98af2b21ea80c4efc6bb5e6008fc122caa630'
  const filter = [
    {
      topics: [
        derivableTopic,
      ],
    },
  ]
  filter.forEach((f) => delete f.address)
  console.log(filter)

  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: 0,

    applyLogs: async (value, logs) => {
      const ddlLogs = logs.filter((log) => {
        return log.address && [derivableTopic].includes(log.topics[0]);
      });
      const parsedLogs = await decodePool.parseDdlLogs(ddlLogs);
      console.log(parsedLogs)
      return value // untouched
    },
  })

  consumer.order = 1 // depends on `tokens` consumer

  const save = async (
    senderAddress,
    tokenFrom,
    tokenTo,
    amount,
    returnAmount,
  ) => {
    let saveTokenFrom = await VolumeModel.findOne({
      user: senderAddress,
      token: tokenFrom,
    })
    let saveTokenTo = await VolumeModel.findOne({
      user: senderAddress,
      token: tokenTo,
    })
    if (saveTokenFrom) {
      let newAmount = bn(saveTokenFrom.amount).add(amount)
      await VolumeModel.findOneAndUpdate(
        { user: senderAddress, token: tokenFrom },
        { amount: newAmount.toString() },
      )
    }
    if (saveTokenTo) {
      let newAmount = bn(saveTokenTo.amount).add(returnAmount)
      await VolumeModel.findOneAndUpdate(
        { user: senderAddress, token: tokenTo },
        { $set: { amount: newAmount.toString() } },
      )
    }
    if (!saveTokenFrom) {
      let volumeModel = new VolumeModel({
        user: senderAddress,
        token: tokenFrom,
        amount: amount,
      })
      await volumeModel.save()
    }
    if (!saveTokenTo) {
      let volumeModel = new VolumeModel({
        user: senderAddress,
        token: tokenTo,
        amount: returnAmount,
      })
      await volumeModel.save()
    }
  }
  return consumer
}
