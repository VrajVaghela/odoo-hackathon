import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.js';
import authRouter from './modules/auth/routes.js';
import vehicleRouter from './modules/vehicles/routes.js';
import driverRouter from './modules/drivers/routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/vehicles', vehicleRouter);
app.use('/api/v1/drivers', driverRouter);

// Health check endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized error handling
app.use(errorHandler);

export default app;
