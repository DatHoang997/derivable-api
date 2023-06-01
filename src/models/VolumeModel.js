var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var VolumeSchema = new Schema({
    token: {
        type: String,
        required: true,
    },
    user: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    }
}, { timestamps: false });


module.exports = mongoose.model("volume", VolumeSchema);