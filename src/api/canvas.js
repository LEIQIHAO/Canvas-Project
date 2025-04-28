import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user'; // Import user store
import { authService } from './auth'; // Import auth service for re-login

// 使用相对路径，让代理服务器处理跨域
// const API_URL = '/canvas'; // This seems unused if baseURL is set

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5001/canvas',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 允许跨域请求携带cookie
  timeout: 10000, // 设置超时时间
});

// Add a flag to prevent infinite retry loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  async (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const originalRequest = error.config;

    // Check if it's a 401 error and not already retrying or refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest); // Retry with new token
          })
          .catch((err) => {
            return Promise.reject(err); // Propagate refresh error
          });
      }

      originalRequest._retry = true; // Mark request as retried
      isRefreshing = true;

      try {
        console.log('Attempting automatic re-login due to 401...');
        const storedCredentials = localStorage.getItem('user_credentials');
        if (!storedCredentials) {
          console.error('No stored credentials found for re-login.');
          // Redirect to login or handle appropriately
          useUserStore().logout(); // Logout if no credentials
          // Optionally redirect: window.location = '/login';
          processQueue(new Error('No credentials for refresh'), null);
          return Promise.reject(new Error('No credentials for refresh'));
        }

        const credentials = JSON.parse(storedCredentials);
        const userData = await authService.login(credentials); // Perform re-login

        if (userData && userData.token) {
          const userStore = useUserStore();
          userStore.setUser(userData, credentials); // Update store with new token AND credentials again

          console.log('Re-login successful, retrying original request.');
          api.defaults.headers.common['Authorization'] = 'Bearer ' + userData.token;
          originalRequest.headers['Authorization'] = 'Bearer ' + userData.token;

          processQueue(null, userData.token); // Process queue with new token
          return api(originalRequest); // Retry original request
        } else {
          throw new Error('Re-login did not return a valid token.');
        }
      } catch (refreshError) {
        console.error('Automatic re-login failed:', refreshError);
        useUserStore().logout(); // Logout on refresh failure
        processQueue(refreshError, null); // Reject queued requests
        // Optionally redirect to login page
        // ElMessage.error('登录状态已过期，请重新登录。');
        // window.location = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

export const canvasService = {
  // 获取用户的所有画布项目
  async getMyCanvases() {
    try {
      const response = await api.get('/my-canvases');
      return response.data.data;
    } catch (error) {
      console.error('获取画布列表失败:', error);
      throw error;
    }
  },

  // 创建新画布项目
  async createCanvas(data) {
    try {
      const response = await api.post('/', {
        title: data.title,
        width: data.width || 1200,
        height: data.height || 800,
        components: data.components || [],
        settings: {
          backgroundColor: '#ffffff',
          gridSize: 10,
          snapToGrid: true,
          ...data.settings,
        },
      });
      return response.data;
    } catch (error) {
      console.error('创建画布失败:', error);
      throw error;
    }
  },

  // 获取单个画布项目
  async getCanvas(id) {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取画布失败:', error);
      throw error;
    }
  },

  // 更新画布项目
  async updateCanvas(id, data) {
    try {
      const response = await api.put(`/${id}`, {
        title: data.title,
        content: data.content ?? undefined,
        updatedAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('更新画布失败:', error);
      throw error;
    }
  },

  // 删除画布项目
  async deleteCanvas(id) {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除画布失败:', error);
      throw error;
    }
  },

  // 添加协作者
  async addCollaborator(canvasId, email) {
    try {
      const response = await api.post(`/${canvasId}/collaborators`, {
        email,
        role: 'editor', // 默认角色为编辑者
      });
      return response.data;
    } catch (error) {
      console.error('添加协作者失败:', error);
      throw error;
    }
  },
};
