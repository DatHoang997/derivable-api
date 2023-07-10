var mongoose = require("mongoose")

var Schema = mongoose.Schema

var InfoSchema = new Schema(
  {
    eth_price: {
      type: String,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
  },
  { timestamps: false },
)

module.exports = mongoose.model("info", InfoSchema)
