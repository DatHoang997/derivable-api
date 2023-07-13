var mongoose = require("mongoose")

var Schema = mongoose.Schema

var VolumeSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unix: true,
    },
    amount: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    type: {
      type: Number,
      required: true,
    },
  },
  { timestamps: false },
)

module.exports = mongoose.model("volume", VolumeSchema)
