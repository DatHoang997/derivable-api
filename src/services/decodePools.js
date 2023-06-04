const {
  getNormalAddress,
  formatMultiCallBignumber,
  bn,
  parseSqrtSpotPrice,
  weiToNumber,
  numberToWei,
} = require("../utils/helper")
const { ethers } = require("ethers")
const { EventDataAbis, POOL_IDS } = require("../utils/constant")
const _ = require("lodash")
const EventsAbi = require("../utils/abi/Events.json")
const TokensInfoAbi = require("../utils/abi/TokensInfo.json")
const PoolOverride = require("../utils/abi/PoolOverride.json")
const UniV3Pair = require("../utils/uniV3Pair")
const { Multicall } = require("ethereum-multicall")
const erc20Abi = require("../utils/abi/ERC20.json")
const configs = require("../helpers/constants")
const { JsonRpcProvider } = require("@ethersproject/providers")

class DecodePools {
  provider
  overrideProvider
  UNIV3PAIR
  pairsInfo
  pair

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      configs[process.env.CHAIN].rpcUrl,
    )
    this.overrideProvider = new JsonRpcProvider(
      configs[process.env.CHAIN].rpcUrl,
    )
    this.UNIV3PAIR = new UniV3Pair(configs[process.env.CHAIN])
  }

  convertdata = async (pool) => {
    const [baseToken, quoteToken, token_r] = await this.getTokenSymbol(
      pool.baseToken,
      pool.quoteToken,
      pool.TOKEN_R,
    )
    const pool_address = pool.poolAddress
    const base_address = pool.baseToken
    const quote_address = pool.quoteToken
    const r_address =  pool.TOKEN_R
    const tiket_id = `${baseToken}-${quoteToken}^${pool.k}.${token_r}`
    const base_currency = baseToken
    const quote_currency = quoteToken
    const last_price = parseSqrtSpotPrice(
      bn(pool.states.twap.toString()),
      this.pairsInfo[this.pair].token0,
      this.pairsInfo[this.pair].token1,
      1,
    )
    const product_type = "PERP"
    const index_price = parseSqrtSpotPrice(
      bn(pool.states.twap.toString()),
      this.pairsInfo[this.pair].token0,
      this.pairsInfo[this.pair].token1,
      1,
    )
    const index_name = baseToken
    const index_currency = token_r
    const start_timestamp = pool.timestamp.toString()
    const end_timestamp = Math.floor(Number.MAX_SAFE_INTEGER).toString()
    return {
      pool_address,
      tiket_id,
      base_currency,
      quote_currency,
      last_price,
      product_type,
      index_price,
      index_name,
      index_currency,
      start_timestamp,
      end_timestamp,
      base_address,
      quote_address,
      r_address,
    }
  }

  getTokenSymbol = async (baseToken, quoteToken, TOKEN_R) => {
    const multicall = new Multicall({
      ethersProvider: this.provider,
      tryAggregate: true,
    })

    const contractCallContext = [
      {
        reference: "baseToken",
        contractAddress: baseToken,
        abi: erc20Abi,
        calls: [
          {
            reference: "tokenSymbol",
            methodName: "symbol",
            methodParameters: [],
          },
        ],
      },
      {
        reference: "quoteToken",
        contractAddress: quoteToken,
        abi: erc20Abi,
        calls: [
          {
            reference: "tokenSymbol",
            methodName: "symbol",
            methodParameters: [],
          },
        ],
      },
      {
        reference: "token_r",
        contractAddress: quoteToken,
        abi: erc20Abi,
        calls: [
          {
            reference: "tokenSymbol",
            methodName: "symbol",
            methodParameters: [],
          },
        ],
      },
    ]

    const results = await multicall.call(contractCallContext)
    return [
      results.results.baseToken.callsReturnContext[0].returnValues[0],
      results.results.quoteToken.callsReturnContext[0].returnValues[0],
      results.results.token_r.callsReturnContext[0].returnValues[0],
    ]
  }

  /**
   * parse DDL logs
   * @param logs
   */
  generatePoolData = (logs) => {
    const allTokens = []
    const allUniPools = []
    const poolData = {}
    logs.forEach((log) => {
      if (log.name === "PoolCreated") {
        const logic = ethers.utils.getAddress(log.topics[3].slice(0, 42))
        const factory = ethers.utils.getAddress(log.topics[2].slice(0, 42))
        const data = log.args
        const powers = [log.args.k.toNumber(), -log.args.k.toNumber()]
        data.dTokens = powers.map((value, key) => {
          return { power: value, index: key }
        })
        data.dTokens = data.dTokens.map(
          (data) => `${log.address}-${data.index}`,
        )

        poolData[log.address] = {
          ...data,
          poolAddress: log.address,
          logic,
          factory,
          powers,
          cToken: data.TOKEN_R,
          timestamp: log.timeStamp,
        }
        this.pair = ethers.utils.getAddress("0x" + data.ORACLE.slice(-40))

        allUniPools.push(this.pair)
        allTokens.push(data.TOKEN_R)
      }
    })
    return this.loadStatesData(allTokens, poolData, allUniPools)
  }

  /**
   * load Token detail, poolstate data and then dispatch to Store
   * @param listTokens
   * @param listPools
   * @param uniPools
   */
  //@ts-ignore
  loadStatesData = async (listTokens, listPools, uniPools) => {
    const multicall = new Multicall({
      multicallCustomContractAddress:
        "0xcA11bde05977b3631167028862bE2a173976CA11", //this.addresses.multiCall,
      ethersProvider: this.getPoolOverridedProvider(Object.keys(listPools)),
      tryAggregate: true,
    })
    const normalTokens = _.uniq(getNormalAddress(listTokens))

    // @ts-ignore
    const context = this.getMultiCallRequest(normalTokens, listPools)

    const { results } = await multicall.call(context)

    this.pairsInfo = await this.UNIV3PAIR.getPairsInfo({
      pairAddresses: _.uniq(uniPools),
    })

    const { tokens: tokensArr, poolsState } = this.parseMultiCallResponse(
      results,
      Object.keys(listPools),
    )
    const tokens = []
    for (let i = 0; i < tokensArr.length; i++) {
      tokens.push({
        symbol: tokensArr[i][0],
        name: tokensArr[i][1],
        decimal: tokensArr[i][2],
        totalSupply: tokensArr[i][3],
        address: normalTokens[i],
      })
    }

    const pools = { ...listPools }
    const poolGroups = {}

    for (const i in pools) {
      pools[i].states = poolsState[i]
      const {
        UTR,
        TOKEN,
        MARK: _MARK,
        ORACLE,
        TOKEN_R,
        powers,
        k: _k,
      } = pools[i]

      const quoteTokenIndex = bn(ORACLE.slice(0, 3)).gt(0) ? 1 : 0
      this.pair = ethers.utils.getAddress("0x" + ORACLE.slice(-40))

      const baseToken =
        quoteTokenIndex === 0
          ? this.pairsInfo[this.pair].token1
          : this.pairsInfo[this.pair].token0
      const quoteToken =
        quoteTokenIndex === 0
          ? this.pairsInfo[this.pair].token0
          : this.pairsInfo[this.pair].token1

      pools[i].baseToken = baseToken.address
      pools[i].quoteToken = quoteToken.address

      const MARK = _MARK.toString()
      const k = _k.toNumber()
      const id = [UTR, TOKEN, MARK, ORACLE, TOKEN_R].join("-")
      if (poolGroups[id]) {
        poolGroups[id].pools[i] = pools[i]
      } else {
        poolGroups[id] = { pools: { [i]: pools[i] } }
        poolGroups[id].UTR = pools[i].UTR
        poolGroups[id].pair = this.pairsInfo[this.pair]
        poolGroups[id].baseToken = pools[i].baseToken
        poolGroups[id].quoteToken = pools[i].quoteToken
        poolGroups[id].TOKEN = pools[i].TOKEN
        poolGroups[id].MARK = pools[i].MARK
        poolGroups[id].INIT_TIME = pools[i].INIT_TIME
        poolGroups[id].HALF_LIFE = pools[i].HALF_LIFE
        poolGroups[id].ORACLE = pools[i].ORACLE
        poolGroups[id].TOKEN_R = pools[i].TOKEN_R
        poolGroups[id].states = {
          twapBase: poolsState[i].twap,
          spotBase: poolsState[i].spot,
          ...poolsState[i],
        }
        poolGroups[id].basePrice = parseSqrtSpotPrice(
          poolsState[i].spot,
          this.pairsInfo[this.pair].token0,
          this.pairsInfo[this.pair].token1,
          quoteTokenIndex,
        )
      }

      const rdc = this.getRdc(Object.values(poolGroups[id].pools))
      poolGroups[id].states = {
        ...poolGroups[id].states,
        ...rdc,
      }

      if (poolGroups[id].powers) {
        poolGroups[id].k.push(pools[i].k.toNumber())
        poolGroups[id].powers.push(pools[i].powers[0], pools[i].powers[1])
      } else {
        poolGroups[id].k = [pools[i].k.toNumber()]
        poolGroups[id].powers = [...pools[i].powers]
      }
      if (poolGroups[id].dTokens) {
        poolGroups[id].dTokens.push(
          pools[i].poolAddress + "-" + POOL_IDS.A,
          pools[i].poolAddress + "-" + POOL_IDS.B,
        )
      } else {
        poolGroups[id].dTokens = [
          pools[i].poolAddress + "-" + POOL_IDS.A,
          pools[i].poolAddress + "-" + POOL_IDS.B,
        ]
      }
      if (poolGroups[id].allTokens) {
        poolGroups[id].allTokens.push(
          pools[i].poolAddress + "-" + POOL_IDS.A,
          pools[i].poolAddress + "-" + POOL_IDS.B,
          pools[i].poolAddress + "-" + POOL_IDS.C,
        )
      } else {
        poolGroups[id].allTokens = [
          pools[i].poolAddress + "-" + POOL_IDS.A,
          pools[i].poolAddress + "-" + POOL_IDS.B,
          pools[i].poolAddress + "-" + POOL_IDS.C,
        ]
      }

      tokens.push(
        {
          symbol: baseToken.symbol + "^" + (1 + k / 2),
          name: baseToken.symbol + "^" + (1 + k / 2),
          decimal: 18,
          totalSupply: 0,
          address: pools[i].poolAddress + "-" + POOL_IDS.A,
        },
        {
          symbol: baseToken.symbol + "^" + (1 - k / 2),
          name: baseToken.symbol + "^" + (1 - k / 2),
          decimal: 18,
          totalSupply: 0,
          address: pools[i].poolAddress + "-" + POOL_IDS.B,
        },
        {
          symbol: `DLP-${baseToken.symbol}-${k / 2}`,
          name: `DLP-${baseToken.symbol}-${k / 2}`,
          decimal: 18,
          totalSupply: 0,
          address: pools[i].poolAddress + "-" + POOL_IDS.C,
        },
        baseToken,
        quoteToken,
      )
    }

    return {
      // @ts-ignore
      tokens: _.uniqBy(tokens, "address"),
      pools,
      poolGroups,
    }
  }

  getRentRate = ({ rDcLong, rDcShort, R }) => {
    const diff = bn(rDcLong).sub(rDcShort).abs()
    const rate = R.isZero() ? bn(0) : diff.mul(rentRate).div(R)
    return {
      rentRateLong: rDcLong.add(rDcShort).isZero()
        ? bn(0)
        : rate.mul(rDcLong).div(rDcLong.add(rDcShort)),
      rentRateShort: rDcLong.add(rDcShort).isZero()
        ? bn(0)
        : rate.mul(rDcShort).div(rDcLong.add(rDcShort)),
    }
  }

  getPoolOverridedProvider = (poolAddresses) => {
    const stateOverride = {}
    poolAddresses.forEach((address) => {
      stateOverride[address] = {
        code: PoolOverride.deployedBytecode,
      }
    })
    this.overrideProvider.setStateOverride({
      ...stateOverride,
    })
    return this.overrideProvider
  }

  getBasePrice = (pairInfo, baseToken) => {
    const token0 = pairInfo.token0.adr
    const r0 = pairInfo.token0.reserve
    const r1 = pairInfo.token1.reserve
    const [rb, rq] = token0 === baseToken ? [r0, r1] : [r1, r0]
    return weiToNumber(rq.mul(numberToWei(1)).div(rb))
  }

  /**
   * get Multicall Request to get List token and poolState data in 1 request to RPC
   * @param normalTokens
   * @param listPools
   */
  //@ts-ignore
  getMultiCallRequest = (normalTokens, listPools) => {
    const request = [
      {
        reference: "tokens",
        contractAddress: "0x696630d3aE600147902c71bF967ec3eb7a2C8b44",
        abi: TokensInfoAbi,
        calls: [
          {
            reference: "tokenInfos",
            methodName: "getTokenInfo",
            methodParameters: [normalTokens],
          },
        ],
      },
    ]

    for (const i in listPools) {
      request.push({
        // @ts-ignore
        decoded: true,
        reference: "pools-" + listPools[i].poolAddress,
        contractAddress: listPools[i].poolAddress,
        // @ts-ignore
        abi: PoolOverride.abi,
        calls: [
          {
            reference: i,
            methodName: "getStates",
            // @ts-ignore
            methodParameters: [
              listPools[i].ORACLE,
              listPools[i].MARK,
              listPools[i].TOKEN_R,
              listPools[i].k,
              listPools[i].TOKEN,
            ],
          },
        ],
      })
    }

    return request
  }

  parseMultiCallResponse = (multiCallData, poolAddresses) => {
    const pools = {}
    const tokens = multiCallData.tokens.callsReturnContext[0].returnValues
    poolAddresses.forEach((poolAddress) => {
      const abiInterface = new ethers.utils.Interface(PoolOverride.abi)
      const poolStateData =
        multiCallData["pools-" + poolAddress].callsReturnContext
      const data = formatMultiCallBignumber(poolStateData[0].returnValues)
      const encodeData = abiInterface.encodeFunctionResult("getStates", [data])
      const formatedData = abiInterface.decodeFunctionResult(
        "getStates",
        encodeData,
      )

      pools[poolStateData[0].reference] = {
        ...formatedData.states,
      }
    })

    return { tokens, poolsState: pools }
  }

  getRdc = (pools) => {
    let rC = bn(0)
    let rDcLong = bn(0)
    let rDcShort = bn(0)
    const supplyDetails = {}
    const rDetails = {}
    for (const pool of pools) {
      rC = pool.states.rC
      rDcLong = pool.states.rA
      rDcShort = pool.states.rB
      rDetails[pool.k.toNumber()] = pool.states.rA
      rDetails[-pool.k.toNumber()] = pool.states.rB

      supplyDetails[pool.k.toNumber()] = pool.states.sA
      supplyDetails[-pool.k.toNumber()] = pool.states.sB
    }
    return {
      supplyDetails,
      rDetails,
      R: rC.add(rDcLong).add(rDcShort),
      rC,
      rDcLong,
      rDcShort,
    }
  }

  parseDdlLogs = async (ddlLogs) => {
    const eventInterface = new ethers.utils.Interface(EventsAbi)
    const result = []
    for (const log of ddlLogs) {
      try {
        const decodeLog = eventInterface.parseLog(log)
        let appName = ""
        try {
          appName = ethers.utils.parseBytes32String(decodeLog.args.topic1)
        } catch (e) {}

        let data = decodeLog
        if (appName) {
          data = ethers.utils.defaultAbiCoder.decode(
            EventDataAbis[appName],
            decodeLog.args.data,
          )
        }
        const lastBlock = await this.getLastBlock()

        result.push({
          address: log.address,
          timeStamp: lastBlock.timestamp,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          index: log.logIndex,
          logIndex: log.transactionHash + "-" + log.logIndex,
          name: appName,
          topics: log.topics,
          args: {
            ...data,
          },
        })
      } catch (e) {
        console.error(e)
        result.push({})
      }
    }
    return result
  }

  getLastBlock = async () => {
    const lastBlock = await this.provider.getBlockNumber()
    return this.provider.getBlock(lastBlock)
  }
}

module.exports = DecodePools
