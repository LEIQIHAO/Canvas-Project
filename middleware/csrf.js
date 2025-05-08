const jwt = require('jsonwebtoken');

const csrfProtection = (req, res, next) => {
  // 排除GET请求和OPTIONS请求
  if (req.method === 'GET' || req.method === 'OPTIONS') {
    return next();
  }

  // 获取CSRF Token
  const csrfToken = req.headers['x-csrf-token'];
  if (!csrfToken) {
    console.error('CSRF Token缺失:', {
      url: req.url,
      method: req.method,
      headers: req.headers
    });
    return res.status(403).json({ message: '缺少CSRF Token' });
  }

  try {
    // 验证CSRF Token格式
    if (!csrfToken.includes('.')) {
      console.error('CSRF Token格式错误:', csrfToken);
      return res.status(403).json({ message: '无效的CSRF Token格式' });
    }

    // 验证CSRF Token
    const decoded = jwt.verify(csrfToken, process.env.JWT_SECRET);
    
    // 检查Token是否过期
    if (decoded.exp < Date.now() / 1000) {
      console.error('CSRF Token已过期:', {
        token: csrfToken,
        exp: decoded.exp,
        current: Date.now() / 1000
      });
      return res.status(403).json({ message: 'CSRF Token已过期' });
    }

    // 将用户ID添加到请求对象中
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('CSRF Token验证失败:', {
      error: error.message,
      token: csrfToken
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: '无效的CSRF Token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'CSRF Token已过期' });
    }
    
    return res.status(403).json({ message: 'CSRF Token验证失败' });
  }
};

module.exports = csrfProtection; 