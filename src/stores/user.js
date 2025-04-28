import { defineStore } from 'pinia';
import { authService } from '../api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
  },

  actions: {
    setUser(userData, credentials = null) {
      this.user = userData.user;
      this.token = userData.token;
      localStorage.setItem('user', JSON.stringify(userData));
      if (credentials) {
        localStorage.setItem('user_credentials', JSON.stringify(credentials));
        console.warn('Storing user credentials in localStorage (Insecure)');
      }
    },

    clearUser() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('user_credentials');
    },

    async login(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const userData = await authService.login(credentials);
        this.setUser(userData, credentials);
        return userData;
      } catch (error) {
        this.error = error.message || '登录失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(userData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await authService.register(userData);
        const loginCredentials = {
          username: userData.username,
          password: userData.password,
        };
        this.setUser(response, loginCredentials);
        return response;
      } catch (error) {
        this.error = error.message || '注册失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.clearUser();
    },

    initialize() {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        this.setUser(userData);
      }
    },
  },
});
