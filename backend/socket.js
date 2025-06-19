import { Server } from "socket.io";
import axios from "axios";

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  const CACHE_TIMEOUT = 600000; // 10 min
  const BROADCAST_INTERVAL = 180000; // 3 min
  const VALID_TIMEFRAMES = ["1", "7", "30", "90"];

  const SUPPORTED_COINS = [
    "bitcoin",
    "ethereum",
    "solana",
    "ripple",
    "dogecoin",
  ];
  const coinCache = {};

  SUPPORTED_COINS.forEach((coin) => {
    coinCache[coin] = {};
    VALID_TIMEFRAMES.forEach((timeframe) => {
      coinCache[coin][timeframe] = { prices: [], lastFetch: 0 };
    });
  });

  let lastSuccessfulSource = "coingecko";
  const apiCallTimes = {
    coingecko: [],
    coinpaprika: [],
  };

  const paprikaMapping = {
    bitcoin: "btc-bitcoin",
    ethereum: "eth-ethereum",
    solana: "sol-solana",
    ripple: "xrp-xrp",
    dogecoin: "doge-dogecoin",
  };

  const basePrices = {
    bitcoin: 55000,
    ethereum: 3000,
    solana: 100,
    ripple: 0.5,
    dogecoin: 0.1,
  };

  const volatilityByTimeframe = {
    1: 0.1, // 10% for 1 day
    7: 0.2, // 20% for 7 days
    30: 0.3, // 30% for 30 days
    90: 0.4, // 40% for 90 days
  };

  function canCallApi(api) {
    const now = Date.now();
    apiCallTimes[api] = apiCallTimes[api].filter((time) => now - time < 60000);

    const limits = {
      coingecko: 10,
      coinpaprika: 5,
    };

    return apiCallTimes[api].length < limits[api];
  }

  function trackApiCall(api) {
    apiCallTimes[api].push(Date.now());
  }

  async function fetchCoinPriceFromCoinGecko(coinId, days) {
    if (!canCallApi("coingecko")) return null;

    try {
      trackApiCall("coingecko");
      const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: "usd",
            days: days,
            precision: "full",
          },
        },
      );

      lastSuccessfulSource = "coingecko";
      return data.prices.map(([time, price]) => ({ time, price }));
    } catch (error) {
      return null;
    }
  }

  async function fetchCoinPriceFromCoinPaprika(coinId, days) {
    if (!canCallApi("coinpaprika")) return null;

    try {
      trackApiCall("coinpaprika");
      const mappedId = paprikaMapping[coinId] || coinId;
      const { data } = await axios.get(
        `https://api.coinpaprika.com/v1/tickers/${mappedId}`,
      );

      const now = Date.now();
      const price = data.quotes.USD.price;
      const daysMs = parseInt(days) * 24 * 60 * 60 * 1000;
      const startTime = now - daysMs;
      const pointCount = Math.min(parseInt(days) * 24, 100);
      const interval = daysMs / pointCount;

      const syntheticData = [];
      let lastPrice = price;

      for (let i = 0; i < pointCount; i++) {
        const timePoint = startTime + i * interval;
        const smallVariation = Math.random() * 0.01 - 0.005;
        const nextPrice = lastPrice * (1 + smallVariation);
        lastPrice = nextPrice;

        syntheticData.push({
          time: timePoint,
          price: nextPrice,
        });
      }

      lastSuccessfulSource = "coinpaprika";
      return syntheticData;
    } catch (error) {
      return null;
    }
  }

  function generateMockPriceData(coinId, days) {
    const mockPrices = [];
    const basePrice = basePrices[coinId] || 100;
    const daysStr = days.toString();

    const now = Date.now();
    const daysMs = parseInt(daysStr) * 24 * 60 * 60 * 1000;
    const startTime = now - daysMs;
    const volatility = volatilityByTimeframe[daysStr] || 0.1;

    for (let i = 0; i < 50; i++) {
      const timePoint = startTime + (i * daysMs) / 50;
      const variation = Math.random() * (volatility * 2) - volatility;
      mockPrices.push({
        time: timePoint,
        price: basePrice * (1 + variation),
      });
    }

    return mockPrices;
  }

  async function fetchCoinPriceHistory(coinId = "bitcoin", days = "1") {
    const normalizedCoin = coinId.toLowerCase();
    const normalizedDays = days.toString();

    if (
      !coinCache[normalizedCoin] ||
      !coinCache[normalizedCoin][normalizedDays]
    ) {
      return generateMockPriceData(normalizedCoin, normalizedDays);
    }

    const cache = coinCache[normalizedCoin][normalizedDays];
    const now = Date.now();

    if (now - cache.lastFetch < CACHE_TIMEOUT && cache.prices.length) {
      return cache.prices;
    }

    const apis =
      lastSuccessfulSource === "coingecko"
        ? ["coingecko", "coinpaprika"]
        : ["coinpaprika", "coingecko"];

    let prices = null;

    for (const api of apis) {
      if (api === "coingecko") {
        prices = await fetchCoinPriceFromCoinGecko(
          normalizedCoin,
          normalizedDays,
        );
      } else {
        prices = await fetchCoinPriceFromCoinPaprika(
          normalizedCoin,
          normalizedDays,
        );
      }

      if (prices) break;
    }

    if (!prices) {
      return cache.prices.length
        ? cache.prices
        : generateMockPriceData(normalizedCoin, normalizedDays);
    }

    cache.prices = prices;
    cache.lastFetch = now;
    return prices;
  }

  setInterval(async () => {
    for (const coinId of Object.keys(coinCache)) {
      try {
        const history = await fetchCoinPriceHistory(coinId);
        io.emit(`${coinId}_history`, history);
      } catch (error) {}
    }
  }, BROADCAST_INTERVAL);

  io.on("connection", (socket) => {
    socket.on("request_coin_data", async ({ coinId, days }) => {
      try {
        const selectedDays = VALID_TIMEFRAMES.includes(days) ? days : "1";
        const history = await fetchCoinPriceHistory(coinId, selectedDays);
        socket.emit(`${coinId}_history`, history);
      } catch (error) {}
    });
  });
}
