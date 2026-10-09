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
import reunionIntelligenceRoutes from './routes/reunionIntelligence';
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
app.use('/api/reunion-intelligence', reunionIntelligenceRoutes);

app.get(['/', '/api'], (req: Request, res: Response) => {
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GlobalX Backend API - Active</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 32px; max-width: 580px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #064e3b; color: #34d399; }
          .dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; }
          h1 { margin: 16px 0 8px 0; font-size: 24px; color: #fff; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; }
          .endpoints { background: #0f172a; border-radius: 12px; padding: 16px; margin: 16px 0; }
          .endpoint-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; font-family: monospace; }
          .endpoint-item:last-child { border-bottom: none; }
          a { color: #a78bfa; text-decoration: none; }
          a:hover { text-decoration: underline; color: #c4b5fd; }
          .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 10px 20px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="dot"></span> Online & Operational</div>
          <h1>GlobalX Backend API</h1>
          <p>The Express + SQLite + Socket.IO disaster reunification server is running smoothly on port ${PORT}.</p>
          <div class="endpoints">
            <div class="endpoint-item"><span>Disaster Feeds:</span> <a href="/api/disasters" target="_blank">/api/disasters</a></div>
            <div class="endpoint-item"><span>Relief Camps:</span> <a href="/api/camps" target="_blank">/api/camps</a></div>
            <div class="endpoint-item"><span>CAP Alert Feeds:</span> <a href="/api/alerts" target="_blank">/api/alerts</a></div>
            <div class="endpoint-item"><span>Health Diagnostic:</span> <a href="/api/health" target="_blank">/api/health</a></div>
          </div>
          <a class="btn" href="http://localhost:5173" target="_blank">Open GlobalX Frontend Web App &rarr;</a>
        </div>
      </body>
      </html>
    `);
    return;
  }
  res.json({
    status: 'ok',
    app: 'GlobalX Backend API',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

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
