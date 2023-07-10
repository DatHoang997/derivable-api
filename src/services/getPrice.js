require("dotenv").config({ path: "./.env" })
const { ethers } = require("ethers")
const fetch = require("node-fetch")
const PoolsModel = require("../models/poolsModel")
const mongoose = require("mongoose")
mongoose.set("useFindAndModify", false)

async function getPrice() {
  const tokens = await getTokens()
  if(tokens.size == 0) return
  query = []
  for (let token of tokens) {
    query.push({
      token_address: token,
    })
  }

  const body = await getApi(query)

  for (let data of body) {
    console.log(data.usdPrice)
    savePrice({
      address: ethers.utils.getAddress(data.tokenAddress),
      price: data.usdPrice.toString(),
    })
  }
}

const getApi = async (query) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-Key":
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjZlNDU2Y2VkLThhMDItNDAwYi04YjhhLTQyMjIzOGI1NDU0OCIsIm9yZ0lkIjoiMjIzNzM1IiwidXNlcklkIjoiMjIzODgyIiwidHlwZUlkIjoiMGI1MzE2MTAtYzJhYi00ODM0LWJiZTQtODA4OWZiY2E4ZWQ4IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE2ODIzMDY2OTgsImV4cCI6NDgzODA2NjY5OH0._0I6-1wKik9UbCGTVOpXB1cwx3JF091RKal40gaQiis",
    },
    body: JSON.stringify({
      tokens: query,
    }),
  }
  const url = `https://deep-index.moralis.io/api/v2/erc20/prices?chain=${process.env.CHAIN}&include=percent_change`

  const response = await fetch(url, options)

  return JSON.parse(await response.text())
}

const savePrice = async (token) => {
  await PoolsModel.updateMany(
    { r_address: token.address },
    { r_price: token.price },
  )
}

const getTokens = async () => {
  let pools = await PoolsModel.find()
  let tokens = []
  for (let pool of pools) {
    tokens.push(pool.r_address)
  }
  let set = new Set(tokens)
  return set
}

module.exports = { getPrice, getApi }
