import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 基础URL
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    const res = response.data;

    // 根据自己的业务逻辑判断响应是否成功
    // 这里假设后端返回的数据格式为 { code: 0, data: xxx, message: 'xxx' }
    if (res.code !== 0) {
      console.error('响应错误:', res.message || '未知错误');

      // 例如: 401 未授权
      if (res.code === 401) {
        // 清除token并跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      return Promise.reject(new Error(res.message || '未知错误'));
    } else {
      return res.data;
    }
  },
  (error) => {
    // 对响应错误做点什么
    console.error('响应错误:', error);

    // 处理HTTP状态码错误
    if (error.response) {
      const { status } = error.response;

      // 处理常见错误码
      if (status === 401) {
        // 未授权，跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (status === 403) {
        // 权限不足
        console.error('权限不足');
      } else if (status === 404) {
        // 资源不存在
        console.error('请求的资源不存在');
      } else if (status === 500) {
        // 服务器错误
        console.error('服务器错误');
      }
    }

    return Promise.reject(error);
  }
);

export default service;
