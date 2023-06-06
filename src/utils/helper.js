const { BigNumber, ethers, utils } = require("ethers")

exports.provider = new ethers.providers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org/",
)

const bn = BigNumber.from

const weiToNumber = (wei, decimal = 18) => {
  if (!wei || !Number(wei)) return "0"
  wei = wei.toString()
  return utils.formatUnits(wei, decimal)
}

const numberToWei = (number, decimal = 18) => {
  number = number.toString()

  const arr = number.split(".")
  if (arr[1] && arr[1].length > decimal) {
    arr[1] = arr[1].slice(0, decimal)
    number = arr.join(".")
  }

  return utils.parseUnits(number, decimal).toString()
}

exports.decodePowers = (powersBytes) => {
  powersBytes = powersBytes.slice(6)
  const raws = powersBytes.match(/.{1,4}/g)
  const powers = []
  for (let i = raws.length - 1; i >= 0; --i) {
    let power = Number("0x" + raws[i])
    if (power > 0x8000) {
      power = 0x8000 - power
    }
    if (power !== 0) {
      powers.push(power)
    }
  }
  return powers
}

const formatMultiCallBignumber = (data) => {
  return data.map((item) => {
    if (item.type === "BigNumber") {
      item = bn(item.hex)
    }

    if (Array.isArray(item)) {
      item = formatMultiCallBignumber(item)
    }
    return item
  })
}

exports.getErc1155Token = (addresses) => {
  const erc1155Addresses = addresses.filter(isErc1155Address)
  const result = {}
  for (let i = 0; i < erc1155Addresses.length; i++) {
    const address = erc1155Addresses[i].split("-")[0]
    const id = erc1155Addresses[i].split("-")[1]
    if (!result[address]) {
      result[address] = [bn(id)]
    } else {
      result[address].push(bn(id))
    }
  }
  return result
}

/**
 * format of erc1155 = 0xabc...abc-id
 * @param address
 */
exports.isErc1155Address = (address) => {
  return /^0x[0-9,a-f,A-Z]{40}-[0-9]{1,}$/g.test(address)
}

const getNormalAddress = (addresses) => {
  return addresses.filter((adr) => /^0x[0-9,a-f,A-Z]{40}$/g.test(adr))
}

const formatFloat = (number, decimal = 4) => {
  number = number.toString()
  const arr = number.split(".")
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return arr.join(".")
}

exports.formatPercent = (floatNumber, decimal = 2) => {
  floatNumber = floatNumber.toString()
  return formatFloat(weiToNumber(numberToWei(floatNumber), 16), decimal)
}

exports.mul = (a, b) => {
  const result = weiToNumber(
    BigNumber.from(numberToWei(a)).mul(numberToWei(b)),
    36,
  )
  const arr = result.split(".")
  arr[1] = arr[1]?.slice(0, 18)
  return arr[1] ? arr.join(".") : arr.join("")
}

exports.sub = (a, b) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).sub(numberToWei(b)))
}
const div = (a, b) => {
  if (!b || b.toString() === "0") {
    return "0"
  }
  return weiToNumber(BigNumber.from(numberToWei(a, 36)).div(numberToWei(b)))
}

exports.add = (a, b) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).add(numberToWei(b)))
}

exports.packId = (kind, address) => {
  const k = bn(kind)
  return k.shl(160).add(address)
}

exports.parseUq128x128 = (value, unit = 1000) => {
  return value.mul(unit).shr(112).toNumber() / unit
}

const parseSqrtSpotPrice = (value, token0, token1, quoteTokenIndex) => {
  let price = weiToNumber(
    value.mul(value).mul(numberToWei(1, token0.decimal)).shr(256),
    token1.decimal,
  )
  if (quoteTokenIndex === 0) {
    price = weiToNumber(bn(numberToWei(1, 36)).div(bn(numberToWei(price))))
  }
  return formatFloat(price, 18)
}

exports.parseSqrtX96 = (price, baseToken, quoteToken) => {
  return weiToNumber(
    price.mul(price).mul(numberToWei(1, baseToken.decimal)).shr(192),
    quoteToken.decimal,
  )
}

const isObject = (item) => {
  return item && typeof item === "object" && !Array.isArray(item)
}

exports.mergeDeep = (target, ...sources) => {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeep(target, ...sources)
}

module.exports = {
  getNormalAddress,
  bn,
  weiToNumber,
  formatMultiCallBignumber,
  parseSqrtSpotPrice,
  numberToWei,
  formatFloat,
  div,
}
