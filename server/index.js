import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import expressWs from 'express-ws';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import recruitRoutes from './routes/recruit.js';
import leaveRoutes from './routes/leave.js';
import payrollRoutes from './routes/payroll.js';
import performanceRoutes from './routes/performance.js';
import interviewRoutes from './routes/interview.js';
import docsRoutes from './routes/docs.js';
import { initRedis } from './redis.js';
import { fileURLToPath } from 'url';

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Only exit on critical errors
  if (error.code === 'EADDRINUSE') {
    console.error('Port already in use. Exiting.');
    process.exit(1);
  }
});

// Load env vars explicitly from server/.env (ESM-safe)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not configured in server/.env. AI transcription will be skipped.');
}

const app = express();
const wsInstance = expressWs(app);
const { app: wsApp } = wsInstance;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory buffer for video chunks per session
const videoBuffers = new Map();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    mongoUriSet: Boolean(process.env.MONGO_URI),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    redisUrlSet: Boolean(process.env.REDIS_URL),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/recruit', recruitRoutes);
app.use('/api/recruit', interviewRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/uploads', express.static('server/uploads'));
app.use('/api/docs', docsRoutes);

// Global error handler middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket route for interview streaming
wsApp.ws('/api/interview-stream', (ws, req) => {
  console.log('Client connected for interview stream');

  // Generate a unique ID for this WebSocket connection
  const connectionId = Math.random().toString(36).substring(2, 15);
  videoBuffers.set(connectionId, []);
  console.log(`WebSocket client connected with ID: ${connectionId}`);

  ws.on('message', async (msg) => {
    try {
      console.log(`Received video stream chunk for ${connectionId}, size: ${msg.length} bytes`);
      const chunks = videoBuffers.get(connectionId);
      if (chunks) {
        chunks.push(msg);
        // In a real application, you'd have more sophisticated logic here:
        // - Periodically process chunks (e.g., every 5 seconds)
        // - Detect speech pauses to send for transcription
        // - Limit buffer size to prevent memory exhaustion
        // For now, let's just log and consider sending for transcription after a certain amount of data
        if (chunks.length > 5) { // Example: send for processing after 5 chunks
          console.log(`Attempting to process ${chunks.length} chunks for ${connectionId}`);
          const audioBlob = Buffer.concat(chunks);
          console.log(`Accumulated audio blob size for ${connectionId}: ${audioBlob.length} bytes`);

          if (process.env.OPENAI_API_KEY) {
            try {
              const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
              const tempFilePath = path.join(os.tmpdir(), `audio-${connectionId}-${Date.now()}.webm`);
              fs.writeFileSync(tempFilePath, audioBlob);
              console.log(`Temporary audio file created at: ${tempFilePath}`);

              const transcript = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
              });
              console.log(`Transcription for ${connectionId}:`, transcript.text);
              ws.send(JSON.stringify({ type: 'transcription', text: transcript.text }));
              fs.unlinkSync(tempFilePath); // Clean up temp file
              console.log(`Temporary audio file deleted: ${tempFilePath}`);
            } catch (error) {
              console.error(`Error transcribing audio for ${connectionId}:`, error.message || error);
              ws.send(JSON.stringify({ type: 'error', message: 'Transcription failed' }));
            }
          } else {
            console.warn('OPENAI_API_KEY not configured. Skipping transcription.');
            ws.send(JSON.stringify({ type: 'warn', message: 'OPENAI_API_KEY not configured. Transcription skipped.' }));
          }
          videoBuffers.set(connectionId, []); // Clear buffer after sending
        }
      }
    } catch (error) {
      console.error(`Error processing WebSocket message for ${connectionId}:`, error.message || error);
      ws.send(JSON.stringify({ type: 'error', message: 'Processing failed' }));
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected from interview stream. Connection ID: ${connectionId}`);
    videoBuffers.delete(connectionId); // Clean up buffer on disconnect
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message || err);
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms';

if (!MONGO_URI || typeof MONGO_URI !== 'string') {
	console.error('MONGO_URI is missing or invalid. Add it to server/.env');
	process.exit(1);
}

(async () => {
  try {
    // Initialize Redis (optional - won't crash if it fails)
    try {
      await initRedis();
    } catch (redisError) {
      console.warn('Redis initialization failed (optional):', redisError.message || redisError);
    }

    // Connect to MongoDB with retry logic
    mongoose.connect(MONGO_URI)
      .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
          console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
      })
      .catch((err) => {
        console.error('Mongo connection error:', err.message || err);
        console.error('Server will not start without MongoDB. Please check your MONGO_URI in server/.env');
        process.exit(1);
      });
  } catch (error) {
    console.error('Server initialization error:', error.message || error);
    process.exit(1);
  }
})();
