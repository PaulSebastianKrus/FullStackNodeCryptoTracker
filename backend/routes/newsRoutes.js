import express from "express";
import axios from "axios";

const router = express.Router();

const newsCache = {
  all: { articles: [], lastFetch: 0 },
  bitcoin: { articles: [], lastFetch: 0 },
  ethereum: { articles: [], lastFetch: 0 },
  solana: { articles: [], lastFetch: 0 },
  ripple: { articles: [], lastFetch: 0 },
  dogecoin: { articles: [], lastFetch: 0 },
};

const coinToCategory = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  ripple: "XRP",
  dogecoin: "DOGE",
};

router.get("/", async (req, res) => {
  try {
    const { coin = "all" } = req.query;
    const validCoin = [
      "all",
      "bitcoin",
      "ethereum",
      "solana",
      "ripple",
      "dogecoin",
    ].includes(coin)
      ? coin
      : "all";

    const cache = newsCache[validCoin];
    const now = Date.now();

    // Return cached news if less than 30 minutes old
    if (now - cache.lastFetch < 1800000 && cache.articles.length > 0) {
      return res.json(cache.articles);
    }

    const { data } = await axios.get(
      "https://min-api.cryptocompare.com/data/v2/news/",
      {
        params: {
          lang: "EN",
          extraParams: "CryptoPortfolio",
        },
      },
    );

    let articles = data.Data.map((article) => ({
      id: article.id,
      title: article.title,
      url: article.url,
      body: article.body,
      imageUrl: article.imageurl,
      source: article.source,
      publishedAt: article.published_on * 1000,
      categories: article.categories,
      relatedCoins: article.categories
        .split("|")
        .filter((cat) => ["BTC", "ETH", "SOL", "XRP", "DOGE"].includes(cat)),
    }));

    if (validCoin !== "all") {
      const categoryTag = coinToCategory[validCoin];

      articles = articles.filter((article) =>
        article.categories.includes(categoryTag),
      );
    }

    articles = articles.slice(0, 20);

    cache.articles = articles;
    cache.lastFetch = now;

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;
