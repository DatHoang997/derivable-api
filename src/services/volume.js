const { bn } = require("../utils/helper")
const volumeModel = require("../models/volumeModel")
const ethers = require("ethers")
const BigNumber = require("bignumber.js")

const getVolume = async () => {
  firstTimestamp = Math.floor(Date.now() / 1000) - 86400000000
  let data = await volumeModel.find(
    { timestamp: { $gt: firstTimestamp } },
    { _id: 0, timestamp: 0 },
  )

  const dataByAddress = {}
  data.forEach((obj) => {
    const address = obj.address
    if (!dataByAddress[address]) {
      dataByAddress[address] = []
    }
    dataByAddress[address].push(obj)
  })

  return dataByAddress
}

const calculateVolume = (volumes, pool, native_price) => {
  if (!volumes) return null
  let volumeAmount = new BigNumber(0)
  for (let volume of volumes) {
    if (volume.type == 1 || volume.type == 2) {
      const price = new BigNumber(native_price) // Giá của token
      const quantity = new BigNumber(volume.amount) // Số lượng token
      volumeAmount = volumeAmount.plus(price.times(quantity))
    }
    if (volume.type == 3 || volume.type == 4) {
      const price = new BigNumber(pool.r_price) // Giá của token
      const quantity = new BigNumber(volume.amount) // Số lượng token
      volumeAmount = volumeAmount.plus(price.times(quantity))
    }
  }

  return ethers.utils.formatEther(volumeAmount.toString())
}

module.exports = { getVolume, calculateVolume }
