exports.hexes = {
  ZERO_HASH:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  LARGE_VALUE:
    "0x8000000000000000000000000000000000000000000000000000000000000000",
}

exports.getlogs = {
  CHUNK_SIZE_HARD_CAP: 4000,
  TARGET_LOGS_PER_CHUNK: 500,
}

exports.arbitrum = {
  chainId: 42161,
  rpcUrl: 'https://rpc.arb1.arbitrum.gateway.fm',
  rpcToGetLogs: 'https://rpc.arb1.arbitrum.gateway.fm',
  scanApi: "https://api.arbiscan.io/api",
  timePerBlock: 1000,
  nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  addresses: {
    reserveTokenPrice: '0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474',
    uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    token: '0x1BA630bEd23129aed65BFF106cd15C4B457a26e8',
    stateCalHelper: '0x9401a34764E01B6556C89bA7ca4944a8907D4442',
    multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    pairsInfo: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
    pairsV3Info: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
    bnA: '0x357FF35761979254F93a21995b20d9071904603d',
    tokensInfo: '0x696630d3aE600147902c71bF967ec3eb7a2C8b44',
    router: '0xbc9a257e43f7b3b1a03aEBE909f15e95A4928834',
    poolFactory: '0xF817EBA38BebD48a58AE38360306ea0E243077cd',
    logic: '0x4413d44163C7Ba2B285787719a9ed2DdFC6f57E0',
    wrapToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    wrapUsdPair: '0xCB0E5bFa72bBb4d16AB5aA0c60601c438F04b4ad',
  },
  stableCoins: [
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  ],
  pc_rate_limit_count: 5,
  rpc_rate_limit_duration: 1000,
  rpc_range_threshold: 4000,
  rpc_maxResults: 100
}

