const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: [true, '用户名已存在'],
    trim: true,
    minlength: [3, '用户名至少需要3个字符'],
    maxlength: [20, '用户名不能超过20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: [true, '邮箱已被使用'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少需要6个字符']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('密码加密错误:', error);
    next(new Error('密码加密失败'));
  }
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('密码比较错误:', error);
    throw new Error('密码验证失败');
  }
};

// 错误处理中间件
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('用户名或邮箱已被使用'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema); 