import request from '@/utils/request';
import { encrypt } from '@/utils/crypto';
import { ElMessage as message } from 'element-plus';

const API_URL = '/auth';

export const authService = {
  // 注册
  async register(userData) {
    try {
      // 验证输入
      if (!userData.username || !userData.email || !userData.password) {
        message.error('请填写所有必填字段');
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(userData.email)) {
        message.error('请输入有效的邮箱地址');
        return;
      }

      // 验证密码长度
      if (userData.password.length < 6) {
        message.error('密码至少需要6个字符');
        return;
      }

      // 加密敏感信息
      const encryptedData = {
        ...userData,
        encryptedPassword: encrypt(userData.password),
      };

      console.log('发送注册请求');
      const response = await request({
        url: `${API_URL}/register`,
        method: 'post',
        data: encryptedData,
      });

      // 保存用户信息和token
      if (response.token && response.user) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...response.user,
            token: response.token,
          })
        );
      }

      return response;
    } catch (error) {
      console.error('注册失败:', error);
      message.error(`注册失败: ${error.message || '请稍后重试'}`);
      throw error;
    }
  },

  // 登录
  async login(credentials) {
    try {
      // 验证输入
      if (!credentials.email || !credentials.password) {
        message.error('请填写邮箱和密码');
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(credentials.email)) {
        message.error('请输入有效的邮箱地址');
        return;
      }

      // 加密密码
      const encryptedCredentials = {
        ...credentials,
        encryptedPassword: encrypt(credentials.password),
      };

      console.log('发送登录请求');
      const response = await request({
        url: `${API_URL}/login`,
        method: 'post',
        data: encryptedCredentials,
      });
      console.log(response.data);
      // 保存用户信息和token
      if (response.data.token && response.data.user) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...response.data.user,
            token: response.data.token,
          })
        );
      }

      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      message.error(`登录失败: ${error.message || '请检查邮箱或密码'}`);
      throw error;
    }
  },

  // 登出
  logout() {
    try {
      localStorage.removeItem('user');
      console.log('登出成功');
    } catch (error) {
      console.error('登出失败:', error);
      message.error(`登出失败: ${error.message || '请稍后重试'}`);
      throw error;
    }
  },

  // 获取当前用户
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },
};
