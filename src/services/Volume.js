const { bn } = require("../utils/helper")
const volumeModel = require("../models/volumeModel")

const calculateVolume = async () => {
  firstTimestamp = Math.floor(Date.now() / 1000) - 86400000000
  let data = await volumeModel.find(
    { timestamp: { $gt: firstTimestamp } },
    { _id: 0, timestamp: 0 },
  )
  console.log(data)
}
module.exports = { calculateVolume }
