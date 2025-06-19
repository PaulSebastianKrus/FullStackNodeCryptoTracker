import express from "express";
import sequelize from "../utils/db.js";

const router = express.Router();

router.get("/notifications", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId parameter is required" });
  }

  try {
    //insure userid is an integer
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "userId must be a valid number" });
    }

    const [results] = await sequelize.query(
      'SELECT * FROM "UserNotifications" WHERE "userId" = :userId ORDER BY "createdAt" DESC',
      { replacements: { userId: userIdNum } },
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [results] = await sequelize.query(
      'SELECT * FROM "UserPortfolio" WHERE "userId" = :userId',
      { replacements: { userId } },
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio." });
  }
});

// Add or update a portfolio entry
router.post("/upsert", async (req, res) => {
  const { userId, coinId, amount } = req.body;

  try {
    const [existingEntries] = await sequelize.query(
      'SELECT * FROM "UserPortfolio" WHERE "userId" = :userId AND "coinId" = :coinId',
      { replacements: { userId, coinId } },
    );

    if (existingEntries.length > 0) {
      await sequelize.query(
        'UPDATE "UserPortfolio" SET "amount" = :amount, "updatedAt" = NOW() WHERE "userId" = :userId AND "coinId" = :coinId',
        { replacements: { userId, coinId, amount } },
      );
    } else {
      await sequelize.query(
        'INSERT INTO "UserPortfolio" ("userId", "coinId", "amount", "updatedAt") VALUES (:userId, :coinId, :amount, NOW())',
        { replacements: { userId, coinId, amount } },
      );
    }

    res.json({ message: "Portfolio updated!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update portfolio." });
  }
});

// Delete a portfolio entry
router.delete("/remove", async (req, res) => {
  const { userId, coinId } = req.query;
  try {
    await sequelize.query(
      'DELETE FROM "UserPortfolio" WHERE "userId" = :userId AND "coinId" = :coinId',
      { replacements: { userId, coinId } },
    );
    res.json({ message: "Portfolio entry removed!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove entry." });
  }
});

// Update notification settings for a portfolio entry
router.post("/update-notification", async (req, res) => {
  const { userId, coinId, notifyAbove, notifyBelow } = req.body;
  try {
    await sequelize.query(
      `UPDATE "UserPortfolio"
       SET "notifyAbove" = :notifyAbove, "notifyBelow" = :notifyBelow, "updatedAt" = NOW()
       WHERE "userId" = :userId AND "coinId" = :coinId`,
      { replacements: { userId, coinId, notifyAbove, notifyBelow } },
    );
    res.json({ message: "Notification settings updated!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification settings." });
  }
});

// Check and insert notifications based on portfolio settings
router.post("/check-notifications", async (req, res) => {
  const { userId, prices } = req.body;
  try {
    const [portfolio] = await sequelize.query(
      'SELECT * FROM "UserPortfolio" WHERE "userId" = :userId',
      { replacements: { userId } },
    );

    for (const entry of portfolio) {
      const price = prices[entry.coinId];
      if (!price) continue;

      if (entry.notifyAbove && price > entry.notifyAbove) {
        await sequelize.query(
          `INSERT INTO "UserNotifications" ("userId", "coinId", "type", "threshold", "price")
           VALUES (:userId, :coinId, 'above', :threshold, :price)`,
          {
            replacements: {
              userId,
              coinId: entry.coinId,
              threshold: entry.notifyAbove,
              price,
            },
          },
        );
      }
      if (entry.notifyBelow && price < entry.notifyBelow) {
        await sequelize.query(
          `INSERT INTO "UserNotifications" ("userId", "coinId", "type", "threshold", "price")
           VALUES (:userId, :coinId, 'below', :threshold, :price)`,
          {
            replacements: {
              userId,
              coinId: entry.coinId,
              threshold: entry.notifyBelow,
              price,
            },
          },
        );
      }
    }
    res.json({ message: "Notifications checked." });
  } catch (error) {
    res.status(500).json({ error: "Failed to check notifications." });
  }
});

// Delete notification
router.delete("/notifications/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await sequelize.query('DELETE FROM "UserNotifications" WHERE "id" = :id', {
      replacements: { id },
    });
    res.json({ message: "Notification deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

export default router;
