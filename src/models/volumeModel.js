var mongoose = require("mongoose")

var Schema = mongoose.Schema

var VolumeSchema = new Schema(
  {
    pool_address: {
      type: String,
      required: true,
      unix: true,
    },
    value: {
      type: String,
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  { timestamps: false },
)

module.exports = mongoose.model("volume", VolumeSchema)
