import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const service = axios.create({
  baseURL: 'http://121.37.219.159:5001/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // withCredentials: true,
});

// 检查API基础URL
if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not set in .env file');
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
    }

    // 添加认证token
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }

    // 记录请求信息
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 记录响应信息
    console.log('收到响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });

    return response;
  },
  async (error) => {
    console.error('响应错误:', error);

    // 处理特定错误
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除用户信息并跳转到登录页
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // token 无效或过期
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误:', error.response.data);
          ElMessage.error('服务器错误，请稍后重试');
          break;
        default:
          console.error('请求失败:', error.response.data);
          ElMessage.error(error.response.data.message || '请求失败');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误:', error.request);
      ElMessage.error('网络错误，请检查网络连接');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
      ElMessage.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

export default service;
