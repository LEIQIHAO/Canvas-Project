const express = require('express');
const router = express.Router();
const Canvas = require('../models/Canvas');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// 中间件：验证用户身份
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 验证用户ID是否为有效的MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(400).json({ message: '无效的用户ID' });
    }

    // 验证用户是否存在
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'token已过期' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户的所有画布项目
router.get('/my-canvases', auth, async (req, res) => {
  try {
    const canvases = await Canvas.find({ owner: req.userId })
      .populate('owner', 'username')
      .populate('collaborators', 'username');
    res.json(canvases);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新画布项目
router.post('/', auth, async (req, res) => {
  try {
    const { title } = req.body;
    
    // 验证标题
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: '画布标题不能为空' });
    }

    // 创建画布
    const canvas = new Canvas({
      title: title.trim(),
      owner: req.userId
    });
    
    // 保存画布
    await canvas.save();
    
    // 填充用户信息
    const populatedCanvas = await Canvas.findById(canvas._id)
      .populate('owner', 'username')
      .populate('collaborators', 'username');
    
    res.status(201).json(populatedCanvas);
  } catch (error) {
    console.error('创建画布错误:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: '数据验证失败', 
        details: error.message 
      });
    }
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ 
        message: '画布标题已存在' 
      });
    }
    res.status(500).json({ 
      message: '服务器错误', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// 获取单个画布项目
router.get('/:id', auth, async (req, res) => {
  try {
    const canvas = await Canvas.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.userId },
        { collaborators: req.userId }
      ]
    }).populate('owner', 'username')
      .populate('collaborators', 'username');

    if (!canvas) {
      return res.status(404).json({ message: '画布项目未找到' });
    }

    res.json(canvas);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新画布项目
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const canvas = await Canvas.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { owner: req.userId },
          { collaborators: req.userId }
        ]
      },
      { title, content },
      { new: true }
    );

    if (!canvas) {
      return res.status(404).json({ message: '画布项目未找到' });
    }

    res.json(canvas);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除画布项目
router.delete('/:id', auth, async (req, res) => {
  try {
    const canvas = await Canvas.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId
    });

    if (!canvas) {
      return res.status(404).json({ message: '画布项目未找到' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加协作者
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const collaborator = await User.findOne({ email });
    
    if (!collaborator) {
      return res.status(404).json({ message: '用户未找到' });
    }

    const canvas = await Canvas.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.userId
      },
      { $addToSet: { collaborators: collaborator._id } },
      { new: true }
    ).populate('collaborators', 'username');

    if (!canvas) {
      return res.status(404).json({ message: '画布项目未找到' });
    }

    res.json(canvas);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 