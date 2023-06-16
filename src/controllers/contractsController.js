const apiResponse = require("../helpers/apiResponse")
const _ = require("lodash")
var mongoose = require("mongoose")
mongoose.set("useFindAndModify", false)

exports.getContracts = [
  async function (req, res) {
    return apiResponse.successResponseWithData(
      res,
      "Operation success",
      "contract",
    )
  },
]

exports.getOrderbooks = [
  async function (req, res) {
    return apiResponse.successResponseWithData(
      res,
      "Operation success",
      "Orderbooks",
    )
  },
]
