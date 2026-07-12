import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.js';
import authRouter from './modules/auth/routes.js';
import vehicleRouter from './modules/vehicles/routes.js';
import driverRouter from './modules/drivers/routes.js';
import tripRouter from './modules/trips/routes.js';
import dashboardRouter from './modules/dashboard/routes.js';
import maintenanceRouter from './modules/maintenance/routes.js';
import financeRouter from './modules/finance/routes.js';
import reportsRouter from './modules/reports/routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/vehicles', vehicleRouter);
app.use('/api/v1/drivers', driverRouter);
app.use('/api/v1/trips', tripRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/reports', reportsRouter);

// Health check endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized error handling
app.use(errorHandler);

export default app;
