exports.LARGE_VALUE =
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
exports.ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
exports.NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
exports.fee10000 = 30
exports.MINI_SECOND_PER_DAY = 86400000
exports.LP_PRICE_UNIT = 10000
exports.TIME_TO_REFRESH_STATE = 30000
exports.CHART_API_ENDPOINT = "https://api-chart-{chainId}.derivable.finance/"

exports.LOCALSTORAGE_KEY = {
  DDL_LOGS: "ddl-log-v1.0",
  LAST_BLOCK_DDL_LOGS: "last-block-ddl-log-v1.0",
  SWAP_LOGS: "swap-log-v1.0",
  SWAP_BLOCK_LOGS: "last-block-swap-log-v1.0",
}

exports.ddlGenesisBlock = {
  56: 23917200,
  31337: 0,
  42161: 107513624,
}

exports.POOL_IDS = {
  cToken: 0x20000,
  cp: 0x10000,
  cw: 0x10001,
  quote: 0x20001,
  base: 0x20002,
  token0: 262144,
  token1: 262145,
  native: "0x000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  R: 0x00,
  A: 0x10,
  B: 0x20,
  C: 0x30,
}

exports.EventDataAbis = {
  PoolCreated: [
    'bytes32 ORACLE',
    'uint k',
    'uint MARK',
    'uint INTEREST_HL',
    'uint PREMIUM_RATE',
    'uint MATURITY',
    'uint MATURITY_VEST',
    'uint MATURITY_RATE',
    'uint OPEN_RATE',
    'address poolAddress'
  ],
  Swap: [
    'address payer',
    'address poolIn',
    'address poolOut',
    'address recipient',
    'uint sideIn',
    'uint sideOut',
    'uint amountIn',
    'uint amountOut',
  ],
}
