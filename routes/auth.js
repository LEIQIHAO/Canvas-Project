const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CryptoJS = require('crypto-js');

// 解密函数
const decrypt = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('解密失败');
    }
    return decrypted;
  } catch (error) {
    console.error('解密错误:', error);
    throw new Error('密码解密失败');
  }
};

// 注册路由
router.post('/register', async (req, res) => {
  try {
    console.log('注册请求:', { ...req.body, encryptedPassword: '***' });
    
    const { username, email, encryptedPassword } = req.body;
    
    // 验证输入
    if (!username || !email || !encryptedPassword) {
      return res.status(400).json({ message: '请提供所有必填字段' });
    }

    // 解密密码
    const password = decrypt(encryptedPassword);
    console.log('解密后的密码长度:', password.length);

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已被使用' });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password
    });

    await user.save();
    console.log('用户创建成功:', user._id);

    // 生成JWT和CSRF令牌
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const csrfToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: '注册成功',
      token,
      csrfToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    console.error('错误堆栈:', error.stack);
    
    // 处理特定错误
    if (error.message.includes('解密失败')) {
      return res.status(400).json({ message: '密码解密失败' });
    }
    if (error.message.includes('用户名或邮箱已被使用')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: '注册失败',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    console.log('登录请求:', { ...req.body, encryptedPassword: '***' });
    

    const { email, encryptedPassword } = req.body;
    
    // 验证输入
    if (!email || !encryptedPassword) {
      return res.status(400).json({ message: '请提供邮箱和密码' });
    }

    // 解密密码
    const password = decrypt(encryptedPassword);
    console.log('解密后的密码长度:', password.length);

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成JWT和CSRF令牌
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const csrfToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: '登录成功',
      token,
      csrfToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    console.error('错误堆栈:', error.stack);
    
    // 处理特定错误
    if (error.message.includes('解密失败')) {
      return res.status(400).json({ message: '密码解密失败' });
    }
    
    res.status(500).json({ 
      message: '登录失败',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
});

module.exports = router; 