import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';

app.set('trust proxy', 1);

// Whitelist local development origins
const allowedOrigins = [
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    FRONTEND_URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Allow tools like Postman
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error(`CORS blocked for origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Local Backend Server Running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/profile', profileRoutes);

const server = app.listen(PORT, () => {
    console.log(`🚀 Local Backend listening on http://localhost:${PORT}`);
    console.log(`🔒 CORS allowing frontend on ${FRONTEND_URL}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Kill the process or pick another port.`);
    }
});