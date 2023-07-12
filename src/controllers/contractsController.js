const apiResponse = require("../helpers/apiResponse")
const _ = require("lodash")
const PoolsModel = require("../models/poolsModel")
const InfoModel = require("../models/infoModel")
var mongoose = require("mongoose")
mongoose.set("useFindAndModify", false)
const getState = require("../services/getState")

exports.getContracts = [
  async function (req, res) {
    let info = await InfoModel.find()
    // if (Date.now() > info.time + 3600000) await getState.getPools()
    await getState.getPools()
    let pools = await PoolsModel.find()
    const data = []
    for (let pool of pools) {
      data.push({
        ticker_id: pool.ticker_id,
        base_currency: pool.base_currency,
        target_currency: pool.quote_currency,
        last_price: pool.last_price,
        base_volume: 0,
        quote_volume: 0,
        product_type: "PERP",
        open_interest: 'pool.open_interest',
        index_price: pool.index_price,
        index_name: pool.index_name,
        index_currency: pool.index_currency,
        start_timestamp: pool.start_timestamp,
        end_timestamp: pool.end_timestamp,
        funding_rate: pool.interes_rate,
        next_funding_rate: pool.interes_rate,
        next_funding_rate_timestamp: pool.end_timestamp,
      })
    }
    return apiResponse.successResponseWithData(res, "Operation success", data)
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
