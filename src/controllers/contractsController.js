const apiResponse = require("../helpers/apiResponse")
const _ = require("lodash")
const PoolsModel = require("../models/poolsModel")
const infoModel = require("../models/infoModel")
const getState = require("../services/getState")
const volume = require("../services/volume")
const mongoose = require("mongoose")
mongoose.set("useFindAndModify", false)

exports.getContracts = [
  async function (req, res) {
    let info = await infoModel.find()
    if (Date.now() > info.time + 3600000) await getState.getPools()
    // await getState.getPools()
    let pools = await PoolsModel.find()
    const data = []
    let getVolume = await volume.getVolume()
    for (let pool of pools) {
      const volumevalue = volume.calculateVolume(
        getVolume[pool.address],
        pool,
        info[0].native_price,
      )
      data.push({
        ticker_id: pool.ticker_id,
        base_currency: pool.base_currency,
        target_currency: pool.quote_currency,
        last_price: pool.last_price,
        base_volume: volumevalue,
        quote_volume: volumevalue,
        product_type: "PERP",
        open_interest: "pool.open_interest",
        index_price: pool.index_price,
        index_name: pool.index_name,
        index_currency: pool.index_currency,
        start_timestamp: pool.start_timestamp,
        end_timestamp: pool.end_timestamp,
        funding_rate: pool.interes_rate,
        next_funding_rate: pool.interes_rate,
        next_funding_rate_timestamp: pool.end_timestamp,
        contract_price_currency: pool.index_currency
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
