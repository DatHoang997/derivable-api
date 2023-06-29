const { bn } = require("../utils/helper")
const PoolsModel = require("../models/PoolsModel")
const { ethers } = require("ethers")
const decodePools = require("./decodePools")

const getPools = async () => {
  const listPools = await PoolsModel.find()
  if (listPools.length == 0) return

  const DecodePools = new decodePools()

  const uniPools = []
  let poolData = {}
  const listTokens = []
  for (const pool of listPools) {
    uniPools.push(ethers.utils.getAddress("0x" + pool.oracle.slice(-40)))
    listTokens.push(pool.r_address)
    poolData[pool.pool_address] = {
      poolAddress: pool.pool_address,
      ORACLE: pool.oracle,
      MARK: bn(pool.mark),
      TOKEN_R: pool.r_address,
      k: bn(pool.k),
      TOKEN: pool.token,
      powers: pool.powers,
      HALF_LIFE: bn(pool.half_life),
    }
  }
  const { tokens, pools, poolGroups } = await DecodePools.loadStatesData(
    listTokens,
    poolData,
    uniPools,
  )
  savePools(pools)
}

const savePools = async (pools) => {
  const poolAddresses = Object.keys(pools)

  for (const poolAddress of poolAddresses ) {
    console.log(pools[poolAddress].price, pools[poolAddress].rC.toString())
    PoolsModel
  }
}

module.exports = { getPools }
