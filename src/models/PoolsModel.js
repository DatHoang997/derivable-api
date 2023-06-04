var mongoose = require("mongoose")

var Schema = mongoose.Schema

var PoolsSchema = new Schema(
  {
    pool_address: {
      type: String,
      required: true,
      unix: true
    },
    tiket_id: {
      type: String,
      required: true,
    },
    base_currency: {
      type: String,
      required: true,
    },
    quote_currency: {
      type: String,
      required: true,
    },
    base_address: {
      type: String,
      required: true,
    },
    quote_address: {
      type: String,
      required: true,
    },
    r_address: {
      type: String,
      required: true,
    },
    last_price: {
      type: String,
      required: true,
    },
    product_type: {
      type: String,
      required: true,
    },
    index_price: {
      type: String,
      required: true,
    },
    index_name: {
      type: String,
      required: true,
    },
    index_currency: {
      type: String,
      required: true,
    },
    start_timestamp: {
      type: String,
      required: true,
    },
    end_timestamp: {
      type: String,
      required: true,
    },
    chainId: {
      type: String,
      required: true,
    },
    constract_price: {
      type: String,
      required: false,
    },
  },
  { timestamps: false },
)

module.exports = mongoose.model("pool", PoolsSchema)
