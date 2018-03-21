/* eslint-disable no-console */

const Bittrex = require('node-bittrex-api');
const Binance = require('node-binance-api');
const Promise = require('bluebird');
const keys = require('./keys.json');

const bittrex = Promise.promisifyAll(Bittrex);
const binance = Promise.promisifyAll(Binance);

binance.options({
  APIKEY: keys.binance.key,
  APISECRET: keys.binance.secret,
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  test: true, // If you want to use sandbox mode where orders are simulated
});

bittrex.options({
  apikey: keys.bittrex.key,
  apisecret: keys.bittrex.secret,
  inverse_callback_arguments: true,
});

function getPrices() {
  return Promise.all([
    bittrex.gettickerAsync({ market: 'USDT-BTC' }),
    binance.bookTickersAsync('BTCUSDT'),
  ]).then(res => ({
    bittrex: {
      bid: res[0].result.Bid,
      ask: res[0].result.Ask,
    },
    binance: {
      bid: res[1].bidPrice,
      ask: res[1].askPrice,
    },
  })).catch((err) => {
    console.log(err);
  });
}

// Check prices
setInterval(() => {
  const datetime = new Date().toISOString();
  getPrices().then((prices) => {
    const premiums = {
      bittrex: (((prices.bittrex.bid / prices.binance.ask) - 1) * 100).toFixed(2),
      binance: (((prices.binance.bid / prices.bittrex.ask) - 1) * 100).toFixed(2),
    };
    console.log(`[${datetime}] Bittrex Premium: ${premiums.bittrex}%, Binance Premium: ${premiums.binance}%`);
  });
}, 5000);
