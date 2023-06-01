require("dotenv").config({ path: "./.env" })
const { ethers } = require("ethers")
const bn = ethers.BigNumber.from
const { ZERO_ADDRESS } = require("../src/helpers/constants").hexes
const { accumulationConsumerFactory } = require("chain-backend")
const { utils } = require("ethers")
const VolumeModel = require("../src/models/VolumeModel")
const { chainConfigs } = require("../src/helpers/util")

module.exports = (config) => {
  let chainConfig = chainConfigs()
  const filter = [
    {
      topics: [
        "0xe17be4ebc00f711cfd440c6386f98af2b21ea80c4efc6bb5e6008fc122caa630",
      ],
    },
  ]
  filter.forEach((f) => delete f.address)
  console.log(filter)

  const consumer = accumulationConsumerFactory({
    ...config,
    filter,
    genesis: process.env.GENESIS,

    applyLogs: async (value, logs) => {
      for (let log of logs) {
        console.log(log)
        // const logParsed = iface.parseLog(log);
        // let senderAddress = logParsed.args.dstReceiver;
        // let tokenFrom = logParsed.args.srcToken;
        // let tokenTo = logParsed.args.dstToken;
        // let amount = logParsed.args.amount;
        // let returnAmount = logParsed.args.returnAmount;
        // await save(
        //     senderAddress,
        //     tokenFrom,
        //     tokenTo,
        //     amount,
        //     returnAmount,
        // );
      }
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
