require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const tenderRoutes = require('./routes/tender.routes');
const contractorRoutes = require('./routes/contractor.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const ingestRoutes = require('./routes/ingest.routes');

const app = express();

app.use(helmet());
app.use(cors({ 
  origin: true,
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Built-in lightweight request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development') {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Government Procurement Intelligence Backend API (Express.js)',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tenders: '/api/tenders',
      contractors: '/api/contractors',
      dashboard: '/api/dashboard',
      ingest: '/api/ingest',
    },
    frontendUrl: 'http://localhost:5173',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ingest', ingestRoutes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
