const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { scheduleTrashCleanup } = require('./utils/trashCleanup');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Permanently purge anything that's been sitting in trash past the
// retention window (30 days by default, see TRASH_RETENTION_DAYS).
scheduleTrashCleanup();

const app = express();

// Middleware
// Comma separated list of allowed origins, e.g.
// CLIENT_URLS=http://localhost:5173,https://note-saver-mern-stack-web.vercel.app
const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:5173,https://note-saver-mern-stack-web.vercel.app')
  .split(',')
  .map((origin) => origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/uploads', require('./routes/uploads'));

// Multer / file upload specific errors (wrong type, too large, etc.)
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  if (err && err.message === 'Unsupported file type') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});