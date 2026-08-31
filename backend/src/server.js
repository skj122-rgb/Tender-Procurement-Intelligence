require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');
const redis = require('./config/redis');
const env = require('./config/env');
const fs = require('fs');

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

let server = null;

const startServer = (port) => {
  const instance = app.listen(port, () => {
    console.log(`Server is running on port ${port} in ${env.NODE_ENV} mode`);
  });

  instance.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use. Retrying on ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    throw error;
  });

  return instance;
};

server = startServer(Number(process.env.PORT || env.PORT || 3000));

const gracefulShutdown = () => {
  console.log('Received shutdown signal. Closing server...');
  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    console.log('Server closed. Closing database and redis connections...');
    Promise.all([
      pool.end().catch(err => console.error('Error closing PG pool', err)),
      redis.quit().catch(err => console.error('Error closing Redis', err))
    ]).then(() => {
      console.log('All connections closed. Exiting process.');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = server;
