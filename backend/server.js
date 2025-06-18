import http from 'http';
import app from './app.js';
import sequelize from './utils/db.js';
import setupSocket from './socket.js';

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    const server = http.createServer(app);
    setupSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error syncing the database:', error);
  }
})();