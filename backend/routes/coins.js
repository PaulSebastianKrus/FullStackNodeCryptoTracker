import express from "express";
import sequelize from "../utils/db.js";

const router = express.Router();

// add a coin
router.post("/add", async (req, res) => {
  const { userId, coinId } = req.body;

  try {
    await sequelize.query(
      'INSERT INTO "UserCoins" ("userId", "coinId", "updatedAt") VALUES (:userId, :coinId, NOW())',
      { replacements: { userId, coinId } },
    );
    res.status(200).json({ message: "Coin added successfully!" });
  } catch (error) {
    console.error("Error adding coin:", error);
    res.status(500).json({ error: "Failed to add coin." });
  }
});

// get all coins
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await sequelize.query(
      'SELECT "coinId" FROM "UserCoins" WHERE "userId" = :userId',
      { replacements: { userId } },
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching coins:", error);
    res.status(500).json({ error: "Failed to fetch coins." });
  }
});

// remove a coin
router.delete("/remove", async (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  let coinId = req.query.coinId;

  // format conversion between btc-bitcoin and bitcoin
  if (coinId.includes("-")) {
    coinId = coinId.split("-")[1];
  }

  try {
    await sequelize.query(
      'DELETE FROM "UserCoins" WHERE "userId" = :userId AND "coinId" = :coinId',
      { replacements: { userId, coinId } },
    );
    res.status(200).json({ message: "Coin removed." });
  } catch (error) {
    console.error("Error removing coin:", error);
    res.status(500).json({ error: "Failed to remove coin." });
  }
});

export default router;
