let express = require("express")

const contractsRouter = require("./trade")

let app = express()

app.use("/", contractsRouter)

module.exports = app
