let express = require("express")

const topVolumeRouter = require("./trade")

let app = express()

app.use("/", topVolumeRouter)

module.exports = app
