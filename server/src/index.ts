import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

import authRoutes from './routes/auth';
import disasterRoutes from './routes/disasters';
import campRoutes from './routes/camps';
import reportRoutes from './routes/reports';
import intakeRoutes from './routes/intake';
import searchRoutes from './routes/search';
import leadRoutes from './routes/leads';
import safeCheckInRoutes from './routes/safeCheckIn';
import dashboardRoutes from './routes/dashboard';
import simulationRoutes from './routes/simulation';
import qrRoutes from './routes/qr';
import alertRoutes from './routes/alerts';
import { NotificationService } from './services/notificationService';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

NotificationService.setIo(io);

io.on('connection', socket => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/safe-checkin', safeCheckInRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/alerts', alertRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'GlobalX API',
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 GlobalX Server running on http://localhost:${PORT}`);
});
