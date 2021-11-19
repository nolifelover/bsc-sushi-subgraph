import { log } from '@graphprotocol/graph-ts';
/* eslint-disable prefer-const */
import { BigDecimal, Address } from "@graphprotocol/graph-ts/index";
import { Pair, Token, Bundle } from "../generated/schema";
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD } from "./utils";

let MINIMUM_LIQUIDITY_THRESHOLD_ETH = 5;
let WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
let DAI_WETH_PAIR = "0xe6cf29055e747e95c058f64423d984546540ede5";
let USDC_WETH_PAIR = "0xc7632b7b2d768bbb30a404e13e1de48d1439ec21";
let USDT_WETH_PAIR = "0x2905817b020fd35d9d09672946362b62766f0d69";

let DAI = "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3";
let USDC = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
let USDT = "0x55d398326f99059ff775485246999027b3197955";

export function getBnbPriceInUSD(): BigDecimal {
  // TODO: We can can get weighted averages, but this will do for now.
  // If block number is less than or equal to the last stablecoin migration (ETH-USDT), use uniswap eth price.
  // After this last migration, we can use sushiswap pricing.
  /*if (block !== null && block.number.le(BigInt.fromI32(10829344))) {
    // Uniswap Factory
    const uniswapFactory = FactoryContract.bind(Address.fromString('0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f'))
    // ETH-USDT
    const ethUsdtPair = uniswapFactory.getPair(
      Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
      Address.fromString('0xdac17f958d2ee523a2206206994597c13d831ec7')
    )
    const ethUsdtPairContract = PairContract.bind(ethUsdtPair)
    const ethUsdtReserves = ethUsdtPairContract.getReserves()
    // TODO: Find out why I'm dividing by 1,000,000... (Oh, probably because USDT?)
    const ethPrice = ethUsdtReserves.value1
      .toBigDecimal()
      .times(BIG_DECIMAL_1E18)
      .div(ethUsdtReserves.value0.toBigDecimal())
      .div(BigDecimal.fromString('1000000'))
    return ethPrice
  }*/

  // fetch eth prices for each stablecoin
  const daiPair = Pair.load(DAI_WETH_PAIR)
  const usdcPair = Pair.load(USDC_WETH_PAIR)
  const usdtPair = Pair.load(USDT_WETH_PAIR)

  // if (daiPair !== null) {
  //   log.warning('Dai Pair {} {}', [
  //     daiPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH) ? 'true' : 'false',
  //     daiPair.reserveETH.toString(),
  //   ])
  // }

  // if (usdcPair !== null) {
  //   log.warning('Usdc Pair {} {}', [
  //     usdcPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH) ? 'true' : 'false',
  //     usdcPair.reserveETH.toString(),
  //   ])
  // }

  // if (usdcPair !== null) {
  //   log.warning('Usdt Pair {} {}', [
  //     usdtPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH) ? 'true' : 'false',
  //     usdtPair.reserveETH.toString(),
  //   ])
  // }

  if (
    daiPair !== null &&
    daiPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH) &&
    usdcPair !== null &&
    usdcPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH) &&
    usdtPair !== null &&
    usdtPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)
  ) {
    const isDaiFirst = daiPair.token0 == DAI
    const isUsdcFirst = usdcPair.token0 == USDC
    const isUsdtFirst = usdtPair.token0 == USDT

    const daiPairEth = isDaiFirst ? daiPair.reserve1 : daiPair.reserve0

    const usdcPairEth = isUsdcFirst ? usdcPair.reserve1 : usdcPair.reserve0

    const usdtPairEth = isUsdtFirst ? usdtPair.reserve1 : usdtPair.reserve0

    const totalLiquidityETH = daiPairEth.plus(usdcPairEth).plus(usdtPairEth)

    const daiWeight = !isDaiFirst ? daiPair.reserve0.div(totalLiquidityETH) : daiPair.reserve1.div(totalLiquidityETH)

    const usdcWeight = !isUsdcFirst
      ? usdcPair.reserve0.div(totalLiquidityETH)
      : usdcPair.reserve1.div(totalLiquidityETH)

    const usdtWeight = !isUsdtFirst
      ? usdtPair.reserve0.div(totalLiquidityETH)
      : usdtPair.reserve1.div(totalLiquidityETH)

    const daiPrice = isDaiFirst ? daiPair.token0Price : daiPair.token1Price

    const usdcPrice = isUsdcFirst ? usdcPair.token0Price : usdcPair.token1Price

    const usdtPrice = isUsdtFirst ? usdtPair.token0Price : usdtPair.token1Price

    return daiPrice.times(daiWeight).plus(usdcPrice.times(usdcWeight)).plus(usdtPrice.times(usdtWeight))

    // dai and USDC have been created
  } else if (
    daiPair !== null &&
    daiPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH) &&
    usdcPair !== null &&
    usdcPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)
  ) {
    const isDaiFirst = daiPair.token0 == DAI
    const isUsdcFirst = usdcPair.token0 == USDC

    const daiPairEth = isDaiFirst ? daiPair.reserve1 : daiPair.reserve0

    const usdcPairEth = isUsdcFirst ? usdcPair.reserve1 : usdcPair.reserve0

    const totalLiquidityETH = daiPairEth.plus(usdcPairEth)

    const daiWeight = !isDaiFirst ? daiPair.reserve0.div(totalLiquidityETH) : daiPair.reserve1.div(totalLiquidityETH)

    const usdcWeight = !isUsdcFirst
      ? usdcPair.reserve0.div(totalLiquidityETH)
      : usdcPair.reserve1.div(totalLiquidityETH)

    const daiPrice = isDaiFirst ? daiPair.token0Price : daiPair.token1Price

    const usdcPrice = isUsdcFirst ? usdcPair.token0Price : usdcPair.token1Price

    return daiPrice.times(daiWeight).plus(usdcPrice.times(usdcWeight))
    // USDC is the only pair so far
  } else if (usdcPair !== null && usdcPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
    const isUsdcFirst = usdcPair.token0 == USDC
    return isUsdcFirst ? usdcPair.token0Price : usdcPair.token1Price
  } else if (usdtPair !== null && usdtPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
    const isUsdtFirst = usdtPair.token0 == USDT
    return isUsdtFirst ? usdtPair.token0Price : usdtPair.token1Price
  } else if (daiPair !== null && daiPair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
    const isDaiFirst = daiPair.token0 == DAI
    return isDaiFirst ? daiPair.token0Price : daiPair.token1Price
  } else {
    log.warning('No eth pair...', [])
    return ZERO_BD
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
  '0xe9e7cea3dedca5984780bafc599bd69add087d56', // BUSD
  '0x55d398326f99059ff775485246999027b3197955', // USDT
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
  '0x23396cf899ca06c4472205fc903bdb4de249d6fc', // UST
  '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3', // DAI
  '0x4bd17003473389a42daf6a0a729f6fdb328bbbd7', // VAI
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', // BTCB
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8', // WETH
  '0x250632378e573c6be1ac2f97fcdf00515d0aa91b', // BETH
  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', // CAKE
  '0xf16e81dce15b08f326220742020379b855b87df9', // ICE
  '0x947950bcc74888a40ffa2593c5798f11fc9124c4', // SUSHI
];

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_BNB = BigDecimal.fromString("10");

/**
 * Search through graph to find derived BNB per token.
 * @todo update to be derived BNB (add stablecoin estimates)
 **/
export function findBnbPerToken(token: Token): BigDecimal {
  if (token.id == WBNB_ADDRESS) {
    return ONE_BD;
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    log.debug("get pair {} {}", [token.id, WHITELIST[i]])
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]));
    if (pairAddress.toHex() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHex());
      if (pair.token0 == token.id && pair.reserveBNB.gt(MINIMUM_LIQUIDITY_THRESHOLD_BNB)) {
        let token1 = Token.load(pair.token1);
        return pair.token1Price.times(token1.derivedBNB as BigDecimal); // return token1 per our token * BNB per token 1
      }
      if (pair.token1 == token.id && pair.reserveBNB.gt(MINIMUM_LIQUIDITY_THRESHOLD_BNB)) {
        let token0 = Token.load(pair.token0);
        return pair.token0Price.times(token0.derivedBNB as BigDecimal); // return token0 per our token * BNB per token 0
      }
    }
  }
  return ZERO_BD; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedBNB.times(bundle.bnbPrice);
  let price1 = token1.derivedBNB.times(bundle.bnbPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1)).div(BigDecimal.fromString("2"));
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0);
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1);
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedBNB.times(bundle.bnbPrice);
  let price1 = token1.derivedBNB.times(bundle.bnbPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1));
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString("2"));
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString("2"));
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}
