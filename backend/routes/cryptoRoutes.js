import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/prices", async (_req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: "bitcoin,ethereum,tether,binancecoin,solana,usd-coin,ripple,dogecoin,toncoin,cardano",
        },
      },
    );
    res.json(data);
  } catch (err) {
    console.error("CoinGecko error:", err.message);
    res.status(500).json({ error: "Failed to fetch crypto prices" });
  }
});

router.get("/user-prices", async (req, res) => {
  try {
    const ids = req.query.ids ? [...new Set(req.query.ids.split(","))] : [];
    const results = [];

    const coinMappings = {
      bitcoin: "btc-bitcoin",
      ethereum: "eth-ethereum",
      tether: "usdt-tether",
      binancecoin: "bnb-binance-coin",
      ripple: "xrp-xrp",
      solana: "sol-solana",
      cardano: "ada-cardano",
      dogecoin: "doge-dogecoin",
    };

    for (const id of ids) {
      try {
        const coinId = coinMappings[id.toLowerCase()] || id;
        const { data } = await axios.get(
          `https://api.coinpaprika.com/v1/tickers/${coinId}`,
        );
        results.push({
          id: data.id,
          name: data.name,
          symbol: data.symbol,
          price: data.quotes.USD.price,
          volume_24h: data.quotes.USD.volume_24h,
          change_24h: data.quotes.USD.percent_change_24h,
          rank: data.rank,
        });
      } catch (err) {
        console.error(
          `Failed to fetch ${id}:`,
          err?.response?.data || err.message,
        );
      }
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching user prices:", err.message);
    res.status(500).json({ error: "Failed to fetch user crypto prices" });
  }
});

export default router;
