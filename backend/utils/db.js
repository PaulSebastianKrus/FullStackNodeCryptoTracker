import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  },
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection to PostgreSQL has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

export default sequelize;
