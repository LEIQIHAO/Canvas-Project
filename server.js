const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// 加载环境变量
dotenv.config();

// 检查必要的环境变量
if (!process.env.JWT_SECRET) {
  console.error('错误: JWT_SECRET 未设置');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT 验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
};

// 应用 JWT 验证，但排除特定路由
const noAuthRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh-token'
];

app.use((req, res, next) => {
  if (noAuthRoutes.includes(req.path)) {
    return next();
  }
  authenticateToken(req, res, next);
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    message: '服务器错误',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack,
      name: err.name
    } : undefined
  });
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/canvas', require('./routes/canvas'));

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join-canvas', (canvasId) => {
    socket.join(canvasId);
  });

  socket.on('canvas-update', (data) => {
    socket.to(data.canvasId).emit('canvas-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// 连接 MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-app';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// 启动服务器
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${mongoUri}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET ? '已设置' : '未设置'}`);
});