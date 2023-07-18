require("dotenv").config({ path: "./.env" })
const { ethers } = require("ethers")
const fetch = require("node-fetch")
const PoolsModel = require("../models/poolsModel")
const mongoose = require("mongoose")
const { bn } = require("../utils/helper")
mongoose.set("useFindAndModify", false)
const BigNumber = require("bignumber.js")

async function getInfo() {
  let pools = await PoolsModel.find()
  getOpenInterest(pools)
  const tokens = await getTokens(pools)
  if (tokens.size == 0) return
  query = []
  for (let token of tokens) {
    query.push({
      token_address: token,
    })
  }

  const body = await getApi(query)

  for (let data of body) {
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
  console.log(token)
  await PoolsModel.updateMany(
    { r_address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" },
    { r_price: token.price },
  )
}

const getOpenInterest = (pools) => {
  const sumMap = new Map()
  // Tính tổng rA và rB cho từng ticker_id
  pools.forEach((obj) => {
    const tickerId = obj.ticker_id.split("^")[0]
    const sum = sumMap.get(tickerId) || { open_interest: bn(0) }
    console.log("rA", obj.rA.toString())
    console.log("rB", obj.rB.toString())
    sum.open_interest = sum.open_interest.add(obj.rA)
    sum.open_interest = sum.open_interest.add(obj.rB)
    sumMap.set(tickerId, sum)
    console.log("sum", sum.open_interest.toString())
  })

  // Lưu tổng rA và rB vào document có ticker_id
  sumMap.forEach(async (sum, tickerId) => {
    const foundObject = pools.find((obj) => obj.ticker_id.startsWith(tickerId))
    console.log('foundObject', foundObject)
    const firstMatchingObject = foundObject && [foundObject]

    console.log(firstMatchingObject[0].r_price)
    const open_interest = BigNumber(firstMatchingObject[0].r_price).times(
      ethers.utils.formatEther(sum.open_interest.toString()),
    )
    console.log(
      firstMatchingObject[0].r_price,
      ethers.utils.formatEther(sum.open_interest.toString()),
      open_interest.toString(),
    )
    await PoolsModel.updateMany(
      { ticker_id: { $regex: tickerId } },
      { open_interest: open_interest.toString() },
    )
  })
}

const getTokens = async (pools) => {
  let tokens = []
  for (let pool of pools) {
    tokens.push(pool.r_address)
  }
  let set = new Set(tokens)
  return set
}

module.exports = { getInfo, getApi }
