const {
  getNormalAddress,
  formatMultiCallBignumber,
  bn,
  div,
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
const configs = require("../helpers/config")
const { JsonRpcProvider } = require("@ethersproject/providers")
const { defaultAbiCoder } = require("ethers/lib/utils")

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

  convertData = async (pool) => {
    console.log(pool)
    const [baseToken, quoteToken, token_r] = await this.getTokenSymbol(
      pool.baseToken,
      pool.quoteToken,
      pool.TOKEN_R,
    )

    const last_price = parseSqrtSpotPrice(
      bn(pool.states.twap.toString()),
      this.pairsInfo[this.pair].token0,
      this.pairsInfo[this.pair].token1,
      1,
    )

    const index_price = parseSqrtSpotPrice(
      bn(pool.states.twap.toString()),
      this.pairsInfo[this.pair].token0,
      this.pairsInfo[this.pair].token1,
      1,
    )

    return {
      address: pool.poolAddress,
      ticker_id: `${baseToken}-${quoteToken}^${pool.k}.${token_r}`,
      base_currency: baseToken,
      quote_currency: quoteToken,
      last_price,
      product_type: "PERP",
      index_price,
      index_name: baseToken,
      index_currency: token_r,
      start_timestamp: pool.timestamp.toString(),
      end_timestamp: Math.floor(Number.MAX_SAFE_INTEGER).toString(),
      base_address: pool.baseToken,
      quote_address: pool.quoteToken,
      r_address: pool.TOKEN_R,
      oracle: pool.ORACLE,
      mark: pool.MARK.toString(),
      k: pool.k.toString(),
      powers: pool.powers,
      interes_rate: pool.dailyInterestRate,
      interest_hl: pool.INTEREST_HL.toString(),
      rA: pool.states.rA,
      rB: pool.states.rB,
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
        contractAddress: TOKEN_R,
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
      pools[i] = {
        ...pools[i],
        ...this.calcPoolInfo(pools[i]),
      }
      const { MARK: _MARK, ORACLE, k: _k } = pools[i]

      const quoteTokenIndex = bn(ORACLE.slice(0, 3)).gt(0) ? 1 : 0
      const pair = ethers.utils.getAddress("0x" + ORACLE.slice(-40))

      const baseToken =
        quoteTokenIndex === 0
          ? pairsInfo[pair].token1
          : this.pairsInfo[pair].token0
      const quoteToken =
        quoteTokenIndex === 0
          ? pairsInfo[pair].token0
          : this.pairsInfo[pair].token1

      pools[i].baseToken = baseToken.address
      pools[i].quoteToken = quoteToken.address

      const k = _k.toNumber()
      const id = [pair].join("-")
      if (poolGroups[id]) {
        poolGroups[id].pools[i] = pools[i]
      } else {
        poolGroups[id] = { pools: { [i]: pools[i] } }
        poolGroups[id].UTR = pools[i].UTR
        poolGroups[id].pair = this.pairsInfo[pair]
        poolGroups[id].baseToken = pools[i].baseToken
        poolGroups[id].quoteToken = pools[i].quoteToken
        poolGroups[id].MARK = pools[i].MARK
        poolGroups[id].INIT_TIME = pools[i].INIT_TIME
        poolGroups[id].ORACLE = pools[i].ORACLE
        poolGroups[id].TOKEN_R = pools[i].TOKEN_R
        poolGroups[id].states = {
          twapBase: poolsState[i].twap,
          spotBase: poolsState[i].spot,
          ...poolsState[i],
        }
        poolGroups[id].basePrice = parseSqrtSpotPrice(
          poolsState[i].spot,
          this.pairsInfo[pair].token0,
          this.pairsInfo[pair].token1,
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
          decimal: this.getDecimals(baseToken, quoteToken, POOL_IDS.A),
          totalSupply: 0,
          address: pools[i].poolAddress + "-" + POOL_IDS.A,
        },
        {
          symbol: baseToken.symbol + "^" + (1 - k / 2),
          name: baseToken.symbol + "^" + (1 - k / 2),
          decimal: this.getDecimals(baseToken, quoteToken, POOL_IDS.B),
          totalSupply: 0,
          address: pools[i].poolAddress + "-" + POOL_IDS.B,
        },
        {
          symbol: `DLP-${baseToken.symbol}-${k / 2}`,
          name: `DLP-${baseToken.symbol}-${k / 2}`,
          decimal: this.getDecimals(baseToken, quoteToken, POOL_IDS.C),
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
    // poolAddresses.forEach((address: string) => {
    stateOverride["0x4413d44163C7Ba2B285787719a9ed2DdFC6f57E0"] = {
      code: PoolOverride.deployedBytecode,
    }
    // })

    //@ts-ignore
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
            methodName: "compute",
            methodParameters: ["0x1BA630bEd23129aed65BFF106cd15C4B457a26e8"],
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
      try {
        const abiInterface = new ethers.utils.Interface(PoolOverride.abi)
        const poolStateData =
          multiCallData["pools-" + poolAddress].callsReturnContext
        const data = formatMultiCallBignumber(poolStateData[0].returnValues)
        const encodeData = abiInterface.encodeFunctionResult("compute", [data])
        const formatedData = abiInterface.decodeFunctionResult(
          "compute",
          encodeData,
        )
        pools[poolStateData[0].reference] = {
          // twapBase: formatedData.states.twap.base._x,
          // twapLP: formatedData.states.twap.LP._x,
          // spotBase: formatedData.states.spot.base._x,
          // spotLP: formatedData.states.spot.LP._x,
          ...formatedData.stateView,
          ...formatedData.stateView.state,
        }
      } catch (e) {
        console.error("Cannot get states of: ", poolAddress)
        console.error(e)
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
      rC = pool.states.rDcLong = pool.states.rA
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

  calcPoolInfo(pool) {
    const { R, rA, rB } = pool.states
    const rC = R.sub(rA).sub(rB)
    const SECONDS_PER_DAY = 86400
    const riskFactor = rC.gt(0) ? div(rA.sub(rB), rC) : "0"
    const dailyInterestRate =
      1 - Math.pow(2, -SECONDS_PER_DAY / pool.INTEREST_HL.toNumber())
    this.pair = ethers.utils.getAddress("0x" + pool.ORACLE.slice(-40))
    const price = parseSqrtSpotPrice(
      bn(pool.states.twap.toString()),
      this.pairsInfo[this.pair].token0,
      this.pairsInfo[this.pair].token1,
      1,
    )
    return {
      riskFactor,
      dailyInterestRate,
      rC,
      price,
    }
  }

  parseDdlLogs(ddlLogs) {
    const eventInterface = new ethers.utils.Interface(EventsAbi)
    return ddlLogs.map((log) => {
      try {
        const decodeLog = eventInterface.parseLog(log)
        let appName = ""
        try {
          appName = ethers.utils.parseBytes32String(decodeLog.args.topic1)
        } catch (e) {}

        let data = decodeLog
        if (appName === "PoolCreated") {
          const poolCreatedData = defaultAbiCoder.decode(
            EventDataAbis[appName],
            decodeLog.args.data,
          )
          data = {
            ...poolCreatedData,
            TOKEN_R: ethers.utils.getAddress(
              "0x" + decodeLog.args.topic3.slice(-40),
            ),
          }
        }
        return {
          address: data.poolAddress,
          timeStamp: parseInt(log.timeStamp),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          index: log.logIndex,
          logIndex: log.transactionHash + "-" + log.logIndex,
          name: appName,
          topics: log.topics,
          args: {
            ...data,
          },
        }
      } catch (e) {
        console.error(e)
        return {}
      }
    })
  }

  getLastBlock = async () => {
    const lastBlock = await this.provider.getBlockNumber()
    return this.provider.getBlock(lastBlock)
  }

  getDecimals(baseToken, quoteToken, side) {
    if (side == POOL_IDS.C) {
      return (baseToken.decimal + quoteToken.decimal) / 2
    }
    return 18 - baseToken.decimal + quoteToken.decimal
  }
}

module.exports = DecodePools
