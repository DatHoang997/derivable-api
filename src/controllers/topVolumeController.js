const { ethers } = require("ethers")
const apiResponse = require("../helpers/apiResponse")
const volumeModel = require("../models/VolumeModel")
const botAddress = require("../helpers/botAddress").bot
const _ = require("lodash")
var mongoose = require("mongoose")
mongoose.set("useFindAndModify", false)

exports.getVolume = [
  async function (req, res) {
    let tokenAddress = await req.params.address
    let limit = await req.query.l
    let botSet = new Set(botAddress)
    if (!limit) limit = 10
    let volume = await volumeModel.find(
      { token: tokenAddress },
      { user: 1, amount: 1, _id: 0 },
    )
    volume = volume.filter((v) => !botSet.has(v.user))
    volume = _.orderBy(volume, ["amount.length", "amount"], ["desc", "desc"])
    const result = volume.slice(0, limit)
    return apiResponse.successResponseWithData(res, "Operation success", result)
  },
]
