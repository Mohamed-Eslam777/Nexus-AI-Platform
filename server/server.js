const dotenv = require('dotenv');
const path = require('path');

// ⬅️ تأكيد قراءة ملف .env الموجود بجانب هذا الملف (في مجلد server)
dotenv.config({ path: path.resolve(__dirname, '.env') }); 

console.log('--- Server Booting ---');
console.log('Loaded MONGO_URI:', process.env.MONGO_URI ? 'Loaded Successfully' : '!!! NOT FOUND !!!');
console.log('Loaded JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded Successfully' : '!!! NOT FOUND !!!');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Trust the first proxy (e.g., Nginx, load balancer, Heroku)
// This is critical for express-rate-limit to correctly identify user IPs behind a proxy
app.set('trust proxy', 1);

// --- Routes ---
const authRoutes = require('./routes/auth.routes.js');
const projectRoutes = require('./routes/project.routes.js');
const userRoutes = require('./routes/user.routes.js');
const walletRoutes = require('./routes/wallet.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const qualificationRoutes = require('./routes/qualification.routes.js');

// Middleware
app.use(cors());
app.use(express.json()); 

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mohamed DataAnnotation API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes); // ⬅️ 2. استخدام راوت المحفظة
app.use('/api/admin', adminRoutes); // ⬅️ Admin routes
app.use('/api/qualification', qualificationRoutes); // ⬅️ Qualification routes
// --- End Routes ---

// Mongo connection
const MONGODB_URI = process.env.MONGO_URI; 

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in environment variables');
  // In serverless, we don't exit - connection will be attempted on first request
}

// Connect to MongoDB (will be cached by Mongoose in serverless environments)
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully! 🟢');
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection error or Mongoose Schema issue:', err.message);
    // In serverless, we don't exit - connection will be attempted on first request
  });

// Vercel handles the server listening part, so we only listen if run locally
// This block ensures the server only starts listening when run directly (local dev)
// and NOT when imported by Vercel (serverless production)
if (require.main === module) {
  const http = require('http');
  const { initializeSocket } = require('./socket');
  
  const PORT = process.env.PORT || 5000;
  
  // Create HTTP server and initialize Socket.io (only for local development)
  const server = http.createServer(app);
  initializeSocket(server);
  
  // Use the HTTP server (with Socket.io) for local development
  server.listen(PORT, () => {
    console.log(`[LOCAL DEV] Server listening on port ${PORT}`);
    console.log(`[LOCAL DEV] Socket.io initialized and ready`);
  });
}

// Export Express app for Vercel serverless function
// This must be at the end and outside the conditional block
module.exports = app;






